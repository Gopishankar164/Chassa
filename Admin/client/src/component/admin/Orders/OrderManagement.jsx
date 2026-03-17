import React, { useState, useEffect, useRef, useCallback } from 'react';
import { orderService } from '../../../services/orderService';
import '../../../styles/GlobalAdmin.css';
import { RefreshCw, ShoppingCart, MapPin, X } from 'lucide-react';
import ADMIN_API_BASE_URL from '../../../config/api.js';

const statusColor = (s) => {
  const lower = (s || '').toLowerCase();
  if (lower === 'delivered') return 'badge-green';
  if (lower === 'processing') return 'badge-blue';
  if (lower === 'pending') return 'badge-yellow';
  if (lower === 'cancelled') return 'badge-red';
  return 'badge-indigo';
};

const paymentColor = (s) => {
  const lower = (s || '').toLowerCase();
  if (lower === 'completed') return 'badge-green';
  if (lower === 'failed') return 'badge-red';
  return 'badge-yellow';
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapOrder, setMapOrder] = useState(null); // order currently open in map panel
  const [mapLeafletReady, setMapLeafletReady] = useState(false);
  const adminMapRef = useRef(null);
  const adminLeafletMap = useRef(null);
  const adminMarker = useRef(null);
  const adminPolyline = useRef(null);   // GPS breadcrumb trail
  const adminRoadRoute = useRef(null);  // OSRM road route line
  const watchIdRef = useRef(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) { window.location.href = '/admin/login'; return; }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true); setError(null);
      const fetchedOrders = await orderService.getAllOrders();
      setOrders(fetchedOrders);
    } catch (error) {
      if (error.message.includes('403')) {
        localStorage.removeItem('adminToken'); window.location.href = '/admin/login'; return;
      }
      setError('Failed to fetch orders: ' + error.message);
    } finally { setLoading(false); }
  };

  // ── Admin Delivery Map ──────────────────────────────────────────────────
  const loadLeafletIfNeeded = () => {
    if (window.L) { setMapLeafletReady(true); return; }
    if (document.querySelector('script[src*="leaflet"]')) return;
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => setMapLeafletReady(true);
    document.head.appendChild(s);
  };

  const openDeliveryMap = (order) => {
    setMapOrder(order);
    loadLeafletIfNeeded();
  };

  const closeDeliveryMap = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    clearTimeout(adminOsrmTimer.current);
    adminLastPos.current = null;
    if (adminLeafletMap.current) { adminLeafletMap.current.remove(); adminLeafletMap.current = null; }
    adminMarker.current = null;
    adminPolyline.current = null;
    adminRoadRoute.current = null;
    setMapOrder(null);
  };

  // ── OSRM road route (admin location → customer home) ────────────────────────
  // Throttled: min 30 m movement + 2 s debounce to avoid hammering OSRM on every GPS tick
  const adminOsrmTimer  = useRef(null);
  const adminLastPos    = useRef(null);

  const drawAdminRoadRoute = useCallback((map, fromLat, fromLng, toLat, toLng) => {
    if (adminLastPos.current) {
      const R = 6371000, dLat = (fromLat - adminLastPos.current.lat) * Math.PI / 180,
            dLng = (fromLng - adminLastPos.current.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(adminLastPos.current.lat*Math.PI/180)*Math.cos(fromLat*Math.PI/180)*Math.sin(dLng/2)**2;
      const moved = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      if (moved < 30) return; // skip if less than 30 m movement
    }
    adminLastPos.current = { lat: fromLat, lng: fromLng };

    clearTimeout(adminOsrmTimer.current);
    adminOsrmTimer.current = setTimeout(async () => {
      const L = window.L;
      if (!L || !map) return;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.code !== 'Ok' || !data.routes?.length) return;
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        if (adminRoadRoute.current) adminRoadRoute.current.remove();
        adminRoadRoute.current = L.polyline(coords, { color: '#2563eb', weight: 5, opacity: 0.85 }).addTo(map);
        map.fitBounds(adminRoadRoute.current.getBounds().pad(0.15));
      } catch (e) { console.warn('OSRM routing failed', e); }
    }, 2000);
  }, []);
  // ──────────────────────────────────────────────────────────────────

  // Resolved destination coords (order pin OR live user profile pin)
  const resolvedDest = useRef(null);

  // Parse shippingAddress for display only (JSON string → readable text)
  const parseShippingAddress = (raw) => {
    if (!raw) return null;
    try {
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const parts = [obj.address, obj.city, obj.state, obj.pincode].filter(Boolean);
      return parts.join(', ');
    } catch {
      return raw;
    }
  };

  // Fetch the user's saved delivery coordinates from their profile
  const fetchUserDeliveryCoords = async (userId) => {
    if (!userId) return null;
    try {
      const adminToken = localStorage.getItem('adminToken');
      const res = await fetch(`${ADMIN_API_BASE_URL}/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!res.ok) return null;
      const user = await res.json();
      if (user.deliveryLat && user.deliveryLng) {
        return { lat: user.deliveryLat, lng: user.deliveryLng };
      }
    } catch { /* ignore */ }
    return null;
  };

  // Direct OSRM draw — bypasses the 30 m throttle (used for initial route only)
  const drawRouteNow = async (map, fromLat, fromLng, toLat, toLng) => {
    const L = window.L;
    if (!L || !map) return;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.length) return;
      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      if (adminRoadRoute.current) adminRoadRoute.current.remove();
      adminRoadRoute.current = L.polyline(coords, { color: '#2563eb', weight: 5, opacity: 0.85 }).addTo(map);
      map.fitBounds(adminRoadRoute.current.getBounds().pad(0.15));
      // Seed lastPos so subsequent GPS ticks use the throttle correctly
      adminLastPos.current = { lat: fromLat, lng: fromLng };
    } catch (e) { console.warn('OSRM initial route failed', e); }
  };

  // Place the home pin and draw initial route (no throttle)
  const placeDestAndRoute = (map, destLat, destLng, label, loc) => {
    const L = window.L;
    resolvedDest.current = { lat: destLat, lng: destLng };
    const destIcon = L.divIcon({
      className: '',
      html: `<div style="background:#1d4ed8;border-radius:50% 50% 50% 0;width:38px;height:38px;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:18px;">🏠</span></div>`,
      iconSize: [38, 38], iconAnchor: [19, 38]
    });
    L.marker([destLat, destLng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`<b>Delivery Destination</b><br>${label}`);
    if (loc) {
      // Direct call — no throttle for first draw
      drawRouteNow(map, loc.lat, loc.lng, destLat, destLng);
    } else {
      map.setView([destLat, destLng], 15);
    }
  };

  // Init the admin map once Leaflet + DOM ref are ready
  useEffect(() => {
    if (!mapLeafletReady || !mapOrder || !adminMapRef.current) return;
    if (adminLeafletMap.current) return; // already inited
    const L = window.L;
    const loc = mapOrder.deliveryLocation;
    resolvedDest.current = null;

    const defaultLat = loc?.lat || 11.0168;
    const defaultLng = loc?.lng || 76.9558;

    const map = L.map(adminMapRef.current).setView([defaultLat, defaultLng], 14);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri', maxZoom: 19
    }).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, opacity: 0.7
    }).addTo(map);
    adminLeafletMap.current = map;

    // GPS breadcrumb trail
    const path = mapOrder.deliveryPath || [];
    if (path.length > 1) {
      adminPolyline.current = L.polyline(path.map(p => [p.lat, p.lng]),
        { color: '#8B1A1A', weight: 3, opacity: 0.7, dashArray: '6 4' }).addTo(map);
    }

    // Truck marker
    if (loc) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#8B1A1A;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);">🚚</div>`,
        iconSize: [36, 36], iconAnchor: [18, 18]
      });
      adminMarker.current = L.marker([loc.lat, loc.lng], { icon }).addTo(map).bindPopup('Current delivery position');
    }

    // ── Resolve destination: order coords → else fetch from user profile ──
    const addrLabel = parseShippingAddress(mapOrder.shippingAddress) || mapOrder.customerName || 'Customer';

    if (mapOrder.destinationLat && mapOrder.destinationLng) {
      // Coords already saved on order — use immediately
      placeDestAndRoute(map, mapOrder.destinationLat, mapOrder.destinationLng, addrLabel, loc);
    } else {
      // Order was placed before user saved their pin — fetch current profile coords
      fetchUserDeliveryCoords(mapOrder.userId).then(coords => {
        if (!coords || !adminLeafletMap.current) return;
        const currentLoc = adminMarker.current ? adminMarker.current.getLatLng() : loc;
        placeDestAndRoute(map, coords.lat, coords.lng, addrLabel, currentLoc);
      });
    }

    // Auto start GPS watch
    startGPSTracking(mapOrder.id, map);
  }, [mapLeafletReady, mapOrder]);

  const startGPSTracking = (orderId, map) => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Push to backend
        try {
          const adminToken = localStorage.getItem('adminToken');
          await fetch(`${ADMIN_API_BASE_URL}/api/orders/${orderId}/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({ lat, lng })
          });
        } catch (e) { console.error('Location push failed', e); }

        // Update map marker and path
        const L = window.L;
        if (!map || !L) return;
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#8B1A1A;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);">🚚</div>`,
          iconSize: [36, 36], iconAnchor: [18, 18]
        });
        if (adminMarker.current) {
          adminMarker.current.setLatLng([lat, lng]);
        } else {
          adminMarker.current = L.marker([lat, lng], { icon }).addTo(map);
        }
        // Extend GPS breadcrumb trail
        if (adminPolyline.current) {
          const latlngs = adminPolyline.current.getLatLngs();
          latlngs.push([lat, lng]);
          adminPolyline.current.setLatLngs(latlngs);
        } else {
          adminPolyline.current = L.polyline([[lat, lng]], { color: '#8B1A1A', weight: 3, opacity: 0.7, dashArray: '6 4' }).addTo(map);
        }

        // ✅ Refresh OSRM road route from new admin position → customer home
        // Use resolvedDest.current — works for both profile-pin orders AND geocoded addresses
        const dest = resolvedDest.current;
        if (dest) {
          drawAdminRoadRoute(map, lat, lng, dest.lat, dest.lng);
        } else {
          map.setView([lat, lng], 16, { animate: true });
        }
      },
      (err) => console.warn('GPS error', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };
  // ───────────────────────────────────────────────────────────────────────────

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    try {
      await orderService.updatePaymentStatus(orderId, newPaymentStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o));
    } catch { alert('Failed to update payment status'); }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => {
        if (o.id !== orderId) return o;
        const u = { ...o, status: newStatus };
        if (newStatus === 'DELIVERED') u.paymentStatus = 'COMPLETED';
        return u;
      }));
    } catch { alert('Failed to update order status'); }
  };

  const TRACKABLE = ['SHIPPED', 'OUT_FOR_DELIVERY'];

  return (
    <div className="page-wrap">
      <div className="page-header-bar">
        <div>
          <h2 className="page-heading">Client Inquiries</h2>
          <p className="page-heading-sub">{orders.length} total inquiries &amp; orders</p>
        </div>
        <button className="btn-secondary" onClick={fetchOrders}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="notice-bar">
        ✉️ <strong>Email notifications are enabled</strong> — clients are notified on every inquiry status update.
      </div>

      <div className="data-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Inquiry ID</th>
                <th>Client</th>
                <th>Image</th>
                <th>Items</th>
                <th>Value</th>
                <th>Method</th>
                <th>Payment</th>
                <th>Inquiry Status</th>
                <th>Date</th>
                <th>Track</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10"><div className="state-loading">Loading orders...</div></td></tr>
              ) : error ? (
                <tr><td colSpan="10">
                  <div className="state-error">
                    <p>{error}</p>
                    <button className="btn-primary" onClick={fetchOrders}>Retry</button>
                  </div>
                </td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="10">
                  <div className="state-empty"><ShoppingCart size={40} /><p>No inquiries found</p></div>
                </td></tr>
              ) : orders.map(order => {
                const items = order.items || order.orderItems || [];
                const firstItem = items[0];
                const rest = items.length - 1;
                const canTrack = TRACKABLE.includes(order.status);
                return (
                  <tr key={order.id}>
                    <td><span style={{ color: '#6366f1', fontWeight: 700 }}>#{order.id}</span></td>
                    <td>{order.customerName || 'N/A'}</td>
                    <td>
                      {firstItem?.image ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img src={firstItem.image} alt={firstItem.name || 'Product'}
                            style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e2e8f0' }}
                            onError={e => e.target.src = 'https://via.placeholder.com/50'} />
                          {rest > 0 && (
                            <span style={{
                              position: 'absolute', top: -6, right: -6, background: '#6366f1',
                              color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 5px',
                              borderRadius: 10, border: '2px solid white'
                            }}>+{rest}</span>
                          )}
                        </div>
                      ) : <span className="badge badge-gray">None</span>}
                    </td>
                    <td><span className="badge badge-indigo">{items.length} item{items.length !== 1 ? 's' : ''}</span></td>
                    <td><strong style={{ color: '#059669' }}>₹{order.total || order.totalAmount}</strong></td>
                    <td><span className="badge badge-blue">{order.paymentMethod || 'N/A'}</span></td>
                    <td>
                      {order.paymentStatus?.toUpperCase() !== 'COMPLETED' ? (
                        <select className="status-select" value={order.paymentStatus || 'PENDING'}
                          onChange={e => handlePaymentStatusChange(order.id, e.target.value)}>
                          <option value="PENDING">Pending</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="FAILED">Failed</option>
                        </select>
                      ) : (
                        <span className={`badge ${paymentColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
                      )}
                    </td>
                    <td>
                      <select className="status-select" value={order.status || 'CONFIRMED'}
                        onChange={e => handleOrderStatusChange(order.id, e.target.value)}
                        disabled={order.status === 'DELIVERED' || order.status === 'CANCELLED'}>
                        <option value="PENDING">Awaiting Response</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PROCESSING">In Production</option>
                        <option value="SHIPPED">Dispatched</option>
                        <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                        <option value="DELIVERED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td>
                      {canTrack ? (
                        <button
                          onClick={() => openDeliveryMap(order)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: 'linear-gradient(135deg,#1565C0,#0D47A1)',
                            color: 'white', border: '1px solid rgba(0,176,255,0.3)', borderRadius: 8,
                            padding: '7px 13px', cursor: 'pointer', fontSize: 12,
                            fontWeight: 700, whiteSpace: 'nowrap',
                            boxShadow: '0 2px 8px rgba(21,101,192,0.4)'
                          }}
                        >
                          <MapPin size={13} /> Deliver
                        </button>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Admin Delivery Map Modal ── */}
      {mapOrder && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 780,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Modal header */}
            <div style={{
              background: 'linear-gradient(135deg,#8B1A1A,#5C0E0E)',
              padding: '16px 20px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: '#4ade80',
                  boxShadow: '0 0 0 0 rgba(74,222,128,0.6)',
                  animation: 'livePulseAdmin 1.4s infinite'
                }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Live Delivery Map</span>
                <span style={{
                  background: 'rgba(255,255,255,0.2)', borderRadius: 20,
                  padding: '2px 10px', fontSize: 12
                }}>Order #{mapOrder.id}</span>
              </div>
              <button onClick={closeDeliveryMap} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'white'
              }}>
                <X size={18} />
              </button>
            </div>

            {/* Customer info strip */}
            <div style={{
              background: '#fafafa', borderBottom: '1px solid #f0f0f0',
              padding: '10px 20px', display: 'flex', gap: 24, flexWrap: 'wrap',
              fontSize: 13, color: '#555'
            }}>
              <span>👤 <strong>{mapOrder.customerName || 'N/A'}</strong></span>
              <span>📦 Status: <strong style={{ color: '#8B1A1A' }}>{mapOrder.status}</strong></span>
              <span>📍 {parseShippingAddress(mapOrder.shippingAddress) || 'Address not set'}</span>
            </div>

            {/* Map */}
            <div
              ref={adminMapRef}
              style={{ width: '100%', height: 420, background: '#e8e8e8' }}
            />

            {/* Footer */}
            <div style={{
              padding: '12px 20px', background: '#fafafa', borderTop: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
                <span>🚚</span>
                <span>GPS is broadcasting your live position to the customer map.</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {mapOrder.deliveryPath?.length > 0 && (
                  <span style={{
                    background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
                    borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600
                  }}>
                    📍 {mapOrder.deliveryPath.length} points recorded
                  </span>
                )}
                <button onClick={closeDeliveryMap} style={{
                  background: '#8B1A1A', color: 'white', border: 'none',
                  borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13
                }}>Stop & Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes livePulseAdmin {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
      `}</style>
    </div>
  );
};

export default OrderManagement;