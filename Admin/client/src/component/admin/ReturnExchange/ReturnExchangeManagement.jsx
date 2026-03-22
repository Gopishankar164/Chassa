import React, { useState, useEffect } from 'react';
import { returnExchangeService } from '../../../services/returnExchangeService';
import '../../../styles/GlobalAdmin.css';
import { RefreshCw, ArrowLeftRight } from 'lucide-react';

const ReturnExchangeManagement = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) { window.location.href = '/admin/login'; return; }
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true); setError(null);
            const data = await returnExchangeService.getAllRequests();
            setRequests(data);
        } catch { setError('Failed to load requests. Please check your connection.'); }
        finally { setLoading(false); }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await returnExchangeService.updateRequestStatus(id, status);
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        } catch { alert('Failed to update status.'); }
    };

    const statusBadge = (s) => {
        const l = (s || '').toLowerCase();
        if (l === 'approved') return 'badge-green';
        if (l === 'rejected') return 'badge-red';
        if (l === 'completed') return 'badge-blue';
        return 'badge-yellow';
    };

    return (
        <div className="page-wrap">
            <div className="page-header-bar">
                <div>
                    <h2 className="page-heading">Returns &amp; Exchange</h2>
                    <p className="page-heading-sub">{requests.length} total return/exchange requests</p>
                </div>
                <button className="btn-secondary" onClick={fetchRequests}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            <div className="data-card">
                <div className="table-scroll">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Inquiry Ref</th>
                                <th>Client</th>
                                <th>Type</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8"><div className="state-loading">Loading return requests...</div></td></tr>
                            ) : error ? (
                                <tr><td colSpan="8">
                                    <div className="state-error">
                                        <p>{error}</p>
                                        <button className="btn-primary" onClick={fetchRequests}>Retry</button>
                                    </div>
                                </td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan="8">
                                    <div className="state-empty"><ArrowLeftRight size={40} /><p>No return / exchange requests</p></div>
                                </td></tr>
                            ) : requests.map(req => (
                                <tr key={req.id}>
                                    <td><span style={{ color: '#6366f1', fontWeight: 700 }}>#{req.id.toString().slice(-6)}</span></td>
                                    <td><span className="badge badge-indigo">#{req.orderId}</span></td>
                                    <td><strong>{req.customerName || 'N/A'}</strong></td>
                                    <td>
                                        <span className={`badge ${req.requestType?.toLowerCase() === 'return' ? 'badge-red' : 'badge-blue'}`}>
                                            {req.requestType?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="reason-text" title={req.reason}>{req.reason}</td>
                                    <td><span className={`badge ${statusBadge(req.status)}`}>{req.status}</span></td>
                                    <td style={{ color: '#94a3b8', fontSize: 12 }}>
                                        {new Date(req.createdAt).toLocaleDateString('en-IN')}
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            {req.status === 'PENDING' && (<>
                                                <button className="btn-edit" style={{ fontSize: 12, padding: '6px 12px', background: '#ecfdf5', color: '#059669', borderColor: '#d1fae5' }}
                                                    onClick={() => handleUpdateStatus(req.id, 'APPROVED')}>Approve</button>
                                                <button className="btn-danger" style={{ fontSize: 12, padding: '6px 12px' }}
                                                    onClick={() => handleUpdateStatus(req.id, 'REJECTED')}>Reject</button>
                                            </>)}
                                            {req.status === 'APPROVED' && (
                                                <button className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}
                                                    onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}>Complete</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReturnExchangeManagement;
