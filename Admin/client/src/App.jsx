import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './component/admin/Auth/AdminLogin';
import AdminLayout from './layout/AdminLayout';
import Dashboard from './component/admin/Dashboard/Dashboard';
import ProductManagement from './component/admin/Products/ProductManagement';
import OrderManagement from './component/admin/Orders/OrderManagement';
import UserManagement from './component/admin/Users/UserManagement';
import PaymentManagement from './component/admin/Orders/PaymentManagement';
import UserOrderHistory from './component/admin/Users/UserOrderHistory';
import AdminComplaints from './component/admin/Users/AdminComplaints';
import ReturnExchangeManagement from './component/admin/ReturnExchange/ReturnExchangeManagement';
import AdminSettings from './component/admin/Settings/AdminSettings';
import Analytics from './component/admin/Analytics/Analytics';
import StaffManagement from './component/admin/Staff/StaffManagement';

// ── Protected route — requires any valid token ──────────────────────────────
const ProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) return <Navigate to="/admin/login" replace />;
  return children;
};

// ── Public route — redirect away if already logged in ───────────────────────
const PublicRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) return <Navigate to="/admin/dashboard" replace />;
  return children;
};

// ── Admin-only route — staff cannot access these pages ──────────────────────
const AdminOnlyRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const adminRole  = localStorage.getItem('adminRole') || 'admin';
  if (!adminToken)          return <Navigate to="/admin/login"     replace />;
  if (adminRole === 'staff') return <Navigate to="/admin/products" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/admin/login"
          element={<PublicRoute><AdminLogin /></PublicRoute>}
        />
        <Route
          path="/admin/*"
          element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}
        >
          {/* Accessible by both admin and staff */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products"  element={<ProductManagement />} />

          {/* Admin-only routes */}
          <Route path="orders"         element={<AdminOnlyRoute><OrderManagement /></AdminOnlyRoute>} />
          <Route path="analytics"      element={<AdminOnlyRoute><Analytics /></AdminOnlyRoute>} />
          <Route path="return-exchange"element={<AdminOnlyRoute><ReturnExchangeManagement /></AdminOnlyRoute>} />
          <Route path="users"          element={<AdminOnlyRoute><UserManagement /></AdminOnlyRoute>} />
          <Route path="users/:userId/orders" element={<AdminOnlyRoute><UserOrderHistory /></AdminOnlyRoute>} />
          <Route path="payments"       element={<AdminOnlyRoute><PaymentManagement /></AdminOnlyRoute>} />
          <Route path="complaints"     element={<AdminOnlyRoute><AdminComplaints /></AdminOnlyRoute>} />
          <Route path="settings"       element={<AdminOnlyRoute><AdminSettings /></AdminOnlyRoute>} />
          <Route path="staff"          element={<AdminOnlyRoute><StaffManagement /></AdminOnlyRoute>} />
        </Route>
        <Route path="/"  element={<Navigate to="/admin/login" replace />} />
        <Route path="*"  element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
