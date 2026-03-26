import React, { useState, useEffect } from 'react';
import { orderService } from '../../../services/orderService';
import '../../../styles/GlobalAdmin.css';
import { RefreshCw, ShoppingCart } from 'lucide-react';

const statusColor = (s) => {
  const lower = (s || '').toLowerCase();
  if (lower === 'delivered') return 'badge-green';
  if (lower === 'processing' || lower === 'in_production') return 'badge-blue';
  if (lower === 'out_for_delivery') return 'badge-indigo';
  if (lower === 'cancelled') return 'badge-red';
  return 'badge-yellow';
};

const paymentColor = (s) => {
  const lower = (s || '').toLowerCase();
  if (lower === 'completed' || lower === 'paid') return 'badge-green';
  if (lower === 'failed') return 'badge-red';
  return 'badge-yellow';
};

const paymentMethodBadge = (method) => {
  if (!method) return <span className="badge badge-gray">N/A</span>;
  const upper = method.toUpperCase();
  if (upper === 'DEMO' || upper === 'DEMO_CARD' || upper === 'DEMO_UPI') {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
        <span className="badge badge-blue">{method}</span>
        <span style={{
          background:'rgba(0,176,255,0.12)', border:'1px solid rgba(0,176,255,0.3)',
          color:'#00B0FF', fontSize:9, fontWeight:800, padding:'1px 5px',
          borderRadius:3, fontFamily:'monospace', letterSpacing:'0.08em'
        }}>DEMO</span>
      </span>
    );
  }
  return <span className="badge badge-blue">{method}</span>;
};

const OrderManagement = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) { window.location.href = '/admin/login'; return; }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true); setError(null);
      const fetchedOrders = await orderService.getAllOrders();
      setOrders(fetchedOrders);
    } catch (error) {
      if (error.message.includes('403')) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }
      setError('Failed to fetch orders: ' + error.message);
    } finally { setLoading(false); }
  };

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    try {
      await orderService.updatePaymentStatus(orderId, newPaymentStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o));
    } catch { alert('Failed to update payment status'); }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => {
        if (o.id !== orderId) return o;
        const u = { ...o, status: newStatus };
        if (newStatus === 'DELIVERED') u.paymentStatus = 'COMPLETED';
        return u;
      }));
    } catch { alert('Failed to update order status'); }
  };

  return (
    <div className="page-wrap">
      <div className="page-header-bar">
        <div>
          <h2 className="page-heading">Client Inquiries</h2>
          <p className="page-heading-sub">{orders.length} total inquiries &amp; orders</p>
        </div>
        <button className="btn-secondary" onClick={fetchOrders}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="notice-bar">
        ✉️ <strong>Email notifications are enabled</strong> — clients are notified on every inquiry status update.
      </div>

      <div className="data-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Inquiry ID</th>
                <th>Client</th>
                <th>Image</th>
                <th>Items</th>
                <th>Value</th>
                <th>Inquiry Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7"><div className="state-loading">Loading orders...</div></td></tr>
              ) : error ? (
                <tr><td colSpan="7">
                  <div className="state-error">
                    <p>{error}</p>
                    <button className="btn-primary" onClick={fetchOrders}>Retry</button>
                  </div>
                </td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7">
                  <div className="state-empty"><ShoppingCart size={40} /><p>No inquiries found</p></div>
                </td></tr>
              ) : orders.map(order => {
                const items     = order.items || order.orderItems || [];
                const firstItem = items[0];
                const rest      = items.length - 1;
                return (
                  <tr key={order.id}>
                    <td><span style={{ color:'#6366f1', fontWeight:700 }}>#{order.id}</span></td>
                    <td>{order.customerName || 'N/A'}</td>
                    <td>
                      {firstItem?.image ? (
                        <div style={{ position:'relative', display:'inline-block' }}>
                          <img src={firstItem.image} alt={firstItem.name || 'Product'}
                            style={{ width:46, height:46, objectFit:'cover', borderRadius:8, border:'1.5px solid #e2e8f0' }}
                            onError={e => e.target.src = 'https://via.placeholder.com/50'} />
                          {rest > 0 && (
                            <span style={{
                              position:'absolute', top:-6, right:-6, background:'#6366f1',
                              color:'white', fontSize:9, fontWeight:800, padding:'2px 5px',
                              borderRadius:10, border:'2px solid white'
                            }}>+{rest}</span>
                          )}
                        </div>
                      ) : <span className="badge badge-gray">None</span>}
                    </td>
                    <td><span className="badge badge-indigo">{items.length} item{items.length !== 1 ? 's' : ''}</span></td>
                    <td><strong style={{ color:'#059669' }}>₹{order.total || order.totalAmount}</strong></td>

                    <td>
                      <select className="status-select" value={order.status || 'PROCESSING'}
                        onChange={e => handleOrderStatusChange(order.id, e.target.value)}
                        disabled={order.status === 'DELIVERED' || order.status === 'CANCELLED'}>
                        <option value="PROCESSING">In Production</option>
                        <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ color:'#94a3b8', fontSize:12 }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
