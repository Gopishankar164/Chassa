import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, RefreshCcw,
  Users, MessageCircleWarning, CreditCard, Settings
} from 'lucide-react';
import '../styles/Sidebar.css';

const menuItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: '/admin/products', label: 'Products', icon: <Package size={18} /> },
  { path: '/admin/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
  { path: '/admin/return-exchange', label: 'Returns', icon: <RefreshCcw size={18} /> },
  { path: '/admin/users', label: 'Users', icon: <Users size={18} /> },
  { path: '/admin/payments', label: 'Payments', icon: <CreditCard size={18} /> },
  { path: '/admin/complaints', label: 'Complaints', icon: <MessageCircleWarning size={18} /> },
  { path: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <div className="sidebar-logo-circle">A</div>
            {isOpen && (
              <div className="sidebar-brand">
                <span className="sidebar-brand-name">Aaradhana</span>
                <span className="sidebar-brand-sub">Admin Panel</span>
              </div>
            )}
          </div>
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={!isOpen ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {isOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {isOpen && (
          <div className="sidebar-footer">
            <div className="sidebar-footer-text">Aaradhana © 2025</div>
          </div>
        )}
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}
    </>
  );
};

export default Sidebar;