import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, status, totalAmount, customerName, paymentMethod } = location.state || {};

  const isSuccess = status === 'paid';

  if (!orderId) {
    return (
      <>
        <Navbar />
        <div className="ps-container">
          <div className="ps-card">
            <p style={{ color: 'var(--text-secondary)' }}>No payment data found.</p>
            <button className="ps-btn-primary" onClick={() => navigate('/home')}>Go Home</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="ps-container">
        {/* Demo Banner */}
        <div className="ps-demo-banner">
          <span className="ps-demo-dot" />
          DEMO MODE — No real transaction was processed
        </div>

        <div className="ps-card">
          {/* Status Icon */}
          <div className={`ps-icon-wrap ${isSuccess ? 'ps-icon-success' : 'ps-icon-fail'}`}>
            {isSuccess ? (
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="2" />
                <path d="M14 27L22 35L38 19" stroke="currentColor" strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="2" />
                <path d="M18 18L34 34M34 18L18 34" stroke="currentColor" strokeWidth="3"
                  strokeLinecap="round" />
              </svg>
            )}
          </div>

          {/* Title */}
          <h1 className={`ps-title ${isSuccess ? 'ps-title-success' : 'ps-title-fail'}`}>
            {isSuccess ? 'Demo Payment Successful' : 'Demo Payment Failed'}
          </h1>

          <p className="ps-subtitle">
            {isSuccess
              ? 'Your demo order has been placed and recorded successfully.'
              : 'This payment was declined in the demo simulation. No charges were made.'}
          </p>

          {/* Details Grid */}
          <div className="ps-details">
            <div className="ps-detail-row">
              <span className="ps-detail-label">Order ID</span>
              <span className="ps-detail-value ps-order-id">#{orderId}</span>
            </div>
            <div className="ps-detail-row">
              <span className="ps-detail-label">Customer</span>
              <span className="ps-detail-value">{customerName || '—'}</span>
            </div>
            <div className="ps-detail-row">
              <span className="ps-detail-label">Amount</span>
              <span className="ps-detail-value ps-amount">₹{Number(totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="ps-detail-row">
              <span className="ps-detail-label">Method</span>
              <span className="ps-detail-value">
                <span className="ps-method-badge">
                  {paymentMethod === 'DEMO_UPI' ? '📱 Demo UPI' : '💳 Demo Card'}
                </span>
              </span>
            </div>
            <div className="ps-detail-row">
              <span className="ps-detail-label">Payment Status</span>
              <span className={`ps-status-badge ${isSuccess ? 'ps-status-paid' : 'ps-status-failed'}`}>
                {isSuccess ? '✓ PAID' : '✗ FAILED'}
              </span>
            </div>
          </div>

          {/* Demo Notice */}
          <div className="ps-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="10" stroke="#00B0FF" strokeWidth="1.5" />
              <path d="M12 8v4M12 16h.01" stroke="#00B0FF" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>
              This is a <strong>Demo Payment System</strong>. No real money was transferred.
              Order data is saved in the system for testing purposes only.
            </span>
          </div>

          {/* Actions */}
          <div className="ps-actions">
            {isSuccess ? (
              <>
                <button className="ps-btn-primary" onClick={() => navigate('/my-orders')}>
                  View My Orders
                </button>
                <button className="ps-btn-secondary" onClick={() => navigate('/home')}>
                  Continue Shopping
                </button>
              </>
            ) : (
              <>
                <button className="ps-btn-retry" onClick={() => navigate(-1)}>
                  ↩ Retry Payment
                </button>
                <button className="ps-btn-secondary" onClick={() => navigate('/home')}>
                  Go to Shop
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;
