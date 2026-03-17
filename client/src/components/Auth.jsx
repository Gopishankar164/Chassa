import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from "lucide-react";
import API_BASE_URL from "../config/api";
import GoogleLoginButton from "./GoogleLoginButton";
import "./Auth.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingVerify, setPendingVerify] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useCart();

  const handleGoogleSuccess = async (user, token) => {
    try {
      setLoading(true);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      setUser(user);
      // Sync cart from server
      try {
        const cartRes = await fetch(`${API_BASE_URL}/api/users/${user.id}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cartRes.ok) {
          const dbUser = await cartRes.json();
          localStorage.setItem("cart", JSON.stringify(dbUser.cart || []));
        }
      } catch { }
      const from = location.state?.from || "/home";
      navigate(from, { replace: true });
    } catch (e) {
      setServerError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname === "/forgot-password") setMode("forgot");
    else if (location.pathname === "/register") setMode("signup");
    else setMode("login");
    if (location.state?.message) setServerError(location.state.message);
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "" }));
    setServerError("");
  };

  const validate = () => {
    const errs = {};
    if (mode === "signup" && !form.name.trim()) errs.name = "Name is required";
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Invalid email";
    if (mode !== "forgot") {
      if (!form.password) errs.password = "Password is required";
      else if (form.password.length < 6) errs.password = "Min 6 characters";
      if (mode === "signup" && form.password !== form.confirm) errs.confirm = "Passwords don't match";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      if (mode === "login") {
        const res = await fetch(`${API_BASE_URL}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password })
        });
        if (!res.ok) throw new Error("Invalid email or password");
        const { user, token } = await res.json();
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        setUser(user);
        const from = location.state?.from || "/home";
        navigate(from, { replace: true });
      } else if (mode === "signup") {
        const res = await fetch(`${API_BASE_URL}/api/users/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, cart: [] })
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.message || "Signup failed");
        }
        const d = await res.json();
        setPendingVerify(true);
        setVerifyEmail(d.email || form.email);
      } else if (mode === "forgot") {
        await fetch(`${API_BASE_URL}/api/users/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email })
        });
        setSuccessMsg("If the email exists, a reset link has been sent.");
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail, code: verifyCode })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Verification failed"); }
      setPendingVerify(false);
      setSuccessMsg("Email verified! Please sign in.");
      setMode("login");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    login: { heading: "Welcome back", sub: "Sign in to your Aaradhana account" },
    signup: { heading: "Create account", sub: "Join us and start shopping" },
    forgot: { heading: "Reset password", sub: "Enter your email for a reset link" }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand-col">
        <Link to="/" className="auth-logo">
          <span className="logo-text">aaradhana</span><span className="logo-dot">✦</span>
        </Link>
        <div className="auth-brand-content">
          <h2>Discover Fashion <br />Made for <em>You</em></h2>
          <p>Shop the finest ethnic wear, contemporary styles, and accessories — all in one place.</p>
          <div className="auth-features">
            {["Free delivery on orders ₹499+", "30-day easy returns", "Exclusive member offers", "100% secure payments"].map(f => (
              <div key={f} className="auth-feature"><span className="af-check">✓</span>{f}</div>
            ))}
          </div>
        </div>
        <div className="auth-decor-circles">
          <div className="ac1" /><div className="ac2" /><div className="ac3" />
        </div>
      </div>

      <div className="auth-form-col">
        <div className="auth-form-wrap">
          <button className="auth-back" onClick={() => navigate("/")}>
            <ArrowLeft size={16} /> Back to Home
          </button>

          <h1 className="auth-heading">{titles[mode].heading}</h1>
          <p className="auth-sub">{titles[mode].sub}</p>

          {serverError && <div className="auth-alert error">{serverError}</div>}
          {successMsg && <div className="auth-alert success">{successMsg}</div>}

          {!pendingVerify ? (
            <form onSubmit={handleSubmit} className="auth-form">
              {mode === "signup" && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-icon-wrap">
                    <User size={16} className="input-icon-left" />
                    <input type="text" name="name" placeholder="Your name" value={form.name}
                      onChange={handleChange} className={`form-input with-icon ${errors.name ? "error" : ""}`} />
                  </div>
                  {errors.name && <p className="form-error">{errors.name}</p>}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-icon-wrap">
                  <Mail size={16} className="input-icon-left" />
                  <input type="email" name="email" placeholder="your@email.com" value={form.email}
                    onChange={handleChange} className={`form-input with-icon ${errors.email ? "error" : ""}`} />
                </div>
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              {mode !== "forgot" && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-icon-wrap">
                    <Lock size={16} className="input-icon-left" />
                    <input type={showPwd ? "text" : "password"} name="password" placeholder="••••••••"
                      value={form.password} onChange={handleChange}
                      className={`form-input with-icon with-icon-right ${errors.password ? "error" : ""}`} />
                    <button type="button" className="input-icon-right-btn" onClick={() => setShowPwd(!showPwd)}>
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="form-error">{errors.password}</p>}
                </div>
              )}

              {mode === "signup" && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-icon-wrap">
                    <Lock size={16} className="input-icon-left" />
                    <input type={showConfirm ? "text" : "password"} name="confirm" placeholder="••••••••"
                      value={form.confirm} onChange={handleChange}
                      className={`form-input with-icon with-icon-right ${errors.confirm ? "error" : ""}`} />
                    <button type="button" className="input-icon-right-btn" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.confirm && <p className="form-error">{errors.confirm}</p>}
                </div>
              )}

              {mode === "login" && (
                <div className="auth-forgot-link">
                  <Link to="/forgot-password">Forgot password?</Link>
                </div>
              )}

              <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="verify-section">
              <p>Enter the 6-digit code sent to <strong>{verifyEmail}</strong></p>
              <input type="text" maxLength={6} placeholder="123456" value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                className="form-input verify-input" autoFocus />
              <button className="btn-primary auth-submit-btn" onClick={handleVerify} disabled={loading || verifyCode.length !== 6}>
                {loading ? "Verifying..." : "Verify Email"}
              </button>
              <button className="auth-text-btn" onClick={async () => {
                await fetch(`${API_BASE_URL}/api/users/resend-verification`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: verifyEmail })
                });
              }}>Resend Code</button>
            </div>
          )}

          {/* Switch */}
          {!pendingVerify && (
            <div className="auth-switch">
              {mode === "login" ? (
                <p>Don't have an account? <button onClick={() => { setMode("signup"); setErrors({}); setServerError(""); }}>Sign Up</button></p>
              ) : mode === "signup" ? (
                <p>Already have an account? <button onClick={() => { setMode("login"); setErrors({}); setServerError(""); }}>Sign In</button></p>
              ) : (
                <p><button onClick={() => { setMode("login"); setErrors({}); setServerError(""); navigate("/login"); }}>← Back to Sign In</button></p>
              )}
            </div>
          )}

          {/* Google Sign-In */}
          {!pendingVerify && mode !== "forgot" && (
            <div className="auth-social">
              <div className="auth-divider">
                <span>OR CONTINUE WITH</span>
              </div>
              <div className="auth-google-wrap">
                <GoogleLoginButton onAuth={handleGoogleSuccess} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
