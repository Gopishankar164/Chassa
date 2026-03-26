import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "../styles/WhatsAppCart.css";

function WhatsAppCart() {
    const { cart, removeFromCart, fetchCart } = useCart();
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Fetch cart data when component mounts
    useEffect(() => {
        const loadCart = async () => {
            try {
                setLoading(true);
                if (fetchCart) {
                    await fetchCart();
                }
            } catch {
            } finally {
                setLoading(false);
            }
        };
        loadCart();
    }, [fetchCart]);

    const makeKey = (item) =>
        `${item.id}-${item.selectedSize ?? ""}-${item.selectedColor ?? ""}`;

    const toggleSelect = (key) => {
        setSelectedItems((prev) =>
            prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
        );
    };

    const selectAll = () => {
        if (selectedItems.length === cart.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(cart.map(makeKey));
        }
    };

    const sendOrder = async () => {
        if (selectedItems.length === 0) {
            showToast("Please select at least one item!", 'error');
            return;
        }

        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');

        let message = "NEW ORDER\n\n";
        let total = 0;
        const itemsToRemove = [];
        const orderItems = [];

        cart.forEach((item) => {
            const key = makeKey(item);
            if (selectedItems.includes(key)) {
                const quantity = item.quantity || 1;
                const rawPrice = Number(item.price ?? 0);
                const displayPrice =
                    item.isDiscountActive && item.discountedPrice && item.discountedPrice < item.price
                        ? Number(item.discountedPrice)
                        : rawPrice;

                total += displayPrice * quantity;

                message += `${item.name}\n`;
                message += `Brand: ${item.brand || "N/A"}\n`;
                if (item.selectedSize) message += `Size: ${item.selectedSize}\n`;
                if (item.selectedColor) message += `Color: ${item.selectedColor}\n`;
                message += `Qty: ${quantity} | \u20b9${(displayPrice * quantity).toLocaleString()}\n\n`;

                itemsToRemove.push({
                    id: item.id,
                    selectedSize: item.selectedSize,
                    selectedColor: item.selectedColor,
                });

                // Build orderItems for backend
                orderItems.push({
                    productId: item.id,
                    productName: item.name,
                    quantity,
                    price: displayPrice,
                    selectedSize: item.selectedSize || null,
                    selectedColor: item.selectedColor || null,
                });
            }
        });

        message += `------------------\n`;
        message += `Total: \u20b9${total.toLocaleString()}\n\n`;
        message += `Please confirm this order. Thank you!`;

        // ✅ Aaradhana WhatsApp business number (without +)
        const phone = "6369381507";
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        // Open WhatsApp
        window.open(url, "_blank");

        // ✅ Save order to backend so it appears in My Orders
        try {
            if (user && token) {
                import('../config/api').then(async ({ default: API_BASE_URL }) => {
                    await fetch(`${API_BASE_URL}/api/orders/create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                            userId: user.id,
                            customerName: user.name,
                            customerEmail: user.email,
                            customerPhone: user.phone || '',
                            shippingAddress: user.address || 'To be confirmed via WhatsApp',
                            totalAmount: total,
                            orderItems,
                            paymentMethod: 'WHATSAPP',
                        }),
                    });
                });
            }
        } catch { /* silent - order was still sent via WhatsApp */ }

        // Remove ordered items from cart
        try {
            for (const item of itemsToRemove) {
                await removeFromCart(item.id, item.selectedSize, item.selectedColor);
            }
            setSelectedItems([]);
            showToast(`Order sent via WhatsApp! ${itemsToRemove.length} item(s) removed from cart.`);
        } catch {
            showToast("Order sent, but there was an error removing items from cart.", 'error');
        }
    };

    return (
        <>
            <Navbar />
            {toast && (
                <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#25D366', color: '#fff', padding: '12px 22px', borderRadius: 10, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: '0.9rem' }}>
                    {toast.msg}
                </div>
            )}
            <div className="whatsapp-cart-container">
                {/* Header */}
                <div className="wc-header">
                    <button className="wc-back-btn" onClick={() => navigate(-1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Back
                    </button>
                    <div className="wc-title-wrap">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <h2>WhatsApp Order</h2>
                    </div>
                    <p className="wc-subtitle">Select items to order via WhatsApp</p>
                </div>

                {loading ? (
                    <div className="wc-loading">
                        <div className="wc-spinner"></div>
                        <p>Loading your cart...</p>
                    </div>
                ) : cart.length === 0 ? (
                    <div className="wc-empty">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 2L4.62 6.96C4.05 7.82 4.66 9 5.7 9H18.3C19.34 9 19.95 7.82 19.38 6.96L16 2H8Z" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3.66 11.44C3.24 14.14 3 16.92 3 19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19C21 16.92 20.76 14.14 20.34 11.44C20.15 10.3 19.17 9 17 9H7C4.83 9 3.85 10.3 3.66 11.44Z" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <h3>Your cart is empty</h3>
                        <p>Add some items to your cart first</p>
                        <button className="wc-shop-btn" onClick={() => navigate("/home")}>
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Select All */}
                        <div className="wc-select-all">
                            <label className="wc-select-all-label">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.length === cart.length && cart.length > 0}
                                    onChange={selectAll}
                                    className="cart-select"
                                />
                                <span>Select All ({cart.length} items)</span>
                            </label>
                            {selectedItems.length > 0 && (
                                <span className="wc-selected-count">
                                    {selectedItems.length} selected
                                </span>
                            )}
                        </div>

                        {/* Cart Items */}
                        {cart.map((item) => {
                            const key = makeKey(item);
                            const isSelected = selectedItems.includes(key);

                            let imageSrc = "";
                            if (item.imageUrl) {
                                imageSrc = item.imageUrl;
                            } else if (Array.isArray(item.images) && item.images.length > 0) {
                                imageSrc = item.images[0];
                            } else if (item.images?.front) {
                                imageSrc = item.images.front;
                            } else {
                                imageSrc = "https://placehold.co/100x100/png?text=No+Image";
                            }

                            const rawPrice = Number(item.price ?? 0);
                            const displayPrice =
                                item.isDiscountActive && item.discountedPrice && item.discountedPrice < item.price
                                    ? Number(item.discountedPrice)
                                    : rawPrice;

                            const hasDiscount = displayPrice < rawPrice && rawPrice > 0;

                            return (
                                <div
                                    className={`cart-item ${isSelected ? "selected" : ""}`}
                                    key={key}
                                    onClick={() => toggleSelect(key)}
                                >
                                    <div className="cart-checkbox">
                                        <input
                                            type="checkbox"
                                            className="cart-select"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(key)}
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label={`Select ${item.name}`}
                                        />
                                    </div>
                                    <img
                                        src={imageSrc}
                                        alt={item.name || "Product"}
                                        className="cart-item-image"
                                        onError={(e) => { e.target.src = "https://placehold.co/100x100/png?text=No+Image"; }}
                                    />
                                    <div className="cart-item-details">
                                        <span className="cart-item-name">{item.name}</span>
                                        <span className="cart-item-brand">{item.brand || "Unknown Brand"}</span>
                                        {item.selectedSize && (
                                            <span className="cart-item-size">Size: {item.selectedSize}</span>
                                        )}
                                        {item.selectedColor && (
                                            <span className="cart-item-color">Color: {item.selectedColor}</span>
                                        )}
                                        <div className="price-row">
                                            <span className="cart-item-price">₹{displayPrice.toLocaleString()}</span>
                                            {hasDiscount && (
                                                <span className="cart-item-original">₹{rawPrice.toLocaleString()}</span>
                                            )}
                                            <span className="cart-qty">× {item.quantity || 1}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Order Button */}
                        <button className="order-btn" onClick={sendOrder} disabled={selectedItems.length === 0}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "10px", verticalAlign: "middle" }}>
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            Order on WhatsApp ({selectedItems.length})
                        </button>
                    </>
                )}
            </div>
        </>
    );
}

export default WhatsAppCart;
