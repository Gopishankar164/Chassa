import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp,
  DollarSign
} from 'lucide-react';
import {
  PageHeader,
  Card,
  StatCard,
  Table,
  Button
} from '../../../components/shared';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 45250.50,
    totalOrders: 1024,
    totalProducts: 342,
    totalUsers: 2851,
    monthlyGrowth: 12.5,
  });

  const [recentOrders, setRecentOrders] = useState([
    { id: '#ORD001', customer: 'John Doe', amount: 250.00, status: 'delivered', date: '2024-03-25' },
    { id: '#ORD002', customer: 'Jane Smith', amount: 150.50, status: 'processing', date: '2024-03-25' },
    { id: '#ORD003', customer: 'Mike Johnson', amount: 890.00, status: 'pending', date: '2024-03-24' },
    { id: '#ORD004', customer: 'Sarah Williams', amount: 420.25, status: 'delivered', date: '2024-03-24' },
  ]);

  const [chartData] = useState([
    { month: 'Jan', sales: 4000, revenue: 2400 },
    { month: 'Feb', sales: 3000, revenue: 1398 },
    { month: 'Mar', sales: 2000, revenue: 9800 },
    { month: 'Apr', sales: 2780, revenue: 3908 },
    { month: 'May', sales: 1890, revenue: 4800 },
    { month: 'Jun', sales: 2390, revenue: 3800 },
  ]);

  const statusColor = (status) => {
    const colors = {
      delivered: 'text-green-600 bg-green-50',
      processing: 'text-blue-600 bg-blue-50',
      pending: 'text-orange-600 bg-orange-50',
      cancelled: 'text-red-600 bg-red-50',
    };
    return colors[status] || colors.pending;
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's your business overview"
      />

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          trend={{ positive: true, percentage: 12.5 }}
          color="green"
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          trend={{ positive: true, percentage: 8.2 }}
          color="blue"
        />
        <StatCard
          icon={Package}
          label="Total Products"
          value={stats.totalProducts}
          trend={{ positive: false, percentage: 2.1 }}
          color="orange"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          trend={{ positive: true, percentage: 5.3 }}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Monthly Growth"
          value={`${stats.monthlyGrowth}%`}
          color="green"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card title="Sales Trend" subtitle="Last 6 months performance">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Revenue Comparison" subtitle="Sales vs Revenue">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card
        title="Recent Orders"
        subtitle="Last orders from your store"
        headerAction={
          <Button variant="secondary" size="sm">
            View All
          </Button>
        }
      >
        <Table
          columns={[
            { key: 'id', label: 'Order ID', sortable: true },
            { key: 'customer', label: 'Customer', sortable: true },
            { key: 'amount', label: 'Amount', sortable: true, render: (val) => `$${val.toFixed(2)}` },
            { 
              key: 'status', 
              label: 'Status',
              render: (status) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(status)}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              )
            },
            { key: 'date', label: 'Date', sortable: true },
          ]}
          data={recentOrders}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
