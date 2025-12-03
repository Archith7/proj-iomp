import React from 'react';
import { Link } from 'react-router-dom';
import './CoverPage.css';

const CoverPage = () => {
  return (
    <div className="cover-page">
      <div className="cover-content">
        <h1 className="cover-title">
          <span className="cover-title-strong">Intelligent Customer Support</span>
          <br />
          <span className="cover-title-highlight">Powered by AI</span>
        </h1>
        <p className="cover-subtitle">
          Experience the future of customer service with our advanced AI chatbot.
          <br />
          Get instant answers, 24/7 support, and seamless assistance for all your insurance needs.
        </p>
        <div className="cover-buttons">
          <Link to="/signup" className="cover-btn btn-lg-primary">
            Get Started
          </Link>
          <Link to="/login" className="cover-btn btn-lg-outline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CoverPage;
