import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import { formatNumberedText } from '../utils/formatHelper';

const AVATAR_USER = 'https://ui-avatars.com/api/?name=U&background=10a37f&color=fff&size=32&rounded=true&format=svg';
const AVATAR_BOT = 'https://ui-avatars.com/api/?name=AI&background=6b7280&color=fff&size=32&rounded=true&format=svg';

const generateSarvamTTS = async (text) => {
  try {
    const ttsRes = await fetch(
      `https://iomp-backend.onrender.com/tts?text=${encodeURIComponent(text)}&language_code=en-IN&speaker=anushka`
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (overrideText = null) => {
    const text = overrideText ?? input;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { text, sender: 'user' }]);
    setInput('');
    setIsTyping(true);

    try {
      // 🍁 CALL YOUR EXISTING CHAT API
      const chatRes = await fetch('https://iomp-backend.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });

      const chatData = await chatRes.json();
      const botText = chatData.answer;

      // ⭐ UPDATED — CALL SARVAM TTS (direct audio URL)
      const audioUrl = await generateSarvamTTS(botText);

      setMessages(prev => [...prev, { text: botText, sender: 'bot', audioUrl }]);
      setIsTyping(false);

    } catch (err) {
      console.error("Error:", err);
      setMessages(prev => [...prev, { text: "Something went wrong.", sender: "bot" }]);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 🎤 Record audio → send to STT → autofill input
  const handleRecord = async () => {
    if (isRecording) return;

    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", blob, "speech.wav");

      const res = await fetch("https://iomp-backend.onrender.com/stt?language_code=en-IN", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      setInput(data.transcript);
      setIsRecording(false);
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 4000);
  };

  return (
    <div className="chatgpt-container">
      <div className="chatgpt-header">AI Assistant</div>

      <div className="chatgpt-window">

        {messages.length === 0 && (
          <div className="chatgpt-welcome">
            <h3>How can I help you today?</h3>
            <p>Ask me anything - I'm here to assist you.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`chatgpt-row ${msg.sender}`}>
            <img
              src={msg.sender === 'user' ? AVATAR_USER : AVATAR_BOT}
              alt=""
              className="chatgpt-avatar"
            />

            <div className={`chatgpt-bubble ${msg.sender}`}>
              {formatNumberedText(msg.text)}

              {/* ⭐ Play audio if exists */}
              {msg.audioUrl && (
                <audio controls src={msg.audioUrl} style={{ width: "100%", marginTop: 8 }} />
              )}

              {/* ⭐ Generate audio manually if missing */}
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
                  style={{ marginTop: 5 }}
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

      <div className="chatgpt-input-area">
        <div className="chatgpt-input-container">
          <input
            type="text"
            value={input}
            placeholder="Message AI Assistant..."
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
