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
        localStorage.setItem('adminName', data.admin?.name || 'Admin');
        localStorage.setItem('adminId', data.admin?.id || '');

        // ✅ Navigate to dashboard
        navigate('/admin/dashboard');
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
          <h1>🛡️ Admin Login</h1>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#8B1A1A', marginTop: 4 }}>Aaradhana</p>
          <p>Access your admin dashboard</p>
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