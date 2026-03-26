import React, { useState } from 'react';
import { PageHeader, Card, Table, Button } from '../../shared';
import { Download, Filter } from 'lucide-react';

const PaymentManagement = () => {
  const [filterStatus, setFilterStatus] = useState('all');

  const [payments, setPayments] = useState([
    { id: '#PAY001', orderId: '#ORD001', customer: 'John Doe', amount: 250.50, method: 'Credit Card', status: 'completed', date: '2024-03-25' },
    { id: '#PAY002', orderId: '#ORD002', customer: 'Jane Smith', amount: 150.00, method: 'PayPal', status: 'completed', date: '2024-03-25' },
    { id: '#PAY003', orderId: '#ORD003', customer: 'Mike Johnson', amount: 890.00, method: 'Bank Transfer', status: 'pending', date: '2024-03-24' },
    { id: '#PAY004', orderId: '#ORD004', customer: 'Sarah Williams', amount: 420.25, method: 'Credit Card', status: 'completed', date: '2024-03-24' },
    { id: '#PAY005', orderId: '#ORD005', customer: 'Tom Brown', amount: 310.75, method: 'Debit Card', status: 'failed', date: '2024-03-23' },
  ]);

  const filteredPayments = filterStatus === 'all' 
    ? payments 
    : payments.filter(p => p.status === filterStatus);

  const totalRevenue = filteredPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const completedCount = filteredPayments.filter(p => p.status === 'completed').length;
  const pendingCount = filteredPayments.filter(p => p.status === 'pending').length;

  const statusColor = (status) => {
    const colors = {
      completed: 'text-green-600 bg-green-50',
      pending: 'text-orange-600 bg-orange-50',
      failed: 'text-red-600 bg-red-50',
    };
    return colors[status] || colors.pending;
  };

  return (
    <div>
      <PageHeader
        title="Payment Management"
        subtitle="Track and manage all transactions"
        actions={
          <Button variant="secondary">
            <Download size={18} />
            Export Report
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm text-gray-500">Completed Payments</p>
            <p className="text-3xl font-bold text-green-600">{completedCount}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm text-gray-500">Pending Payments</p>
            <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="text-3xl font-bold text-blue-600">{filteredPayments.length}</p>
          </div>
        </Card>
      </div>

      {/* Status Filter */}
      <Card className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            All Payments
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('failed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Failed
          </button>
        </div>
      </Card>

      {/* Payments Table */}
      <Card>
        <Table
          columns={[
            { key: 'id', label: 'Payment ID', sortable: true },
            { key: 'orderId', label: 'Order ID', sortable: true },
            { key: 'customer', label: 'Customer', sortable: true },
            { key: 'amount', label: 'Amount', sortable: true, render: (val) => `$${val.toFixed(2)}` },
            { key: 'method', label: 'Method', sortable: true },
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
          data={filteredPayments}
        />
      </Card>
    </div>
  );
};

export default PaymentManagement;
