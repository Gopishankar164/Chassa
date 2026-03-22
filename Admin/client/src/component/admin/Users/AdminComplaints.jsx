import React, { useEffect, useState } from 'react';
import '../../../styles/GlobalAdmin.css';
import ADMIN_API_BASE_URL from '../../../config/api';
import { MessageCircleWarning } from 'lucide-react';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch(`${ADMIN_API_BASE_URL}/api/complaints`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => { if (!res.ok) throw new Error('Forbidden'); return res.json(); })
      .then(data => { setComplaints(data); setLoading(false); })
      .catch(err => { setComplaints([]); setLoading(false); });
  }, []);

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const statusBadge = (s) => {
    const l = (s || '').toLowerCase();
    if (l === 'open') return 'badge-red';
    if (l === 'closed') return 'badge-green';
    return 'badge-yellow';
  };

  return (
    <div className="page-wrap">
      <div className="page-header-bar">
        <div>
          <h2 className="page-heading">Support Tickets</h2>
          <p className="page-heading-sub">{complaints.length} total support requests received</p>
        </div>
      </div>

      <div className="data-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Inquiry #</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7"><div className="state-loading">Loading support tickets...</div></td></tr>
              ) : complaints.length === 0 ? (
                <tr><td colSpan="7">
                  <div className="state-empty">
                    <MessageCircleWarning size={40} />
                    <p>No support tickets — all clear! ✅</p>
                  </div>
                </td></tr>
              ) : complaints.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td style={{ color: '#6366f1', fontSize: 12 }}>{c.email}</td>
                  <td><span className="badge badge-indigo">{c.orderNumber || 'N/A'}</span></td>
                  <td style={{ fontWeight: 600 }}>{c.subject}</td>
                  <td className="msg-cell" title={c.message}>{c.message}</td>
                  <td><span className={`badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                  <td style={{ color: '#94a3b8', fontSize: 12 }}>{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminComplaints;