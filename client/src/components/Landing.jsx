import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import heroCard1 from "../assets/hero-card-1.png";
import heroCard2 from "../assets/hero-card-2.png";
import "./Landing.css";

const COMMANDS = [
  {
    title: "New Arrivals — Ethnic Elegance",
    desc: "Discover our hand-curated collection of ethnic wear — silk sarees, embroidered kurtas, and traditional jewellery designed for every celebration.",
    img: heroCard1,
    link: "/home",
    cta: "Shop New Arrivals",
  },
  {
    title: "Free Shipping on Every Order",
    desc: "We believe premium fashion should reach your doorstep without extra cost. Enjoy free shipping on all orders, with hassle-free 30-day returns included.",
    img: heroCard2,
    link: "/home",
    cta: "Explore Accessories",
  },
];

export default function Landing() {
  const commandsRef = useRef(null);

  useEffect(() => {
    const nodes = commandsRef.current?.querySelectorAll('.command-item');
    if (!nodes || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('reveal'); observer.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    nodes.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar />
      <main className="landing-page page-content">
        {/* Hero */}
        <section className="hero-section">
          <div className="hero-content">
            <span className="hero-eyebrow">New Collection 2025</span>
            <h1 className="hero-heading">Dress the Story <br />of <em>You</em></h1>
            <p className="hero-sub">
              Curated styles & accessories — crafted for every occasion.
            </p>
            <div className="hero-ctas">
              <Link to="/home" className="btn-primary">Shop Now</Link>
              <Link to="/home?cat=accessories" className="btn-outline">Explore Collection</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card hero-card-1">
              <img src={heroCard1} alt="New Arrivals" className="hero-card-img" />
              <div className="hero-badge">✦ New Arrivals</div>
            </div>
            <div className="hero-card hero-card-2">
              <img src={heroCard2} alt="Free Shipping" className="hero-card-img" />
              <div className="hero-badge accent">Free Shipping</div>
            </div>
            <div className="hero-floating-text">
              <span>Premium</span>
              <span>Quality</span>
              <span>Curated</span>
            </div>
          </div>
        </section>


        {/* Banner */}
        <section className="promo-banner">
          <div className="container">
            <div className="promo-inner">
              <div className="promo-text">
                <span className="promo-eyebrow">Limited Time Offer</span>
                <h2>Up to 50% Off <br />on Our Collection</h2>
                <p>Handpicked accessories, footwear, and more at unbeatable prices.</p>
                <Link to="/home" className="btn-accent">Grab the Deal</Link>
              </div>
              <div className="promo-decoration">
                <div className="promo-circle c1"></div>
                <div className="promo-circle c2"></div>
                <div className="promo-circle c3"></div>
                <span className="promo-emoji">💍</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Commands / Services Section (KS style) ── */}
        <section className="commands-section" ref={commandsRef}>
          <div className="container">
            <h2 className="commands-heading">
              <span className="heading-accent-bar"></span>
              Why Shop with Aaradhana
            </h2>
            <div className="commands-grid">
              {COMMANDS.map((item, idx) => (
                <article key={item.title} className={`command-item ${idx % 2 === 1 ? 'reverse' : ''}`}>
                  <div className="command-media">
                    <div className="command-shape-bg" />
                    <img src={item.img} alt={item.title} loading="lazy" />
                  </div>
                  <div className="command-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                    <Link to={item.link} className="btn-primary">{item.cta}</Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
