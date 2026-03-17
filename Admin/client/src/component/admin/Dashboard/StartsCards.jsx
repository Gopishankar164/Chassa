import React from 'react';
import { DollarSign, Package, Users, ShoppingCart, AlertTriangle } from 'lucide-react';
import '../../../styles/Dashboard.css';

const StatsCards = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Revenue */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100">Total Revenue</p>
            <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
          </div>
          <DollarSign className="w-8 h-8 text-blue-200" />
        </div>
      </div>
      {/* Products */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100">Products</p>
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
          </div>
          <Package className="w-8 h-8 text-green-200" />
        </div>
      </div>
      {/* Users */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100">Users</p>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </div>
          <Users className="w-8 h-8 text-purple-200" />
        </div>
      </div>
      {/* Total Orders */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100">Total Orders</p>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </div>
          <ShoppingCart className="w-8 h-8 text-orange-200" />
        </div>
      </div>
      {/* Pending Orders */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100">Pending Orders</p>
            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-200" />
        </div>
      </div>
    </div>
  );
};

export default StatsCards;