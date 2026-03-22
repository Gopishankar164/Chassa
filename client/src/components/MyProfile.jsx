import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { User, Mail, Phone, MapPin, Edit2, Save, X, LogOut, Navigation } from "lucide-react";
import API_BASE_URL from "../config/api";

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  // Delivery location map state
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [locPin, setLocPin] = useState(null);       // { lat, lng }
  const [locLabel, setLocLabel] = useState("");     // reverse-geocoded label
  const [locSaving, setLocSaving] = useState(false);
  const [locMsg, setLocMsg] = useState("");
  const mapDivRef = useRef(null);
  const leafletMapRef = useRef(null);
  const pinMarkerRef = useRef(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored) { navigate("/login"); return; }
    setUser(stored);
    setForm({ name: stored.name || "", email: stored.email || "", phone: stored.phone || "", address: stored.address || "" });
    if (stored.deliveryLat && stored.deliveryLng) {
      setLocPin({ lat: stored.deliveryLat, lng: stored.deliveryLng });
      setLocLabel(stored.deliveryLocationLabel || "");
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const updated = await res.json();
        // Backend returns the user object directly (not wrapped in {user: ...})
        const updatedUser = { ...user, ...form, ...updated };
        delete updatedUser.password;
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setForm({ name: updatedUser.name || "", email: updatedUser.email || "", phone: updatedUser.phone || "", address: updatedUser.address || "" });
        setEditing(false);
        setMsg("Profile updated successfully!");
        setTimeout(() => setMsg(""), 2500);
      } else {
        const err = await res.json().catch(() => ({}));
        setMsg(err.message || "Failed to update profile");
        setTimeout(() => setMsg(""), 3000);
      }
    } catch {
      setMsg("Network error. Please try again.");
      setTimeout(() => setMsg(""), 3000);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // ── Delivery Location Map helpers ──────────────────────────────
  const loadLeaflet = () => new Promise(resolve => {
    if (window.L) { resolve(); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = resolve;
    document.head.appendChild(s);
  });

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
  };

  const openLocationMap = async () => {
    setShowLocationMap(true);
    await loadLeaflet();
    // Wait one tick for the div to mount
    setTimeout(() => initMap(), 80);
  };

  const initMap = () => {
    if (!mapDivRef.current || leafletMapRef.current) return;
    const L = window.L;
    const defaultLat = locPin?.lat || 11.0168;
    const defaultLng = locPin?.lng || 76.9558;

    const map = L.map(mapDivRef.current).setView([defaultLat, defaultLng], 16);
    // Satellite layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri', maxZoom: 19
    }).addTo(map);
    // Road labels overlay
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, opacity: 0.7
    }).addTo(map);

    leafletMapRef.current = map;

    const homeIcon = L.divIcon({
      className: '',
      html: `<div style="background:#8B1A1A;border-radius:50% 50% 50% 0;width:36px;height:36px;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:16px;">🏠</span></div>`,
      iconSize: [36, 36], iconAnchor: [18, 36]
    });

    // If already have a pin, place it
    if (locPin) {
      pinMarkerRef.current = L.marker([locPin.lat, locPin.lng], { icon: homeIcon, draggable: true }).addTo(map);
      pinMarkerRef.current.on('dragend', async (e) => {
        const { lat, lng } = e.target.getLatLng();
        setLocPin({ lat, lng });
        const label = await reverseGeocode(lat, lng);
        setLocLabel(label);
      });
    }

    // Click to place/move pin
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      setLocPin({ lat, lng });
      const label = await reverseGeocode(lat, lng);
      setLocLabel(label);
      if (pinMarkerRef.current) {
        pinMarkerRef.current.setLatLng([lat, lng]);
      } else {
        pinMarkerRef.current = L.marker([lat, lng], { icon: homeIcon, draggable: true }).addTo(map);
        pinMarkerRef.current.on('dragend', async (ev) => {
          const p = ev.target.getLatLng();
          setLocPin({ lat: p.lat, lng: p.lng });
          const lbl = await reverseGeocode(p.lat, p.lng);
          setLocLabel(lbl);
        });
      }
    });
  };

  const useMyGPS = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setLocPin({ lat, lng });
      const label = await reverseGeocode(lat, lng);
      setLocLabel(label);
      const map = leafletMapRef.current;
      const L = window.L;
      if (map && L) {
        map.setView([lat, lng], 17, { animate: true });
        const homeIcon = L.divIcon({
          className: '',
          html: `<div style="background:#8B1A1A;border-radius:50% 50% 50% 0;width:36px;height:36px;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:16px;">🏠</span></div>`,
          iconSize: [36, 36], iconAnchor: [18, 36]
        });
        if (pinMarkerRef.current) pinMarkerRef.current.setLatLng([lat, lng]);
        else {
          pinMarkerRef.current = L.marker([lat, lng], { icon: homeIcon, draggable: true }).addTo(map);
          pinMarkerRef.current.on('dragend', async (ev) => {
            const p = ev.target.getLatLng();
            setLocPin({ lat: p.lat, lng: p.lng });
            setLocLabel(await reverseGeocode(p.lat, p.lng));
          });
        }
      }
    }, () => alert('Could not get your location. Please allow location access.'));
  };

  const saveDeliveryLocation = async () => {
    if (!locPin) { setLocMsg('Please pin a location on the map first.'); return; }
    setLocSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          deliveryLat: String(locPin.lat),
          deliveryLng: String(locPin.lng),
          deliveryLocationLabel: locLabel
        })
      });
      if (res.ok) {
        const updated = await res.json();
        const newUser = { ...user, deliveryLat: locPin.lat, deliveryLng: locPin.lng, deliveryLocationLabel: locLabel, ...updated };
        delete newUser.password;
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        setLocMsg('✅ Delivery location saved!');
        setTimeout(() => { setLocMsg(''); setShowLocationMap(false); leafletMapRef.current = null; pinMarkerRef.current = null; }, 1800);
      } else {
        setLocMsg('Failed to save. Please try again.');
      }
    } catch { setLocMsg('Network error. Please try again.'); }
    setLocSaving(false);
  };

  const closeLocationMap = () => {
    setShowLocationMap(false);
    if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    pinMarkerRef.current = null;
    setLocMsg('');
  };
  // ───────────────────────────────────────────────────────────────

  if (!user) return null;

  return (
    <>
      <Navbar />
      {msg && <div className="toast success">{msg}</div>}
      <main className="page-content" style={{ padding: "40px 0 80px" }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 700, marginBottom: 32 }}>My Profile</h1>

          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary))", padding: "32px 32px 48px", position: "relative" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#fff", fontWeight: 700 }}>
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
              <h2 style={{ color: "#fff", fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginTop: 12, marginBottom: 2 }}>{user.name}</h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.88rem" }}>{user.email}</p>
            </div>

            {/* Fields */}
            <div style={{ padding: "32px", marginTop: -16 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20, gap: 8 }}>
                {editing ? (
                  <>
                    <button className="btn-primary" onClick={handleSave} disabled={loading} style={{ fontSize: "0.82rem", padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                      <Save size={14} /> {loading ? "Saving..." : "Save"}
                    </button>
                    <button className="btn-outline" onClick={() => setEditing(false)} style={{ fontSize: "0.82rem", padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                      <X size={14} /> Cancel
                    </button>
                  </>
                ) : (
                  <button className="btn-outline" onClick={() => setEditing(true)} style={{ fontSize: "0.82rem", padding: "8px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                    <Edit2 size={14} /> Edit Profile
                  </button>
                )}
              </div>

              {[
                { icon: User, label: "Full Name", key: "name", type: "text" },
                { icon: Mail, label: "Email", key: "email", type: "email" },
                { icon: Phone, label: "Phone", key: "phone", type: "tel" },
                { icon: MapPin, label: "Address", key: "address", type: "text" },
              ].map(field => (
                <div key={field.key} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 0", borderBottom: "1px solid var(--border-light)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <field.icon size={16} style={{ color: "var(--primary)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>{field.label}</p>
                    {editing ? (
                      <input
                        type={field.type}
                        value={form[field.key] || ""}
                        onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                        className="form-input"
                        style={{ fontSize: "0.95rem" }}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    ) : (
                      <p style={{ fontSize: "0.95rem", color: form[field.key] ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {form[field.key] || `No ${field.label.toLowerCase()} added`}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* ── Delivery Location Card ── */}
              <div style={{ marginTop: 28, padding: '20px', background: 'linear-gradient(135deg,#fdf2f2,#fff)', border: '1.5px solid #e8c8c8', borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#8B1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={18} color="white" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#333', margin: 0 }}>Delivery Location</p>
                      <p style={{ fontSize: '0.78rem', color: '#888', margin: 0 }}>Pinpoint your exact delivery address on the map</p>
                    </div>
                  </div>
                  <button
                    onClick={openLocationMap}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#8B1A1A', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                  >
                    <Navigation size={14} /> {locPin ? 'Update Pin' : 'Set on Map'}
                  </button>
                </div>
                {locPin && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid #f0d0d0', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📍</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#8B1A1A', fontWeight: 700 }}>Pinned Location</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{locLabel || `${locPin.lat.toFixed(5)}, ${locPin.lng.toFixed(5)}`}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#aaa' }}>{locPin.lat.toFixed(6)}, {locPin.lng.toFixed(6)}</p>
                    </div>
                    <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>Saved</span>
                  </div>
                )}
                {!locPin && (
                  <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: '#aaa', textAlign: 'center' }}>No delivery location set — orders will use your text address.</p>
                )}
              </div>

              <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => navigate("/my-orders")} className="btn-outline" style={{ fontSize: "0.85rem" }}>View Orders</button>
                <button onClick={() => navigate("/wishlist")} className="btn-outline" style={{ fontSize: "0.85rem" }}>My Wishlist</button>
                <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1.5px solid var(--error)", color: "var(--error)", padding: "10px 18px", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", marginLeft: "auto", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--error)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--error)"; }}>
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* ── Delivery Location Map Modal ── */}
      {showLocationMap && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 700,
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg,#8B1A1A,#5C0E0E)',
              padding: '16px 20px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={18} color="white" />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Pin Your Delivery Location</span>
              </div>
              <button onClick={closeLocationMap} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'white'
              }}>✕</button>
            </div>

            {/* Instruction strip */}
            <div style={{
              background: '#fffbeb', borderBottom: '1px solid #fde68a',
              padding: '10px 18px', fontSize: 13, color: '#92400e',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span>👇</span>
              <span><strong>Tap anywhere on the map</strong> to pin your exact delivery location, or drag the 🏠 pin to adjust it.</span>
            </div>

            {/* GPS button */}
            <div style={{ padding: '10px 18px 6px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={useMyGPS} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#1d4ed8', color: 'white', border: 'none',
                borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                fontWeight: 600, fontSize: 13
              }}>
                <Navigation size={14} /> Use My Current Location
              </button>
              {locPin && (
                <span style={{ fontSize: 12, color: '#666' }}>
                  📍 {locPin.lat.toFixed(6)}, {locPin.lng.toFixed(6)}
                </span>
              )}
            </div>

            {/* Map */}
            <div ref={mapDivRef} style={{ width: '100%', height: 380 }} />

            {/* Address preview */}
            {locLabel && (
              <div style={{
                padding: '10px 18px', background: '#f8f9fa',
                borderTop: '1px solid #f0f0f0', fontSize: 12, color: '#555'
              }}>
                <strong style={{ color: '#8B1A1A' }}>🏠 Address:</strong> {locLabel}
              </div>
            )}

            {/* Footer */}
            <div style={{
              padding: '12px 18px', borderTop: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
            }}>
              {locMsg && <span style={{ fontSize: 13, color: locMsg.startsWith('✅') ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{locMsg}</span>}
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button onClick={closeLocationMap} style={{
                  background: 'none', border: '1.5px solid #ddd', borderRadius: 8,
                  padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#555'
                }}>Cancel</button>
                <button onClick={saveDeliveryLocation} disabled={locSaving || !locPin} style={{
                  background: locPin ? '#8B1A1A' : '#ccc', color: 'white', border: 'none',
                  borderRadius: 8, padding: '8px 20px', cursor: locPin ? 'pointer' : 'default',
                  fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
                }}>
                  <Save size={14} /> {locSaving ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
