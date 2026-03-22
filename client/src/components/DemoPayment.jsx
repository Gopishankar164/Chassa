import React, { useState } from 'react';
import './DemoPayment.css';
import API_BASE_URL from '../config/api';

const DemoPayment = ({ orderPayload, totalAmount, onSuccess, onFailure, onCancel }) => {
  const [method, setMethod] = useState('DEMO_CARD');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'done'

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // UPI field
  const [upiId, setUpiId] = useState('');

  const [errors, setErrors] = useState({});

  // ── Formatters ───────────────────────────────────────────────
  const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  // ── Validate ─────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (method === 'DEMO_CARD') {
      if (cardNumber.replace(/\s/g, '').length !== 16) e.cardNumber = 'Enter a valid 16-digit card number';
      if (!expiry.match(/^\d{2}\/\d{2}$/)) e.expiry = 'Use MM/YY format';
      if (cvv.length < 3 || cvv.length > 4) e.cvv = 'CVV must be 3 or 4 digits';
      if (!cardName.trim()) e.cardName = 'Cardholder name is required';
    }
    if (method === 'DEMO_UPI') {
      if (!upiId.match(/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/)) e.upiId = 'Enter a valid UPI ID (e.g. user@upi)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────
  const handlePay = async () => {
    if (!validate()) return;

    setStep('processing');
    setLoading(true);

    // Simulate network latency (2–3s)
    await new Promise(r => setTimeout(r, 2200 + Math.random() * 800));

    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...orderPayload,
          paymentMethod: method,
          demoPaymentDetails: method === 'DEMO_CARD'
            ? { lastFour: cardNumber.replace(/\s/g, '').slice(-4), cardName }
            : { upiId },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        onFailure(data.error || 'Payment failed');
        return;
      }

      if (data.paymentStatus === 'paid') {
        onSuccess(data);
      } else {
        onFailure('Payment was declined in demo simulation.', data);
      }
    } catch {
      onFailure('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Processing overlay ───────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="dp-overlay">
        <div className="dp-modal dp-modal-processing">
          <div className="dp-demo-tag">DEMO MODE</div>
          <div className="dp-spinner-wrap">
            <div className="dp-spinner" />
          </div>
          <h3 className="dp-processing-title">Processing Demo Payment</h3>
          <p className="dp-processing-sub">Simulating transaction… please wait</p>
          <div className="dp-processing-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────
  return (
    <div className="dp-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="dp-modal">

        {/* Header */}
        <div className="dp-header">
          <div>
            <div className="dp-demo-tag">DEMO MODE</div>
            <h2 className="dp-title">Secure Demo Checkout</h2>
          </div>
          <button className="dp-close-btn" onClick={onCancel} title="Cancel">✕</button>
        </div>

        {/* Demo Warning Banner */}
        <div className="dp-warning-banner">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" />
            <line x1="12" y1="9" x2="12" y2="13" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          </svg>
          This is a <strong>Demo Payment System</strong> — No real transaction will occur
        </div>

        {/* Amount display */}
        <div className="dp-amount-display">
          <span className="dp-amount-label">Total Amount</span>
          <span className="dp-amount-value">₹{Number(totalAmount).toFixed(2)}</span>
        </div>

        {/* Method selector */}
        <div className="dp-method-selector">
          <button
            className={`dp-method-btn ${method === 'DEMO_CARD' ? 'active' : ''}`}
            onClick={() => { setMethod('DEMO_CARD'); setErrors({}); }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M2 10H22" stroke="currentColor" strokeWidth="1.8" />
              <path d="M6 15H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Demo Card
          </button>
          <button
            className={`dp-method-btn ${method === 'DEMO_UPI' ? 'active' : ''}`}
            onClick={() => { setMethod('DEMO_UPI'); setErrors({}); }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Demo UPI
          </button>
        </div>

        {/* ── Card Form ── */}
        {method === 'DEMO_CARD' && (
          <div className="dp-form">
            <div className="dp-field-group">
              <label className="dp-label">Card Number</label>
              <input
                className={`dp-input ${errors.cardNumber ? 'dp-input-error' : ''}`}
                type="text"
                value={cardNumber}
                onChange={e => setCardNumber(formatCard(e.target.value))}
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                autoComplete="off"
              />
              {errors.cardNumber && <span className="dp-error">{errors.cardNumber}</span>}
            </div>

            <div className="dp-row">
              <div className="dp-field-group">
                <label className="dp-label">Expiry Date</label>
                <input
                  className={`dp-input ${errors.expiry ? 'dp-input-error' : ''}`}
                  type="text"
                  value={expiry}
                  onChange={e => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  autoComplete="off"
                />
                {errors.expiry && <span className="dp-error">{errors.expiry}</span>}
              </div>
              <div className="dp-field-group">
                <label className="dp-label">CVV</label>
                <input
                  className={`dp-input ${errors.cvv ? 'dp-input-error' : ''}`}
                  type="password"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="• • •"
                  maxLength={4}
                  autoComplete="off"
                />
                {errors.cvv && <span className="dp-error">{errors.cvv}</span>}
              </div>
            </div>

            <div className="dp-field-group">
              <label className="dp-label">Name on Card</label>
              <input
                className={`dp-input ${errors.cardName ? 'dp-input-error' : ''}`}
                type="text"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                placeholder="Full Name"
                autoComplete="off"
              />
              {errors.cardName && <span className="dp-error">{errors.cardName}</span>}
            </div>
          </div>
        )}

        {/* ── UPI Form ── */}
        {method === 'DEMO_UPI' && (
          <div className="dp-form">
            <div className="dp-field-group">
              <label className="dp-label">UPI ID</label>
              <input
                className={`dp-input ${errors.upiId ? 'dp-input-error' : ''}`}
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="example@upi"
                autoComplete="off"
              />
              {errors.upiId && <span className="dp-error">{errors.upiId}</span>}
              <span className="dp-hint">Example: user@okhdfcbank, user@paytm, user@ybl</span>
            </div>
            <div className="dp-upi-icons">
              {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(name => (
                <span key={name} className="dp-upi-icon">{name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Simulation note */}
        <div className="dp-sim-note">
          <span className="dp-sim-dot success" /> 80% chance: Payment approved
          <span style={{ margin: '0 12px', color: 'var(--border)' }}>|</span>
          <span className="dp-sim-dot fail" /> 20% chance: Payment declined
        </div>

        {/* Pay button */}
        <button
          className="dp-pay-btn"
          onClick={handlePay}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          Pay Now (Demo) — ₹{Number(totalAmount).toFixed(2)}
        </button>

        <p className="dp-footer-note">
          Demo payments are recorded in the system. Use any test data you like.
        </p>
      </div>
    </div>
  );
};

export default DemoPayment;
