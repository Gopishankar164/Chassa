import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import UserOrderHistory from './UserOrderHistory';
import '../../../styles/GlobalAdmin.css';
import ADMIN_API_BASE_URL from '../../../config/api';

const UserManagement = () => {
  const [usersWithOrders, setUsersWithOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsersOrderSummary();
  }, []);

  const fetchUsersOrderSummary = async () => {
    try {
      setLoading(true); setError(null);
      const token = localStorage.getItem('adminToken');
      if (!token) { setError('No authentication token found'); return; }

      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/user-orders/users-summary`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (response.status === 401) { localStorage.removeItem('token'); window.location.href = '/admin/login'; return; }
      if (response.status === 403) { setError('Access denied. Admin privileges required.'); return; }
      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      setUsersWithOrders(data);
    } catch (error) {
      setError('Failed to fetch users: ' + error.message);
    } finally { setLoading(false); }
  };

  if (selectedUser) {
    return (
      <UserOrderHistory
        userEmail={selectedUser.email}
        userName={selectedUser.name}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <div className="page-wrap">
      <div className="page-header-bar">
        <div>
          <h2 className="page-heading">Client Management</h2>
          <p className="page-heading-sub">{usersWithOrders.length} clients with orders</p>
        </div>
      </div>

      <div className="data-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Total Orders</th>
                <th>Total Value</th>
                <th>Pending Inquiries</th>
                <th>Pending Payments</th>
                <th>Last Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7"><div className="state-loading">Loading clients...</div></td></tr>
              ) : error ? (
                <tr><td colSpan="7">
                  <div className="state-error">
                    <p>{error}</p>
                    <button className="btn-primary" onClick={fetchUsersOrderSummary}>Retry</button>
                  </div>
                </td></tr>
              ) : usersWithOrders.length === 0 ? (
                <tr><td colSpan="7">
                  <div className="state-empty"><Package size={40} /><p>No clients with orders yet</p></div>
                </td></tr>
              ) : usersWithOrders.map((user, i) => (
                <tr key={i}>
                  <td>
                    <div className="cust-name">{user.customerName || 'N/A'}</div>
                    <div className="cust-email">{user.customerEmail}</div>
                  </td>
                  <td><span className="badge badge-indigo">{user.totalOrders}</span></td>
                  <td><strong style={{ color: '#059669' }}>₹{user.totalAmount?.toFixed(0) || '0'}</strong></td>
                  <td>
                    <span className={`badge ${user.pendingOrders > 0 ? 'badge-yellow' : 'badge-green'}`}>
                      {user.pendingOrders || 0}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.pendingPayments > 0 ? 'badge-red' : 'badge-green'}`}>
                      {user.pendingPayments || 0}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: 12 }}>
                    {user.lastOrderDate ? new Date(user.lastOrderDate).toLocaleDateString('en-IN') : 'N/A'}
                  </td>
                  <td>
                    <button className="btn-primary" style={{ fontSize: 12, padding: '8px 14px' }}
                      onClick={() => setSelectedUser({ email: user.customerEmail, name: user.customerName, ...user })}>
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;