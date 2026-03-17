import React, { useState, useEffect } from 'react';
import '../../../styles/GlobalAdmin.css';
import ADMIN_API_BASE_URL from '../../../config/api';
import { TrendingUp, Clock, CheckCircle } from 'lucide-react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

const PaymentManagement = () => {
  const [orders, setOrders] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
    fetchPaymentSummary();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      let url = `${ADMIN_API_BASE_URL}/api/admin/orders/list`;
      if (filter === 'pending') url = `${ADMIN_API_BASE_URL}/api/admin/orders/pending-payments`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        const filtered = filter !== 'all' && filter !== 'pending'
          ? data.filter(o => o.paymentStatus?.toLowerCase() === filter) : data;
        setOrders(filtered);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchPaymentSummary = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/orders/payment-summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) setPaymentSummary(await response.json());
    } catch (e) { console.error(e); }
  };

  const handlePaymentStatusChange = async (orderId, newStatus, remarks = '') => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/admin/orders/${orderId}/update-payment-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: newStatus, remarks })
      });
      if (response.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, paymentStatus: newStatus } : o));
        fetchPaymentSummary();
      } else throw new Error();
    } catch { alert('Failed to update payment status'); }
  };

  const summaryCards = [
    { label: 'Total Revenue', value: formatCurrency(paymentSummary.totalRevenue), icon: <TrendingUp size={20} />, color: 'icon-indigo' },
    { label: 'Pending Amount', value: formatCurrency(paymentSummary.pendingAmount), sub: `${paymentSummary.pendingPayments || 0} orders`, icon: <Clock size={20} />, color: 'icon-amber' },
    { label: 'Completed Payments', value: paymentSummary.completedPayments || 0, sub: 'orders paid', icon: <CheckCircle size={20} />, color: 'icon-green' },
  ];

  const payStatus = (s) => {
    const l = (s || '').toLowerCase();
    if (l === 'completed') return 'badge-green';
    if (l === 'failed') return 'badge-red';
    return 'badge-yellow';
  };

  return (
    <div className="page-wrap">
      <div className="page-header-bar">
        <div>
          <h2 className="page-heading">Payment Management</h2>
          <p className="page-heading-sub">Manage and track all payment transactions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {summaryCards.map((c, i) => (
          <div className="summary-card" key={i}>
            <div className="summary-card-info">
              <h4>{c.label}</h4>
              <p>{c.value}</p>
              {c.sub && <span style={{ fontSize: 12, color: '#94a3b8' }}>{c.sub}</span>}
            </div>
            <div className={`summary-card-icon ${c.color}`}>{c.icon}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['all', 'pending', 'completed', 'failed'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="data-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Payment Status</th>
                <th>Order Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7"><div className="state-loading">Loading payments...</div></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7"><div className="state-empty"><p>No orders found</p></div></td></tr>
              ) : orders.map(order => (
                <tr key={order.id}>
                  <td><span style={{ color: '#6366f1', fontWeight: 700 }}>#{order.id}</span></td>
                  <td>
                    <div className="cust-name">{order.customerName}</div>
                    <div className="cust-email">{order.customerEmail}</div>
                  </td>
                  <td><strong style={{ color: '#059669' }}>{formatCurrency(order.total)}</strong></td>
                  <td><span className="badge badge-blue">{order.paymentMethod}</span></td>
                  <td>
                    <span className={`badge ${payStatus(order.paymentStatus)}`}>
                      {order.paymentStatus || 'PENDING'}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: 12 }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <div className="actions-cell">
                      {order.paymentStatus === 'PENDING' && (<>
                        <button className="btn-edit" style={{ fontSize: 12, padding: '6px 12px', background: '#ecfdf5', color: '#059669', borderColor: '#d1fae5' }}
                          onClick={() => handlePaymentStatusChange(order.id, 'COMPLETED', 'Confirmed by admin')}>
                          ✅ Confirm
                        </button>
                        <button className="btn-danger" style={{ fontSize: 12, padding: '6px 12px' }}
                          onClick={() => { const r = prompt('Reason:'); if (r) handlePaymentStatusChange(order.id, 'FAILED', r); }}>
                          ❌ Fail
                        </button>
                      </>)}
                      {order.paymentStatus === 'COMPLETED' && (
                        <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}
                          onClick={() => handlePaymentStatusChange(order.id, 'PENDING', 'Reverted')}>
                          🔄 Revert
                        </button>
                      )}
                    </div>
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

export default PaymentManagement;