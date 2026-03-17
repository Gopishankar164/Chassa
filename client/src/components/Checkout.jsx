import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Navbar from './Navbar';
import './Checkout.css';
import OrderConfirmation from './OrderConfirmation';
import API_BASE_URL from '../config/api';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { removeFromCart } = useCart();

  const [user, setUser] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [orderData, setOrderData] = useState({
    shippingAddress: {
      fullName: '', email: '', phone: '',
      address: '', city: '', state: '', pincode: '', landmark: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [orderConfirmationData, setOrderConfirmationData] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const userInfo = JSON.parse(userData);
      setUser(userInfo);
      setOrderData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          fullName: userInfo.name || userInfo.fullName || '',
          email: userInfo.email || '',
          phone: userInfo.phone || '',
          address: userInfo.address || '',
          city: userInfo.city || '',
          state: userInfo.state || '',
          pincode: userInfo.pincode || '',
          landmark: ''
        }
      }));
    }
    if (location.state?.selectedItem) {
      setSelectedItem(location.state.selectedItem);
    } else {
      navigate('/cart');
    }
  }, [location, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, [name]: value }
    }));
  };

  // ── Validation ─────────────────────────────────────────────────
  const validateForm = () => {
    const { shippingAddress: s } = orderData;
    if (!s.fullName || !s.email || !s.phone || !s.address || !s.city || !s.state || !s.pincode) {
      setError('Please fill all required fields');
      return false;
    }
    if (!/^[0-9]{10}$/.test(s.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!/^[0-9]{6}$/.test(s.pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  const handlePlaceOrderClick = () => {
    if (showPaymentDropdown) { setShowPaymentDropdown(false); return; }
    if (!validateForm()) return;
    setShowPaymentDropdown(true);
    setError('');
  };

  const handlePaymentSelection = (method) => {
    setShowPaymentDropdown(false);
    if (method === 'cod') handleCashOnDelivery();
    else if (method === 'online') handleOnlinePayment();
  };

  // ── Build shared order payload ──────────────────────────────────
  const buildOrderPayload = (paymentMethod) => ({
    userId: user?.id,
    customerName: orderData.shippingAddress.fullName,
    customerEmail: orderData.shippingAddress.email,
    customerPhone: orderData.shippingAddress.phone,
    shippingAddress: JSON.stringify(orderData.shippingAddress),
    paymentMethod,
    totalAmount,
    orderItems: [{
      productId: selectedItem.id,
      productName: selectedItem.name || selectedItem.title,
      quantity: selectedItem.quantity || 1,
      price: displayPrice,
      selectedSize: selectedItem.selectedSize || '',
      selectedColor: selectedItem.selectedColor || '',
    }],
  });

  // ── Cash on Delivery ────────────────────────────────────────────
  const handleCashOnDelivery = async () => {
    setLoading(true);
    setError('');
    try {
      const orderPayload = buildOrderPayload('COD');
      const response = await fetch(`${API_BASE_URL}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(orderPayload),
      });
      if (response.ok) {
        const result = await response.json();
        setOrderConfirmationData({
          orderId: result.orderId,
          totalAmount,
          paymentMethod: 'COD',
          customerName: orderPayload.customerName,
          shippingAddress: orderPayload.shippingAddress,
          orderItems: orderPayload.orderItems,
        });
        setShowOrderConfirmation(true);
        removeFromCart(selectedItem.id, selectedItem.selectedSize, selectedItem.selectedColor);
      } else {
        setError('Failed to place order. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── Razorpay Online Payment ─────────────────────────────────────
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) { resolve(true); return; }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleOnlinePayment = async () => {
    const token = localStorage.getItem('token');
    setRazorpayLoading(true);
    setError('');
    try {
      // 1. Create internal order (PENDING)
      const orderPayload = buildOrderPayload('ONLINE');
      const orderRes = await fetch(`${API_BASE_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(orderPayload),
      });
      if (!orderRes.ok) { setError('Failed to create order. Please try again.'); return; }
      const orderResult = await orderRes.json();
      const internalOrderId = orderResult.orderId;

      // 2. Create Razorpay order — amount is validated server-side
      const rpRes = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: totalAmount, orderId: internalOrderId, currency: 'INR' }),
      });
      if (!rpRes.ok) { setError('Payment gateway error. Please try again.'); return; }
      const rpData = await rpRes.json();

      // 3. Load Razorpay checkout.js
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError('Could not load payment gateway. Check your internet connection.');
        return;
      }

      // 4. Open Razorpay modal
      const options = {
        key: rpData.keyId,
        amount: rpData.amount,        // paise — set by server
        currency: rpData.currency,
        name: 'Aaradhana',
        description: `Order #${internalOrderId}`,
        order_id: rpData.razorpayOrderId,
        prefill: {
          name: orderData.shippingAddress.fullName,
          email: orderData.shippingAddress.email,
          contact: orderData.shippingAddress.phone,
        },
        theme: { color: '#7c3aed' },

        // 5. On success — verify signature server-side
        handler: async (response) => {
          const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId:           internalOrderId,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            removeFromCart(selectedItem.id, selectedItem.selectedSize, selectedItem.selectedColor);
            setOrderConfirmationData({
              orderId: internalOrderId,
              totalAmount,
              paymentMethod: 'ONLINE',
              customerName: orderPayload.customerName,
              shippingAddress: orderPayload.shippingAddress,
              orderItems: orderPayload.orderItems,
            });
            setShowOrderConfirmation(true);
          } else {
            setError(
              `Payment verification failed. Contact support with payment ID: ${response.razorpay_payment_id}`
            );
          }
        },

        modal: {
          ondismiss: () => setError('Payment was cancelled. You can try again.'),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setRazorpayLoading(false);
    }
  };

  const handleCloseConfirmation = () => {
    setShowOrderConfirmation(false);
    setOrderConfirmationData(null);
    navigate('/home');
  };

  // ── Early returns ───────────────────────────────────────────────
  if (!user) return (
    <><Navbar />
      <div className="checkout-error">
        <h2>Please Login</h2>
        <button onClick={() => navigate('/')}>Go to Login</button>
      </div>
    </>
  );

  if (!selectedItem) return (
    <><Navbar />
      <div className="checkout-error">
        <h2>No Item Selected</h2>
        <button onClick={() => navigate('/cart')}>Go to Cart</button>
      </div>
    </>
  );

  const displayPrice =
    selectedItem.isDiscountActive &&
    selectedItem.discountedPrice &&
    selectedItem.discountedPrice < selectedItem.price
      ? selectedItem.discountedPrice
      : selectedItem.price;

  const shipping = 50;
  const totalAmount = (displayPrice * selectedItem.quantity) + shipping;

  const isBusy = loading || razorpayLoading;

  return (
    <>
      <Navbar />
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <button onClick={() => navigate('/cart')} className="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08"
                stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Cart
          </button>
        </div>

        <div className="checkout-content">
          {/* ── Order Summary ──────────────────────────────── */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="order-item">
              <img
                src={
                  selectedItem.imageUrl ||
                  (Array.isArray(selectedItem.images) && selectedItem.images.length > 0
                    ? selectedItem.images[0]
                    : selectedItem.images?.front) ||
                  'https://via.placeholder.com/80x80'
                }
                alt={selectedItem.name}
              />
              <div className="item-details">
                <h4>{selectedItem.name}</h4>
                <p>{selectedItem.brand}</p>
                {selectedItem.selectedSize && <p>Size: {selectedItem.selectedSize}</p>}
                {selectedItem.selectedColor && <p>Color: {selectedItem.selectedColor}</p>}
                <p>Qty: {selectedItem.quantity}</p>
              </div>
              <div className="item-price">
                ₹{(displayPrice * selectedItem.quantity).toFixed(2)}
              </div>
            </div>
            <div className="order-total">
              <div className="total-line">
                <span>Subtotal:</span>
                <span>₹{(displayPrice * selectedItem.quantity).toFixed(2)}</span>
              </div>
              <div className="total-line">
                <span>Shipping:</span>
                <span>₹{shipping.toFixed(2)}</span>
              </div>
              <div className="total-line total">
                <span>Total:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ── Shipping Form ──────────────────────────────── */}
          <div className="shipping-form">
            <h2>Shipping Address</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-row">
                <input type="text" name="fullName" placeholder="Full Name *"
                  value={orderData.shippingAddress.fullName} onChange={handleInputChange} required />
                <input type="email" name="email" placeholder="Email Address *"
                  value={orderData.shippingAddress.email} onChange={handleInputChange}
                  required readOnly title="Email is pre-filled from your account" />
              </div>
              <div className="form-row">
                <input type="tel" name="phone" placeholder="Phone Number (10 digits) *"
                  value={orderData.shippingAddress.phone} onChange={handleInputChange}
                  maxLength="10" required />
                <input type="text" name="pincode" placeholder="Pincode (6 digits) *"
                  value={orderData.shippingAddress.pincode} onChange={handleInputChange}
                  maxLength="6" required />
              </div>
              <textarea name="address" placeholder="Complete Address *"
                value={orderData.shippingAddress.address} onChange={handleInputChange} required />
              <div className="form-row">
                <input type="text" name="city" placeholder="City *"
                  value={orderData.shippingAddress.city} onChange={handleInputChange} required />
                <input type="text" name="state" placeholder="State *"
                  value={orderData.shippingAddress.state} onChange={handleInputChange} required />
              </div>
              <input type="text" name="landmark" placeholder="Landmark (Optional)"
                value={orderData.shippingAddress.landmark} onChange={handleInputChange} />
            </form>

            {/* ── Place Order button + payment dropdown ─── */}
            <div className="place-order-section">
              <div className="place-order-container">
                <button onClick={handlePlaceOrderClick} className="place-order-btn"
                  disabled={isBusy} type="button">
                  {isBusy ? 'Processing…' : `Place Order (₹${totalAmount.toFixed(2)})`}
                </button>

                {showPaymentDropdown && (
                  <div className="payment-dropdown">
                    <div className="dropdown-arrow" />
                    <div className="payment-options">
                      {/* COD */}
                      <button onClick={() => handlePaymentSelection('cod')}
                        className="payment-option" disabled={isBusy} type="button">
                        <span className="payment-icon">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="6" width="20" height="12" rx="2" stroke="#28a745" strokeWidth="2" />
                            <circle cx="12" cy="12" r="3" stroke="#28a745" strokeWidth="2" />
                            <path d="M18 10V14M6 10V14" stroke="#28a745" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </span>
                        <div className="payment-text">
                          <strong>Cash on Delivery</strong>
                          <small>Pay ₹{totalAmount.toFixed(2)} when order arrives</small>
                        </div>
                      </button>

                      {/* Online / Razorpay */}
                      <button onClick={() => handlePaymentSelection('online')}
                        className="payment-option" disabled={isBusy} type="button">
                        <span className="payment-icon">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="5" width="18" height="14" rx="2" stroke="#667eea" strokeWidth="2" />
                            <path d="M3 10H21" stroke="#667eea" strokeWidth="2" />
                            <path d="M7 15H11" stroke="#667eea" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </span>
                        <div className="payment-text">
                          <strong>Pay Online (UPI / Card / NetBanking)</strong>
                          <small>
                            {razorpayLoading
                              ? 'Opening payment gateway…'
                              : `Pay ₹${totalAmount.toFixed(2)} securely via Razorpay`}
                          </small>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {isBusy && (
                <div className="loading-section">
                  <div className="loading-spinner" />
                  <p>{razorpayLoading ? 'Opening payment gateway…' : 'Processing your order…'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overlay to close dropdown */}
        {showPaymentDropdown && (
          <div className="dropdown-overlay" onClick={() => setShowPaymentDropdown(false)} />
        )}

        {/* Order Confirmation Modal */}
        {showOrderConfirmation && (
          <OrderConfirmation orderData={orderConfirmationData} onClose={handleCloseConfirmation} />
        )}
      </div>
    </>
  );
};

export default Checkout;
