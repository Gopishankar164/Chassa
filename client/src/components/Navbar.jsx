import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { ShoppingBag, User, Search, Package, ChevronDown, LogOut, Menu, X, Settings } from "lucide-react";
import "./Navbar.css";

function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userOpen, setUserOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUserState] = useState(null);
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const userRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUserState(JSON.parse(stored));
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setUserOpen(false);
    setSearchOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleLogout = () => {
    localStorage.clear();
    setUserState(null);
    setUserOpen(false);
    setMenuOpen(false);
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/home?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMenuOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/home", label: "Products" },
    { to: "/#about", label: "About" },
    { to: "/#industries", label: "Industries" },
    { to: "/customer-support", label: "Contact" },
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        {/* Top accent line */}
        <div className="nav-accent-line" />
        <div className="nav-inner">
          {/* Logo */}
          <Link to="/" className="nav-logo">
            <div className="logo-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" stroke="#00B0FF" strokeWidth="1.5" fill="none"/>
                <polygon points="14,7 21,11 21,18 14,22 7,18 7,11" stroke="#1565C0" strokeWidth="1" fill="rgba(21,101,192,0.2)"/>
                <circle cx="14" cy="14" r="3" fill="#00B0FF"/>
              </svg>
            </div>
            <div className="logo-text-wrap">
              <span className="logo-text">CHASSA</span>
              <span className="logo-sub">ENGINEERING DRIVES</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <ul className="nav-links-desktop">
            {navLinks.map(link => (
              <li key={link.to}>
                <Link to={link.to} className={location.pathname === link.to ? "active" : ""}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="nav-actions">
            <div className="search-wrapper" ref={searchRef}>
              <button className="icon-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search">
                <Search size={18} />
              </button>
              {searchOpen && (
                <form className="search-dropdown" onSubmit={handleSearch}>
                  <input autoFocus type="text" placeholder="Search products..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
                  <button type="submit" className="search-submit-btn"><Search size={16} /></button>
                </form>
              )}
            </div>

            {/* Inquiry Basket */}
            <Link to="/cart" className="icon-btn cart-btn" aria-label="Inquiry Basket"
              onClick={() => { if (user) fetchCart().catch(() => {}); }}>
              <ShoppingBag size={18} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {user ? (
              <div className="user-menu-wrapper user-desktop" ref={userRef}>
                <button className="user-btn" onClick={() => setUserOpen(!userOpen)}>
                  <div className="user-avatar">{user.name?.charAt(0)?.toUpperCase() || "U"}</div>
                  <ChevronDown size={13} className={`chevron ${userOpen ? "open" : ""}`} />
                </button>
                {userOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <p className="user-name">{user.name}</p>
                      <p className="user-email">{user.email}</p>
                    </div>
                    <div className="user-dropdown-links">
                      <Link to="/my-profile"><User size={14} /> My Profile</Link>
                      <Link to="/my-orders"><Package size={14} /> My Inquiries</Link>
                      <Link to="/customer-support"><Settings size={14} /> Support</Link>
                      <button onClick={handleLogout} className="logout-link">
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary nav-login-btn">Login</Link>
            )}

            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <div className="mobile-menu-inner">
          {user && (
            <div className="mobile-user-info">
              <div className="user-avatar large">{user.name?.charAt(0)?.toUpperCase() || "U"}</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>{user.name}</p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{user.email}</p>
              </div>
            </div>
          )}
          <form className="mobile-search" onSubmit={handleSearch}>
            <input type="text" placeholder="Search products..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} />
            <button type="submit"><Search size={18} /></button>
          </form>
          <nav className="mobile-nav-links">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            ))}
            {user ? (
              <>
                <Link to="/my-profile"><User size={15} style={{ marginRight: 8 }} />My Profile</Link>
                <Link to="/my-orders"><Package size={15} style={{ marginRight: 8 }} />My Inquiries</Link>
                <Link to="/cart"><ShoppingBag size={15} style={{ marginRight: 8 }} />Inquiry Basket {cartCount > 0 && `(${cartCount})`}</Link>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>
          {user && (
            <button className="mobile-logout-btn" onClick={handleLogout}>
              <LogOut size={15} /> Logout
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
