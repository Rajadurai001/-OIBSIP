import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

// Intentionally NOT linked from the public registration flow - admins reach
// this page only via a direct URL (/admin/login), separate from user auth.
const AdminLogin = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await adminApi.post('/admin/auth/login', form);
      loginAdmin(data.token, data.admin);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card admin-card" onSubmit={handleSubmit}>
        <h2>Admin Login</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login as Admin'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
