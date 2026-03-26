import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart2,
  Users, MessageCircleWarning, CreditCard, Settings
} from 'lucide-react';
import '../styles/Sidebar.css';

const menuItems = [
  { path: '/admin/dashboard',  label: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
  { path: '/admin/products',   label: 'Products',     icon: <Package size={18} /> },
  { path: '/admin/orders',     label: 'Orders',       icon: <ShoppingCart size={18} /> },
  { path: '/admin/analytics',  label: 'Analytics',    icon: <BarChart2 size={18} /> },
  { path: '/admin/users',      label: 'Users',        icon: <Users size={18} /> },
  { path: '/admin/payments',   label: 'Payments',     icon: <CreditCard size={18} /> },
  { path: '/admin/complaints', label: 'Support',      icon: <MessageCircleWarning size={18} /> },
  { path: '/admin/settings',   label: 'Settings',     icon: <Settings size={18} /> },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <div className="sidebar-logo-circle">
              {/* Hexagonal logo mark */}
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 3L24 8.5V19.5L14 25L4 19.5V8.5L14 3Z"
                  stroke="#34D399" strokeWidth="1.5" fill="rgba(52,211,153,0.12)"
                />
                <circle cx="14" cy="14" r="2.5" fill="#34D399" />
                <line x1="14" y1="8" x2="14" y2="11" stroke="#34D399" strokeWidth="1.2" />
                <line x1="14" y1="17" x2="14" y2="20" stroke="#34D399" strokeWidth="1.2" />
              </svg>
            </div>
            {isOpen && (
              <div className="sidebar-brand">
                <span className="sidebar-brand-name">NEXUS</span>
                <span className="sidebar-brand-sub">ADMIN CONSOLE</span>
              </div>
            )}
          </div>
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {isOpen && <div className="nav-section-label">Main</div>}
          {menuItems.slice(0, 4).map((item) => (
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

          {isOpen && <div className="nav-section-label">Manage</div>}
          {menuItems.slice(4).map((item) => (
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
            <div className="sidebar-footer-text">NEXUS PANEL · v2.0</div>
          </div>
        )}
      </aside>
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}
    </>
  );
};

export default Sidebar;
