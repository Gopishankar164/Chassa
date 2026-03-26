import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Package, Users, DollarSign,
  ArrowRight, Activity,
} from 'lucide-react';
import '../../../styles/Dashboard.css';
import ADMIN_API_BASE_URL from '../../../config/api';





// ── Main Dashboard Component ────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const adminName = localStorage.getItem('adminName') || 'Admin';
  const adminRole = localStorage.getItem('adminRole') || 'admin';

  const [stats, setStats]               = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [lastRefresh, setLastRefresh]   = useState(new Date());



  const token   = localStorage.getItem('adminToken');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, ordRes, usrRes] = await Promise.all([
        fetch(`${ADMIN_API_BASE_URL}/api/products?page=0&size=100`,          { headers }),
        fetch(`${ADMIN_API_BASE_URL}/api/admin/orders`,                      { headers }),
        fetch(`${ADMIN_API_BASE_URL}/api/admin/user-orders/users-summary`,   { headers }),
      ]);
      const products = prodRes.ok ? await prodRes.json() : [];
      const orders   = ordRes.ok  ? await ordRes.json()  : [];
      const users    = usrRes.ok  ? await usrRes.json()  : [];

      const totalRevenue  = orders.reduce((s, o) => s + (Number(o.total || o.totalAmount) || 0), 0);
      const pendingOrders = orders.filter(o => (o.status || '').toUpperCase() === 'PENDING').length;

      setStats({ totalRevenue, totalOrders: orders.length, totalProducts: products.length, totalUsers: users.length, pendingOrders });
      setRecentOrders(orders.slice(0, 6));
      setLowStock(products.filter(p => Number(p.stockQuantity ?? p.stock ?? 999) <= 15).slice(0, 5));
    } catch {
      // Fallback demo data
      setStats({ totalRevenue: 45250, totalOrders: 1024, totalProducts: 342, totalUsers: 2851, pendingOrders: 37 });
      setRecentOrders([
        { id:'ORD001', customerName:'Arjun Menon',  total:25000, status:'DELIVERED',  createdAt: new Date() },
        { id:'ORD002', customerName:'Kavya Nair',   total:15050, status:'PROCESSING', createdAt: new Date() },
        { id:'ORD003', customerName:'Ravi Shankar', total:89000, status:'PENDING',    createdAt: new Date() },
        { id:'ORD004', customerName:'Priya Thomas', total:42025, status:'CONFIRMED',  createdAt: new Date() },
        { id:'ORD005', customerName:'Suresh Kumar', total:7500,  status:'SHIPPED',    createdAt: new Date() },
        { id:'ORD006', customerName:'Deepa Raj',    total:18900, status:'DELIVERED',  createdAt: new Date() },
      ]);
      setLowStock([
        { id:1, name:'Bearing 6205-2RS', category:'Bearings',    stockQuantity:3  },
        { id:2, name:'V-Belt A-40',      category:'Drive Belts', stockQuantity:8  },
        { id:3, name:'Shaft Coupling',   category:'Couplings',   stockQuantity:12 },
        { id:4, name:"Oil Seal 35×55",   category:'Seals',       stockQuantity:5  },
      ]);
    }
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => { fetchData(); }, []);

  const statusClass = (s) => {
    const map = {
      DELIVERED:'status-delivered', PROCESSING:'status-processing',
      PENDING:'status-pending-badge', CANCELLED:'status-cancelled',
      CONFIRMED:'status-confirmed', SHIPPED:'status-shipped',
      OUT_FOR_DELIVERY:'status-out-delivery',
    };
    return map[(s||'').toUpperCase()] || 'status-pending-badge';
  };

  const statCards = stats ? [
    { label:'Total Revenue',  value:`₹${Number(stats.totalRevenue).toLocaleString('en-IN')}`, sub:`${stats.pendingOrders} pending`,     icon:DollarSign,  color:'stat-indigo',  trend:'+12.5%' },
    { label:'Total Orders',   value:stats.totalOrders.toLocaleString(),                        sub:`${stats.pendingOrders} awaiting`,    icon:ShoppingCart,color:'stat-emerald', trend:'+8.2%'  },
    { label:'Products',       value:stats.totalProducts,                                       sub:`${lowStock.length} low stock`,       icon:Package,     color:'stat-violet',  trend: lowStock.length > 0 ? `⚠ ${lowStock.length}` : 'OK' },
    { label:'Clients',        value:stats.totalUsers.toLocaleString(),                         sub:'Registered customers',               icon:Users,       color:'stat-amber',   trend:'+5.3%'  },
  ] : [];

  return (
    <div className="dashboard-wrap">



      {/* Stat Cards */}
      {loading ? (
        <div className="stat-cards-grid" style={{ marginBottom:24 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              height:120, borderRadius:12, background:'#1C2230',
              backgroundImage:'linear-gradient(90deg,#1C2230 25%,rgba(52,211,153,0.04) 50%,#1C2230 75%)',
              backgroundSize:'200% 100%', animation:'shimmer 1.4s infinite'
            }} />
          ))}
        </div>
      ) : (
        <div className="stat-cards-grid">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className={`stat-card-new ${card.color}`}>
                <div className="stat-card-top">
                  <div className="stat-icon-wrap"><Icon size={20} /></div>
                  <span className="stat-trend-badge"><Activity size={10} /> {card.trend}</span>
                </div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-title">{card.label}</div>
                <div className="stat-sub">{card.sub}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Orders */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-row">
            <ShoppingCart size={15} className="panel-icon" />
            <h3 className="panel-title">Recent Orders</h3>
            <span className="panel-count-badge">{recentOrders.length}</span>
          </div>
          <button className="panel-link" style={{ background:'none', border:'none', cursor:'pointer' }}
            onClick={() => navigate('/admin/orders')}>
            View All <ArrowRight size={11} style={{ verticalAlign:'middle' }} />
          </button>
        </div>
        {loading ? (
          <div className="skeleton-rows">{[1,2,3,4].map(i => <div key={i} className="skeleton-row" />)}</div>
        ) : recentOrders.length === 0 ? (
          <div className="panel-empty">No orders yet.</div>
        ) : (
          <div className="recent-orders-table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Order ID</th><th>Client</th><th>Value</th><th>Status</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td><span className="mini-id">#{order.id}</span></td>
                    <td style={{ color:'#F0F6FC', fontWeight:600 }}>{order.customerName || 'N/A'}</td>
                    <td><span className="mini-amount">₹{Number(order.total || order.totalAmount || 0).toLocaleString('en-IN')}</span></td>
                    <td><span className={`mini-badge ${statusClass(order.status)}`}>{(order.status||'Pending').toLowerCase()}</span></td>
                    <td><span className="mini-date">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : '—'}</span></td>
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

export default Dashboard;
