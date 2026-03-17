import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import API_BASE_URL from "../config/api";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchWishlist = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    if (!user || !token) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.wishlist || data || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchWishlist(); }, []);

  const removeItem = async (productId) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    await fetch(`${API_BASE_URL}/api/users/${user.id}/wishlist/${productId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` }
    });
    setItems(prev => prev.filter(p => p.id !== productId));
  };

  const getImg = (item) => {
    if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    if (item.images?.front) return item.images.front;
    return "https://via.placeholder.com/200x260?text=No+Image";
  };

  return (
    <>
      <Navbar />
      <main className="page-content" style={{ padding: "40px 0 80px" }}>
        <div className="container">
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 700 }}>My Wishlist</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4 }}>{items.length} saved items</p>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
              <div className="loader-ring" />
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <Heart size={64} strokeWidth={1} />
              <h3>Your wishlist is empty</h3>
              <p>Save items you love to your wishlist</p>
              <button className="btn-primary" onClick={() => navigate("/home")}>Browse Products</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
              {items.map(item => {
                const hasDiscount = item.isDiscountActive && item.discountedPrice && item.discountedPrice < item.price;
                return (
                  <div key={item.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                    <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", background: "var(--bg-secondary)", cursor: "pointer" }}
                      onClick={() => navigate(`/product/${item.id}`)}>
                      <img src={getImg(item)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {hasDiscount && (
                        <span style={{ position: "absolute", top: 10, left: 10, background: "var(--primary)", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
                          {item.discountPercentage}% OFF
                        </span>
                      )}
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{item.brand || item.category}</p>
                      <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <span style={{ fontWeight: 700, color: "var(--primary)" }}>₹{hasDiscount ? item.discountedPrice : item.price}</span>
                        {hasDiscount && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textDecoration: "line-through" }}>₹{item.price}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: "0.75rem", padding: "8px 12px" }}
                          onClick={() => navigate(`/product/${item.id}`)}>
                          <ShoppingBag size={13} /> Buy
                        </button>
                        <button onClick={() => removeItem(item.id)}
                          style={{ width: 36, height: 36, border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--error)", transition: "all 0.2s" }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
