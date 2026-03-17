import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./Landing.css";

const CAPABILITIES = [
  { icon: "⚙", label: "CNC Machining", spec: "±0.01 mm precision" },
  { icon: "🔩", label: "Metal Casting", spec: "Aluminum & Gun Metal" },
  { icon: "🏭", label: "Surface Finishing", spec: "50–60 HRC hardness" },
  { icon: "🤖", label: "Automation", spec: "PLC / VFD / IoT 4.0" },
];

const INDUSTRIES = [
  { icon: "🚗", name: "Automotive", desc: "Precision components for engines, drivetrains, and chassis systems" },
  { icon: "⚙", name: "Industrial Machinery", desc: "Heavy-duty machined parts, gear systems, and structural castings" },
  { icon: "🤖", name: "Automation Systems", desc: "VFD drives, PLC control panels, HMI/SCADA integration" },
];

const PRODUCT_CATEGORIES = [
  { name: "Precision CNC", items: "Cam Housings, Turned Components, Gear Parts", color: "#1565C0" },
  { name: "Casting", items: "Aluminum Blades, Gun Metal Plugs, Finishing", color: "#00838F" },
  { name: "Automation", items: "VFD, PLC, HMI/SCADA, IoT 4.0", color: "#1B5E20" },
  { name: "Valve Technology", items: "Valve Mouths, Industrial Valves", color: "#4A148C" },
];

const STATS = [
  { value: "0.01mm", label: "Machining Precision" },
  { value: "15+", label: "Years Experience" },
  { value: "500+", label: "Components Manufactured" },
  { value: "ISO", label: "Quality Standards" },
];

export default function Landing() {
  const revealRef = useRef(null);

  useEffect(() => {
    const nodes = document.querySelectorAll('.reveal-on-scroll');
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(el => el.classList.add('revealed'));
      return;
    }
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    nodes.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar />
      <main className="landing-page page-content">

        {/* ── HERO ── */}
        <section className="hero-section">
          <div className="hero-grid-bg" />
          <div className="hero-content">
            <div className="hero-tag"><span className="hero-tag-dot" />COIMBATORE, TAMIL NADU</div>
            <h1 className="hero-heading">
              Precision Engineering<br />
              <em>&amp; Industrial Drive</em><br />
              Solutions
            </h1>
            <p className="hero-sub">
              CNC Components · Automation Systems · Metal Casting<br />
              Built for industries that demand zero tolerance.
            </p>
            <div className="hero-ctas">
              <Link to="/home" className="btn-primary">Explore Products</Link>
              <Link to="/customer-support" className="btn-outline">Request Quote</Link>
            </div>
            <div className="hero-specs">
              {CAPABILITIES.map(c => (
                <div key={c.label} className="hero-spec-chip">
                  <span className="spec-icon">{c.icon}</span>
                  <div>
                    <div className="spec-label">{c.label}</div>
                    <div className="spec-value">{c.spec}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-schematic">
              <svg viewBox="0 0 400 400" className="schematic-svg">
                {/* Outer ring */}
                <circle cx="200" cy="200" r="180" stroke="#1E2D42" strokeWidth="1" fill="none" strokeDasharray="4 6"/>
                <circle cx="200" cy="200" r="140" stroke="#1565C0" strokeWidth="0.5" fill="none" opacity="0.4"/>
                {/* Gear teeth simulation */}
                {Array.from({length: 16}).map((_, i) => {
                  const angle = (i / 16) * Math.PI * 2;
                  const x1 = 200 + Math.cos(angle) * 155;
                  const y1 = 200 + Math.sin(angle) * 155;
                  const x2 = 200 + Math.cos(angle) * 175;
                  const y2 = 200 + Math.sin(angle) * 175;
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1565C0" strokeWidth="3" />;
                })}
                {/* Inner hub */}
                <circle cx="200" cy="200" r="80" stroke="#00B0FF" strokeWidth="1.5" fill="rgba(21,101,192,0.08)"/>
                <circle cx="200" cy="200" r="40" stroke="#00B0FF" strokeWidth="2" fill="rgba(0,176,255,0.1)"/>
                <circle cx="200" cy="200" r="12" fill="#00B0FF"/>
                {/* Crosshairs */}
                <line x1="200" y1="120" x2="200" y2="160" stroke="#00B0FF" strokeWidth="1" opacity="0.6"/>
                <line x1="200" y1="240" x2="200" y2="280" stroke="#00B0FF" strokeWidth="1" opacity="0.6"/>
                <line x1="120" y1="200" x2="160" y2="200" stroke="#00B0FF" strokeWidth="1" opacity="0.6"/>
                <line x1="240" y1="200" x2="280" y2="200" stroke="#00B0FF" strokeWidth="1" opacity="0.6"/>
                {/* Dimension labels */}
                <text x="210" y="118" fill="#5C6E82" fontSize="9" fontFamily="monospace">Ø360</text>
                <text x="210" y="162" fill="#00B0FF" fontSize="8" fontFamily="monospace">±0.01</text>
                <text x="158" y="197" fill="#5C6E82" fontSize="8" fontFamily="monospace">HUB</text>
                {/* Bolt holes */}
                {Array.from({length: 6}).map((_, i) => {
                  const angle = (i / 6) * Math.PI * 2;
                  const x = 200 + Math.cos(angle) * 110;
                  const y = 200 + Math.sin(angle) * 110;
                  return <circle key={i} cx={x} cy={y} r="6" stroke="#3D5166" strokeWidth="1" fill="#111827"/>;
                })}
              </svg>
              <div className="schematic-label">CNC DRIVE COMPONENT — REV.4</div>
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <section className="stats-strip">
          <div className="container">
            <div className="stats-grid">
              {STATS.map(s => (
                <div key={s.label} className="stat-item">
                  <div className="stat-val">{s.value}</div>
                  <div className="stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section className="about-section" id="about">
          <div className="container">
            <div className="about-grid reveal-on-scroll">
              <div className="about-text">
                <div className="section-tag">// ABOUT US</div>
                <h2 className="section-heading-left">Precision Built.<br />Industry Proven.</h2>
                <p>Chassa Engineering Drives is a high-precision engineering and manufacturing firm based in Coimbatore, Tamil Nadu — the engineering capital of South India. We specialize in CNC components, industrial automation systems, metal casting, and drive solutions.</p>
                <p>Our facility operates with sub-millimeter tolerances, serving automotive OEMs, industrial machinery manufacturers, and automation integrators across India.</p>
                <Link to="/customer-support" className="btn-outline" style={{ marginTop: '8px' }}>Get In Touch</Link>
              </div>
              <div className="about-capabilities">
                <div className="section-tag">// MANUFACTURING CAPABILITIES</div>
                <div className="cap-list">
                  <div className="cap-item"><div className="cap-bar" style={{ width: '95%' }}><span>CNC Machining</span><strong>±0.01mm</strong></div></div>
                  <div className="cap-item"><div className="cap-bar" style={{ width: '88%' }}><span>Aluminum Casting</span><strong>A360 Alloy</strong></div></div>
                  <div className="cap-item"><div className="cap-bar" style={{ width: '80%' }}><span>Surface Finishing</span><strong>50–60 HRC</strong></div></div>
                  <div className="cap-item"><div className="cap-bar" style={{ width: '75%' }}><span>Automation Integration</span><strong>PLC/VFD</strong></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRODUCT CATEGORIES ── */}
        <section className="categories-section" id="products">
          <div className="container">
            <div className="section-header reveal-on-scroll">
              <div className="section-tag">// PRODUCT RANGE</div>
              <h2 className="section-heading-left">Industrial Solutions</h2>
              <p className="section-desc">Engineered components and systems for demanding industrial applications.</p>
            </div>
            <div className="cat-grid reveal-on-scroll">
              {PRODUCT_CATEGORIES.map(cat => (
                <Link to="/home" key={cat.name} className="cat-card">
                  <div className="cat-card-accent" style={{ background: cat.color }} />
                  <h3 className="cat-card-name">{cat.name}</h3>
                  <p className="cat-card-items">{cat.items}</p>
                  <div className="cat-card-cta">View Products →</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── INDUSTRIES ── */}
        <section className="industries-section" id="industries">
          <div className="container">
            <div className="section-header reveal-on-scroll">
              <div className="section-tag">// INDUSTRIES SERVED</div>
              <h2 className="section-heading-left">Sectors We Power</h2>
            </div>
            <div className="industries-grid">
              {INDUSTRIES.map((ind, i) => (
                <div key={ind.name} className="ind-card reveal-on-scroll" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="ind-icon">{ind.icon}</div>
                  <h3>{ind.name}</h3>
                  <p>{ind.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="cta-banner">
          <div className="container">
            <div className="cta-inner reveal-on-scroll">
              <div className="cta-text">
                <div className="section-tag light">// GET STARTED</div>
                <h2>Ready to Source Precision Components?</h2>
                <p>Send us your technical drawings or specifications. Our engineering team will respond within 24 hours.</p>
                <Link to="/customer-support" className="btn-primary">Submit Technical Inquiry</Link>
              </div>
              <div className="cta-spec-block">
                <div className="spec-line"><span>Min. Tolerance</span><strong>±0.01 mm</strong></div>
                <div className="spec-line"><span>Materials</span><strong>Al, SS, CI, GM</strong></div>
                <div className="spec-line"><span>Lead Time</span><strong>7–21 Days</strong></div>
                <div className="spec-line"><span>MOQ</span><strong>On Request</strong></div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
