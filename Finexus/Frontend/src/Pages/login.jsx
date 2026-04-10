import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import './style.css';

const FinexusLogo = () => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="7" fill="#6366F1"/>
    <path d="M7 9h14M7 14h9M7 19h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="21" cy="14" r="3" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.5"/>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', form);
      const token = res.data?.data?.token;
      if (token) {
        localStorage.setItem("token", token);
      }
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* Brand */}
      <div className="auth-brand">
        <FinexusLogo />
        <span className="auth-brand__wordmark">Finexus</span>
      </div>

      <div className="auth-card">
        <h1 className="auth-card__heading">Welcome back</h1>
        <p className="auth-card__subheading">Sign in to your Finexus account to continue.</p>

        {error && (
          <div className="auth-feedback auth-feedback--error" role="alert">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-input-group">
            <label htmlFor="login-email">
              Email address <span className="req">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className={error ? 'input--error' : ''}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="login-password">
              Password <span className="req">*</span>
            </label>
            <input
              id="login-password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className={error ? 'input--error' : ''}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="auth-forgot">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? <><span className="auth-spinner" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')}>Create one</button>
        </p>
      </div>

      <p className="auth-footer-note">
        By continuing, you agree to Finexus's Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export default Login;
