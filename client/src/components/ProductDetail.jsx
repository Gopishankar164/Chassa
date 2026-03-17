import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useCart } from "../context/CartContext";
import { ChevronLeft, Heart, ShoppingBag, Star, Truck, RotateCcw, Shield } from "lucide-react";
import API_BASE_URL from "../config/api";
import ReviewDisplay from "./reviews/ReviewDisplay";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [toast, setToast] = useState(null);
  const [addingCart, setAddingCart] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/products/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    if (!user || !token) return;
    fetch(`${API_BASE_URL}/api/users/${user.id}/wishlist/check/${product.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setInWishlist(data.inWishlist); })
      .catch(() => { });
  }, [product]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const getImages = () => {
    if (!product?.images) return ["https://via.placeholder.com/500x600?text=No+Image"];
    if (Array.isArray(product.images)) return product.images;
    if (product.images.front) return [product.images.front, product.images.back].filter(Boolean);
    return ["https://via.placeholder.com/500x600?text=No+Image"];
  };

  const getPrice = () => {
    if (!product) return 0;
    if (product.isDiscountActive && product.discountedPrice && product.discountedPrice < product.price)
      return product.discountedPrice;
    return product.price;
  };
  const handleWhatsAppOrder = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: `/product/${id}` } });
      return;
    }
    if (!selectedSize && product.size?.length > 0) {
      showToast("Please select a size", "error");
      return;
    }
    // Add to cart first, then navigate to WhatsApp cart page (KS method)
    setAddingCart(true);
    const success = await addToCart({
      ...product, selectedSize, selectedColor, quantity, price: getPrice()
    });
    setAddingCart(false);
    if (success) {
      navigate("/whatsapp-cart");
    } else {
      navigate("/login", { state: { from: `/product/${id}` } });
    }
  };

  const handleAddToCart = async (goToCart = false) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: `/product/${id}` } });
      return;
    }
    if (!selectedSize && product.size?.length > 0) {
      showToast("Please select a size", "error");
      return;
    }
    setAddingCart(true);
    const success = await addToCart({
      ...product, selectedSize, selectedColor, quantity, price: getPrice()
    });
    setAddingCart(false);
    if (success) {
      if (goToCart) navigate("/cart");
      else showToast(`${product.name} added to cart!`);
    } else {
      navigate("/login", { state: { from: `/product/${id}` } });
    }
  };

  const handleWishlist = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    try {
      if (inWishlist) {
        await fetch(`${API_BASE_URL}/api/users/${user.id}/wishlist/${product.id}`, {
          method: "DELETE", headers: { Authorization: `Bearer ${token}` }
        });
        setInWishlist(false);
        showToast("Removed from wishlist");
      } else {
        await fetch(`${API_BASE_URL}/api/users/${user.id}/wishlist`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id })
        });
        setInWishlist(true);
        showToast("Added to wishlist ♡");
      }
    } catch { showToast("Failed to update wishlist", "error"); }
  };

  const images = getImages();
  const displayPrice = getPrice();
  const hasDiscount = product?.isDiscountActive && product?.discountedPrice && product.discountedPrice < product.price;

  if (loading) return (
    <>
      <Navbar />
      <div className="page-content pd-loading">
        <div className="loader-ring" />
      </div>
    </>
  );

  if (!product) return (
    <>
      <Navbar />
      <div className="page-content pd-error">
        <h2>Product not found</h2>
        <button className="btn-primary" onClick={() => navigate("/home")}>Back to Shop</button>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
      <main className="page-content pd-page">
        <div className="container">
          {/* Breadcrumb */}
          <div className="pd-breadcrumb">
            <button onClick={() => navigate("/home")} className="pd-back">
              <ChevronLeft size={16} /> Back to Shop
            </button>
            <span className="pd-bc-sep">/</span>
            <span className="pd-bc-cat">{product.category}</span>
            <span className="pd-bc-sep">/</span>
            <span className="pd-bc-name">{product.name}</span>
          </div>

          <div className="pd-grid">
            {/* Images */}
            <div className="pd-images">
              <div className="pd-main-img">
                <img src={images[selectedImg]} alt={product.name} />
                {hasDiscount && (
                  <span className="pd-discount-badge">{product.discountPercentage}% OFF</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="pd-thumbnails">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      className={`pd-thumb ${i === selectedImg ? "active" : ""}`}
                      onClick={() => setSelectedImg(i)}
                    >
                      <img src={img} alt={`${product.name} ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="pd-info">
              <p className="pd-category">{product.category}</p>
              <h1 className="pd-name">{product.name}</h1>
              <p className="pd-brand">by {product.brand}</p>

              {/* Rating — always visible */}
              <div className="pd-rating">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={16}
                    fill={s <= Math.round(product.averageRating || 0) ? "var(--accent)" : "none"}
                    stroke={s <= Math.round(product.averageRating || 0) ? "var(--accent)" : "#ccc"}
                  />
                ))}
                <a
                  href="#reviews"
                  className="pd-rating-count"
                  onClick={e => { e.preventDefault(); document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' }); }}
                >
                  ({product.totalReviews || 0} reviews)
                </a>
              </div>

              {/* Price */}
              <div className="pd-price-section">
                <span className="pd-price-main">₹{displayPrice.toLocaleString()}</span>
                {hasDiscount && (
                  <>
                    <span className="pd-price-old">₹{product.price.toLocaleString()}</span>
                    <span className="pd-price-save">Save ₹{(product.price - product.discountedPrice).toLocaleString()}</span>
                  </>
                )}
              </div>

              <hr className="pd-divider" />

              {/* Color */}
              {product.colors?.length > 0 && (
                <div className="pd-option-section">
                  <p className="pd-option-label">Color: <strong>{selectedColor || "Select"}</strong></p>
                  <div className="pd-color-options">
                    {product.colors.map(color => (
                      <button
                        key={color}
                        className={`pd-color-btn ${selectedColor === color ? "active" : ""}`}
                        onClick={() => setSelectedColor(color)}
                      >{color}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size */}
              {product.size?.length > 0 && (
                <div className="pd-option-section">
                  <p className="pd-option-label">Size: <strong>{selectedSize || "Select"}</strong></p>
                  <div className="pd-size-options">
                    {product.size.map(s => (
                      <button
                        key={s}
                        className={`pd-size-btn ${selectedSize === s ? "active" : ""}`}
                        onClick={() => setSelectedSize(s)}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="pd-option-section">
                <p className="pd-option-label">Quantity</p>
                <div className="pd-qty-wrap">
                  <button className="pd-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                  <span className="pd-qty-val">{quantity}</span>
                  <button className="pd-qty-btn" onClick={() => setQuantity(q => Math.min(10, q + 1))}>+</button>
                </div>
              </div>

              {/* Total */}
              <div className="pd-total">
                Total: <strong>₹{(displayPrice * quantity).toLocaleString()}</strong>
              </div>

              {/* Actions */}
              <div className="pd-actions">
                <button
                  className="btn-primary pd-cart-btn"
                  onClick={() => handleAddToCart(false)}
                  disabled={addingCart}
                >
                  <ShoppingBag size={18} />
                  {addingCart ? "Adding..." : "Add to Cart"}
                </button>
                <button className="btn-outline pd-buy-btn" onClick={() => handleAddToCart(true)}>
                  Buy Now
                </button>
                <button
                  className={`pd-wish-btn ${inWishlist ? "active" : ""}`}
                  onClick={handleWishlist}
                  title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart size={20} fill={inWishlist ? "var(--primary)" : "none"} />
                </button>
              </div>

              {/* Delivery badges */}
              <div className="pd-badges">
                <div className="pd-badge"><Truck size={16} /> Free delivery on orders above ₹1000</div>
                <div className="pd-badge"><RotateCcw size={16} /> 30-day easy returns</div>
                <div className="pd-badge"><Shield size={16} /> 100% authentic products</div>
              </div>

              {/* Details */}
              <div className="pd-details">
                <h3>Product Details</h3>
                {product.description && <p>{product.description}</p>}
                <div className="pd-detail-list">
                  {product.material && <div className="pd-detail-item"><span>Material:</span><span>{product.material}</span></div>}
                  {product.care && <div className="pd-detail-item"><span>Care:</span><span>{product.care}</span></div>}
                  {product.fit && <div className="pd-detail-item"><span>Fit:</span><span>{product.fit}</span></div>}
                  <div className="pd-detail-item"><span>Country:</span><span>{product.countryOfOrigin || "India"}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews section with anchor */}
          <div id="reviews">
            <ReviewDisplay productId={product.id} />
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
