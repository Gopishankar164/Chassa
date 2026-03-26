import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LogOut, Menu, Bell } from 'lucide-react';
import '../styles/Header.css';

const pageTitles = {
  '/admin/dashboard':  'Dashboard',
  '/admin/products':   'Products',
  '/admin/orders':     'Orders',
  '/admin/analytics':  'Analytics',
  '/admin/users':      'User Management',
  '/admin/payments':   'Payment Management',
  '/admin/complaints': 'Support Center',
  '/admin/settings':   'Settings',
};

const pageSubs = {
  '/admin/dashboard':  'Overview · Live metrics',
  '/admin/products':   'Catalogue · Inventory',
  '/admin/orders':     'Transactions · Fulfillment',
  '/admin/analytics':  'Reports · Insights',
  '/admin/users':      'Accounts · Permissions',
  '/admin/payments':   'Finance · Billing',
  '/admin/complaints': 'Tickets · Resolution',
  '/admin/settings':   'Config · Preferences',
};

const Header = ({ onLogout, toggleSidebar }) => {
  const adminName = localStorage.getItem('adminName') || 'Admin';
  const adminEmail = localStorage.getItem('adminEmail') || 'admin@nexus.com';
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || 'Admin Panel';
  const pageSub = pageSubs[location.pathname] || 'Nexus Admin Console';
  const initials = adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar} title="Toggle Sidebar">
          <Menu size={20} />
        </button>
        <div className="header-page-info">
          <h1 className="header-page-title">{pageTitle}</h1>
          <span className="header-breadcrumb">{pageSub}</span>
        </div>
      </div>

      <div className="header-right">
        <button className="header-icon-btn" title="Notifications">
          <Bell size={17} />
          <span className="notif-dot" />
        </button>

        <div className="header-profile">
          <div className="header-avatar">{initials}</div>
          <div className="header-user-info">
            <span className="header-name">{adminName}</span>
            <span className="header-email">{adminEmail}</span>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout} title="Logout">
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
