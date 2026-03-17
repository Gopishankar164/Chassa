import React, { useEffect, useState, useCallback } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, ShoppingCart, Users, Package, AlertTriangle,
  RefreshCw, ArrowUp, Plus, Eye, CreditCard
} from 'lucide-react';
import '../../../styles/Dashboard.css';
import ADMIN_API_BASE_URL from '../../../config/api';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

const STATUS_COLORS = {
  DELIVERED: '#10b981',
  PROCESSING: '#6366f1',
  PENDING: '#f59e0b',
  CANCELLED: '#ef4444',
  CONFIRMED: '#8b5cf6',
  SHIPPED: '#06b6d4',
  OUT_FOR_DELIVERY: '#f97316',
};

const PIE_COLOR_LIST = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

// Get "YYYY-MM-DD" in LOCAL time (avoids UTC midnight shift for IST +5:30)
const toLocalDateStr = (date) => {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Build the last-7-days labels + date boundaries
const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dateStr: toLocalDateStr(d), // "YYYY-MM-DD" in local time
    });
  }
  return days;
};

// Parse createdAt from Spring Boot — can be:
//   - ISO string: "2026-03-07T10:38:19"
//   - Array:       [2026, 3, 7, 10, 38, 19, 0]  (LocalDateTime default serialisation)
//   - null / undefined
const parseDate = (raw) => {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    // [year, month(1-based), day, hour, min, sec, nano]
    const [y, mo, d, h = 0, mi = 0, s = 0] = raw;
    return new Date(y, mo - 1, d, h, mi, s); // local time, no UTC shift
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

const Dashboard = () => {
  const adminName = localStorage.getItem('adminName') || 'Admin';

  const [stats, setStats] = useState({ revenue: 0, products: 0, users: 0, orders: 0 });
  const [revenueData, setRevenueData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const token = localStorage.getItem('adminToken');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchAll = useCallback(async () => {
    setLoading(true);

    // ── 1. Dashboard stats ──
    try {
      const res = await fetch(`${ADMIN_API_BASE_URL}/api/dashboard/stats`, { headers });
      if (res.ok) setStats(await res.json());
    } catch { }

    // ── 2. All orders → weekly revenue + order-status pie + recent orders ──
    try {
      const res = await fetch(`${ADMIN_API_BASE_URL}/api/admin/orders`, { headers });
      if (res.ok) {
        const allOrders = await res.json();

        // Weekly revenue — last 7 days from real createdAt
        const days = getLast7Days();
        const revMap = {};
        days.forEach(d => { revMap[d.dateStr] = 0; });

        allOrders.forEach(order => {
          const d = parseDate(order.createdAt);
          if (!d) return;
          const dateStr = toLocalDateStr(d);
          if (revMap[dateStr] !== undefined) {
            revMap[dateStr] += order.total || order.totalAmount || 0;
          }
        });

        setRevenueData(days.map(d => ({
          day: d.label,
          revenue: Math.round(revMap[d.dateStr]),
        })));

        // Order status pie — real counts
        const statusCount = {};
        allOrders.forEach(o => {
          const s = o.status || o.statusString || 'PENDING';
          statusCount[s] = (statusCount[s] || 0) + 1;
        });
        setOrderStatusData(
          Object.entries(statusCount).map(([name, value]) => ({ name, value }))
        );

        // Recent orders — sorted by createdAt desc, top 5
        const sorted = [...allOrders].sort((a, b) => {
          const ta = parseDate(a.createdAt)?.getTime() ?? 0;
          const tb = parseDate(b.createdAt)?.getTime() ?? 0;
          return tb - ta;
        });
        setRecentOrders(sorted.slice(0, 5));
      }
    } catch { }

    // ── 3. Products → low stock ──
    try {
      const res = await fetch(`${ADMIN_API_BASE_URL}/api/products`, { headers });
      if (res.ok) {
        const prods = await res.json();
        const allProds = Array.isArray(prods) ? prods : [];
        const low = allProds
          .filter(p => { const q = p.stockQuantity ?? p.stock; return q != null && q <= 15; })
          .sort((a, b) => (a.stockQuantity ?? a.stock ?? 999) - (b.stockQuantity ?? b.stock ?? 999))
          .slice(0, 6);
        setLowStockProducts(low);
      }
    } catch { }

    setLoading(false);
    setLastRefreshed(new Date());
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const statCards = [
    { title: 'Total Revenue', value: formatCurrency(stats.revenue), icon: <TrendingUp size={22} />, color: 'indigo', sub: 'All time earnings' },
    { title: 'Total Orders', value: stats.orders || 0, icon: <ShoppingCart size={22} />, color: 'emerald', sub: 'Lifetime orders' },
    { title: 'Total Users', value: stats.users || 0, icon: <Users size={22} />, color: 'violet', sub: 'Registered customers' },
    { title: 'Products Listed', value: stats.products || 0, icon: <Package size={22} />, color: 'amber', sub: 'Active catalogue' },
  ];

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return 'status-delivered';
    if (s === 'processing') return 'status-processing';
    if (s === 'pending') return 'status-pending-badge';
    if (s === 'cancelled') return 'status-cancelled';
    if (s === 'shipped') return 'status-shipped';
    if (s === 'out_for_delivery') return 'status-out-delivery';
    return 'status-confirmed';
  };

  const totalRevenueThisWeek = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalOrdersThisWeek = recentOrders.filter(o => {
    const d = parseDate(o.createdAt);
    if (!d) return false;
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  return (
    <div className="dashboard-wrap">

      {/* ── Welcome Banner ── */}
      <div className="welcome-banner">
        <div className="welcome-left">
          <h1 className="welcome-greeting">{getGreeting()}, {adminName} 👋</h1>
          <p className="welcome-sub">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            &nbsp;·&nbsp;Last refreshed: {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="welcome-right">
          <button className="refresh-btn" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stat-cards-grid">
        {statCards.map((card, i) => (
          <div key={i} className={`stat-card-new stat-${card.color}`}>
            <div className="stat-card-top">
              <div className="stat-icon-wrap">{card.icon}</div>
              <span className="stat-trend-badge"><ArrowUp size={11} /> Live</span>
            </div>
            <div className="stat-value">{loading ? '—' : card.value}</div>
            <div className="stat-title">{card.title}</div>
            <div className="stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="charts-row">

        {/* Weekly Revenue Trend — REAL DATA */}
        <div className="chart-card chart-lg">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Weekly Revenue Trend</h3>
              <p className="chart-sub">
                Revenue from real orders · Last 7 days&nbsp;
                {!loading && totalRevenueThisWeek > 0 && (
                  <strong style={{ color: '#6366f1' }}>{formatCurrency(totalRevenueThisWeek)}</strong>
                )}
              </p>
            </div>
          </div>
          {loading ? (
            <div className="chart-loading">
              <div className="chart-skeleton" />
            </div>
          ) : revenueData.every(d => d.revenue === 0) ? (
            <div className="panel-empty">No order revenue in the last 7 days</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                <Tooltip
                  formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)', fontSize: 13 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#revenueGrad)" dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status Pie — REAL DATA */}
        <div className="chart-card chart-sm">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Order Status</h3>
              <p className="chart-sub">Live distribution from all orders</p>
            </div>
          </div>
          {loading ? (
            <div className="chart-loading"><div className="chart-skeleton round" /></div>
          ) : orderStatusData.length === 0 ? (
            <div className="panel-empty">No orders yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%" cy="45%"
                  innerRadius={52} outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={STATUS_COLORS[entry.name] || PIE_COLOR_LIST[idx % PIE_COLOR_LIST.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value + ' orders', name]}
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)', fontSize: 12 }}
                />
                <Legend
                  iconType="circle" iconSize={9}
                  formatter={(val) => (
                    <span style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>
                      {val.replace(/_/g, ' ')}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="bottom-row">

        {/* Recent Orders — REAL DATA */}
        <div className="panel panel-lg">
          <div className="panel-header">
            <div className="panel-title-row">
              <ShoppingCart size={18} className="panel-icon" />
              <h3 className="panel-title">Recent Orders</h3>
              {!loading && <span className="panel-count-badge">{recentOrders.length} shown</span>}
            </div>
            <a href="/admin/orders" className="panel-link">View All →</a>
          </div>
          <div className="recent-orders-table-wrap">
            {loading ? (
              <div className="skeleton-rows">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton-row" />)}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="panel-empty">
                <ShoppingCart size={36} style={{ opacity: 0.2, margin: '0 auto 8px' }} />
                <p>No orders yet</p>
              </div>
            ) : (
              <table className="mini-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => {
                    const items = order.items || order.orderItems || [];
                    const amount = order.total || order.totalAmount || 0;
                    return (
                      <tr key={order.id}>
                        <td className="mini-id">#{String(order.id).slice(-8)}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{order.customerName || 'N/A'}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{order.customerEmail || ''}</div>
                        </td>
                        <td>
                          <span className="badge-count">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="mini-amount">₹{Number(amount).toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`mini-badge ${getStatusClass(order.status || order.statusString)}`}>
                            {(order.status || order.statusString || 'N/A').toString().replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="mini-date">
                          {parseDate(order.createdAt)
                            ? parseDate(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                            : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alert — REAL DATA */}
        <div className="panel panel-sm">
          <div className="panel-header">
            <div className="panel-title-row">
              <AlertTriangle size={18} className="panel-icon panel-icon-warn" />
              <h3 className="panel-title">Low Stock Alert</h3>
              {!loading && lowStockProducts.length > 0 && (
                <span className="panel-warn-badge">{lowStockProducts.length}</span>
              )}
            </div>
            <a href="/admin/products" className="panel-link">Manage →</a>
          </div>

          {loading ? (
            <div className="skeleton-rows">
              {[1, 2, 3].map(i => <div key={i} className="skeleton-row" />)}
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div className="panel-empty stock-ok">
              <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
              All products well stocked!
            </div>
          ) : (
            <div className="stock-list">
              {lowStockProducts.map(p => (
                <div key={p.id} className={`stock-item ${p.stock <= 5 ? 'stock-critical' : 'stock-low'}`}>
                  <div className="stock-info">
                    <span className="stock-name">{p.name}</span>
                    <span className="stock-category">{p.category || 'Uncategorised'}</span>
                  </div>
                  <div className="stock-count">
                    <span className="stock-num" style={{ color: (p.stockQuantity ?? p.stock) <= 5 ? '#ef4444' : '#f59e0b' }}>
                      {p.stockQuantity ?? p.stock}
                    </span>
                    <span className="stock-label">left</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="quick-actions-row">
        <h3 className="quick-title">Quick Actions</h3>
        <div className="quick-actions-grid">
          <a href="/admin/products" className="quick-btn quick-indigo">
            <Plus size={20} /><span>Add Product</span>
          </a>
          <a href="/admin/orders" className="quick-btn quick-emerald">
            <Eye size={20} /><span>View Orders</span>
          </a>
          <a href="/admin/users" className="quick-btn quick-violet">
            <Users size={20} /><span>Manage Users</span>
          </a>
          <a href="/admin/payments" className="quick-btn quick-rose">
            <CreditCard size={20} /><span>Payments</span>
          </a>
          <a href="/admin/complaints" className="quick-btn quick-slate">
            <AlertTriangle size={20} /><span>Complaints</span>
          </a>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
