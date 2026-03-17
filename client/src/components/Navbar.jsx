import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { ShoppingBag, Heart, User, Search, Package, ChevronDown, LogOut, Menu, X } from "lucide-react";
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

  // Prevent body scroll when mobile menu is open
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

  const isHome = location.pathname === "/" || location.pathname === "/home";

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""} ${isHome ? "on-hero" : ""}`}>
        <div className="nav-inner">
          {/* Logo */}
          <Link to="/" className="nav-logo">
            <span className="logo-text">aaradhana</span>
            <span className="logo-dot">✦</span>
          </Link>

          {/* Desktop Links */}
          <ul className="nav-links-desktop">
            <li><Link to="/home" className={location.pathname === "/home" ? "active" : ""}>Shop</Link></li>
          </ul>

          {/* Actions */}
          <div className="nav-actions">
            {/* Search */}
            <div className="search-wrapper" ref={searchRef}>
              <button className="icon-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search">
                <Search size={20} />
              </button>
              {searchOpen && (
                <form className="search-dropdown" onSubmit={handleSearch}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  <button type="submit" className="search-submit-btn">
                    <Search size={16} />
                  </button>
                </form>
              )}
            </div>

            {/* Wishlist — desktop only */}
            {user && (
              <Link to="/wishlist" className="icon-btn wishlist-desktop" aria-label="Wishlist">
                <Heart size={20} />
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="icon-btn cart-btn" aria-label="Cart"
              onClick={() => { if (user) fetchCart().catch(() => { }); }}>
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {/* User — desktop only */}
            {user ? (
              <div className="user-menu-wrapper user-desktop" ref={userRef}>
                <button className="user-btn" onClick={() => setUserOpen(!userOpen)}>
                  <div className="user-avatar">{user.name?.charAt(0)?.toUpperCase() || "U"}</div>
                  <ChevronDown size={14} className={`chevron ${userOpen ? "open" : ""}`} />
                </button>
                {userOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <p className="user-name">{user.name}</p>
                      <p className="user-email">{user.email}</p>
                    </div>
                    <div className="user-dropdown-links">
                      <Link to="/my-profile"><User size={15} /> My Profile</Link>
                      <Link to="/my-orders"><Package size={15} /> My Orders</Link>
                      <Link to="/wishlist"><Heart size={15} /> Wishlist</Link>
                      <Link to="/whatsapp-cart" className="whatsapp-dropdown-link">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 13.89 2.525 15.66 3.438 17.168L2.546 20.2C2.49478 20.3741 2.49141 20.5587 2.53624 20.7346C2.58107 20.9104 2.67245 21.0709 2.80076 21.1992C2.92907 21.3276 3.08958 21.4189 3.26542 21.4638C3.44125 21.5086 3.62592 21.5052 3.8 21.454L6.832 20.562C8.33997 21.475 10.11 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM9.738 14.263C11.761 16.285 13.692 16.552 14.374 16.577C15.411 16.615 16.421 15.823 16.814 14.904C16.8636 14.7896 16.8816 14.6641 16.866 14.5406C16.8503 14.4172 16.8016 14.3003 16.725 14.202L15.213 12.285C15.1429 12.1952 15.0501 12.1249 14.9441 12.0812C14.838 12.0375 14.7226 12.0219 14.609 12.036C14.3828 12.0629 14.1624 12.1289 13.957 12.231L13.449 12.502C13.3673 12.5455 13.2753 12.5665 13.1829 12.5628C13.0906 12.5592 13.0006 12.531 12.9224 12.481C12.3084 12.111 11.8894 11.692 11.5194 11.078C11.4694 10.9998 11.4412 10.9098 11.4375 10.8175C11.4339 10.7251 11.4549 10.6331 11.4984 10.551L11.7694 10.043C11.8714 9.83759 11.9374 9.61724 11.9644 9.391C11.9785 9.27738 11.9629 9.16199 11.9192 9.05594C11.8755 8.94989 11.8052 8.85705 11.7154 8.787L9.79837 7.275C9.69997 7.19844 9.58313 7.14968 9.45966 7.13404C9.33618 7.11841 9.21073 7.13646 9.09637 7.186C8.17737 7.579 7.38537 8.59 7.42337 9.627C7.44837 10.308 7.71537 12.239 9.73737 14.262L9.738 14.263Z" />
                        </svg>
                        WhatsApp Order
                      </Link>
                      <button onClick={handleLogout} className="logout-link">
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary nav-login-btn">Login</Link>
            )}

            {/* Hamburger — mobile only */}
            <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && <div className="menu-overlay" onClick={() => setMenuOpen(false)} />}

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <div className="mobile-menu-inner">
          {/* User info */}
          {user && (
            <div className="mobile-user-info">
              <div className="user-avatar large">{user.name?.charAt(0)?.toUpperCase() || "U"}</div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>{user.name}</p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{user.email}</p>
              </div>
            </div>
          )}

          {/* Search */}
          <form className="mobile-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit"><Search size={18} /></button>
          </form>

          {/* Nav links */}
          <nav className="mobile-nav-links">
            <Link to="/home">Shop</Link>
            {user ? (
              <>
                <Link to="/my-profile"><User size={16} style={{ marginRight: 8 }} />My Profile</Link>
                <Link to="/my-orders"><Package size={16} style={{ marginRight: 8 }} />My Orders</Link>
                <Link to="/wishlist"><Heart size={16} style={{ marginRight: 8 }} />Wishlist</Link>
                <Link to="/cart"><ShoppingBag size={16} style={{ marginRight: 8 }} />Cart {cartCount > 0 && `(${cartCount})`}</Link>
                <Link to="/whatsapp-cart" style={{ color: "#16a34a" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8 }} xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 13.89 2.525 15.66 3.438 17.168L2.546 20.2C2.49478 20.3741 2.49141 20.5587 2.53624 20.7346C2.58107 20.9104 2.67245 21.0709 2.80076 21.1992C2.92907 21.3276 3.08958 21.4189 3.26542 21.4638C3.44125 21.5086 3.62592 21.5052 3.8 21.454L6.832 20.562C8.33997 21.475 10.11 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM9.738 14.263C11.761 16.285 13.692 16.552 14.374 16.577C15.411 16.615 16.421 15.823 16.814 14.904C16.8636 14.7896 16.8816 14.6641 16.866 14.5406C16.8503 14.4172 16.8016 14.3003 16.725 14.202L15.213 12.285C15.1429 12.1952 15.0501 12.1249 14.9441 12.0812C14.838 12.0375 14.7226 12.0219 14.609 12.036C14.3828 12.0629 14.1624 12.1289 13.957 12.231L13.449 12.502C13.3673 12.5455 13.2753 12.5665 13.1829 12.5628C13.0906 12.5592 13.0006 12.531 12.9224 12.481C12.3084 12.111 11.8894 11.692 11.5194 11.078C11.4694 10.9998 11.4412 10.9098 11.4375 10.8175C11.4339 10.7251 11.4549 10.6331 11.4984 10.551L11.7694 10.043C11.8714 9.83759 11.9374 9.61724 11.9644 9.391C11.9785 9.27738 11.9629 9.16199 11.9192 9.05594C11.8755 8.94989 11.8052 8.85705 11.7154 8.787L9.79837 7.275C9.69997 7.19844 9.58313 7.14968 9.45966 7.13404C9.33618 7.11841 9.21073 7.13646 9.09637 7.186C8.17737 7.579 7.38537 8.59 7.42337 9.627C7.44837 10.308 7.71537 12.239 9.73737 14.262L9.738 14.263Z" />
                  </svg>
                  WhatsApp Order
                </Link>
                <Link to="/customer-support">Customer Support</Link>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>

          {/* Logout */}
          {user && (
            <button className="mobile-logout-btn" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
