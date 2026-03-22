import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Linkedin, Youtube, Twitter } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container footer-grid">
          {/* Brand */}
          <div className="footer-col brand-col">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon">
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                  <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" stroke="#00B0FF" strokeWidth="1.5" fill="none"/>
                  <circle cx="14" cy="14" r="4" fill="#00B0FF"/>
                </svg>
              </div>
              <div>
                <span className="logo-text">CHASSA</span>
                <span className="footer-logo-sub">ENGINEERING DRIVES</span>
              </div>
            </Link>
            <p className="footer-tagline">
              High-precision CNC components, industrial automation, and casting solutions. Built for industries that demand zero tolerance.
            </p>
            <div className="footer-contact">
              <div className="fc-item"><Phone size={13} /><span>+91 98765 43210</span></div>
              <div className="fc-item"><Mail size={13} /><span>enquiry@chassadrives.com</span></div>
              <div className="fc-item"><MapPin size={13} /><span>Coimbatore, Tamil Nadu — 641 001</span></div>
            </div>
          </div>

          {/* Products */}
          <div className="footer-col">
            <h4 className="footer-col-title">Products</h4>
            <ul className="footer-links">
              <li><Link to="/home">All Products</Link></li>
              <li><Link to="/home">Precision CNC Components</Link></li>
              <li><Link to="/home">Casting & Metal Products</Link></li>
              <li><Link to="/home">Automation & IoT</Link></li>
              <li><Link to="/home">Valve Technology</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-col">
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-links">
              <li><Link to="/#about">About Us</Link></li>
              <li><Link to="/#industries">Industries Served</Link></li>
              <li><Link to="/customer-support">Contact & Inquiry</Link></li>
              <li><Link to="/my-orders">Order Tracking</Link></li>
            </ul>
          </div>

          {/* Certifications */}
          <div className="footer-col">
            <h4 className="footer-col-title">Capabilities</h4>
            <div className="footer-caps">
              <div className="cap-badge">CNC Machining ±0.01mm</div>
              <div className="cap-badge">Aluminum Casting</div>
              <div className="cap-badge">Surface Finishing 50–60 HRC</div>
              <div className="cap-badge">PLC / VFD Automation</div>
              <div className="cap-badge">IoT 4.0 Integration</div>
            </div>
            <div className="footer-socials" style={{ marginTop: '20px' }}>
              <a href="#" className="social-icon"><Linkedin size={16} /></a>
              <a href="#" className="social-icon"><Youtube size={16} /></a>
              <a href="#" className="social-icon"><Twitter size={16} /></a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© 2025 Chassa Engineering Drives. All rights reserved.</p>
          <p className="footer-loc">Coimbatore, Tamil Nadu, India</p>
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
