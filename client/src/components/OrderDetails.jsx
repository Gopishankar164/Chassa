import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './OrderDetails.css';
import API_BASE_URL from '../config/api';

const getDisplayPrice = (item) => {
  return item.isDiscountActive && item.discountedPrice && item.discountedPrice < item.price
    ? item.discountedPrice
    : item.price;
};

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getPaymentMethod = (order) => {
    if (order.paymentMethod === 'COD' || order.paymentMethod === 'CASH_ON_DELIVERY') {
      return 'Cash on Delivery';
    }
    if (order.paymentMethod === 'ONLINE') {
      return 'Online Payment';
    }
    return 'Cash on Delivery';
  };

  const getPaymentStatus = (order) => {
    if (order.paymentStatus) {
      return order.paymentStatus.toUpperCase();
    }
    return 'PENDING';
  };

  // Parse the shipping address string into individual fields
  const parseShippingInfo = (order) => {
    const shippingInfo = {
      name: order.customerName || 'Not provided',
      email: order.customerEmail || 'Not provided',
      phone: order.customerPhone || 'Not provided',
      address: 'Not provided'
    };

    if (order.shippingAddress) {
      const addressStr = order.shippingAddress;

      if (addressStr.includes('fullName=')) {
        const fullNameMatch = addressStr.match(/fullName=([^,]+)/);
        const emailMatch = addressStr.match(/email=([^,]+)/);
        const phoneMatch = addressStr.match(/phone=([^,]+)/);
        const addressMatch = addressStr.match(/address=([^,]+)/);
        const cityMatch = addressStr.match(/city=([^,]+)/);
        const stateMatch = addressStr.match(/state=([^,]+)/);
        const pincodeMatch = addressStr.match(/pincode=([^,]+)/);
        const landmarkMatch = addressStr.match(/landmark=([^}]+)/);

        if (fullNameMatch) shippingInfo.name = fullNameMatch[1].trim();
        if (emailMatch) shippingInfo.email = emailMatch[1].trim();
        if (phoneMatch) shippingInfo.phone = phoneMatch[1].trim();

        let addressParts = [];
        if (addressMatch) addressParts.push(addressMatch[1].trim());
        if (cityMatch) addressParts.push(cityMatch[1].trim());
        if (stateMatch) addressParts.push(stateMatch[1].trim());
        if (pincodeMatch) addressParts.push(pincodeMatch[1].trim());
        if (landmarkMatch) addressParts.push('Landmark: ' + landmarkMatch[1].trim());

        if (addressParts.length > 0) {
          shippingInfo.address = addressParts.join(', ');
        }
      } else {
        shippingInfo.address = addressStr;
      }
    }

    return shippingInfo;
  };

  // Render order items with product images
  const getOrderItems = (order) => {
    const items = order.items || order.orderItems || [];

    if (!items || items.length === 0) {
      return (
        <div className="no-items">
          <p>No items found in this order</p>
        </div>
      );
    }

    return items.map((item, index) => {
      const productName = item.productName || item.name || `Product ${item.productId}`;
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      const size = item.size || item.selectedSize || '';
      const color = item.color || item.selectedColor || '';

      // Resolve product image
      let imageSrc;
      if (item.images) {
        if (Array.isArray(item.images) && item.images.length > 0) {
          imageSrc = item.images[0];
        } else if (typeof item.images === 'object' && item.images.front) {
          imageSrc = item.images.front;
        }
      } else if (item.imageUrl) {
        imageSrc = item.imageUrl;
      } else if (item.image) {
        imageSrc = item.image;
      }

      // Fix relative image paths
      if (imageSrc && !imageSrc.startsWith('http')) {
        imageSrc = `${API_BASE_URL}${imageSrc.startsWith('/') ? '' : '/'}${imageSrc}`;
      }
      if (!imageSrc) {
        imageSrc = 'https://placehold.co/100x100/png?text=No+Image';
      }

      const displayPrice = getDisplayPrice(item);

      return (
        <div key={`${item.id || item.productId || index}`} className="item-card">
          <img
            src={imageSrc}
            alt={productName}
            className="order-item-image"
            onError={(e) => {
              e.target.src = 'https://placehold.co/100x100/png?text=No+Image';
            }}
          />
          <div className="item-details">
            <h4 className="item-name">{productName}</h4>
            {size && <p className="item-size">Size: {size}</p>}
            {color && <p className="item-color">Color: {color}</p>}
            <div className="item-pricing">
              <span className="order-item-price">
                ₹{displayPrice} × {quantity}
              </span>
              <span className="order-item-total">
                ₹{(displayPrice * quantity).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="order-details-container">
          <div className="loading">Loading order details...</div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="order-details-container">
          <div className="error">Order not found</div>
        </div>
      </>
    );
  }

  const shippingInfo = parseShippingInfo(order);

  const orderTotal = order.items
    ? order.items.reduce((sum, item) => sum + getDisplayPrice(item) * item.quantity, 0)
    : order.total || order.totalAmount || 0;

  return (
    <>
      <Navbar />
      <div className="order-details-container">
        {/* Header */}
        <div className="order-details-header">
          <h1>Order Details</h1>
          <button className="back-btn" onClick={() => navigate('/my-orders')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
              <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Orders
          </button>
        </div>

        {/* Order Details Card */}
        <div className="order-details-card">

          {/* Order Header */}
          <div className="order-header">
            <h3 className="order-id">Order ID: {order.id}</h3>
            <span className="order-date">{formatDate(order.createdAt)}</span>
          </div>

          {/* Order Total */}
          <div className="order-total">
            <h3>₹{Number(orderTotal).toFixed(2)}</h3>
          </div>

          {/* Status Badges */}
          <div className="status-badges">
            <span className="status-badge confirmed">ORDER: {order.status || 'CONFIRMED'}</span>
            <span className={`payment-badge ${getPaymentStatus(order).toLowerCase()}`}>
              PAYMENT: {getPaymentStatus(order)}
            </span>
          </div>

          {/* Payment Method */}
          <div className="details-section">
            <h4>Payment Method:</h4>
            <div className="payment-method-info">
              <span className="payment-text">{getPaymentMethod(order)}</span>
              {(order.paymentMethod === 'COD' || order.paymentMethod === 'CASH_ON_DELIVERY') && (
                <div className="cod-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '5px', verticalAlign: 'middle' }}>
                    <path d="M2 8.50488H22" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 16.5049H8" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10.5 16.5049H14.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6.44 3.50488H17.55C21.11 3.50488 22 4.38488 22 7.89488V16.1049C22 19.6149 21.11 20.4949 17.56 20.4949H6.44C2.89 20.5049 2 19.6249 2 16.1149V7.89488C2 4.38488 2.89 3.50488 6.44 3.50488Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Pay ₹{Number(orderTotal).toFixed(2)} on delivery
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="details-section">
            <h4>Items:</h4>
            <div className="items-container">
              {getOrderItems(order)}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="details-section">
            <h4>Shipping Information:</h4>
            <div className="shipping-info">
              <div className="shipping-row">
                <span className="shipping-label">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C9.38 2 7.25 4.13 7.25 6.75C7.25 9.32 9.26 11.4 11.88 11.49C11.96 11.48 12.04 11.48 12.1 11.49C12.12 11.49 12.13 11.49 12.15 11.49C12.16 11.49 12.16 11.49 12.17 11.49C14.73 11.4 16.74 9.32 16.75 6.75C16.75 4.13 14.62 2 12 2Z" fill="currentColor" />
                    <path d="M17.08 14.15C14.29 12.29 9.74 12.29 6.93 14.15C5.66 15 4.96 16.15 4.96 17.38C4.96 18.61 5.66 19.75 6.92 20.59C8.32 21.53 10.16 22 12 22C13.84 22 15.68 21.53 17.08 20.59C18.34 19.74 19.04 18.6 19.04 17.36C19.03 16.13 18.34 14.99 17.08 14.15Z" fill="currentColor" />
                  </svg>
                  <span>Name</span>
                </span>
                <span className="shipping-value">{shippingInfo.name}</span>
              </div>
              <div className="shipping-row">
                <span className="shipping-label">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Email</span>
                </span>
                <span className="shipping-value">{shippingInfo.email}</span>
              </div>
              <div className="shipping-row">
                <span className="shipping-label">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.97 18.33C21.97 18.69 21.89 19.06 21.72 19.42C21.55 19.78 21.33 20.12 21.04 20.44C20.55 20.98 20.01 21.37 19.4 21.62C18.8 21.87 18.15 22 17.45 22C16.43 22 15.34 21.76 14.19 21.27C13.04 20.78 11.89 20.12 10.75 19.29C9.6 18.45 8.51 17.52 7.47 16.49C6.44 15.45 5.51 14.36 4.68 13.22C3.86 12.08 3.2 10.94 2.72 9.81C2.24 8.67 2 7.58 2 6.54C2 5.86 2.12 5.21 2.36 4.61C2.6 4 2.98 3.44 3.51 2.94C4.15 2.31 4.85 2 5.59 2C5.87 2 6.15 2.06 6.4 2.18C6.66 2.3 6.89 2.48 7.07 2.74L9.39 6.01C9.57 6.26 9.7 6.49 9.79 6.71C9.88 6.92 9.93 7.13 9.93 7.32C9.93 7.56 9.86 7.8 9.72 8.03C9.59 8.26 9.4 8.5 9.16 8.74L8.4 9.53C8.29 9.64 8.24 9.77 8.24 9.93C8.24 10.01 8.25 10.08 8.27 10.16C8.3 10.24 8.33 10.3 8.35 10.36C8.53 10.69 8.84 11.12 9.28 11.64C9.73 12.16 10.21 12.69 10.73 13.22C11.27 13.75 11.79 14.24 12.32 14.69C12.84 15.13 13.27 15.43 13.61 15.61C13.66 15.63 13.72 15.66 13.79 15.69C13.87 15.72 13.95 15.73 14.04 15.73C14.21 15.73 14.34 15.67 14.45 15.56L15.21 14.81C15.46 14.56 15.7 14.37 15.93 14.25C16.16 14.11 16.39 14.04 16.64 14.04C16.83 14.04 17.03 14.08 17.25 14.17C17.47 14.26 17.7 14.39 17.95 14.56L21.26 16.91C21.52 17.09 21.7 17.3 21.81 17.55C21.91 17.8 21.97 18.05 21.97 18.33Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" />
                  </svg>
                  <span>Phone</span>
                </span>
                <span className="shipping-value">{shippingInfo.phone}</span>
              </div>
              <div className="shipping-row">
                <span className="shipping-label">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 13.43C13.7231 13.43 15.12 12.0331 15.12 10.31C15.12 8.58687 13.7231 7.19 12 7.19C10.2769 7.19 8.88 8.58687 8.88 10.31C8.88 12.0331 10.2769 13.43 12 13.43Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3.62001 8.49C5.59001 -0.169998 18.42 -0.159997 20.38 8.5C21.53 13.58 18.37 17.88 15.6 20.54C13.59 22.48 10.41 22.48 8.39001 20.54C5.63001 17.88 2.47001 13.57 3.62001 8.49Z" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span>Address</span>
                </span>
                <span className="shipping-value">{shippingInfo.address}</span>
              </div>
            </div>
          </div>

          {/* Track Order Button */}
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button
              className="track-order-action-btn"
              onClick={() => navigate(`/track/${order.id}`)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path d="M1.5 1.5H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1.5 5.5H9.5V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.5 8.5H13.5L17.5 12.5V17.5H9.5V8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="4" cy="17.5" r="2" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="14.5" cy="17.5" r="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Track This Order
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetails;
