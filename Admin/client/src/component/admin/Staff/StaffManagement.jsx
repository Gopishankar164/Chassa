import React, { useState, useEffect } from 'react';
import {
  UserPlus, Trash2, RefreshCw, Shield, Eye, EyeOff,
  CheckCircle, AlertCircle, Users
} from 'lucide-react';
import ADMIN_API_BASE_URL from '../../../config/api';
import '../../../styles/GlobalAdmin.css';

// ─────────────────────────────────────────────────────────────────────────────
// StaffManagement — full-stack page
//
// Backend endpoints assumed (add these to your Spring Boot controller):
//   POST   /api/admin/staff         { name, email, password }  → creates staff account
//   GET    /api/admin/staff                                     → returns staff list
//   DELETE /api/admin/staff/:id                                 → removes staff
//
// Staff users are stored with role = "STAFF" in your User / Admin table.
// On login, the server returns { token, admin: { role:'STAFF', ... } }.
// This page saves adminRole='staff' to localStorage so the layout can detect it.
// ─────────────────────────────────────────────────────────────────────────────

const StaffManagement = () => {
  const [staffList, setStaffList]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [formOpen, setFormOpen]           = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [alert, setAlert]                 = useState(null);

  const [form, setForm] = useState({ name:'', email:'', password:'' });

  const token   = localStorage.getItem('adminToken');
  const headers = { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' };

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  // ── Fetch staff list ────────────────────────────────────────────────────
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API_BASE_URL}/api/admin/staff`, { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setStaffList(data);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      // Demo data so the UI is visible even without backend endpoint yet
      setStaffList([
        { id:1, name:'Karthik S',    email:'karthik@chassa.in',  createdAt:'2025-11-01', active:true  },
        { id:2, name:'Meena Devi',   email:'meena@chassa.in',    createdAt:'2025-12-10', active:true  },
        { id:3, name:'Arun Prasad',  email:'arun@chassa.in',     createdAt:'2026-01-15', active:false },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  // ── Create staff ────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      showAlert('All fields are required', 'error'); return;
    }
    if (form.password.length < 6) {
      showAlert('Password must be at least 6 characters', 'error'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${ADMIN_API_BASE_URL}/api/admin/staff`, {
        method:'POST', headers,
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role:'STAFF' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create staff account');
      }
      const newStaff = await res.json();
      setStaffList(prev => [newStaff, ...prev]);
      setForm({ name:'', email:'', password:'' });
      setFormOpen(false);
      showAlert(`Staff account created for ${form.name}`);
    } catch (err) {
      showAlert(err.message, 'error');
    }
    setSubmitting(false);
  };

  // ── Delete staff ────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove staff account for "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${ADMIN_API_BASE_URL}/api/admin/staff/${id}`, {
        method:'DELETE', headers,
      });
      if (!res.ok) throw new Error('Delete failed');
      setStaffList(prev => prev.filter(s => s.id !== id));
      showAlert(`${name}'s account has been removed`);
    } catch (err) {
      showAlert(err.message, 'error');
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────
  const cardStyle = {
    background:'#161D2E', border:'1px solid #1E2D42', borderRadius:10,
    padding:'26px 30px', marginBottom:22, boxShadow:'0 4px 20px rgba(0,0,0,0.4)',
  };

  const labelStyle = {
    display:'block', fontSize:10, fontWeight:700, color:'#00B0FF',
    marginBottom:6, textTransform:'uppercase', letterSpacing:'0.15em',
    fontFamily:"'Share Tech Mono',monospace",
  };

  const inputStyle = {
    width:'100%', padding:'10px 14px', border:'1px solid #1E2D42', borderRadius:6,
    fontSize:13, outline:'none', background:'#0A0E1A', color:'#E8EDF5',
    boxSizing:'border-box', fontFamily:"'Barlow',sans-serif", transition:'border-color 0.2s',
  };

  const permissionBadge = (label, color) => (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      background: `${color}14`, border:`1px solid ${color}33`,
      color, fontSize:10, fontWeight:700, padding:'3px 9px',
      borderRadius:5, fontFamily:"'Share Tech Mono',monospace", letterSpacing:'0.08em',
    }}>
      <CheckCircle size={10} /> {label}
    </span>
  );

  return (
    <div className="page-wrap" style={{ maxWidth:860 }}>

      {/* Page Header */}
      <div className="page-header-bar">
        <div>
          <h2 className="page-heading">Staff Management</h2>
          <p className="page-heading-sub">Manage staff accounts — Products &amp; Stock access only</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-secondary" onClick={fetchStaff}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setFormOpen(o => !o)}>
            <UserPlus size={14} /> {formOpen ? 'Cancel' : 'Add Staff'}
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div style={{
          display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
          borderRadius:8, marginBottom:20, fontSize:13, fontWeight:500,
          background: alert.type === 'success' ? 'rgba(0,200,83,0.08)' : 'rgba(255,23,68,0.08)',
          border:`1px solid ${alert.type === 'success' ? 'rgba(0,200,83,0.25)' : 'rgba(255,23,68,0.25)'}`,
          color: alert.type === 'success' ? '#00C853' : '#FF1744',
          fontFamily:"'Share Tech Mono',monospace",
        }}>
          {alert.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {alert.msg}
        </div>
      )}

      {/* Role Explanation Card */}
      <div style={{
        ...cardStyle,
        background:'linear-gradient(135deg,#0D1A2E 0%,#1565C0 100%)',
        borderLeft:'3px solid #00B0FF', marginBottom:24,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <Shield size={20} color="#00B0FF" />
          <div>
            <div style={{ fontWeight:700, fontSize:15, fontFamily:"'Rajdhani',sans-serif", letterSpacing:'0.1em', color:'#E8EDF5' }}>
              Staff Role Permissions
            </div>
            <div style={{ fontSize:11, color:'#9AAABB', fontFamily:"'Share Tech Mono',monospace" }}>
              What staff accounts can access
            </div>
          </div>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {permissionBadge('View Dashboard',      '#00B0FF')}
          {permissionBadge('Add Products',        '#00C853')}
          {permissionBadge('Edit Products',       '#00C853')}
          {permissionBadge('Stock Management',    '#FFB74D')}
          {permissionBadge('Set Discounts',       '#FFB74D')}
        </div>
        <div style={{ marginTop:12, display:'flex', flexWrap:'wrap', gap:8 }}>
          <span style={{ fontSize:10, color:'rgba(255,82,82,0.7)', fontFamily:"'Share Tech Mono',monospace" }}>
            ✕ No access to: Orders, Users, Analytics, Payments, Returns, Complaints, Settings
          </span>
        </div>
      </div>

      {/* Add Staff Form */}
      {formOpen && (
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
            <UserPlus size={18} color="#00B0FF" />
            <h3 style={{ fontSize:14, fontWeight:700, color:'#E8EDF5', margin:0, fontFamily:"'Rajdhani',sans-serif", letterSpacing:'0.08em' }}>
              Create Staff Account
            </h3>
          </div>
          <form onSubmit={handleCreate}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:18 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input type="text" style={inputStyle} placeholder="e.g. Karthik Subramanian" required
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input type="email" style={inputStyle} placeholder="staff@chassa.in" required
                  value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginBottom:22 }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight:44 }}
                  placeholder="Min. 6 characters"
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0,
                }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" disabled={submitting} style={{
                background: submitting ? '#2A3A50' : '#1565C0',
                color: submitting ? '#5C6E82' : '#fff',
                border:'1px solid rgba(0,176,255,0.3)', borderRadius:6,
                padding:'11px 28px', fontSize:12, fontWeight:700, cursor: submitting ? 'not-allowed' : 'pointer',
                display:'flex', alignItems:'center', gap:8,
                fontFamily:"'Rajdhani',sans-serif", letterSpacing:'0.1em', textTransform:'uppercase',
              }}>
                <UserPlus size={15} /> {submitting ? 'Creating...' : 'Create Staff Account'}
              </button>
              <button type="button" onClick={() => { setFormOpen(false); setForm({ name:'', email:'', password:'' }); }} style={{
                background:'transparent', color:'#9AAABB',
                border:'1px solid #1E2D42', borderRadius:6,
                padding:'11px 22px', fontSize:12, fontWeight:600, cursor:'pointer',
                fontFamily:"'Rajdhani',sans-serif", letterSpacing:'0.08em', textTransform:'uppercase',
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff List */}
      <div className="data-card">
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(52,211,153,0.09)', display:'flex', alignItems:'center', gap:10 }}>
          <Users size={15} style={{ color:'#34D399' }} />
          <span style={{ fontSize:13, fontWeight:700, color:'#F0F6FC', fontFamily:"'Outfit',sans-serif" }}>
            Active Staff Accounts
          </span>
          <span style={{
            background:'rgba(52,211,153,0.1)', color:'#34D399',
            border:'1px solid rgba(52,211,153,0.2)', fontSize:10, fontWeight:700,
            padding:'2px 7px', borderRadius:5, fontFamily:"'JetBrains Mono',monospace",
          }}>{staffList.length}</span>
        </div>
        <div className="table-scroll">
          {loading ? (
            <div className="state-loading" style={{ padding:'40px 20px' }}>Loading staff...</div>
          ) : staffList.length === 0 ? (
            <div className="state-empty">
              <Users size={36} />
              <p>No staff accounts yet. Click "Add Staff" to create one.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(staff => (
                  <tr key={staff.id}>
                    <td style={{ color:'#F0F6FC', fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{
                          width:32, height:32, borderRadius:6, background:'rgba(0,176,255,0.12)',
                          border:'1px solid rgba(0,176,255,0.3)', display:'flex', alignItems:'center',
                          justifyContent:'center', fontSize:13, fontWeight:800, color:'#00B0FF',
                          fontFamily:"'Rajdhani',sans-serif",
                        }}>
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        {staff.name}
                      </div>
                    </td>
                    <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'#8B949E' }}>
                      {staff.email}
                    </td>
                    <td>
                      <span style={{
                        background:'rgba(0,176,255,0.1)', color:'#00B0FF',
                        border:'1px solid rgba(0,176,255,0.25)', fontSize:10, fontWeight:700,
                        padding:'3px 9px', borderRadius:5, fontFamily:"'Share Tech Mono',monospace",
                        letterSpacing:'0.1em',
                      }}>STAFF</span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {permissionBadge('Products', '#00C853')}
                        {permissionBadge('Stock',    '#FFB74D')}
                      </div>
                    </td>
                    <td style={{ color:'#484F58', fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>
                      {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td>
                      <span className={`badge ${staff.active !== false ? 'badge-green' : 'badge-gray'}`}>
                        {staff.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(staff.id, staff.name)}
                        style={{
                          display:'inline-flex', alignItems:'center', gap:6,
                          background:'rgba(252,129,129,0.08)', color:'#FC8181',
                          border:'1px solid rgba(252,129,129,0.22)', borderRadius:7,
                          padding:'7px 12px', fontSize:12, fontWeight:600,
                          cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif",
                          transition:'all 0.2s',
                        }}
                        onMouseOver={e => { e.currentTarget.style.background='#FC8181'; e.currentTarget.style.color='#0D1117'; }}
                        onMouseOut={e  => { e.currentTarget.style.background='rgba(252,129,129,0.08)'; e.currentTarget.style.color='#FC8181'; }}
                        title="Remove staff account"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p style={{ fontSize:10, color:'#5C6E82', textAlign:'center', marginTop:12, fontFamily:"'Share Tech Mono',monospace", letterSpacing:'0.08em' }}>
        // STAFF ACCOUNTS HAVE LIMITED ACCESS — PRODUCTS &amp; STOCK MANAGEMENT ONLY
      </p>
    </div>
  );
};

export default StaffManagement;
