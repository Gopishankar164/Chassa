import React, { useState } from 'react';
import { PageHeader, Card, Table, Button } from '../../../components/shared';
import { Download, TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Analytics = () => {
  const [dateRange, setDateRange] = useState('30days');

  // Sample analytics data
  const revenueData = [
    { date: 'Mar 1', revenue: 4000, orders: 24, customers: 120 },
    { date: 'Mar 5', revenue: 3000, orders: 18, customers: 95 },
    { date: 'Mar 10', revenue: 2000, orders: 30, customers: 110 },
    { date: 'Mar 15', revenue: 2780, orders: 20, customers: 105 },
    { date: 'Mar 20', revenue: 1890, orders: 28, customers: 98 },
    { date: 'Mar 25', revenue: 2390, orders: 35, customers: 140 },
  ];

  const categoryData = [
    { name: 'Electronics', value: 4500 },
    { name: 'Accessories', value: 3200 },
    { name: 'Clothing', value: 2800 },
    { name: 'Home & Garden', value: 2100 },
    { name: 'Sports', value: 1900 },
  ];

  const topProducts = [
    { id: 1, name: 'Wireless Headphones', sales: 342, revenue: 27360, rating: 4.8 },
    { id: 2, name: 'Phone Case', sales: 521, revenue: 10419, rating: 4.5 },
    { id: 3, name: 'USB-C Cable', sales: 418, revenue: 5434, rating: 4.6 },
    { id: 4, name: 'Screen Protector', sales: 290, revenue: 2891, rating: 4.3 },
    { id: 5, name: 'Laptop Stand', sales: 156, revenue: 4992, rating: 4.9 },
  ];

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const stats = [
    { label: 'Total Revenue', value: '$47,574', change: '+12.5%', color: 'green', icon: DollarSign },
    { label: 'Total Orders', value: '1,247', change: '+8.2%', color: 'blue', icon: ShoppingCart },
    { label: 'Unique Customers', value: '891', change: '+5.3%', color: 'purple', icon: Users },
    { label: 'Avg Order Value', value: '$38.15', change: '+3.2%', color: 'orange', icon: TrendingUp },
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Reports & Insights — Track your business performance"
        actions={
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>
            <Button variant="secondary">
              <Download size={18} />
              Export
            </Button>
          </div>
        }
      />

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const colorClasses = {
            green: 'text-green-600 bg-green-50',
            blue: 'text-blue-600 bg-blue-50',
            purple: 'text-purple-600 bg-purple-50',
            orange: 'text-orange-600 bg-orange-50',
          };
          return (
            <Card key={idx}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="mt-1 text-sm font-medium text-green-600">{stat.change} from last period</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="lg:col-span-2">
          <Card title="Revenue Trend" subtitle="Daily revenue over selected period">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Category Distribution */}
        <Card title="Sales by Category" subtitle="Revenue distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Orders & Customers Trend */}
        <Card title="Orders & Customers" subtitle="Daily metrics comparison">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#3b82f6" />
              <Bar dataKey="customers" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Metrics */}
        <Card title="Performance Metrics" subtitle="Key business indicators">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Conversion Rate</span>
              <span className="font-bold text-blue-600">3.24%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">Customer Retention</span>
              <span className="font-bold text-green-600">68.5%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-gray-700">Refund Rate</span>
              <span className="font-bold text-orange-600">2.1%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-gray-700">Avg Session Duration</span>
              <span className="font-bold text-purple-600">4m 32s</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-gray-700">Cart Abandonment Rate</span>
              <span className="font-bold text-red-600">18.7%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Products */}
      <Card title="Top Selling Products" subtitle="Best performing products by revenue">
        <Table
          columns={[
            { key: 'name', label: 'Product Name', sortable: true },
            { key: 'sales', label: 'Units Sold', sortable: true },
            { key: 'revenue', label: 'Revenue', sortable: true, render: (val) => `$${val.toLocaleString()}` },
            { key: 'rating', label: 'Rating', sortable: true, render: (val) => `${val.toFixed(1)} ⭐` },
          ]}
          data={topProducts}
        />
      </Card>
    </div>
  );
};

export default Analytics;
