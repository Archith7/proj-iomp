import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Chatbot from './components/Chatbot';
import Login from './components/Login';
import Signup from './components/Signup';
import Navbar from './components/Navbar';
import CoverPage from './components/CoverPage';
import VerifyOtp from './components/VerifyOtp';

const PrivateRoute = ({ isAuthenticated, children }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    const storedAuthFlag = localStorage.getItem('isAuthenticated') === 'true';

    if (storedToken) {
      setIsAuthenticated(true);
    } else if (storedAuthFlag) {
      setIsAuthenticated(true);
    }

    if (storedUser) {
      try {
        JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse stored auth user', error);
        localStorage.removeItem('authUser');
      }
    }
  }, []);

  const handleAuthSuccess = ({ token, user }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<CoverPage />} />
        <Route path="/login" element={<Login onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOtp onAuthSuccess={handleAuthSuccess} />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <div>
                <h1 style={{ textAlign: 'center', marginTop: '20px' }}>Customer Service Chatbot</h1>
                <Chatbot />
              </div>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
