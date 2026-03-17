import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container footer-grid">
          {/* Brand */}
          <div className="footer-col brand-col">
            <Link to="/" className="footer-logo">
              <span className="logo-text">aaradhana</span><span className="logo-dot">✦</span>
            </Link>
            <p className="footer-tagline">
              Premium styles & accessories — curated for every occasion.
            </p>
            <div className="footer-contact">
              <div className="fc-item"><Phone size={14} /><span>+91 98652 65689</span></div>
              <div className="fc-item"><Mail size={14} /><span>aaradhanasilkskpm@gmail.com</span></div>
              <div className="fc-item"><MapPin size={14} /><span>2/330-2, Salem Main Road, GRG Auto Consulting, Namakkal, Tamil Nadu</span></div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/home">Shop All</Link></li>
              <li><Link to="/home?cat=accessories">Accessories</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="footer-col">
            <h4 className="footer-col-title">Customer Care</h4>
            <ul className="footer-links">
              <li><Link to="/customer-support">Contact Us</Link></li>
              <li><a href="#">Shipping Policy</a></li>
              <li><a href="#">Returns & Exchange</a></li>
              <li><Link to="/my-orders">Track My Order</Link></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>

          {/* Social */}
          <div className="footer-col">
            <h4 className="footer-col-title">Follow Us</h4>
            <div className="footer-socials">
              <a href="#" className="social-icon"><Instagram size={18} /></a>
              <a href="#" className="social-icon"><Facebook size={18} /></a>
              <a href="#" className="social-icon"><Twitter size={18} /></a>
              <a href="#" className="social-icon"><Youtube size={18} /></a>
            </div>
            <div className="footer-newsletter">
              <p>Subscribe to our newsletter</p>
              <form className="fn-form" onSubmit={e => e.preventDefault()}>
                <input type="email" placeholder="your@email.com" className="fn-input" />
                <button type="submit" className="fn-btn">Go</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© 2025 Aaradhana. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </div>

      <button
        className="scroll-top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >↑</button>
    </footer>
  );
}
