import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const AVATAR_USER = 'https://ui-avatars.com/api/?name=U&background=10a37f&color=fff&size=32&rounded=true&format=svg';
const AVATAR_BOT = 'https://ui-avatars.com/api/?name=AI&background=6b7280&color=fff&size=32&rounded=true&format=svg';

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

  // Send typed or STT transcript
  const handleSend = async (overrideText = null) => {
    const text = overrideText ?? input;
    if (!text.trim()) return;

    const newMessage = { text, sender: 'user' };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const chatRes = await fetch('https://iomp-backend.onrender.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: text }),
      });

      if (!chatRes.ok) {
        throw new Error(`Chat API failed: ${chatRes.statusText}`);
      }

      const chatData = await chatRes.json();
      const botText = chatData.answer;

      const ttsRes = await fetch(
        `https://iomp-backend.onrender.com/tts?text=${encodeURIComponent(botText)}&language_code=en-IN&speaker=anushka`
      );

      if (!ttsRes.ok || ttsRes.headers.get("content-type") !== "audio/mpeg") {
        console.error("TTS failed", await ttsRes.text());
        setIsTyping(false);
        setMessages(prev => [...prev, { text: botText, sender: 'bot' }]);
        return;
      }

      const blob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(blob);

      setIsTyping(false);
      setMessages(prev => [...prev, { text: botText, sender: 'bot', audioUrl }]);
    } catch (err) {
      console.error("Error in handleSend:", err);
      const botText = "Sorry, something went wrong. Please try again.";
      setIsTyping(false);
      setMessages(prev => [...prev, { text: botText, sender: 'bot' }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const playAudio = (url) => {
    const audio = new Audio(url);
    audio.play();
  };

  // 🎤 Record → send to /stt → auto-send transcript
  const handleRecord = async () => {
    if (isRecording) return;
    setIsRecording(true);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const formData = new FormData();
      formData.append("file", blob, "speech.wav");

      const res = await fetch("https://iomp-backend.onrender.com/stt?language_code=en-IN", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      setIsRecording(false);

      const transcript = data.transcript;
      setInput(transcript);
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 4000); // record 4 sec
  };

  return (
    <div className="chatgpt-container">
      <div className="chatgpt-header">AI Assistant</div>
      <div className="chatgpt-window">
        {messages.length === 0 && (
          <div className="chatgpt-welcome">
            <h3>How can I help you today?</h3>
            <p>Ask me anything - I'm here to assist you</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`chatgpt-row ${msg.sender}`}>
            <img
              src={msg.sender === 'user' ? AVATAR_USER : AVATAR_BOT}
              alt={msg.sender}
              className="chatgpt-avatar"
            />
            <div className={`chatgpt-bubble ${msg.sender}`}>
              {msg.text}
              {msg.sender === 'bot' && (
                <button
                  onClick={async () => {
                    const r = await fetch(
                      `https://iomp-backend.onrender.com/tts?text=${encodeURIComponent(msg.text)}&language_code=en-IN&speaker=anushka`
                    );

                    if (!r.ok || r.headers.get("content-type") !== "audio/mpeg") {
                      console.error("Replay TTS failed", await r.text());
                      return;
                    }

                    const b = await r.blob();
                    const url = URL.createObjectURL(b);
                    playAudio(url);
                  }}
                >
                  🔊
                </button>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chatgpt-row bot">
            <img src={AVATAR_BOT} alt="bot" className="chatgpt-avatar" />
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
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Assistant..."
            autoFocus
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
