import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input, Textarea } from '../../shared';
import { MessageSquare, Reply, Archive } from 'lucide-react';

const AdminComplaints = () => {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  const [complaints, setComplaints] = useState([
    { id: '#CMP001', customer: 'John Doe', subject: 'Damaged Package', priority: 'high', status: 'open', date: '2024-03-25', message: 'Received damaged product.' },
    { id: '#CMP002', customer: 'Jane Smith', subject: 'Wrong Item Shipped', priority: 'high', status: 'open', date: '2024-03-25', message: 'Got completely wrong item.' },
    { id: '#CMP003', customer: 'Mike Johnson', subject: 'Late Delivery', priority: 'medium', status: 'resolved', date: '2024-03-24', message: 'Delivery took too long.' },
    { id: '#CMP004', customer: 'Sarah Williams', subject: 'Quality Issue', priority: 'low', status: 'resolved', date: '2024-03-23', message: 'Product quality below expectation.' },
  ]);

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailsModalOpen(true);
  };

  const handleReply = () => {
    if (replyText.trim()) {
      setComplaints(complaints.map(c =>
        c.id === selectedComplaint.id ? { ...c, status: 'resolved' } : c
      ));
      setReplyText('');
      setIsDetailsModalOpen(false);
    }
  };

  const priorityColor = (priority) => {
    const colors = {
      high: 'text-red-600 bg-red-50',
      medium: 'text-orange-600 bg-orange-50',
      low: 'text-green-600 bg-green-50',
    };
    return colors[priority] || colors.low;
  };

  const statusColor = (status) => {
    const colors = {
      open: 'text-blue-600 bg-blue-50',
      resolved: 'text-green-600 bg-green-50',
      closed: 'text-gray-600 bg-gray-50',
    };
    return colors[status] || colors.open;
  };

  return (
    <div>
      <PageHeader
        title="Support & Complaints"
        subtitle="Handle customer complaints and support tickets"
      />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <div>
            <p className="text-sm text-gray-500">Total Complaints</p>
            <p className="text-3xl font-bold text-gray-900">{complaints.length}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm text-gray-500">Open Issues</p>
            <p className="text-3xl font-bold text-blue-600">{complaints.filter(c => c.status === 'open').length}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm text-gray-500">High Priority</p>
            <p className="text-3xl font-bold text-red-600">{complaints.filter(c => c.priority === 'high').length}</p>
          </div>
        </Card>
        <Card>
          <div>
            <p className="text-sm text-gray-500">Resolved</p>
            <p className="text-3xl font-bold text-green-600">{complaints.filter(c => c.status === 'resolved').length}</p>
          </div>
        </Card>
      </div>

      {/* Complaints Table */}
      <Card>
        <Table
          columns={[
            { key: 'id', label: 'Complaint ID', sortable: true },
            { key: 'customer', label: 'Customer', sortable: true },
            { key: 'subject', label: 'Subject', sortable: true },
            {
              key: 'priority',
              label: 'Priority',
              render: (priority) => (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityColor(priority)}`}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </span>
              )
            },
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
                  <Reply size={16} />
                  Reply
                </Button>
              )
            },
          ]}
          data={complaints}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedComplaint(null);
          setReplyText('');
        }}
        title={`${selectedComplaint?.subject} (${selectedComplaint?.id})`}
        size="lg"
      >
        {selectedComplaint && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Customer Message</p>
              <p className="p-4 bg-gray-50 rounded-lg text-gray-700">{selectedComplaint.message}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${priorityColor(selectedComplaint.priority)}`}>
                  {selectedComplaint.priority.charAt(0).toUpperCase() + selectedComplaint.priority.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColor(selectedComplaint.status)}`}>
                  {selectedComplaint.status.charAt(0).toUpperCase() + selectedComplaint.status.slice(1)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Your Reply</p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => {
                setIsDetailsModalOpen(false);
                setSelectedComplaint(null);
                setReplyText('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleReply}>
                <Reply size={18} />
                Send Reply
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminComplaints;
