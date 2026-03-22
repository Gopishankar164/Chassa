/* filepath: src/components/MyOrders.jsx */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orderStatusService from '../services/orderStatusService';
import './MyOrders.css';
import API_BASE_URL from '../config/api';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserOrders();

    const handleOrderUpdate = (event) => {
      const { orderId, newStatus } = event.detail;
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        )
      );
    };

    window.addEventListener('orderStatusUpdated', handleOrderUpdate);

    return () => {
      window.removeEventListener('orderStatusUpdated', handleOrderUpdate);
    };
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      orders.forEach(order => {
        if (order.status && order.status !== 'DELIVERED' && order.status !== 'CANCELLED') {
          if (!orderStatusService.getAutomationStatus(order.id)) {
            orderStatusService.startAutomation(order.id, order.status);
          }
        }
      });
    }
  }, [orders]);

  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));

      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      const apiUrl = `${API_BASE_URL}/api/orders/user/${user.id}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData || []);
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
      month: 'short',
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
    if (order.paymentMethod === 'COD' || order.paymentMethod === 'CASH_ON_DELIVERY') {
      return 'PENDING';
    }
    return 'COMPLETED';
  };

  const getOrderStatus = (status) => {
    const statusMap = {
      'PENDING': { text: 'Order Placed', color: '#fbbf24', bgColor: '#fef3c7' },
      'CONFIRMED': { text: 'Confirmed', color: '#3b82f6', bgColor: '#dbeafe' },
      'PROCESSING': { text: 'Processing', color: '#8b5cf6', bgColor: '#e9d5ff' },
      'SHIPPED': { text: 'Shipped', color: '#06b6d4', bgColor: '#cffafe' },
      'OUT_FOR_DELIVERY': { text: 'Out for Delivery', color: '#f59e0b', bgColor: '#fef3c7' },
      'DELIVERED': { text: 'Delivered', color: '#10b981', bgColor: '#d1fae5' },
      'CANCELLED': { text: 'Cancelled', color: '#ef4444', bgColor: '#fee2e2' }
    };
    return statusMap[status] || { text: 'Confirmed', color: '#3b82f6', bgColor: '#dbeafe' };
  };

  const getOrderTotal = (order) => {
    if (order.totalAmount) return order.totalAmount;
    if (order.total) return order.total;
    const items = order.items || order.orderItems || [];
    if (items.length > 0) {
      return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }
    return 0;
  };

  const isAutomationActive = (orderId) => {
    return orderStatusService.getAutomationStatus(orderId);
  };

  const canReturnOrder = (order) => {
    if (order.status !== 'DELIVERED') return false;
    const deliveredDate = new Date(order.updatedAt || order.createdAt);
    const daysSinceDelivery = Math.floor((new Date() - deliveredDate) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery <= 30;
  };

  const openCancelModal = (order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
    setCancellationReason('');
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedOrder(null);
    setCancellationReason('');
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    if (!cancellationReason.trim()) {
      showToast('Please provide a reason for cancellation', 'error');
      return;
    }

    setCancellingOrderId(selectedOrder.id);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/orders/${selectedOrder.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: cancellationReason })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Order cancelled successfully!');
        fetchUserOrders();
        closeCancelModal();
      } else {
        showToast(data.message || 'Failed to cancel order', 'error');
      }
    } catch {
      showToast('Error cancelling order. Please try again.', 'error');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const canCancelOrder = (status) => {
    const cancellableStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'Pending', 'Confirmed', 'Processing'];
    return cancellableStatuses.includes(status);
  };

  if (loading) {
    return (
      <div className="orders-loading-overlay">
        <div className="premium-loader">
          <div className="loader-content">
            <h2>Fetching Your Orders</h2>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders-container">
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color: '#fff', padding: '12px 22px', borderRadius: 10, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', fontSize: '0.9rem' }}>
          {toast.msg}
        </div>
      )}
      {/* Header */}
      <div className="orders-header">
        <h1>My Orders</h1>
        <button
          className="continue-shopping-btn"
          onClick={() => navigate('/home')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
            <path d="M15 19.92L8.48 13.4C7.71 12.63 7.71 11.37 8.48 10.6L15 4.08" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          CONTINUE SHOPPING
        </button>
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 2L4.62 6.96C4.05 7.82 4.66 9 5.7 9H18.3C19.34 9 19.95 7.82 19.38 6.96L16 2H8Z" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.66 11.44C3.24 14.14 3 16.92 3 19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19C21 16.92 20.76 14.14 20.34 11.44C20.15 10.3 19.17 9 17 9H7C4.83 9 3.85 10.3 3.66 11.44Z" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 13.5C10 12.67 10.67 12 11.5 12H12.5C13.33 12 14 12.67 14 13.5C14 14.33 13.33 15 12.5 15H11.5C10.67 15 10 14.33 10 13.5Z" stroke="#d1d5db" strokeWidth="1.5" />
              </svg>
            </div>
            <h3>No orders found</h3>
            <p>You haven't placed any orders yet.</p>
            <button
              className="start-shopping-btn"
              onClick={() => navigate('/')}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const orderStatus = getOrderStatus(order.status);
            const automationActive = isAutomationActive(order.id);

            return (
              <div key={order.id} className="order-card-summary">
                {/* Order Header */}
                <div className="order-summary-header">
                  <div className="order-header-left">
                    <h3 className="order-id-blue">Order #{order.id}</h3>
                  </div>
                  <span className="order-date-gray">{formatDate(order.createdAt)}</span>
                </div>

                {/* Order Total */}
                <div className="order-total-large">
                  <h2>₹{getOrderTotal(order)}</h2>
                </div>

                {/* Dynamic Status Badges */}
                <div className="status-badges-row">
                  <span
                    className="order-status-badge"
                    style={{
                      backgroundColor: orderStatus.bgColor,
                      color: orderStatus.color,
                      border: `1px solid ${orderStatus.color}`
                    }}
                  >
                    {orderStatus.text}
                  </span>
                  <span className={`payment-status ${getPaymentStatus(order).toLowerCase()}`}>
                    PAYMENT: {getPaymentStatus(order)}
                  </span>
                </div>

                {/* Payment Method */}
                <div className="payment-method-section">
                  <strong>Payment:</strong> {getPaymentMethod(order)}
                  {(order.paymentMethod === 'COD' || order.paymentMethod === 'CASH_ON_DELIVERY') && (
                    <div className="cod-payment-note">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '5px', verticalAlign: 'middle' }}>
                        <path d="M2 8.50488H22" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 16.5049H8" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10.5 16.5049H14.5" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6.44 3.50488H17.55C21.11 3.50488 22 4.38488 22 7.89488V16.1049C22 19.6149 21.11 20.4949 17.56 20.4949H6.44C2.89 20.5049 2 19.6249 2 16.1149V7.89488C2 4.38488 2.89 3.50488 6.44 3.50488Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Pay ₹{getOrderTotal(order)} on delivery
                    </div>
                  )}
                </div>

                {/* Items Section */}
                <div className="items-section-summary">
                  <strong>Items:</strong>
                  <div className="items-list">
                    {(order.items || order.orderItems || []).map((item, index) => (
                      <div key={index} className="order-item-row">
                        <span className="item-name">{item.productName || item.name || 'Product'}</span>
                        <span className="item-details">
                          <span className="item-quantity">Qty: {item.quantity}</span>
                          <span className="item-price">₹{item.price}</span>
                        </span>
                      </div>
                    ))}
                    {(order.items || order.orderItems || []).length === 0 && (
                      <div className="no-items">No items found</div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="order-actions">
                  <button
                    onClick={() => navigate(`/order/${order.id}`)}
                    className="view-details-btn"
                  >
                    VIEW DETAILS
                  </button>
                  <button
                    onClick={() => navigate(`/track/${order.id}`)}
                    className="track-order-btn"
                  >
                    TRACK ORDER
                  </button>
                  {canCancelOrder(order.status) && (
                    <button
                      className="cancel-order-btn"
                      onClick={() => openCancelModal(order)}
                      disabled={cancellingOrderId === order.id}
                    >
                      {cancellingOrderId === order.id ? 'Cancelling...' : 'CANCEL'}
                    </button>
                  )}
                  {canReturnOrder(order) && (
                    <button
                      className="return-exchange-btn"
                      onClick={() => navigate(`/return-exchange/${order.id}`)}
                    >
                      RETURN
                    </button>
                  )}
                </div>

                {/* Last updated info */}
                <div className="order-footer">
                  <small className="last-updated">
                    Last updated: {new Date(order.updatedAt || order.createdAt).toLocaleString()}
                  </small>
                </div>

                {/* Cancellation info */}
                {(orderStatus.text === 'Cancelled' || orderStatus.text === 'CANCELLED') && order.cancellationReason && (
                  <div className="cancellation-info">
                    <small>Reason: {order.cancellationReason}</small>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={closeCancelModal}>
          <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cancel Order</h2>
              <button className="modal-close-btn" onClick={closeCancelModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel this order?</p>
              <p className="order-id-display">Order ID: #{selectedOrder?.id.substring(0, 8)}</p>

              <div className="cancellation-reason-section">
                <label htmlFor="cancellation-reason">
                  Reason for Cancellation <span className="required">*</span>
                </label>
                <select
                  id="cancellation-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="reason-select"
                >
                  <option value="">Select a reason</option>
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Found better price elsewhere">Found better price elsewhere</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Delivery taking too long">Delivery taking too long</option>
                  <option value="Want to change shipping address">Want to change shipping address</option>
                  <option value="Other">Other</option>
                </select>

                {cancellationReason === 'Other' && (
                  <textarea
                    placeholder="Please specify your reason..."
                    className="reason-textarea"
                    onChange={(e) => setCancellationReason(e.target.value)}
                  />
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="modal-cancel-btn"
                  onClick={closeCancelModal}
                >
                  Keep Order
                </button>
                <button
                  className="modal-confirm-btn"
                  onClick={handleCancelOrder}
                  disabled={!cancellationReason || cancellingOrderId === selectedOrder?.id}
                >
                  {cancellingOrderId === selectedOrder?.id ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
