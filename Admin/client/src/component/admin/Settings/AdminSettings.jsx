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
    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8,
    fontSize: 14, outline: 'none', background: '#f8fafc', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border-color 0.2s',
  };

  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

  const Alert = ({ data }) => data ? (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
      borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500,
      background: data.type === 'success' ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${data.type === 'success' ? '#86efac' : '#fca5a5'}`,
      color: data.type === 'success' ? '#15803d' : '#b91c1c',
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
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16,
    padding: '28px 32px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  };

  const submitBtn = (loading, label) => ({
    background: loading ? '#94a3b8' : '#6366f1',
    color: '#fff', border: 'none', borderRadius: 8, padding: '11px 28px',
    fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 8,
    transition: 'background 0.2s',
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
      <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{adminName}</div>
            <div style={{ opacity: 0.8, fontSize: 13, marginTop: 2 }}>{adminEmail}</div>
            <div style={{ opacity: 0.65, fontSize: 11, marginTop: 2 }}>🛡️ Administrator</div>
          </div>
        </div>
      </div>

      {/* Change Email */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mail size={18} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Change Email</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Update your admin login email</p>
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
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={18} color="#a855f7" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>Change Password</h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Use a strong password (min. 6 characters)</p>
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

      <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
        After changing your credentials, you will be logged out automatically.
      </p>
    </div>
  );
};

export default AdminSettings;
