import React from 'react';
import { Link } from 'react-router-dom';

const CoverPage = () => {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary/20 rounded-full filter blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="max-w-5xl w-full text-center relative z-10">
        <h1 className="mb-8">
          <span className="block text-6xl md:text-7xl lg:text-8xl font-extrabold mb-4 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-tertiary bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,212,255,0.5)] animate-gradient">
            Intelligent Customer Support
          </span>
          <span className="block text-5xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-[0_0_20px_rgba(123,47,247,0.6)]">
            Powered by AI
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          Experience the future of customer service with our advanced AI chatbot.
          <br />
          Get instant answers, 24/7 support, and seamless assistance for all your insurance needs.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link 
            to="/signup" 
            className="px-12 py-5 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-2xl font-bold text-xl hover:shadow-neon-lg hover:scale-110 transition-all duration-300 min-w-[200px]"
          >
            Get Started
          </Link>
          <Link 
            to="/login" 
            className="px-12 py-5 bg-transparent border-2 border-accent-primary text-accent-primary rounded-2xl font-bold text-xl hover:bg-accent-primary hover:text-white hover:shadow-neon transition-all duration-300 min-w-[200px]"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CoverPage;
