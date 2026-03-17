import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <>
      <Navbar />
      <main className="page-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "7rem", fontWeight: 700, color: "var(--border)", lineHeight: 1 }}>404</p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", fontWeight: 700, color: "var(--text-primary)", margin: "16px 0 12px" }}>Page Not Found</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: 32, maxWidth: 360, margin: "0 auto 32px" }}>
            The page you're looking for doesn't exist or may have moved.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/")} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Home size={16} /> Go Home
            </button>
            <button className="btn-outline" onClick={() => navigate("/home")} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <ShoppingBag size={16} /> Shop
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
