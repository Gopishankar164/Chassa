import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal } from '../../shared';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const ReturnExchangeManagement = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [requests, setRequests] = useState([
    { id: '#REQ001', orderId: '#ORD001', customer: 'John Doe', type: 'return', reason: 'Defective Product', status: 'pending', date: '2024-03-25' },
    { id: '#REQ002', orderId: '#ORD002', customer: 'Jane Smith', type: 'exchange', reason: 'Wrong Size', status: 'approved', date: '2024-03-24' },
    { id: '#REQ003', orderId: '#ORD003', customer: 'Mike Johnson', type: 'return', reason: 'Not as Described', status: 'completed', date: '2024-03-23' },
    { id: '#REQ004', orderId: '#ORD004', customer: 'Sarah Williams', type: 'exchange', reason: 'Color Change', status: 'rejected', date: '2024-03-22' },
  ]);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  const handleStatusChange = (request, newStatus) => {
    setRequests(requests.map(r => r.id === request.id ? { ...r, status: newStatus } : r));
  };

  const statusColor = (status) => {
    const colors = {
      pending: 'text-orange-600 bg-orange-50',
      approved: 'text-blue-600 bg-blue-50',
      completed: 'text-green-600 bg-green-50',
      rejected: 'text-red-600 bg-red-50',
    };
    return colors[status] || colors.pending;
  };

  const typeColor = (type) => {
    return type === 'return' ? 'bg-red-50 text-red-700' : 'bg-purple-50 text-purple-700';
  };

  return (
    <div>
      <PageHeader
        title="Returns & Exchanges"
        subtitle="Manage customer return and exchange requests"
      />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div>
            <p className="text-sm text-gray-500">Total Requests</p>
            <p className="text-3xl font-bold text-gray-900">{requests.length}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-3xl font-bold text-orange-600">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-3xl font-bold text-blue-600">{requests.filter(r => r.status === 'approved').length}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-3xl font-bold text-green-600">{requests.filter(r => r.status === 'completed').length}</p>
          </div>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <Table
          columns={[
            { key: 'id', label: 'Request ID', sortable: true },
            { key: 'orderId', label: 'Order ID', sortable: true },
            { key: 'customer', label: 'Customer', sortable: true },
            {
              key: 'type',
              label: 'Type',
              render: (type) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColor(type)}`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              )
            },
            { key: 'reason', label: 'Reason', sortable: true },
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
          data={requests}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedRequest(null);
        }}
        title={`Request ${selectedRequest?.id}`}
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Request Type</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${typeColor(selectedRequest.type)}`}>
                  {selectedRequest.type.charAt(0).toUpperCase() + selectedRequest.type.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reason</p>
                <p className="font-semibold text-gray-900">{selectedRequest.reason}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Update Status</p>
              <select
                value={selectedRequest.status}
                onChange={(e) => handleStatusChange(selectedRequest, e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReturnExchangeManagement;
