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

const ProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) return <Navigate to="/admin/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) return <Navigate to="/admin/dashboard" replace />;
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
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="return-exchange" element={<ReturnExchangeManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="users/:userId/orders" element={<UserOrderHistory />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;