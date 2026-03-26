import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import API_BASE_URL from "../config/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const token = params.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: form.password })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Reset failed"); }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 }}>
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 40, maxWidth: 440, width: "100%", boxShadow: "var(--shadow-md)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>aaradhana<span style={{ color: "var(--accent)" }}>✦</span></div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 700, marginBottom: 6 }}>Reset Password</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Enter your new password below</p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>✅</div>
            <p style={{ fontWeight: 600 }}>Password reset successfully!</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 8 }}>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: "rgba(198,40,40,0.08)", color: "var(--error)", padding: "10px 14px", borderRadius: "var(--radius-sm)", marginBottom: 20, fontSize: "0.85rem" }}>{error}</div>}
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="form-input"
                  style={{ paddingLeft: 38, paddingRight: 38 }}
                  placeholder="At least 6 characters"
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="password"
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  placeholder="Repeat password"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
