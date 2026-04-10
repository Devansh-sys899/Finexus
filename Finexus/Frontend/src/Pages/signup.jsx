import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import './style.css';

const FinexusLogo = () => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="28" rx="7" fill="#6366F1"/>
    <path d="M7 9h14M7 14h9M7 19h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="21" cy="14" r="3" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="1.5"/>
  </svg>
);

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: form.fullName, // map `fullName` state to backend's `name`
        email: form.email,
        password: form.password
      };
      const res = await axios.post('/api/auth/signup', payload);
      const token = res.data?.data?.token;
      if (token) {
        localStorage.setItem("token", token);
      }
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
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
        <h1 className="auth-card__heading">Create your account</h1>
        <p className="auth-card__subheading">Start managing your finances intelligently — for free.</p>

        {error && (
          <div className="auth-feedback auth-feedback--error" role="alert">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-input-group">
            <label htmlFor="signup-name">
              Full Name <span className="req">*</span>
            </label>
            <input
              id="signup-name"
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={form.fullName}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="signup-email">
              Email address <span className="req">*</span>
            </label>
            <input
              id="signup-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="signup-password">
              Password <span className="req">*</span>
            </label>
            <input
              id="signup-password"
              type="password"
              name="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            id="signup-submit-btn"
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? <><span className="auth-spinner" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')}>Sign in</button>
        </p>
      </div>

      <p className="auth-footer-note">
        By signing up, you agree to Finexus's Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export default Signup;
