import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

const Cart = () => {
  const { cart, removeFromCart, fetchCart, updateQuantity, decreaseQuantity } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleQuantityChange = (productId, change, selectedSize, selectedColor) => {
    if (change === -1) {
      decreaseQuantity(productId, selectedSize, selectedColor);
    } else {
      const item = cart.find(p => p.id === productId && p.selectedSize === selectedSize && p.selectedColor === selectedColor);
      if (!item) return;
      const newQuantity = (item.quantity || 1) + change;
      updateQuantity(productId, newQuantity, selectedSize, selectedColor);
    }
  };

  const handleDirectQuantityChange = (productId, newQuantity, selectedSize, selectedColor) => {
    const quantity = parseInt(newQuantity);
    if (quantity < 1 || isNaN(quantity)) return;
    updateQuantity(productId, quantity, selectedSize, selectedColor);
  };

  const handleProceedToPay = (item) => {
    navigate('/checkout', {
      state: {
        selectedItem: {
          ...item,
          imageUrl: Array.isArray(item.images) && item.images.length > 0
            ? item.images[0]
            : item.images?.front || "https://via.placeholder.com/300x300?text=No+Image"
        },
        fromCart: true
      }
    });
  };

  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      try {
        await fetchCart();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, [fetchCart]);

  if (loading)
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );

  if (error)
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );

  return (
    <>
      <Navbar />
      <div className="cart-page">
        <h2 className="cart-title">Inquiry Basket</h2>
        <p className="cart-page-subtitle">// ITEMS SELECTED FOR QUOTATION</p>
        {cart.length === 0 ? (
          <div className="empty-cart">
            <p>Your inquiry basket is empty</p>
          </div>
        ) : (
          <div className="cart-container">
            {cart.map((item) => {
              const rawPrice = Number(item.price ?? 0);
              const displayPrice =
                item.isDiscountActive && item.discountedPrice && item.discountedPrice < item.price
                  ? Number(item.discountedPrice)
                  : rawPrice;

              const hasDiscount = displayPrice < rawPrice && rawPrice > 0;

              let imageSrc;
              if (Array.isArray(item.images) && item.images.length > 0) {
                imageSrc = item.images[0];
              } else if (item.images?.front) {
                imageSrc = item.images.front;
              } else {
                imageSrc = "https://via.placeholder.com/300x300?text=No+Image";
              }

              return (
                <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} className="cart-card">
                  <img
                    src={imageSrc}
                    alt={item.name || "Product"}
                    className="cart-image"
                    onError={(e) => { e.target.src = "https://placehold.co/300x300/png?text=No+Image"; }}
                  />
                  <div className="cart-info">
                    <div className="cart-header">
                      <h3 className="cart-title">{item.name || "Unnamed Product"}</h3>
                      <div className="cart-details-row">
                        <div className="cart-details">
                          <span className="cart-brand">{item.brand || "Unknown Brand"}</span>
                          <span className="cart-separator">•</span>
                          <span className="cart-category">{item.category || "Misc"}</span>
                        </div>
                        {item.selectedSize && (
                          <div className="cart-size-info">
                            <span className="cart-size">Size: {item.selectedSize}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {item.selectedColor && (
                      <div className="cart-color-row">
                        <span className="cart-color">Color: {item.selectedColor}</span>
                      </div>
                    )}
                    <div className="cart-pricing">
                      <div className="pricing-row">
                        <span className="unit-price">
                          ₹{rawPrice.toFixed(2)} × {item.quantity || 1}
                        </span>
                        <span className="total-price">
                          ₹{((displayPrice || rawPrice) * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="cart-actions">
                    <div className="quantity-controls">
                      <button
                        className="qty-btn minus"
                        onClick={() => handleQuantityChange(item.id, -1, item.selectedSize, item.selectedColor)}
                        disabled={(item.quantity || 1) <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className="qty-input"
                        value={item.quantity || 1}
                        onChange={(e) => handleDirectQuantityChange(item.id, e.target.value, item.selectedSize, item.selectedColor)}
                        min="1"
                        max="99"
                      />
                      <button
                        className="qty-btn plus"
                        onClick={() => handleQuantityChange(item.id, 1, item.selectedSize, item.selectedColor)}
                      >
                        +
                      </button>
                    </div>
                    <div className="action-buttons">
                      <button
                        className="proceed-btn"
                        onClick={() => handleProceedToPay(item)}
                      >
                        Proceed to Pay
                      </button>
                      <button
                        className="remove-btn-small"
                        onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;
