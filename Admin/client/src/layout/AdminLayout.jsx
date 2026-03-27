import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/shared';
import {
  LayoutDashboard, Package, ShoppingCart,
  Users, MessageSquare,
} from 'lucide-react';
import '../styles/AdminLayout.css';
import '../styles/Sidebar.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate  = useNavigate();
  const adminRole = localStorage.getItem('adminRole') || 'admin';
  const isStaff   = adminRole === 'staff';

  // ── Full navigation for admins ──────────────────────────────────────────
  const adminNav = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/products',  label: 'Products',  icon: Package         },
    { path: '/admin/orders',    label: 'Orders',    icon: ShoppingCart    },
    { path: '/admin/users',     label: 'Users',     icon: Users           },
    { path: '/admin/complaints',label: 'Support',   icon: MessageSquare   },
  ];

  // ── Limited navigation for staff ──────────────────────────────────────
  const staffNav = [
    { path: '/admin/dashboard', label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/admin/products',  label: 'Products & Stock', icon: Package         },
  ];

  const navigationItems = isStaff ? staffNav : adminNav;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminRole');
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <Sidebar items={navigationItems} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onLogout={handleLogout} />

      <div className={`admin-main ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
