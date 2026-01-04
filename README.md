# Customer Support Voice & Text Chat Application

A full-stack application providing AI-powered customer support through voice and text interfaces with document-based RAG (Retrieval Augmented Generation).

## 🎯 Features

- **Voice Chat:** Real-time voice conversations with STT/TTS
- **Text Chat:** Floating chat interface for typed conversations
- **Document Upload:** Support for PDF, DOCX, TXT files
- **RAG-based Answers:** Context-aware responses using uploaded documents
- **User Authentication:** Secure login/signup with JWT and OTP
- **Conversation History:** Track and review past interactions
- **Analytics Dashboard:** View usage statistics and insights
- **Dark Neon UI:** Modern cyberpunk-themed interface

## 📁 Project Structure

```
customer-service/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   └── utils/           # Helper functions
│   ├── public/              # Static assets
│   ├── package.json
│   └── README.md            # Frontend documentation
│
├── backend/                 # FastAPI server
│   ├── main.py             # Main application
│   ├── .env                # Environment variables
│   ├── start_server.ps1    # Start script
│   └── README.md           # Backend documentation
│
├── README.md               # This file
├── .gitignore
└── Documentation files
```

## 🚀 Quick Start

### Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install fastapi uvicorn motor pymongo pinecone-client groq bcrypt pyjwt python-dotenv
```

3. Configure `.env` file with your API keys

4. Start the server:
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## 🛠️ Tech Stack

### Frontend
- React 18
- React Router DOM
- Tailwind CSS v3
- Web Speech API (STT/TTS)

### Backend
- FastAPI
- MongoDB (Motor)
- Pinecone (Vector Store)
- Groq (LLM)
- Sarvam AI (STT/TTS)
- JWT Authentication

## 📖 Documentation

- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)
- [MongoDB Integration](./MONGODB_INTEGRATION.md)
- [Voice Call Features](./VOICE_CALL_FEATURES.md)

## 🔑 Environment Variables

See `backend/.env.example` for required environment variables:
- MongoDB connection string
- Pinecone API key
- Groq API keys
- Brevo API key
- JWT secret

## 🎨 UI Features

- **Dark Neon Theme:** Cyan, purple, and pink accent colors
- **Smooth Animations:** Float, glow, wave effects
- **Responsive Design:** Works on all screen sizes
- **Custom Scrollbars:** Gradient-styled scrollbars
- **Neon Glow Effects:** Shadows and borders with glow

## 📝 Usage

1. **Sign Up/Login:** Create an account or log in
2. **Upload Document:** Upload a PDF/DOCX/TXT file
3. **Start Conversation:**
   - Click "Start Voice Call" for voice interaction
   - Click floating 💬 button for text chat
4. **Ask Questions:** Ask about the uploaded document
5. **View History:** Check past conversations in History tab
6. **Check Analytics:** View usage stats in Analytics tab

## 🤝 Contributing

This is a private project. For access or contributions, please contact the repository owner.

## 📄 License

Private - All rights reserved

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
