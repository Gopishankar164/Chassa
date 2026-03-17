import React, { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import ADMIN_API_BASE_URL from '../../../config/api';
import '../../../styles/GlobalAdmin.css';

const AdminSettings = () => {
  const adminEmail = localStorage.getItem('adminEmail') || '';
  const adminName = localStorage.getItem('adminName') || 'Admin';

  // Change Email state
  const [emailForm, setEmailForm] = useState({ currentPassword: '', newEmail: '', confirmEmail: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState(null);

  // Change Password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const token = localStorage.getItem('adminToken');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const showMsg = (setter, msg, type = 'success') => {
    setter({ msg, type });
    setTimeout(() => setter(null), 4000);
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    if (emailForm.newEmail !== emailForm.confirmEmail) {
      showMsg(setEmailMsg, 'New emails do not match', 'error'); return;
    }
    if (!emailForm.newEmail.includes('@')) {
      showMsg(setEmailMsg, 'Please enter a valid email address', 'error'); return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch(`${ADMIN_API_BASE_URL}/api/auth/admin/change-email`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ currentPassword: emailForm.currentPassword, newEmail: emailForm.newEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminEmail', emailForm.newEmail);
        setEmailForm({ currentPassword: '', newEmail: '', confirmEmail: '' });
        showMsg(setEmailMsg, 'Email updated successfully! Please log in again.', 'success');
        setTimeout(() => { localStorage.removeItem('adminToken'); window.location.href = '/admin/login'; }, 2500);
      } else {
        showMsg(setEmailMsg, data.message || 'Failed to update email', 'error');
      }
    } catch {
      showMsg(setEmailMsg, 'Network error. Please try again.', 'error');
    }
    setEmailLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showMsg(setPwMsg, 'New passwords do not match', 'error'); return;
    }
    if (pwForm.newPassword.length < 6) {
      showMsg(setPwMsg, 'New password must be at least 6 characters', 'error'); return;
    }
    setPwLoading(true);
    try {
      const res = await fetch(`${ADMIN_API_BASE_URL}/api/auth/admin/change-password`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showMsg(setPwMsg, 'Password updated successfully! Please log in again.', 'success');
        setTimeout(() => { localStorage.removeItem('adminToken'); window.location.href = '/admin/login'; }, 2500);
      } else {
        showMsg(setPwMsg, data.message || 'Failed to update password', 'error');
      }
    } catch {
      showMsg(setPwMsg, 'Network error. Please try again.', 'error');
    }
    setPwLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1px solid #1E2D42', borderRadius: 6,
    fontSize: 13, outline: 'none',
    background: '#0A0E1A', color: '#E8EDF5',
    boxSizing: 'border-box',
    fontFamily: "'Barlow', sans-serif", transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 700,
    color: '#00B0FF', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.15em',
    fontFamily: "'Share Tech Mono', monospace"
  };

  const Alert = ({ data }) => data ? (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
      borderRadius: 6, marginBottom: 20, fontSize: 13, fontWeight: 500,
      background: data.type === 'success' ? 'rgba(0,200,83,0.08)' : 'rgba(255,23,68,0.08)',
      border: `1px solid ${data.type === 'success' ? 'rgba(0,200,83,0.25)' : 'rgba(255,23,68,0.25)'}`,
      color: data.type === 'success' ? '#00C853' : '#FF1744',
      fontFamily: "'Share Tech Mono', monospace",
    }}>
      {data.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {data.msg}
    </div>
  ) : null;

  const PwInput = ({ label, field, form, setForm, show, setShow }) => (
    <div style={{ marginBottom: 18 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={form[field]}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          style={{ ...inputStyle, paddingRight: 44 }}
          required
        />
        <button type="button" onClick={() => setShow(!show)}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  const cardStyle = {
    background: '#161D2E',
    border: '1px solid #1E2D42',
    borderRadius: 8,
    padding: '28px 32px', marginBottom: 24,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  };

  const submitBtn = (loading) => ({
    background: loading ? '#2A3A50' : '#1565C0',
    color: loading ? '#5C6E82' : '#fff',
    border: '1px solid rgba(0,176,255,0.3)',
    borderRadius: 6, padding: '11px 28px',
    fontSize: 12, fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 8,
    transition: 'all 0.2s',
    fontFamily: "'Rajdhani', sans-serif",
    letterSpacing: '0.1em', textTransform: 'uppercase',
  });

  return (
    <div className="page-wrap" style={{ maxWidth: 640 }}>
      {/* Page Header */}
      <div className="page-header-bar">
        <div>
          <h2 className="page-heading">Settings</h2>
          <p className="page-heading-sub">Manage your admin account credentials</p>
        </div>
      </div>

      {/* Current Account Info */}
      <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #0D1A2E 0%, #1565C0 100%)', borderLeft: '3px solid #00B0FF', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 6, background: 'rgba(0,176,255,0.15)', border: '1px solid rgba(0,176,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, fontFamily: "'Rajdhani', sans-serif", color: '#00B0FF' }}>
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.1em', color: '#E8EDF5' }}>{adminName}</div>
            <div style={{ fontSize: 12, marginTop: 2, color: '#00B0FF', fontFamily: "'Share Tech Mono', monospace" }}>{adminEmail}</div>
            <div style={{ fontSize: 10, marginTop: 3, color: '#5C6E82', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '0.1em' }}>⚙ CHASSA ENGINEERING DRIVES — ADMINISTRATOR</div>
          </div>
        </div>
      </div>

      {/* Change Email */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(0,176,255,0.1)', border: '1px solid rgba(0,176,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={18} color="#00B0FF" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF5', margin: 0, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em' }}>Change Email</h3>
            <p style={{ fontSize: 11, color: '#5C6E82', margin: 0, fontFamily: "'Share Tech Mono', monospace" }}>Update your admin login email</p>
          </div>
        </div>

        <Alert data={emailMsg} />

        <form onSubmit={handleChangeEmail}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Current Password</label>
            <input type="password" value={emailForm.currentPassword}
              onChange={e => setEmailForm(p => ({ ...p, currentPassword: e.target.value }))}
              style={inputStyle} required placeholder="Enter current password" />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>New Email</label>
            <input type="email" value={emailForm.newEmail}
              onChange={e => setEmailForm(p => ({ ...p, newEmail: e.target.value }))}
              style={inputStyle} required placeholder="Enter new email address" />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Confirm New Email</label>
            <input type="email" value={emailForm.confirmEmail}
              onChange={e => setEmailForm(p => ({ ...p, confirmEmail: e.target.value }))}
              style={inputStyle} required placeholder="Confirm new email address" />
          </div>
          <button type="submit" disabled={emailLoading} style={submitBtn(emailLoading)}>
            <Mail size={15} /> {emailLoading ? 'Updating...' : 'Update Email'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(0,176,255,0.1)', border: '1px solid rgba(0,176,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={18} color="#00B0FF" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF5', margin: 0, fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em' }}>Change Password</h3>
            <p style={{ fontSize: 11, color: '#5C6E82', margin: 0, fontFamily: "'Share Tech Mono', monospace" }}>Use a strong password (min. 6 characters)</p>
          </div>
        </div>

        <Alert data={pwMsg} />

        <form onSubmit={handleChangePassword}>
          <PwInput label="Current Password" field="currentPassword" form={pwForm} setForm={setPwForm} show={showCurrentPw} setShow={setShowCurrentPw} />
          <PwInput label="New Password" field="newPassword" form={pwForm} setForm={setPwForm} show={showNewPw} setShow={setShowNewPw} />
          <PwInput label="Confirm New Password" field="confirmPassword" form={pwForm} setForm={setPwForm} show={showConfirmPw} setShow={setShowConfirmPw} />

          {/* Password strength hint */}
          {pwForm.newPassword && (
            <div style={{ marginBottom: 16, fontSize: 12, color: pwForm.newPassword.length >= 8 ? '#16a34a' : '#d97706' }}>
              {pwForm.newPassword.length >= 8 ? '✅ Good password length' : '⚠️ Use at least 8 characters for a stronger password'}
            </div>
          )}

          <button type="submit" disabled={pwLoading} style={{ ...submitBtn(pwLoading), background: pwLoading ? '#94a3b8' : '#a855f7' }}>
            <Shield size={15} /> {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <p style={{ fontSize: 10, color: '#5C6E82', textAlign: 'center', marginTop: 8, fontFamily: "'Share Tech Mono', monospace", letterSpacing: '0.08em' }}>
        // AFTER CHANGING CREDENTIALS, YOU WILL BE LOGGED OUT AUTOMATICALLY
      </p>
    </div>
  );
};

export default AdminSettings;
