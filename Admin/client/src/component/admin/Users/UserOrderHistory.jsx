import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, CreditCard, User, Phone, MapPin } from 'lucide-react';
import '../../../styles/UserOrderHistory.css';
import ADMIN_API_BASE_URL from '../../../config/api';

const UserOrderHistory = ({ userEmail, userName, onBack }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [userDetails, setUserDetails] = useState(null); // ✅ ADD THIS

  useEffect(() => {
    fetchUserOrders();
  }, [userEmail]);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/user-orders/email/${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setTotalOrders(data.totalOrders || 0);
      setTotalAmount(data.totalAmount || 0);

      // ✅ SET USER DETAILS FROM FIRST ORDER
      if (data.orders && data.orders.length > 0) {
        const firstOrder = data.orders[0];
        setUserDetails({
          name: firstOrder.customerName,
          email: firstOrder.customerEmail,
          phone: firstOrder.customerPhone,
          address: firstOrder.shippingAddress
        });
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/user-orders/${orderId}/payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      if (response.ok) {
        // Refresh orders after update
        fetchUserOrders();
      } else {
        console.error('Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  if (loading) {
    return (
      <div className="user-order-history-container">
        <div className="loading">Loading order history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-order-history-container">
        <div className="error">Error: {error}</div>
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={20} />
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="user-order-history-container">
      {/* ✅ SIMPLE HEADER WITHOUT USER DETAILS */}
      <div className="header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft size={20} />
          Back to Clients
        </button>
        <div className="page-title">
          <h2>Client Order History</h2>
        </div>
      </div>

      {/* ✅ USER DETAILS CARD */}
      {userDetails && (
        <div className="user-details-card">
          <div className="user-details-header">
            <User className="user-icon" />
            <h3>Client Information</h3>
          </div>
          <div className="user-details-content">
            <div className="detail-row">
              <User size={16} />
              <span className="detail-label">Name:</span>
              <span className="detail-value">{userDetails.name || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{userDetails.email}</span>
            </div>
            <div className="detail-row">
              <Phone size={16} />
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{userDetails.phone || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <MapPin size={16} />
              <span className="detail-label">Address:</span>
              <span className="detail-value">{userDetails.address || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <Package className="card-icon" />
          <div className="card-content">
            <h3>TOTAL INQUIRIES</h3>
            <p className="card-value">{totalOrders}</p>
          </div>
        </div>
        <div className="summary-card">
          <CreditCard className="card-icon" />
          <div className="card-content">
            <h3>TOTAL VALUE</h3>
            <p className="card-value">₹{totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-section">
        <h3>Inquiry &amp; Order History</h3>

        {orders.length === 0 ? (
          <div className="no-orders">
            <Package size={48} />
            <p>No orders found for this client</p>
          </div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                <th>INQUIRY #</th>
                <th>DATE</th>
                <th>ITEMS</th>
                <th>VALUE</th>
                <th>INQUIRY STATUS</th>
                <th>PAYMENT STATUS</th>
                <th>PAYMENT METHOD</th>
                <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id-cell">#{order.id?.substring(0, 8) || 'N/A'}</td>
                    <td className="date-cell">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-GB')
                        : 'N/A'
                      }
                    </td>
                    <td className="items-cell">{order.items?.length || 0} items</td>
                    <td className="amount-cell">₹{order.total?.toFixed(2) || '0.00'}</td>
                    <td className="status-cell">
                      <span className="status-badge confirmed">
                        {order.status || 'CONFIRMED'}
                      </span>
                    </td>
                    <td className="payment-status-cell">
                      {order.paymentMethod === 'COD' ? (
                        <select
                          className={`payment-status-select ${order.paymentStatus?.toLowerCase() || 'pending'}`}
                          value={order.paymentStatus || 'PENDING'}
                          onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="FAILED">FAILED</option>
                        </select>
                      ) : (
                        <span className="status-badge completed">
                          COMPLETED
                        </span>
                      )}
                    </td>
                    <td className="payment-method-cell">
                      <span className="payment-method cod">
                        {order.paymentMethod || 'COD'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button className="btn-view" title="View Details">👁️</button>
                        <button className="btn-edit" title="Edit Order">✏️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrderHistory;