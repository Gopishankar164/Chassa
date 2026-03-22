import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import '../styles/Header.css';

const pageTitles = {
  '/admin/dashboard': 'Operations Dashboard',
  '/admin/products': 'Engineering Products',
  '/admin/orders': 'Client Inquiries',
  '/admin/return-exchange': 'Returns & Exchange',
  '/admin/users': 'Client Management',
  '/admin/payments': 'Payment Management',
  '/admin/complaints': 'Support Tickets',
  '/admin/settings': 'Admin Settings',
};

const Header = ({ onLogout, toggleSidebar }) => {
  const adminName = localStorage.getItem('adminName') || 'Admin';
  const adminEmail = localStorage.getItem('adminEmail') || 'admin@aaradhana.com';
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || 'Admin Panel';
  const initials = adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar} title="Toggle Sidebar">
          <Menu size={20} />
        </button>
        <div className="header-page-info">
          <h1 className="header-page-title">{pageTitle}</h1>
          <span className="header-breadcrumb">Chassa Engineering Drives · Admin</span>
        </div>
      </div>

      <div className="header-right">
        <div className="header-profile" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="header-avatar">{initials}</div>
          <div className="header-user-info">
            <span className="header-name">{adminName}</span>
            <span className="header-email">{adminEmail}</span>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout} title="Logout">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;