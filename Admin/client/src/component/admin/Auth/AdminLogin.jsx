import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/AdminLogin.css';
import ADMIN_API_BASE_URL from '../../../config/api';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Clear any existing session on mount
  useEffect(() => {
    // Optional: Clear old tokens when login page loads
    // Uncomment if you want to force logout when accessing login page
    // localStorage.removeItem('adminToken');
    // localStorage.removeItem('adminEmail');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${ADMIN_API_BASE_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();

      // ✅ Store token and user info
      if (data.token) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminEmail', data.admin?.email || email);
        localStorage.setItem('adminName',  data.admin?.name  || 'Admin');
        localStorage.setItem('adminId',    data.admin?.id    || '');
        // ✅ Save role — 'admin' or 'staff' — used for route guards and sidebar
        localStorage.setItem('adminRole',  (data.admin?.role || 'admin').toLowerCase());

        // ✅ Staff go to products; admins go to dashboard
        const role = (data.admin?.role || 'admin').toLowerCase();
        navigate(role === 'staff' ? '/admin/products' : '/admin/dashboard');
      } else {
        throw new Error('No token received from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="login-card">
        <div className="login-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" stroke="#00B0FF" strokeWidth="1.5" fill="none"/>
              <circle cx="14" cy="14" r="3" fill="#00B0FF"/>
            </svg>
            <div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.3rem', letterSpacing: '0.15em', color: '#E8EDF5' }}>CHASSA</div>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.45rem', color: '#00B0FF', letterSpacing: '0.2em' }}>ENGINEERING DRIVES</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#9AAABB', marginTop: 4 }}>Admin Control Panel</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;