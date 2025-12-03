import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AuthForm.css';

const API_BASE_URL = 'https://iomp-backend.onrender.com';

const VerifyOtp = ({ onAuthSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);

  const [email, setEmail] = useState(() => {
    if (location.state && location.state.email) {
      return location.state.email;
    }

    const params = new URLSearchParams(location.search);
    return params.get('email') || '';
  });
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(location.state?.notice || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!email.trim() || !otp.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.token && data.user) {
        const successMessage = data.message || 'Verification successful';
        setMessage(successMessage);
        if (onAuthSuccess) {
          onAuthSuccess({ token: data.token, user: data.user });
        }
        redirectTimeoutRef.current = setTimeout(() => navigate('/chat'), 1200);
      } else if (response.status === 400) {
        setError(data.message || 'Invalid OTP');
      } else {
        setError(data.message || 'Server error');
      }
    } catch (err) {
      console.error('Error verifying OTP', err);
      setError('Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2>Verify OTP</h2>
          <p>Enter the one-time password we emailed you to finish signup.</p>
        </div>
        <div className="auth-card-body">
          <form onSubmit={handleVerify}>
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="you@example.com"
                disabled={isSubmitting}
              />
            </div>
            <div className="auth-field">
              <label>OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="auth-input"
                placeholder="Enter 6-digit code"
                disabled={isSubmitting}
              />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="Create a password"
                disabled={isSubmitting}
              />
            </div>
            <div className="auth-field">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-input"
                placeholder="Re-enter password"
                disabled={isSubmitting}
              />
            </div>
            {message && <div className="auth-feedback success">{message}</div>}
            {error && <div className="auth-feedback error">{error}</div>}
            <button type="submit" className="auth-button" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Verify and Continue'}
            </button>
          </form>
          <p className="auth-footer">
            Already verified? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
