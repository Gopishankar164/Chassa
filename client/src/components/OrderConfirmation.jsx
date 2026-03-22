import React from 'react';
import { useNavigate } from 'react-router-dom';
import './OrderConfirmation.css';

const OrderConfirmation = ({ orderData, onClose }) => {
    const navigate = useNavigate();

    if (!orderData) return null;

    const getPaymentMethodDisplay = (method) => {
        if (method === 'COD') return 'Cash on Delivery';
        if (method === 'ONLINE') return 'Online Payment';
        return method || 'Cash on Delivery';
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
                <div className="success-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#10b981" />
                        <path d="M7 12L10.5 15.5L17 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h1>Order Placed Successfully!</h1>
                <p>Thank you for your order. We'll send you a confirmation email shortly.</p>

                <div className="order-summary-confirm">
                    <h3>Order Details</h3>
                    <div className="order-info">
                        {orderData.orderId && <p><strong>Order ID:</strong> #{orderData.orderId.substring(0, 8)}...</p>}
                        <p><strong>Total Amount:</strong> ₹{orderData.totalAmount}</p>
                        <p><strong>Payment Method:</strong> {getPaymentMethodDisplay(orderData.paymentMethod)}</p>
                        <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
                    </div>
                </div>

                <div className="confirmation-actions">
                    <button onClick={() => { onClose(); navigate('/my-orders'); }} className="track-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '7px', verticalAlign: 'middle' }}>
                            <path d="M8 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M16 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M3 8.5H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M21 8V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 11H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M8 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        View My Orders
                    </button>
                    <button onClick={onClose} className="continue-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '7px', verticalAlign: 'middle' }}>
                            <path d="M8 2L4.62 6.96C4.05 7.82 4.66 9 5.7 9H18.3C19.34 9 19.95 7.82 19.38 6.96L16 2H8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3.66 11.44C3.24 14.14 3 16.92 3 19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19C21 16.92 20.76 14.14 20.34 11.44C20.15 10.3 19.17 9 17 9H7C4.83 9 3.85 10.3 3.66 11.44Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
