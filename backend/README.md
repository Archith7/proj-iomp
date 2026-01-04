# Backend - FastAPI Server

## Overview
FastAPI backend for the Customer Support Voice & Text Chat application with RAG capabilities using Pinecone, Groq, and MongoDB.

## Features
- Document upload and embedding generation
- Voice chat with STT/TTS
- Text chat interface
- RAG-based question answering
- User authentication (JWT)
- MongoDB integration for user management
- Conversation history and analytics

## Prerequisites
- Python 3.11+
- MongoDB Atlas account
- Pinecone API key
- Groq API key
- Brevo API key (for email)

## Setup

1. **Install dependencies:**
```bash
pip install fastapi uvicorn motor pymongo pinecone-client groq bcrypt pyjwt python-dotenv
```

2. **Configure environment variables:**
Copy `.env.example` to `.env` and fill in your credentials:
```
MONGO_URI=your_mongodb_connection_string
MONGO_DB_NAME=Customer--support--server
JWT_SECRET=your_jwt_secret
PINECONE_API_KEY=your_pinecone_key
GROQ_API_KEY_1=your_groq_key
BREVO_API_KEY=your_brevo_key
```

3. **Run the server:**
```bash
# Development with auto-reload
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or use the PowerShell script
powershell -File start_server.ps1
```

## API Endpoints

### Document Management
- `POST /document-upload` - Upload and process documents
- `GET /indexes` - List available indexes

### Chat
- `POST /chat` - Text-based chat with document context
- `POST /stt` - Speech-to-text conversion
- `POST /tts` - Text-to-speech conversion

### Authentication
- `POST /signup` - User registration
- `POST /login` - User login
- `POST /verify-otp` - OTP verification

### MongoDB (User-specific)
- `POST /save-conversation` - Save conversation history
- `GET /get-conversations` - Retrieve conversation history
- `POST /save-analytics` - Save analytics data
- `GET /get-analytics` - Retrieve analytics

## Project Structure
```
backend/
├── main.py              # Main FastAPI application
├── .env                 # Environment variables (not in git)
├── .env.example         # Example environment file
├── start_server*.ps1    # PowerShell start scripts
└── __pycache__/         # Python cache
```

## Tech Stack
- **Framework:** FastAPI
- **Database:** MongoDB (Motor async driver)
- **Vector Store:** Pinecone
- **LLM:** Groq (Llama models)
- **STT/TTS:** Sarvam AI
- **Email:** Brevo
- **Authentication:** JWT + bcrypt
