import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import '../styles/ReturnExchange.css';
import API_BASE_URL from '../config/api';

const ReturnExchange = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [requestType, setRequestType] = useState('return'); // Default: 'return'
    const [selectedItems, setSelectedItems] = useState([]);
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState(false);

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
                const data = await response.json();
                setOrder(data);
            }
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const handleItemToggle = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 5) {
            setFormError('You can upload up to 5 images only.');
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImages(prev => [...prev, {
                    file,
                    preview: event.target.result
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (selectedItems.length === 0) { setFormError('Please select at least one item.'); return; }
        if (!reason) { setFormError('Please choose a reason.'); return; }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('orderId', orderId);
            formData.append('requestType', requestType);
            formData.append('items', JSON.stringify(selectedItems));
            formData.append('reason', reason);
            formData.append('description', description);

            images.forEach(img => formData.append('images', img.file));

            const response = await fetch(`${API_BASE_URL}/api/orders/return-exchange`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                setFormSuccess(true);
            } else {
                setFormError('Something went wrong. Please try again.');
            }
        } catch {
            setFormError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const reasonList = {
        return: ['Defective/Damaged', 'Wrong item', 'Size/Fit issues', 'Not as described', 'Changed mind', 'Quality issues', 'Other'],
        exchange: ['Wrong size', 'Wrong color', 'Defective product', 'Better fit needed', 'Different variant preferred', 'Other']
    };

    if (loading) return (
        <div className="re-loading-view">
            <Navbar />
            <div className="re-loading-content">
                <div className="re-spinner"></div>
                <p>Loading order details...</p>
            </div>
        </div>
    );

    if (!order) return (
        <div className="re-error-view">
            <Navbar />
            <div className="re-error-content">
                <div className="re-error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M9 21V12H15V21" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                </div>
                <h3>Order Not Found</h3>
                <p>We couldn't find the order you're looking for.</p>
                <button className="re-back-to-orders-btn" onClick={() => navigate('/my-orders')}>
                    Back to Orders
                </button>
            </div>
        </div>
    );

    if (formSuccess) return (
        <>
            <Navbar />
            <div className="return-exchange-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 10, color: '#10b981' }}>Request Submitted!</h2>
                <p style={{ color: '#666', marginBottom: 28, maxWidth: 420, margin: '0 auto 28px' }}>
                    Your {requestType} request has been submitted. Our team will review it within 24–48 hours and reach out with next steps.
                </p>
                <button className="re-submit-btn" onClick={() => navigate('/my-orders')}>Back to My Orders</button>
            </div>
        </>
    );

    return (
        <>
            <Navbar />
            <div className="return-exchange-container">
                <header className="return-exchange-header">
                    <button className="back-btn" onClick={() => navigate('/my-orders')}>
                        <span>←</span> Back to Orders
                    </button>
                    <h1>Return or Exchange</h1>
                    <span className="order-id-label">Order ID: #{order.id}</span>
                </header>

                {formError && (
                    <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 18px', borderRadius: 8, marginBottom: 20, fontWeight: 500 }}>
                        {formError}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    {/* Step 1: Choose Type */}
                    <div className="form-section">
                        <h3>1. What service do you need?</h3>
                        <div className="type-selector">
                            <button
                                type="button"
                                className={`type-btn ${requestType === 'return' ? 'active' : ''}`}
                                onClick={() => setRequestType('return')}
                            >
                                <div className="selection-dot">
                                    {requestType === 'return' && <span className="tick">✓</span>}
                                </div>
                                <strong>Return</strong>
                                <small>Send items back for a refund</small>
                            </button>
                            <button
                                type="button"
                                className={`type-btn ${requestType === 'exchange' ? 'active' : ''}`}
                                onClick={() => setRequestType('exchange')}
                            >
                                <div className="selection-dot">
                                    {requestType === 'exchange' && <span className="tick">✓</span>}
                                </div>
                                <strong>Exchange</strong>
                                <small>Replace items with a new one</small>
                            </button>
                        </div>
                    </div>

                    {/* Step 2: Select Items */}
                    <div className="form-section">
                        <h3>2. Select items to {requestType === 'return' ? 'Return' : 'Exchange'}</h3>
                        <div className="items-grid">
                            {(order.items || order.orderItems || []).map(item => (
                                <div
                                    key={item.id}
                                    className={`item-selection-card ${selectedItems.includes(item.id) ? 'selected' : ''}`}
                                    onClick={() => handleItemToggle(item.id)}
                                >
                                    <div className="item-checkbox">
                                        {selectedItems.includes(item.id) && <span className="tick">✓</span>}
                                    </div>
                                    <img
                                        src={item.product?.imageUrl || item.imageUrl || item.productImageUrl || '/placeholder.png'}
                                        alt={item.product?.name || item.productName || item.name || 'Product'}
                                        onError={(e) => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNmMWY1ZjkiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIyMCIgZmlsbD0iI2NiZDVlMSI+8J+TmTwvdGV4dD48L3N2Zz4='; }}
                                    />
                                    <div className="item-meta">
                                        <h4>{item.product?.name || item.productName || item.name || 'Product'}</h4>
                                        <p>Qty: {item.quantity} | Price: ₹{item.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {(order.items || order.orderItems || []).length === 0 && (
                            <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>No items found in this order.</p>
                        )}
                    </div>

                    {/* Step 3: Choose Reason */}
                    <div className="form-section">
                        <h3>3. What's the reason?</h3>
                        <div className="reason-grid">
                            {reasonList[requestType].map(r => (
                                <label key={r} className="reason-label">
                                    <input
                                        type="radio"
                                        name="return_reason"
                                        value={r}
                                        checked={reason === r}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                    {r}
                                </label>
                            ))}
                        </div>

                        <div className="description-container">
                            <h4>Tell us more (Optional)</h4>
                            <textarea
                                className="description-textarea"
                                placeholder="Share more details about your request here..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Step 4: Photos */}
                    <div className="form-section">
                        <h3>4. Add Photos (Recommended)</h3>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '-15px 0 15px 0' }}>
                            Upload images showing the condition of the items.
                        </p>
                        <label className="upload-placeholder" htmlFor="img-upload">
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                Click to add photos ({images.length}/5)
                            </span>
                            <input
                                id="img-upload"
                                type="file"
                                multiple
                                hidden
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </label>
                        <div className="preview-grid">
                            {images.map((img, i) => (
                                <div key={i} className="image-preview-item">
                                    <img src={img.preview} alt="upload preview" />
                                    <button type="button" className="remove-img-btn" onClick={() => removeImage(i)}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-footer">
                        <button
                            type="submit"
                            className="re-submit-btn"
                            disabled={submitting || selectedItems.length === 0}
                        >
                            {submitting ? 'Submitting Request...' : `Submit ${requestType === 'return' ? 'Return' : 'Exchange'} Request`}
                        </button>

                        <div className="info-box">
                            <h4>What happens next?</h4>
                            <ul>
                                <li>Our team will review your request within 24-48 hours.</li>
                                <li>Once approved, you will receive pickup instructions.</li>
                                <li>The {requestType === 'return' ? 'refund' : 'exchange'} will be processed after the item is received and inspected.</li>
                            </ul>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};

export default ReturnExchange;
