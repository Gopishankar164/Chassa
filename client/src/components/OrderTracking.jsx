import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import orderStatusService from '../services/orderStatusService';
import './OrderTracking.css';
import API_BASE_URL from '../config/api';

const TRACKABLE_STATUSES = ['SHIPPED', 'OUT_FOR_DELIVERY'];

// Haversine distance in metres between two lat/lng points
const haversineMetres = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const OrderTracking = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [orderDetails, setOrderDetails] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true); // only true on first load
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [mapLoaded, setMapLoaded] = useState(false);

    // All map state lives in refs — never triggers re-renders
    const mapRef          = useRef(null);
    const leafletMapRef   = useRef(null);
    const markerRef       = useRef(null);
    const polylineRef     = useRef(null);
    const roadRouteRef    = useRef(null);
    const destMarkerRef   = useRef(null);
    const resolvedDestRef = useRef(null); // resolved destination {lat,lng}
    const osrmTimerRef    = useRef(null); // debounce OSRM calls
    const lastTruckPos    = useRef(null); // {lat,lng} — skip OSRM if truck hasn't moved >30 m
    const orderRef        = useRef(null); // mirror of orderDetails for use inside intervals

    const isTrackable = orderDetails && TRACKABLE_STATUSES.includes(orderDetails.status);

    // Fetch the user's saved delivery pin from their profile (fallback for old orders)
    const fetchUserDeliveryCoords = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const userId = userStr ? JSON.parse(userStr)?.id : null;
            if (!userId) return null;
            const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return null;
            const user = await res.json();
            if (user.deliveryLat && user.deliveryLng)
                return { lat: user.deliveryLat, lng: user.deliveryLng };
        } catch { /* ignore */ }
        return null;
    }, []);

    // Direct OSRM draw - no throttle, used for the initial route only
    const drawRouteNow = useCallback(async (map, fromLat, fromLng, toLat, toLng) => {
        const L = window.L;
        if (!L || !map) return;
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.code !== 'Ok' || !data.routes?.length) return;
            const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            if (roadRouteRef.current) roadRouteRef.current.remove();
            roadRouteRef.current = L.polyline(coords, { color: '#2563eb', weight: 5, opacity: 0.82 }).addTo(map);
            map.fitBounds(roadRouteRef.current.getBounds().pad(0.18));
            lastTruckPos.current = { lat: fromLat, lng: fromLng };
        } catch (e) { console.warn('OSRM initial route failed', e); }
    }, []);

    // OSRM road-route poll updates (debounced, skips if truck hasn't moved >30 m)
    const drawRoadRoute = useCallback((map, fromLat, fromLng, toLat, toLng) => {
        // Skip if truck position hasn't changed more than 30 m
        if (lastTruckPos.current) {
            const moved = haversineMetres(lastTruckPos.current.lat, lastTruckPos.current.lng, fromLat, fromLng);
            if (moved < 30) return;
        }
        lastTruckPos.current = { lat: fromLat, lng: fromLng };

        // Debounce: cancel any pending OSRM call and wait 1.5 s
        clearTimeout(osrmTimerRef.current);
        osrmTimerRef.current = setTimeout(async () => {
            const L = window.L;
            if (!L || !map) return;
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();
                if (data.code !== 'Ok' || !data.routes?.length) return;
                const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                if (roadRouteRef.current) roadRouteRef.current.remove();
                roadRouteRef.current = L.polyline(coords, { color: '#2563eb', weight: 5, opacity: 0.82 }).addTo(map);
                map.fitBounds(roadRouteRef.current.getBounds().pad(0.18));
            } catch (e) {
                console.warn('OSRM routing failed', e);
            }
        }, 1500);
    }, []);
    // ──────────────────────────────────────────────────────────────────────────

    // Initial fetch only — shows spinner
    useEffect(() => {
        if (!orderId) return;
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (res.ok) {
                    const data = await res.json();
                    orderRef.current = data;
                    setOrderDetails(data);
                } else { setError('Order not found'); }
            } catch { setError('Failed to load order details'); }
            finally { setInitialLoading(false); }
        })();
    }, [orderId]);

    // Background poll — NO spinner, only updates map refs directly when live
    useEffect(() => {
        if (!orderDetails) return;
        const { status } = orderDetails;
        if (status === 'DELIVERED' || status === 'CANCELLED') return;
        const isLive = TRACKABLE_STATUSES.includes(status);
        const interval = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (!res.ok) return;
                const data = await res.json();
                orderRef.current = data;
                setLastUpdated(new Date());

                // If live and map is ready, update only what changed — no full re-render
                const map = leafletMapRef.current;
                const L = window.L;
                if (!isLive || !map || !L) {
                    // Non-live: only update state if status changed
                    if (data.status !== orderDetails.status) setOrderDetails(data);
                    return;
                }

                const loc = data.deliveryLocation;
                const destLat = data.destinationLat;
                const destLng = data.destinationLng;

                // Update truck marker position only
                if (loc && markerRef.current) {
                    markerRef.current.setLatLng([loc.lat, loc.lng]);
                }

                // Update breadcrumb trail
                const path = data.deliveryPath || [];
                if (path.length > 1 && polylineRef.current) {
                    polylineRef.current.setLatLngs(path.map(p => [p.lat, p.lng]));
                }

                // Re-draw road route only if truck moved (use resolvedDestRef for old orders)
                const dest = resolvedDestRef.current || (destLat && destLng ? { lat: destLat, lng: destLng } : null);
                if (loc && dest) {
                    drawRoadRoute(map, loc.lat, loc.lng, dest.lat, dest.lng);
                }

                // Update status badge / timeline only if status changed
                if (data.status !== orderDetails.status) setOrderDetails(data);

            } catch { /* silent background poll failure */ }
        }, isLive ? 10000 : 60000);
        return () => clearInterval(interval);
    }, [orderDetails?.status, orderId, drawRoadRoute]);

    // Listen for status updates from automation
    useEffect(() => {
        const handleStatusUpdate = (event) => {
            if (event.detail.orderId === orderId && orderRef.current) {
                setOrderDetails({ ...orderRef.current, status: event.detail.status || orderRef.current.status });
                setLastUpdated(new Date());
            }
        };
        window.addEventListener('orderStatusUpdated', handleStatusUpdate);
        return () => window.removeEventListener('orderStatusUpdated', handleStatusUpdate);
    }, [orderId]);

    // Automation
    useEffect(() => {
        if (orderDetails && orderDetails.status !== 'DELIVERED' && orderDetails.status !== 'CANCELLED') {
            orderStatusService.startAutomation(orderId, orderDetails.status);
        }
    }, [orderDetails?.status, orderId]);

    // Load Leaflet dynamically (only once)
    useEffect(() => {
        if (!isTrackable) return;
        if (window.L) { setMapLoaded(true); return; }
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);
    }, [isTrackable]);

    // Initialize map ONCE — never re-runs on poll updates
    useEffect(() => {
        if (!mapLoaded || !isTrackable || !mapRef.current || leafletMapRef.current) return;
        const L = window.L;
        const loc = orderDetails.deliveryLocation;
        const destLat = orderDetails.destinationLat;
        const destLng = orderDetails.destinationLng;
        const path = orderDetails.deliveryPath || [];

        const defaultLat = loc?.lat || destLat || 11.0168;
        const defaultLng = loc?.lng || destLng || 76.9558;

        const map = L.map(mapRef.current, { zoomControl: true }).setView([defaultLat, defaultLng], 14);
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri', maxZoom: 19
        }).addTo(map);
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19, opacity: 0.6
        }).addTo(map);
        leafletMapRef.current = map;

        // Breadcrumb trail
        if (path.length > 1) {
            polylineRef.current = L.polyline(path.map(p => [p.lat, p.lng]), {
                color: '#8B1A1A', weight: 3, opacity: 0.7, dashArray: '6 4'
            }).addTo(map);
        }

        // Truck marker
        if (loc) {
            const truckIcon = L.divIcon({
                className: '',
                html: `<div style="background:#8B1A1A;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);animation:truckPulse 1.5s infinite;">🚚</div>`,
                iconSize: [40, 40], iconAnchor: [20, 20]
            });
            markerRef.current = L.marker([loc.lat, loc.lng], { icon: truckIcon })
                .addTo(map).bindPopup('<b>Delivery Agent</b><br>Your order is on the way!');
        }

        // Helper: place home pin + draw initial route
        const placeHomePin = (dLat, dLng) => {
            resolvedDestRef.current = { lat: dLat, lng: dLng };
            const homeIcon = L.divIcon({
                className: '',
                html: `<div style="background:#1d4ed8;border-radius:50% 50% 50% 0;width:38px;height:38px;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:17px;">🏠</span></div>`,
                iconSize: [38, 38], iconAnchor: [19, 38]
            });
            destMarkerRef.current = L.marker([dLat, dLng], { icon: homeIcon })
                .addTo(map).bindPopup('<b>Your Delivery Location</b><br>The delivery agent is heading here.');
            if (loc) {
                drawRouteNow(map, loc.lat, loc.lng, dLat, dLng);
            } else {
                map.setView([dLat, dLng], 15);
            }
        };

        // Resolve destination: order coords first, else fetch live profile pin
        if (destLat && destLng) {
            placeHomePin(destLat, destLng);
        } else {
            fetchUserDeliveryCoords().then(coords => {
                if (!coords || !leafletMapRef.current) return;
                placeHomePin(coords.lat, coords.lng);
            });
        }
    }, [mapLoaded, isTrackable, drawRouteNow, fetchUserDeliveryCoords]); // intentionally NOT depending on orderDetails

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimeout(osrmTimerRef.current);
            resolvedDestRef.current = null;
            lastTruckPos.current = null;
            if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
        };
    }, []);

    const getOrderStatus = (status) => {
        const statusMap = {
            'PENDING': {
                text: 'Order Placed', color: '#fbbf24', step: 1,
                icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2V5" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><path d="M16 2V5" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><path d="M3 8.5H21" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><path d="M21 8V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M15.6947 13.7H15.7037" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M15.6947 16.7H15.7037" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M11.9955 13.7H12.0045" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M11.9955 16.7H12.0045" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8.29431 13.7H8.30329" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8.29431 16.7H8.30329" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>)
            },
            'CONFIRMED': {
                text: 'Confirmed', color: '#3b82f6', step: 2,
                icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M7.75 12L10.58 14.83L16.25 9.17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>)
            },
            'PROCESSING': {
                text: 'Processing', color: '#8b5cf6', step: 3,
                icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 12.88V11.12C2 10.08 2.85 9.22 3.9 9.22C5.71 9.22 6.45 7.94 5.54 6.37C5.02 5.47 5.33 4.3 6.24 3.78L7.97 2.79C8.76 2.32 9.78 2.6 10.25 3.39L10.36 3.58C11.26 5.15 12.74 5.15 13.65 3.58L13.76 3.39C14.23 2.6 15.25 2.32 16.04 2.79L17.77 3.78C18.68 4.3 18.99 5.47 18.47 6.37C17.56 7.94 18.3 9.22 20.11 9.22C21.15 9.22 22.01 10.07 22.01 11.12V12.88C22.01 13.92 21.16 14.78 20.11 14.78C18.3 14.78 17.56 16.06 18.47 17.63C18.99 18.54 18.68 19.7 17.77 20.22L16.04 21.21C15.25 21.68 14.23 21.4 13.76 20.61L13.65 20.42C12.75 18.85 11.27 18.85 10.36 20.42L10.25 20.61C9.78 21.4 8.76 21.68 7.97 21.21L6.24 20.22C5.33 19.7 5.02 18.53 5.54 17.63C6.45 16.06 5.71 14.78 3.9 14.78C2.85 14.78 2 13.92 2 12.88Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>)
            },
            'SHIPPED': {
                text: 'Shipped', color: '#06b6d4', step: 4,
                icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1H15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 1V11L3 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 5H15V13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 8H19L23 12V17H15V8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="5" cy="17" r="2" stroke="white" strokeWidth="1.5" /><circle cx="19" cy="17" r="2" stroke="white" strokeWidth="1.5" /></svg>)
            },
            'OUT_FOR_DELIVERY': {
                text: 'Out for Delivery', color: '#f59e0b', step: 5,
                icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 8V13" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 16H12.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>)
            },
            'DELIVERED': {
                text: 'Delivered', color: '#10b981', step: 6,
                icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.37 2.15L21 6.27V11.22C21 16.12 17.1 20.69 12 22C6.9 20.69 3 16.12 3 11.22V6.27L11.63 2.15C11.86 2.05 12.14 2.05 12.37 2.15Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M8.5 12L10.5 14L15.5 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>)
            },
            'CANCELLED': {
                text: 'Cancelled', color: '#ef4444', step: 0,
                icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M9.17 14.83L14.83 9.17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M14.83 14.83L9.17 9.17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>)
            }
        };
        return statusMap[status] || { text: status, color: '#6b7280', step: 1, icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" /></svg>) };
    };

    const trackingSteps = [
        { id: 1, title: 'Order Placed', desc: 'Your order has been placed successfully' },
        { id: 2, title: 'Confirmed', desc: 'Order confirmed and payment processed' },
        { id: 3, title: 'Processing', desc: 'Your order is being prepared' },
        { id: 4, title: 'Shipped', desc: 'Order has been shipped' },
        { id: 5, title: 'Out for Delivery', desc: 'Order is out for delivery' },
        { id: 6, title: 'Delivered', desc: 'Order delivered successfully' }
    ];

    if (initialLoading) {
        return (
            <>
                <Navbar />
                <div className="tracking-container">
                    <div className="loading-message">
                        <p>Loading order details...</p>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="tracking-container">
                    <div className="error-message">
                        <h2>{error}</h2>
                        <button onClick={() => navigate('/my-orders')} className="back-btn">
                            Back to Orders
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const currentStatus = getOrderStatus(orderDetails?.status);
    const isAutomationActive = orderStatusService.getAutomationStatus(orderId);

    return (
        <>
            <Navbar />
            <div className="tracking-container">

                {/* Header */}
                <div className="tracking-header">
                    <div className="header-content">
                        <div className="header-top">
                            <button onClick={() => navigate('/my-orders')} className="back-button">
                                ← Back to Orders
                            </button>
                            {isAutomationActive && (
                                <span className="automation-status">
                                    Live Updates Active
                                </span>
                            )}
                        </div>
                        <h1>Track Your Order</h1>
                        <div className="order-info">
                            <span className="order-id">Order #{orderDetails?.id}</span>
                            <span className="order-date">
                                Placed: {new Date(orderDetails?.createdAt).toLocaleDateString('en-IN')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Current Status Card */}
                <div className="current-status-card">
                    <div className="status-icon" style={{ backgroundColor: currentStatus.color }}>
                        {currentStatus.icon}
                    </div>
                    <div className="status-info">
                        <h2>{currentStatus.text}</h2>
                        <p>Expected delivery: {orderDetails?.expectedDelivery || '3–5 business days'}</p>
                        <p className="last-updated">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="status-badge" style={{ backgroundColor: currentStatus.color }}>
                        {currentStatus.text}
                    </div>
                </div>

                {/* Live Satellite Map - shown when SHIPPED or OUT_FOR_DELIVERY */}
                {isTrackable && (
                    <div className="live-map-section">
                        <div className="live-map-header">
                            <div className="live-map-title">
                                <span className="live-dot"></span>
                                <h3>Live Delivery Tracking</h3>
                            </div>
                            {orderDetails.deliveryLocation && (
                                <span className="map-updated-badge">
                                    Updated: {new Date(orderDetails.deliveryLocation.updatedAt).toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                        {!orderDetails.deliveryLocation ? (
                            <div className="map-pending-msg">
                                <div className="map-pending-icon">🗺️</div>
                                <p>Live location will appear here once the delivery agent begins their route.</p>
                            </div>
                        ) : (
                            <div ref={mapRef} className="leaflet-map-container" />
                        )}
                        {orderDetails.deliveryPath && orderDetails.deliveryPath.length > 1 && (
                            <div className="map-path-info">
                                <span>📍 {orderDetails.deliveryPath.length} location points recorded</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Email Notification Banner */}
                <div className="email-notification-banner">
                    <div className="notification-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="notification-content">
                        <h3>Stay Updated!</h3>
                        <p>
                            We'll send you real-time email notifications at every step of your order journey.
                            From confirmation to delivery, you'll never miss an update!
                        </p>
                        <div className="notification-features">
                            <span className="feature-tag">Instant Updates</span>
                            <span className="feature-tag">Delivery Alerts</span>
                            <span className="feature-tag">Status Changes</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${(currentStatus.step / 6) * 100}%` }}
                        ></div>
                    </div>
                    <span className="progress-text">
                        {currentStatus.step}/6 Steps Complete
                    </span>
                </div>

                {/* Timeline */}
                <div className="tracking-timeline">
                    <h3>Order Progress</h3>
                    <div className="timeline">
                        {trackingSteps.map((step) => {
                            const isCompleted = step.id <= currentStatus.step;
                            const isCurrent = step.id === currentStatus.step;

                            return (
                                <div
                                    key={step.id}
                                    className={`timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                                >
                                    <div className="step-icon">
                                        {isCompleted ? '✓' : step.id}
                                    </div>
                                    <div className="step-content">
                                        <h4>{step.title}</h4>
                                        <p>{step.desc}</p>
                                        {isCurrent && (
                                            <span className="current-label">Current Status</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Contact Support */}
                <button
                    className="contact-support-btn"
                    onClick={() => navigate('/customer-support')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                        <path d="M21.97 18.33C21.97 18.69 21.89 19.06 21.72 19.42C21.55 19.78 21.33 20.12 21.04 20.44C20.55 20.98 20.01 21.37 19.4 21.62C18.8 21.87 18.15 22 17.45 22C16.43 22 15.34 21.76 14.19 21.27C13.04 20.78 11.89 20.12 10.75 19.29C9.6 18.45 8.51 17.52 7.47 16.49C6.44 15.45 5.51 14.36 4.68 13.22C3.86 12.08 3.2 10.94 2.72 9.81C2.24 8.67 2 7.58 2 6.54C2 5.86 2.12 5.21 2.36 4.61C2.6 4 2.98 3.44 3.51 2.94C4.15 2.31 4.85 2 5.59 2C5.87 2 6.15 2.06 6.4 2.18C6.66 2.3 6.89 2.48 7.07 2.74L9.39 6.01C9.57 6.26 9.7 6.49 9.79 6.71C9.88 6.92 9.93 7.13 9.93 7.32C9.93 7.56 9.86 7.8 9.72 8.03C9.59 8.26 9.4 8.5 9.16 8.74L8.4 9.53C8.29 9.64 8.24 9.77 8.24 9.93C8.24 10.01 8.25 10.08 8.27 10.16C8.3 10.24 8.33 10.3 8.35 10.36C8.53 10.69 8.84 11.12 9.28 11.64C9.73 12.16 10.21 12.69 10.73 13.22C11.27 13.75 11.79 14.24 12.32 14.69C12.84 15.13 13.27 15.43 13.61 15.61C13.66 15.63 13.72 15.66 13.79 15.69C13.87 15.72 13.95 15.73 14.04 15.73C14.21 15.73 14.34 15.67 14.45 15.56L15.21 14.81C15.46 14.56 15.7 14.37 15.93 14.25C16.16 14.11 16.39 14.04 16.64 14.04C16.83 14.04 17.03 14.08 17.25 14.17C17.47 14.26 17.7 14.39 17.95 14.56L21.26 16.91C21.52 17.09 21.7 17.3 21.81 17.55C21.91 17.8 21.97 18.05 21.97 18.33Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" />
                    </svg>
                    Contact Support
                </button>
            </div>
        </>
    );
};

export default OrderTracking;