import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { User, Mail, Phone, MapPin, Edit2, Save, X, LogOut } from "lucide-react";
import API_BASE_URL from "../config/api";

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored) { navigate("/login"); return; }
    setUser(stored);
    setForm({ name: stored.name || "", email: stored.email || "", phone: stored.phone || "", address: stored.address || "" });
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
    </>
  );
}
