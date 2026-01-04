# Frontend - React Application

## Overview
React frontend for the Customer Support Voice & Text Chat application with Tailwind CSS styling.

## Features
- Voice call interface with real-time STT/TTS
- Floating text chat modal
- Document upload interface
- Conversation history view
- Analytics dashboard
- User authentication (Login/Signup/OTP)
- Dark neon cyberpunk theme

## Prerequisites
- Node.js 14+
- npm or yarn

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Run the development server:**
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

3. **Build for production:**
```bash
npm run build
```

## Project Structure
```
frontend/
├── public/              # Static files
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/      # React components
│   │   ├── AuthForm.css
│   │   ├── Chatbot.js   # Main voice & text chat
│   │   ├── Chatbot.css
│   │   ├── CoverPage.js # Landing page
│   │   ├── Login.js
│   │   ├── Signup.js
│   │   ├── VerifyOtp.js
│   │   └── Navbar.js
│   ├── utils/
│   │   └── formatHelper.js
│   ├── App.js           # Main app component
│   ├── App.css
│   ├── index.js         # Entry point
│   └── index.css        # Global styles + Tailwind
├── package.json
├── tailwind.config.js   # Tailwind configuration
└── postcss.config.js    # PostCSS configuration
```

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Tech Stack
- **Framework:** React 18
- **Routing:** React Router DOM
- **Styling:** Tailwind CSS v3
- **Build Tool:** Create React App
- **API Communication:** Fetch API

## Backend Connection
The frontend connects to the backend at:
- **Production:** `https://iomp-backbro.onrender.com`
- **Development:** Can be changed in `src/components/Chatbot.js` (BASE_URL)

## Features

### 1. Voice Call
- Real-time voice conversation
- Automatic speech recognition (STT)
- Text-to-speech responses (TTS)
- Document-aware responses using RAG
- Call timer and status indicators

### 2. Text Chat (Floating Button 💬)
- Bottom-right floating chat button
- Real-time text-based conversation
- Same document context as voice
- Message history with timestamps
- Auto-scroll to latest message

### 3. Document Upload
- PDF, DOCX, TXT support
- Automatic indexing with Pinecone
- Document-aware conversations

### 4. History & Analytics
- Conversation history with replay
- Call duration tracking
- Usage statistics
- Session management

## Tailwind Theme
Custom dark neon cyberpunk theme with:
- Dark backgrounds: `#0a0e27`, `#151932`, `#1e2139`
- Accent colors: Cyan (`#00d4ff`), Purple (`#7b2ff7`), Pink (`#ff2e97`)
- Neon glow effects and animations
- Custom scrollbars with gradients
