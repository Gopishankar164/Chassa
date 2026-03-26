import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Input, Select, Modal, ConfirmModal } from '../../shared';
import { Plus, Edit2, Trash2, Filter, Download } from 'lucide-react';

const OrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [orders, setOrders] = useState([
    { id: '#ORD001', customer: 'John Doe', email: 'john@example.com', items: 3, total: 250.50, status: 'delivered', date: '2024-03-25' },
    { id: '#ORD002', customer: 'Jane Smith', email: 'jane@example.com', items: 1, total: 150.00, status: 'processing', date: '2024-03-25' },
    { id: '#ORD003', customer: 'Mike Johnson', email: 'mike@example.com', items: 5, total: 890.00, status: 'pending', date: '2024-03-24' },
    { id: '#ORD004', customer: 'Sarah Williams', email: 'sarah@example.com', items: 2, total: 420.25, status: 'delivered', date: '2024-03-24' },
    { id: '#ORD005', customer: 'Tom Brown', email: 'tom@example.com', items: 4, total: 310.75, status: 'shipped', date: '2024-03-23' },
  ]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.includes(searchTerm);
    const matchesStatus = !filterStatus || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStatus = (order, newStatus) => {
    setOrders(orders.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
  };

  const statusColor = (status) => {
    const colors = {
      pending: 'text-orange-600 bg-orange-50',
      processing: 'text-blue-600 bg-blue-50',
      shipped: 'text-purple-600 bg-purple-50',
      delivered: 'text-green-600 bg-green-50',
      cancelled: 'text-red-600 bg-red-50',
    };
    return colors[status] || colors.pending;
  };

  return (
    <div>
      <PageHeader
        title="Order Management"
        subtitle="Manage and track all customer orders"
        actions={
          <Button variant="secondary">
            <Download size={18} />
            Export
          </Button>
        }
      />

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Card>
        <Card>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'processing', label: 'Processing' },
              { value: 'shipped', label: 'Shipped' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </Card>
        <Card className="flex items-center justify-end">
          <span className="text-sm text-gray-600">{filteredOrders.length} orders found</span>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <Table
          columns={[
            { key: 'id', label: 'Order ID', sortable: true },
            { key: 'customer', label: 'Customer', sortable: true },
            { key: 'items', label: 'Items', sortable: true },
            { key: 'total', label: 'Total', sortable: true, render: (val) => `$${val.toFixed(2)}` },
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
            {
              key: 'id',
              label: 'Actions',
              render: (id, row) => (
                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(row)}>
                  View
                </Button>
              )
            },
          ]}
          data={filteredOrders}
        />
      </Card>

      {/* Order Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedOrder(null);
        }}
        title={`Order ${selectedOrder?.id}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
              <p className="text-gray-600">{selectedOrder.customer}</p>
              <p className="text-gray-600">{selectedOrder.email}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Order Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-lg font-bold text-gray-900">{selectedOrder.items}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-lg font-bold text-green-600">${selectedOrder.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Update Status</h4>
              <Select
                value={selectedOrder.status}
                onChange={(e) => handleUpdateStatus(selectedOrder, e.target.value)}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'shipped', label: 'Shipped' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderManagement;
