import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Input, Modal } from '../../shared';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1-201-555-0124', orders: 5, totalSpent: 1250.50, joinDate: '2024-01-15', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1-201-555-0125', orders: 3, totalSpent: 450.00, joinDate: '2024-02-20', status: 'active' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '+1-201-555-0126', orders: 12, totalSpent: 3890.00, joinDate: '2023-12-01', status: 'active' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', phone: '+1-201-555-0127', orders: 0, totalSpent: 0, joinDate: '2024-03-01', status: 'inactive' },
  ]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Users Management"
        subtitle="Manage customer accounts and profiles"
      />

      {/* Search Bar */}
      <Card className="mb-6">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Card>

      {/* Users Table */}
      <Card>
        <Table
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'email', label: 'Email', sortable: true },
            { key: 'phone', label: 'Phone', sortable: true },
            { key: 'orders', label: 'Orders', sortable: true },
            { key: 'totalSpent', label: 'Total Spent', sortable: true, render: (val) => `$${val.toFixed(2)}` },
            { key: 'joinDate', label: 'Join Date', sortable: true },
            {
              key: 'status',
              label: 'Status',
              render: (status) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {status === 'active' ? 'Active' : 'Inactive'}
                </span>
              )
            },
            {
              key: 'id',
              label: 'Actions',
              render: (id, row) => (
                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(row)}>
                  <Eye size={16} />
                  View
                </Button>
              )
            },
          ]}
          data={filteredUsers}
        />
      </Card>

      {/* User Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedUser(null);
        }}
        title={`User: ${selectedUser?.name}`}
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Join Date</p>
                <p className="text-lg font-semibold text-gray-900">{selectedUser.joinDate}</p>
              </div>
            </div>
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Purchase History</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedUser.orders}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold text-green-600">${selectedUser.totalSpent.toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Avg Order Value</p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${selectedUser.orders > 0 ? (selectedUser.totalSpent / selectedUser.orders).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
