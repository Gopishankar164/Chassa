import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar, Button } from '../components/shared';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Users, 
  DollarSign, 
  RotateCcw, 
  MessageSquare,
  Settings,
  LogOut 
} from 'lucide-react';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const navigationItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { path: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/payments', label: 'Payments', icon: DollarSign },
    { path: '/admin/return-exchange', label: 'Returns & Exchanges', icon: RotateCcw },
    { path: '/admin/complaints', label: 'Support', icon: MessageSquare },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar items={navigationItems} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col md:ml-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Admin Dashboard</h2>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;