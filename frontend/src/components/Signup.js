import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';

const API_BASE_URL = 'https://iomp-backend.onrender.com';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!username.trim() || !email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim(), email: email.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const successMessage = data.message || 'OTP sent';
        setMessage(successMessage);
        navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`, {
          state: { email: email.trim(), fromSignup: true, notice: successMessage },
        });
      } else if (response.status === 400) {
        setError(data.message || 'User already registered');
      } else if (response.status === 409) {
        setError(data.message || 'User already registered');
      } else {
        setError(data.message || 'Server error');
      }
    } catch (err) {
      console.error('Error during registration', err);
      setError('Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2>Create Account</h2>
          <p>We will email you a one-time password to finish signup.</p>
        </div>
        <div className="auth-card-body">
          <form onSubmit={handleSignup}>
            <div className="auth-field">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="auth-input"
                placeholder="Choose a username"
                disabled={isSubmitting}
              />
            </div>
            <br/>
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
            <br/>
            {message && <div className="auth-feedback success">{message}</div>}
            {error && <div className="auth-feedback error">{error}</div>}
            <button type="submit" className="auth-button" disabled={isSubmitting}>
              {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
          <p className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
