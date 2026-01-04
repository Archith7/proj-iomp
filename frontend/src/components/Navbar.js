import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ isAuthenticated, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className="bg-dark-elevated border-b border-accent-primary/30 shadow-dark-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="text-2xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent hover:drop-shadow-[0_0_20px_rgba(0,212,255,0.6)] transition-all duration-300"
          >
            CustomerSupport
          </Link>
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/login" 
                  className="px-6 py-2 text-gray-300 hover:text-accent-primary transition-all duration-300 font-semibold"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="px-6 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-lg font-semibold hover:shadow-neon transition-all duration-300"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <button 
                  onClick={handleLogout} 
                  className="px-6 py-2 bg-transparent border-2 border-accent-tertiary text-accent-tertiary rounded-lg font-semibold hover:bg-accent-tertiary hover:text-white hover:shadow-neon-pink transition-all duration-300"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
