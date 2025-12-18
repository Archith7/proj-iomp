import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import { formatNumberedText } from '../utils/formatHelper';

const AVATAR_USER = 'https://ui-avatars.com/api/?name=U&background=10a37f&color=fff&size=32&rounded=true&format=svg';
const AVATAR_BOT = 'https://ui-avatars.com/api/?name=AI&background=6b7280&color=fff&size=32&rounded=true&format=svg';

// ✅ CHANGED: URL to localhost
const BASE_URL = "https://iomp-backbro.onrender.com";

const generateSarvamTTS = async (text) => {
  try {
    const ttsRes = await fetch(
      `${BASE_URL}/tts?text=${encodeURIComponent(text)}&language_code=en-IN&speaker=anushka`
    );
    if (!ttsRes.ok || ttsRes.headers.get("content-type") !== "audio/mpeg") {
      console.error("TTS failed", await ttsRes.text());
      return null;
    }
    const blob = await ttsRes.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Error in generateSarvamTTS:", err);
    return null;
  }
};

const Chatbot = () => {
  // --- Chat State ---
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const chatEndRef = useRef(null);

  // --- Upload State ---
  const [file, setFile] = useState(null);
  const [indexName, setIndexName] = useState(null); // Stores the backend index ID
  const [uploadStatus, setUploadStatus] = useState(''); // 'uploading', 'error', 'success'

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // --- 1. HANDLE FILE UPLOAD ---
  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${BASE_URL}/document-upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data = await res.json();
      
      // ✅ SUCCESS: Save the index name and switch to chat view
      if (data.success) {
        setIndexName(data.index_name);
        setUploadStatus('success');
        // Optional: Add a welcoming system message
        setMessages([{ 
            text: `Document uploaded successfully! I have indexed content from "${file.name}". What would you like to know?`, 
            sender: 'bot' 
        }]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Upload failed: ${err.message}`);
      setUploadStatus('error');
    }
  };

  // --- 2. HANDLE CHAT SEND ---
  const handleSend = async (overrideText = null) => {
    const text = overrideText ?? input;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { text, sender: 'user' }]);
    setInput('');
    setIsTyping(true);

    try {
      // ✅ CHANGED: Send index_name along with the question
      const chatRes = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            question: text,
            index_name: indexName // Crucial: tells backend which PDF to search
        }),
      });

      const chatData = await chatRes.json();
      const botText = chatData.answer;

      // Call TTS
      const audioUrl = await generateSarvamTTS(botText);

      setMessages(prev => [...prev, { text: botText, sender: 'bot', audioUrl }]);
    } catch (err) {
      console.error("Error:", err);
      setMessages(prev => [...prev, { text: "Something went wrong with the server.", sender: "bot" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- 3. HANDLE RECORDING (STT) ---
  const handleRecord = async () => {
    if (isRecording) return;

    setIsRecording(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);

        recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("file", blob, "speech.wav");

        // ✅ CHANGED: Localhost URL
        const res = await fetch(`${BASE_URL}/stt?language_code=en-IN`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        setInput(data.transcript);
        setIsRecording(false);
        };

        recorder.start();
        setTimeout(() => recorder.stop(), 4000);
    } catch (err) {
        console.error("Mic error:", err);
        setIsRecording(false);
    }
  };

  // ----------------------------------------------------
  // VIEW: UPLOAD SCREEN (Show this if no indexName yet)
  // ----------------------------------------------------
  if (!indexName) {
    return (
      <div className="chatgpt-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="chatgpt-window" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
          
          <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>📄 Document Upload</h2>
          <p style={{ color: '#ccc', marginBottom: '2rem' }}>
            Upload a PDF document to start chatting with it.
          </p>
          
          <div style={{ 
              border: '2px dashed #444', 
              borderRadius: '10px', 
              padding: '40px', 
              width: '100%', 
              maxWidth: '400px',
              backgroundColor: '#202123'
          }}>
            <input 
              type="file" 
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ color: '#fff', marginBottom: '20px' }}
            />
            
            <button 
              onClick={handleFileUpload}
              disabled={!file || uploadStatus === 'uploading'}
              style={{
                backgroundColor: uploadStatus === 'uploading' ? '#555' : '#10a37f',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: uploadStatus === 'uploading' ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                width: '100%'
              }}
            >
              {uploadStatus === 'uploading' ? 'Processing & Indexing...' : 'Upload and Start Chatting'}
            </button>
          </div>

          {/* Helper Note */}
          <p style={{ marginTop: '20px', fontSize: '0.8rem', color: '#666' }}>
             Supported format: .pdf only
          </p>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW: CHAT INTERFACE (Show this if indexName exists)
  // ----------------------------------------------------
  return (
    <div className="chatgpt-container">
      <div className="chatgpt-header">
        <span>AI Assistant</span>
        {/* Optional: Button to reset and upload new file */}
        <button 
            onClick={() => { setIndexName(null); setMessages([]); setFile(null); }}
            style={{ 
                background: 'transparent', 
                border: '1px solid #555', 
                color: '#aaa', 
                fontSize: '0.8rem', 
                padding: '4px 8px', 
                borderRadius: '4px',
                cursor: 'pointer'
            }}
        >
            New Document
        </button>
      </div>

      <div className="chatgpt-window">
        {/* Messages Mapping */}
        {messages.map((msg, idx) => (
          <div key={idx} className={`chatgpt-row ${msg.sender}`}>
            <img
              src={msg.sender === 'user' ? AVATAR_USER : AVATAR_BOT}
              alt=""
              className="chatgpt-avatar"
            />

            <div className={`chatgpt-bubble ${msg.sender}`}>
              {formatNumberedText(msg.text)}

              {/* Play audio if exists */}
              {msg.audioUrl && (
                <audio controls src={msg.audioUrl} style={{ width: "100%", marginTop: 8 }} />
              )}

              {/* Generate audio manually if missing */}
              {msg.sender === "bot" && !msg.audioUrl && (
                <button
                  onClick={async () => {
                    const url = await generateSarvamTTS(msg.text);
                    if (url) {
                      setMessages(prev =>
                        prev.map((m, i) => i === idx ? ({ ...m, audioUrl: url }) : m)
                      );
                    }
                  }}
                  style={{ marginTop: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '0.8em' }}
                >
                  🔊 Play TTS
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="chatgpt-row bot">
            <img src={AVATAR_BOT} className="chatgpt-avatar" alt="ai" />
            <div className="chatgpt-bubble bot">
              <span className="typing-indicator">●●●</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="chatgpt-input-area">
        <div className="chatgpt-input-container">
          <input
            type="text"
            value={input}
            placeholder="Ask about the document..."
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
          />

          <button
            onClick={() => handleSend()}
            className="chatgpt-send-btn"
            disabled={!input.trim() || isTyping}
          >
            Send
          </button>

          <button
            onClick={handleRecord}
            className="chatgpt-send-btn"
            disabled={isRecording}
          >
            {isRecording ? "🎙..." : "🎤"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;