/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark neon theme colors
        dark: {
          bg: '#0a0e27',
          surface: '#151932',
          elevated: '#1e2139',
          card: '#252947',
        },
        accent: {
          primary: '#00d4ff',
          secondary: '#7b2ff7',
          tertiary: '#ff2e97',
        },
        neon: {
          cyan: '#00d4ff',
          purple: '#7b2ff7',
          pink: '#ff2e97',
          green: '#00ff88',
        },
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 212, 255, 0.5)',
        'neon-lg': '0 0 30px rgba(0, 212, 255, 0.6)',
        'neon-purple': '0 0 20px rgba(123, 47, 247, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 46, 151, 0.5)',
        'dark': '0 8px 30px rgba(0, 0, 0, 0.5)',
        'dark-lg': '0 12px 40px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'spin-slow': 'spin 4s linear infinite',
        'gradient': 'gradient 15s ease infinite',
        'wave': 'wave 1.2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
