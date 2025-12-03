import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';

const API_BASE_URL = 'https://iomp-backend.onrender.com';

const Login = ({ onAuthSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: identifier.trim(), password: password.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.token && data.user) {
        if (onAuthSuccess) {
          onAuthSuccess({ token: data.token, user: data.user });
        }
        navigate('/chat');
      } else if (response.status === 400 || response.status === 401) {
        setError(data.message || 'Invalid credentials');
      } else {
        setError(data.message || 'Server error');
      }
    } catch (err) {
      console.error('Error during login', err);
      setError('Server error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h2>Welcome Back</h2>
          <p>Log in to continue the conversation.</p>
        </div>
        <div className="auth-card-body">
          <form onSubmit={handleLogin}>
            <div className="auth-field">
              <label>Email or Username</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="auth-input"
                placeholder="you@example.com or username"
                disabled={isSubmitting}
              />
            </div>
            <br/>
            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
              <br/>
            </div>
            {error && <div className="auth-feedback error">{error}</div>}
            <button type="submit" className="auth-button" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="auth-footer">
            Need an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
