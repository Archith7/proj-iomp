import React, { useState, useRef, useEffect } from 'react';

// Backend URL
const BASE_URL = "https://iomp-backbro.onrender.com";

// Sound effects
const DING_SOUND = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSBAKS6Hh8bllHAU2jdXvz38pBSh+zO/blEIKFGCx5+6nVBEKRJzd8b9uIgU3i9Hu0oQ0BiFrwO3jmkgNCkug4PC3ZBwFNo3V8M9+KQUofczu25RCChRgsefvp1QRCkSc3fG/biIFN4vR7tKENAYha8Dt45pIDQpLoODwt2QcBTaN1fDPfikFKH3M7tuUQgoUYLHn76dUEQpEnN3xv24iBTeL0e7ShDQGIWvA7eOaSA0KS6Dg8LdkHAU2jdXwz34pBSh9zO7blEIKFGCx5++nVBEKRJzd8b9uIgU3i9Hu0oQ0BiFrwO3jmkgNCkug4PC3ZBwFNo3V8M9+KQUofczu25RCChRgsefvp1QRCkSc3fG/biIFN4vR7tKENAYha8Dt45pIDQpLoODwt2QcBTaN1fDPfikFKH3M7tuUQgoUYLHn76dUEQpEnN3xv24iBTeL0e7ShDQGIWvA7eOaSA0KS6Dg8LdkHAU2jdXwz34pBSh9zO7blEIKFGCx5++nVBEKRJzd8b9uIgU3i9Hu0oQ0BiFrwO3jmkgNCkug4PC3ZBwFNo3V8M9+KQUofczu25RCChRgsefvp1QRCkSc3fG/biIFN4vR7tKENAYha8Dt45pIDQpLoODwt2QcBTaN1fDPfikFKH3M7tuUQgoUYLHn76dUEQpEnN3xv24iBTeL0e7ShDQGIWvA');
const DONG_SOUND = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/cnB/');

// Backend TTS (kept as fallback)
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
  const [isRecording, setIsRecording] = useState(false);
  const chatEndRef = useRef(null);

  // --- View State ---
  const [currentView, setCurrentView] = useState('voice'); // 'voice', 'history', 'analytics'
  
  // --- Text Chat Modal State ---
  const [isTextChatOpen, setIsTextChatOpen] = useState(false);
  const [textChatMessages, setTextChatMessages] = useState([]);
  const [textChatInput, setTextChatInput] = useState('');
  const [isTextChatLoading, setIsTextChatLoading] = useState(false);
  const textChatEndRef = useRef(null);
  
  // --- Conversation History ---
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // --- Analytics ---
  const [analytics, setAnalytics] = useState({
    totalCalls: 0,
    totalDuration: 0,
    avgCallDuration: 0,
    topQueries: [],
    callsToday: 0
  });
  const callStartTimeRef = useRef(null);
  const [callTimer, setCallTimer] = useState(0); // Timer in seconds
  const timerIntervalRef = useRef(null);

  // --- Upload State ---
  const [file, setFile] = useState(null);
  const [indexName, setIndexName] = useState(null); // Stores the backend index ID
  const [uploadStatus, setUploadStatus] = useState(''); // 'uploading', 'error', 'success'

  // --- Voice Call State ---
  const [isCallActive, setIsCallActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const streamRef = useRef(null);
  const isCallActiveRef = useRef(false); // Add ref to track call state
  const idleTimeoutRef = useRef(null); // Timeout for idle conversation
  const noInputCountRef = useRef(0); // Track consecutive no-input occurrences
  const missedSpeechAttemptsRef = useRef(0); // Track missed speech attempts
  const currentUtteranceRef = useRef(null); // Track current speech for interruption
  const ttsSpeedRef = useRef(1.0); // TTS speed control
  const lastBotResponseRef = useRef(''); // Store last response for repeat command

  // Browser-based TTS using Web Speech API (faster and more reliable)
  const speakTextDirectly = (text) => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        console.error('Speech Synthesis not supported');
        reject(new Error('Speech Synthesis not supported'));
        return;
      }

      console.log('Starting speech synthesis for:', text.substring(0, 50) + '...');

      const utterance = new SpeechSynthesisUtterance(text);
      currentUtteranceRef.current = utterance; // Store for interruption
      
      // Configure voice settings
      utterance.rate = ttsSpeedRef.current; // Speed of speech (use ref for dynamic control)
      utterance.pitch = 1.0; // Pitch (0 to 2)
      utterance.volume = 1.0; // Volume (0 to 1)
      utterance.lang = 'en-US'; // Language

      // Get voices - they may load asynchronously
      let voices = window.speechSynthesis.getVoices();
      
      // If voices aren't loaded yet, wait for them
      if (voices.length === 0) {
        console.log('Voices not loaded yet, waiting...');
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          console.log('Voices loaded:', voices.length);
          setVoiceAndSpeak();
        };
      } else {
        setVoiceAndSpeak();
      }

      function setVoiceAndSpeak() {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(v => v.name));
        
        // Try to use a female voice if available
        const femaleVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('samantha')
        );
        
        if (femaleVoice) {
          console.log('Using voice:', femaleVoice.name);
          utterance.voice = femaleVoice;
        } else if (voices.length > 0) {
          console.log('Using default voice:', voices[0].name);
          utterance.voice = voices[0];
        }

      utterance.onstart = () => {
        console.log('Speech started');
      };        utterance.onend = () => {
          console.log('Speech ended');
          currentUtteranceRef.current = null;
          resolve();
        };

        utterance.onerror = (error) => {
          console.error('Speech synthesis error:', error);
          reject(error);
        };

        console.log('Calling speechSynthesis.speak()');
        window.speechSynthesis.speak(utterance);
      }
    });
  };

  // Initialize speech synthesis voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Load voices
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    
    // Using in-memory storage - data starts fresh on each page load
    console.log('Using in-memory storage (data will be cleared on refresh)');
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-scroll text chat to bottom
  useEffect(() => {
    if (textChatEndRef.current) {
      textChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [textChatMessages]);

  // --- TEXT CHAT FUNCTIONS ---
  const sendTextMessage = async () => {
    if (!textChatInput.trim() || isTextChatLoading) return;

    const userMessage = {
      role: 'user',
      text: textChatInput,
      timestamp: new Date().toISOString()
    };

    setTextChatMessages(prev => [...prev, userMessage]);
    setTextChatInput('');
    setIsTextChatLoading(true);

    try {
      // If no document uploaded, provide a helpful response
      if (!indexName) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        const botMessage = {
          role: 'assistant',
          text: 'Please upload a document first using the "Voice Call" tab. Once uploaded, I can answer questions about your document! 📄',
          timestamp: new Date().toISOString()
        };
        setTextChatMessages(prev => [...prev, botMessage]);
        setIsTextChatLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage.text,
          index_name: indexName
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = {
        role: 'assistant',
        text: data.answer || 'Sorry, I could not process your request.',
        timestamp: new Date().toISOString()
      };

      setTextChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending text message:', error);
      const errorMessage = {
        role: 'assistant',
        text: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      };
      setTextChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTextChatLoading(false);
    }
  };

  const handleTextChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

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

  // --- 2. PLAY AUDIO AND CONTINUE LISTENING (Using Browser TTS) ---
  const playAudioAndContinue = async (text) => {
    setIsSpeaking(true);
    lastBotResponseRef.current = text; // Store for repeat command
    
    console.log("playAudioAndContinue called with text:", text);
    
    try {
      // Check if speech synthesis is supported
      if (!('speechSynthesis' in window)) {
        console.error('Speech Synthesis not supported in this browser');
        throw new Error('Speech Synthesis not supported');
      }
      
      // Use browser's speech synthesis for immediate playback
      console.log("Calling speakTextDirectly...");
      await speakTextDirectly(text);
      console.log("Speech completed successfully");
      
      setIsSpeaking(false);
      
      // After speaking, start listening again if call is active
      console.log("Checking if should restart listening - isCallActiveRef.current:", isCallActiveRef.current, "streamRef.current:", !!streamRef.current);
      if (isCallActiveRef.current && streamRef.current) {
        console.log("Restarting listening after speech...");
        setTimeout(() => startListening(streamRef.current), 500);
      }
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
      
      // Continue listening even if TTS failed
      if (isCallActiveRef.current && streamRef.current) {
        console.log("Restarting listening after TTS error...");
        setTimeout(() => startListening(streamRef.current), 500);
      }
    }
  };

  // --- 3. SPEAK RESPONSE FUNCTION (Legacy - kept for compatibility) ---
  const speakResponse = async (text) => {
    setIsSpeaking(true);
    
    try {
      const audioUrl = await generateSarvamTTS(text);
      
      if (audioUrl) {
        // Play the audio
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsSpeaking(false);
          
          // After speaking, start listening again if call is active
          if (isCallActive && streamRef.current) {
            setTimeout(() => startListening(streamRef.current), 500);
          }
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          console.error("Error playing audio");
          
          // Continue listening even if audio playback failed
          if (isCallActive && streamRef.current) {
            setTimeout(() => startListening(streamRef.current), 500);
          }
        };
        
        // Play audio with promise to handle autoplay policy
        audio.play().catch(err => {
          console.error("Autoplay error:", err);
          setIsSpeaking(false);
          // Continue listening even if autoplay blocked
          if (isCallActive && streamRef.current) {
            setTimeout(() => startListening(streamRef.current), 500);
          }
        });
      } else {
        setIsSpeaking(false);
        // Continue listening even if TTS failed
        if (isCallActive && streamRef.current) {
          setTimeout(() => startListening(streamRef.current), 500);
        }
      }
    } catch (err) {
      console.error("TTS error:", err);
      setIsSpeaking(false);
      
      // Continue listening even if error occurred
      if (isCallActive && streamRef.current) {
        setTimeout(() => startListening(streamRef.current), 500);
      }
    }
  };

  // --- 3. HANDLE CHAT SEND ---
  const handleSend = async (overrideText = null) => {
    const text = overrideText ?? input;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { text, sender: 'user' }]);
    setInput('');

    try {
      // Use regular chat endpoint for both modes (text only)
      const chatRes = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            question: text,
            index_name: indexName
        }),
      });

      const chatData = await chatRes.json();
      const botText = chatData.answer;

      console.log("Bot text received:", botText);
      console.log("Is call active (state):", isCallActive);
      console.log("Is call active (ref):", isCallActiveRef.current);

      if (!isCallActiveRef.current) {
        // Normal mode: show message without audio
        console.log("Normal mode - just showing message");
        setMessages(prev => [...prev, { text: botText, sender: 'bot' }]);
      } else {
        // Voice call mode: show message and speak using browser TTS
        console.log("Voice call mode - adding message and speaking");
        setMessages(prev => [...prev, { text: botText, sender: 'bot', isVoiceCall: true }]);
        // Speak the text directly using browser TTS
        console.log("About to call playAudioAndContinue...");
        await playAudioAndContinue(botText);
      }
    } catch (err) {
      console.error("Error:", err);
      setMessages(prev => [...prev, { text: "Something went wrong with the server.", sender: "bot" }]);
      
      // Continue listening if in voice call mode
      if (isCallActive && streamRef.current) {
        setTimeout(() => startListening(streamRef.current), 500);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- 3. VOICE CALL FUNCTIONS ---
  
  // Start Voice Call
  const startVoiceCall = async () => {
    console.log("startVoiceCall called");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log("Setting isCallActive to TRUE (state and ref)");
      setIsCallActive(true);
      isCallActiveRef.current = true; // Update ref
      noInputCountRef.current = 0; // Reset no-input counter
      missedSpeechAttemptsRef.current = 0; // Reset missed speech counter
      
      // Start new conversation session
      const sessionId = Date.now().toString();
      setCurrentSessionId(sessionId);
      callStartTimeRef.current = Date.now();
      
      // Start call timer
      setCallTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
      
      const welcomeMessage = "Hello! Welcome to our customer service. How can I assist you today?";
      setMessages(prev => [...prev, { 
        text: welcomeMessage, 
        sender: 'bot' 
      }]);
      
      console.log("Speaking welcome message...");
      // Speak welcome message then start listening
      await speakTextDirectly(welcomeMessage);
      
      console.log("Starting to listen...");
      startListening(stream);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Could not access microphone. Please allow microphone permissions.");
    }
  };

  // End Voice Call
  const endVoiceCall = async (withGoodbye = true) => {
    // Stop any ongoing TTS immediately
    if (currentUtteranceRef.current && window.speechSynthesis.speaking) {
      console.log("Stopping ongoing speech");
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
    }
    
    // Stop call timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    setIsCallActive(false);
    isCallActiveRef.current = false; // Update ref
    setIsListening(false);
    setIsSpeaking(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    
    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (withGoodbye) {
      const goodbyeMessage = "Thank you for contacting us! Have a great day. Goodbye!";
      setMessages(prev => [...prev, { 
        text: goodbyeMessage, 
        sender: 'bot' 
      }]);
      await speakTextDirectly(goodbyeMessage);
    }
    
    // Save conversation to history
    if (currentSessionId && messages.length > 0) {
      saveConversationToHistory();
    }
  };

  // Save Conversation to History
  const saveConversationToHistory = () => {
    const callDuration = callStartTimeRef.current 
      ? Math.floor((Date.now() - callStartTimeRef.current) / 1000) 
      : 0;
    
    const conversationData = {
      sessionId: currentSessionId,
      timestamp: new Date().toISOString(),
      duration: callDuration,
      messages: messages.map(msg => ({
        role: msg.sender || msg.role,
        text: msg.text,
        timestamp: msg.timestamp || new Date().toISOString()
      })),
      messageCount: messages.length
    };
    
    const updatedHistory = [conversationData, ...conversationHistory].slice(0, 50);
    setConversationHistory(updatedHistory);
    
    // Update analytics
    updateAnalytics(callDuration, messages);
  };
  
  // Update Analytics
  const updateAnalytics = (duration, sessionMessages) => {
    const newAnalytics = {
      totalCalls: analytics.totalCalls + 1,
      totalDuration: analytics.totalDuration + duration,
      avgCallDuration: Math.floor((analytics.totalDuration + duration) / (analytics.totalCalls + 1)),
      callsToday: analytics.callsToday + 1,
      topQueries: analytics.topQueries || []
    };
    setAnalytics(newAnalytics);
  };

  // Reset idle timeout
  const resetIdleTimeout = () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    
    // Set 15 second timeout for idle detection
    idleTimeoutRef.current = setTimeout(() => {
      handleIdleTimeout();
    }, 15000);
  };
  
  // Handle idle timeout
  const handleIdleTimeout = async () => {
    if (!isCallActiveRef.current) return;
    
    noInputCountRef.current += 1;
    
    if (noInputCountRef.current === 1) {
      // First timeout - ask if they have more queries
      const promptMessage = "Are you still there? Do you have any more questions I can help you with?";
      setMessages(prev => [...prev, { 
        text: promptMessage, 
        sender: 'bot' 
      }]);
      setIsSpeaking(true);
      await speakTextDirectly(promptMessage);
      setIsSpeaking(false);
      
      // Restart listening and reset timeout
      if (isCallActiveRef.current && streamRef.current) {
        resetIdleTimeout();
        setTimeout(() => startListening(streamRef.current), 500);
      }
    } else if (noInputCountRef.current === 2) {
      // Second timeout - ask if they want to end
      const endPromptMessage = "I haven't heard from you. Would you like to end the conversation or continue with more queries? Say 'end' to finish or ask your question to continue.";
      setMessages(prev => [...prev, { 
        text: endPromptMessage, 
        sender: 'bot' 
      }]);
      setIsSpeaking(true);
      await speakTextDirectly(endPromptMessage);
      setIsSpeaking(false);
      
      // Restart listening and reset timeout
      if (isCallActiveRef.current && streamRef.current) {
        resetIdleTimeout();
        setTimeout(() => startListening(streamRef.current), 500);
      }
    } else {
      // Third timeout - end the call
      console.log("No response after multiple prompts, ending call");
      await endVoiceCall(true);
    }
  };

  // Start Listening
  const startListening = async (stream) => {
    if (!isCallActive && !stream) return;
    
    // Reset idle timeout when starting to listen
    resetIdleTimeout();
    
    // Play ding sound
    DING_SOUND.play().catch(e => console.log("Ding sound error:", e));
    
    setIsListening(true);
    
    try {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Play dong sound
        DONG_SOUND.play().catch(e => console.log("Dong sound error:", e));
        
        setIsListening(false);
        
        if (chunks.length === 0) {
          console.log("No audio data recorded");
          if (isCallActive) {
            // Restart listening if call is still active
            setTimeout(() => startListening(stream), 500);
          }
          return;
        }

        const blob = new Blob(chunks, { type: "audio/wav" });
        
        // Convert speech to text
        await processVoiceInput(blob, stream);
      };

      mediaRecorder.start();

      // Implement silence detection (stop after 3 seconds of silence)
      let lastSoundTime = Date.now();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkSilence = () => {
        if (mediaRecorder.state !== 'recording') return;
        
        analyser.getByteTimeDomainData(dataArray);
        
        // Calculate volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sum += normalized * normalized;
        }
        const volume = Math.sqrt(sum / bufferLength);
        
        // If volume is above threshold, update last sound time
        if (volume > 0.01) {
          lastSoundTime = Date.now();
        }
        
        // Check if silent for more than 2 seconds
        const silenceDuration = Date.now() - lastSoundTime;
        if (silenceDuration > 2000) {
          mediaRecorder.stop();
          audioContext.close();
        } else {
          requestAnimationFrame(checkSilence);
        }
      };

      // Start after a short delay to avoid immediate silence detection
      setTimeout(() => {
        lastSoundTime = Date.now();
        checkSilence();
      }, 500);

    } catch (err) {
      console.error("Recording error:", err);
      setIsListening(false);
    }
  };

  // Process Voice Input
  const processVoiceInput = async (audioBlob, stream) => {
    // Clear idle timeout when processing input
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    noInputCountRef.current = 0; // Reset no-input counter
    
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "speech.wav");

      const res = await fetch(`${BASE_URL}/stt?language_code=en-IN`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      const transcript = data.transcript;

      if (transcript && transcript.trim()) {
        // Reset missed speech counter on successful input
        missedSpeechAttemptsRef.current = 0;
        
        // Check for voice commands
        const lowerText = transcript.toLowerCase().trim();
        
        // Voice Command: Repeat
        if (lowerText === 'repeat' || lowerText === 'repeat that' || lowerText === 'say that again') {
          if (lastBotResponseRef.current) {
            console.log("Repeating last response");
            setIsSpeaking(true);
            await speakTextDirectly(lastBotResponseRef.current);
            setIsSpeaking(false);
            if (isCallActiveRef.current && streamRef.current) {
              setTimeout(() => startListening(streamRef.current), 500);
            }
          }
          return;
        }
        
        // Voice Command: Speed control
        if (lowerText.includes('speak slower') || lowerText.includes('slow down')) {
          ttsSpeedRef.current = Math.max(0.5, ttsSpeedRef.current - 0.2);
          const confirmMsg = "I'll speak slower now.";
          setIsSpeaking(true);
          await speakTextDirectly(confirmMsg);
          setIsSpeaking(false);
          if (isCallActiveRef.current && streamRef.current) {
            setTimeout(() => startListening(streamRef.current), 500);
          }
          return;
        }
        
        if (lowerText.includes('speak faster') || lowerText.includes('speed up')) {
          ttsSpeedRef.current = Math.min(2.0, ttsSpeedRef.current + 0.2);
          const confirmMsg = "I'll speak faster now.";
          setIsSpeaking(true);
          await speakTextDirectly(confirmMsg);
          setIsSpeaking(false);
          if (isCallActiveRef.current && streamRef.current) {
            setTimeout(() => startListening(streamRef.current), 500);
          }
          return;
        }
        
        if (lowerText.includes('normal speed') || lowerText.includes('reset speed')) {
          ttsSpeedRef.current = 1.0;
          const confirmMsg = "Back to normal speed.";
          setIsSpeaking(true);
          await speakTextDirectly(confirmMsg);
          setIsSpeaking(false);
          if (isCallActiveRef.current && streamRef.current) {
            setTimeout(() => startListening(streamRef.current), 500);
          }
          return;
        }
        
        // Voice Command: Transfer to agent
        if (lowerText.includes('transfer') || lowerText.includes('human agent') || lowerText.includes('speak to agent')) {
          const transferMsg = "I understand you'd like to speak with a human agent. Transferring your call now. Please hold.";
          setIsSpeaking(true);
          await speakTextDirectly(transferMsg);
          setIsSpeaking(false);
          // In real implementation, this would trigger actual transfer
          await endVoiceCall(false);
          return;
        }
        
        // Check if user wants to end the conversation
        if (lowerText === 'end' || lowerText === 'end call' || lowerText === 'goodbye' || lowerText === 'bye' || lowerText === 'end conversation') {
          console.log("User requested to end conversation");
          await endVoiceCall(true);
          return;
        }
        
        // Send the transcript as a message
        await handleSend(transcript);
      } else {
        // Increment missed speech counter
        missedSpeechAttemptsRef.current += 1;
        console.log("No speech detected, missed attempts:", missedSpeechAttemptsRef.current);
        
        if (missedSpeechAttemptsRef.current >= 3) {
          // After 3 missed attempts, ask if user is there
          const checkMessage = "Are you there? I haven't heard you speak. Please say something if you're still on the call.";
          setMessages(prev => [...prev, { 
            text: checkMessage, 
            sender: 'bot' 
          }]);
          setIsSpeaking(true);
          await speakTextDirectly(checkMessage);
          setIsSpeaking(false);
          missedSpeechAttemptsRef.current = 0; // Reset counter after prompt
        }
        
        console.log("Continuing to listen...");
        if (isCallActiveRef.current && streamRef.current) {
          setTimeout(() => startListening(streamRef.current), 500);
        }
      }
    } catch (err) {
      console.error("STT error:", err);
      if (isCallActiveRef.current && streamRef.current) {
        // Restart listening if error occurred
        setTimeout(() => startListening(streamRef.current), 500);
      }
    }
  };



  // --- 4. OLD RECORDING FUNCTION (kept for backward compatibility) ---
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
  // RENDER HELPER FUNCTIONS
  // ----------------------------------------------------
  
  const renderHistoryView = () => (
    <div className="flex flex-col h-full">
      <div className="bg-dark-elevated p-6 rounded-t-2xl border-t-4 border-gradient-to-r from-accent-primary via-accent-secondary to-accent-tertiary shadow-dark">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent mb-2">
          Conversation History
        </h2>
        <p className="text-gray-400 text-sm">{conversationHistory.length} conversations</p>
      </div>
      <div className="flex-1 overflow-y-auto bg-dark-surface p-6 custom-scrollbar">
        {conversationHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-2xl text-gray-400 mb-2">No conversations yet</p>
            <p className="text-sm text-gray-500">Start a voice call to create history</p>
          </div>
        ) : (
          conversationHistory.map((session) => (
            <div 
              key={session.sessionId || session._id} 
              className="bg-dark-elevated p-6 rounded-xl mb-4 border border-accent-primary/20 shadow-dark transition-all duration-300 hover:translate-x-2 hover:border-accent-primary/60 hover:shadow-neon group"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-accent-primary font-semibold text-shadow-[0_0_10px_rgba(0,212,255,0.5)]">
                  {new Date(session.timestamp).toLocaleString()}
                </span>
                <span className="bg-gradient-to-r from-accent-primary to-accent-secondary px-3 py-1 rounded-full text-white text-sm font-medium shadow-[0_4px_15px_rgba(0,212,255,0.4)]">
                  {Math.floor(session.duration / 60)}m {session.duration % 60}s
                </span>
              </div>
              <div className="space-y-3">
                {session.messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-lg border-l-4 transition-all duration-300 hover:translate-x-1 ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-accent-primary/10 to-transparent border-accent-primary' 
                        : 'bg-dark-surface border-accent-secondary'
                    }`}
                  >
                    <strong className={msg.role === 'user' ? 'text-accent-primary' : 'text-accent-secondary'}>
                      {msg.role === 'user' ? 'You' : 'AI'}:
                    </strong> 
                    <span className="text-gray-300 ml-2">{msg.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="bg-dark-elevated p-6 rounded-t-2xl border-t-4 border-gradient-to-r from-accent-primary via-accent-secondary to-accent-tertiary shadow-dark mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
          Analytics Dashboard
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 mb-8">
        <div className="relative bg-dark-elevated p-6 rounded-2xl border border-accent-primary/20 shadow-dark transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-neon group overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" 
               style={{background: 'conic-gradient(from 0deg, transparent, #00d4ff, transparent 30%)'}}></div>
          <div className="relative z-10">
            <div className="text-5xl mb-4 animate-float drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]">📞</div>
            <div className="text-4xl font-extrabold text-white mb-3 bg-gradient-to-br from-accent-primary to-accent-tertiary bg-clip-text text-transparent">
              {analytics.totalCalls}
            </div>
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Total Calls</div>
          </div>
        </div>
        <div className="relative bg-dark-elevated p-6 rounded-2xl border border-accent-primary/20 shadow-dark transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-neon group overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" 
               style={{background: 'conic-gradient(from 0deg, transparent, #00d4ff, transparent 30%)'}}></div>
          <div className="relative z-10">
            <div className="text-5xl mb-4 animate-float drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]">⏱️</div>
            <div className="text-4xl font-extrabold text-white mb-3 bg-gradient-to-br from-accent-primary to-accent-tertiary bg-clip-text text-transparent">
              {Math.floor(analytics.totalDuration / 60)}m
            </div>
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Total Duration</div>
          </div>
        </div>
        <div className="relative bg-dark-elevated p-6 rounded-2xl border border-accent-primary/20 shadow-dark transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-neon group overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" 
               style={{background: 'conic-gradient(from 0deg, transparent, #00d4ff, transparent 30%)'}}></div>
          <div className="relative z-10">
            <div className="text-5xl mb-4 animate-float drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]">📊</div>
            <div className="text-4xl font-extrabold text-white mb-3 bg-gradient-to-br from-accent-primary to-accent-tertiary bg-clip-text text-transparent">
              {analytics.avgCallDuration}s
            </div>
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Avg Call Duration</div>
          </div>
        </div>
        <div className="relative bg-dark-elevated p-6 rounded-2xl border border-accent-primary/20 shadow-dark transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-neon group overflow-hidden">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" 
               style={{background: 'conic-gradient(from 0deg, transparent, #00d4ff, transparent 30%)'}}></div>
          <div className="relative z-10">
            <div className="text-5xl mb-4 animate-float drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]">📅</div>
            <div className="text-4xl font-extrabold text-white mb-3 bg-gradient-to-br from-accent-primary to-accent-tertiary bg-clip-text text-transparent">
              {analytics.callsToday}
            </div>
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Calls Today</div>
          </div>
        </div>
      </div>
      <div className="bg-dark-elevated mx-6 mb-6 p-10 rounded-2xl shadow-dark border border-accent-primary/20">
        <h3 className="text-2xl font-bold mb-7 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
          Available Voice Commands
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-dark-surface p-5 rounded-xl border-l-4 border-accent-primary shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-300 hover:translate-x-2 hover:border-accent-tertiary hover:shadow-neon cursor-pointer">
            <strong className="block text-accent-primary mb-2 text-base font-bold drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">"Repeat"</strong>
            <span className="text-gray-400 text-sm">Replay last response</span>
          </div>
          <div className="bg-dark-surface p-5 rounded-xl border-l-4 border-accent-primary shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-300 hover:translate-x-2 hover:border-accent-tertiary hover:shadow-neon cursor-pointer">
            <strong className="block text-accent-primary mb-2 text-base font-bold drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">"Speak slower"</strong>
            <span className="text-gray-400 text-sm">Decrease speed</span>
          </div>
          <div className="bg-dark-surface p-5 rounded-xl border-l-4 border-accent-primary shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-300 hover:translate-x-2 hover:border-accent-tertiary hover:shadow-neon cursor-pointer">
            <strong className="block text-accent-primary mb-2 text-base font-bold drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">"Speak faster"</strong>
            <span className="text-gray-400 text-sm">Increase speed</span>
          </div>
          <div className="bg-dark-surface p-5 rounded-xl border-l-4 border-accent-primary shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-300 hover:translate-x-2 hover:border-accent-tertiary hover:shadow-neon cursor-pointer">
            <strong className="block text-accent-primary mb-2 text-base font-bold drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">"Normal speed"</strong>
            <span className="text-gray-400 text-sm">Reset speed</span>
          </div>
          <div className="bg-dark-surface p-5 rounded-xl border-l-4 border-accent-primary shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-300 hover:translate-x-2 hover:border-accent-tertiary hover:shadow-neon cursor-pointer">
            <strong className="block text-accent-primary mb-2 text-base font-bold drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">"Transfer"</strong>
            <span className="text-gray-400 text-sm">Connect to agent</span>
          </div>
          <div className="bg-dark-surface p-5 rounded-xl border-l-4 border-accent-primary shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-all duration-300 hover:translate-x-2 hover:border-accent-tertiary hover:shadow-neon cursor-pointer">
            <strong className="block text-accent-primary mb-2 text-base font-bold drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">"End"</strong>
            <span className="text-gray-400 text-sm">End conversation</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // MAIN RENDER
  // ----------------------------------------------------
  
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Navigation Header */}
      <div className="bg-dark-elevated border-b border-accent-primary/30 shadow-dark-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button 
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  currentView === 'voice' 
                    ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-neon' 
                    : 'text-gray-400 hover:text-accent-primary hover:bg-dark-surface'
                }`}
                onClick={() => setCurrentView('voice')}
              >
                🎤 Voice Call
              </button>
              <button 
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  currentView === 'history' 
                    ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-neon' 
                    : 'text-gray-400 hover:text-accent-primary hover:bg-dark-surface'
                }`}
                onClick={() => setCurrentView('history')}
              >
                📜 History
              </button>
              <button 
                className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  currentView === 'analytics' 
                    ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-neon' 
                    : 'text-gray-400 hover:text-accent-primary hover:bg-dark-surface'
                }`}
                onClick={() => setCurrentView('analytics')}
              >
                📊 Analytics
              </button>
            </div>
            {indexName && (
              <button 
                onClick={() => { setIndexName(null); setMessages([]); setFile(null); }}
                className="px-6 py-3 rounded-lg font-semibold text-sm bg-dark-surface text-accent-tertiary border border-accent-tertiary/30 hover:bg-accent-tertiary/10 hover:border-accent-tertiary transition-all duration-300"
              >
                New Document
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Hide messages - stored for history only */}
        <div className="hidden">
          {messages.map((msg, idx) => (
            <div key={idx}>{msg.text}</div>
          ))}
        </div>

        {/* Conditional View Rendering */}
        {currentView === 'voice' && (
          !indexName ? (
            // Upload View
            <div className="flex items-center justify-center h-full p-6">
              <div className="bg-dark-elevated p-12 rounded-3xl shadow-dark-lg border border-accent-primary/20 max-w-2xl w-full text-center relative overflow-hidden group">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow"
                     style={{background: 'conic-gradient(from 0deg, transparent, #00d4ff, transparent 30%)'}}></div>
                <div className="relative z-10">
                  <div className="text-8xl mb-6 animate-float">📄</div>
                  <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                    Upload Document First
                  </h2>
                  <p className="text-gray-400 text-lg mb-8">Upload a document to enable voice assistance</p>
                  <input
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                    id="file-input"
                  />
                  <label 
                    htmlFor="file-input" 
                    className="inline-block px-8 py-4 mb-4 bg-dark-surface text-accent-primary border-2 border-accent-primary/30 rounded-xl font-semibold cursor-pointer hover:bg-accent-primary/10 hover:border-accent-primary transition-all duration-300 shadow-lg"
                  >
                    {file ? file.name : 'Choose File'}
                  </label>
                  <button
                    onClick={handleFileUpload}
                    disabled={!file || uploadStatus === 'uploading'}
                    className="block w-full px-8 py-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-neon transition-all duration-300"
                  >
                    {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Voice Call Interface
            <div className="flex items-center justify-center h-full p-6">
              {!isCallActive ? (
                <div className="bg-dark-elevated p-16 rounded-3xl shadow-dark-lg border border-accent-primary/20 max-w-2xl w-full text-center animate-pulse-slow">
                  <div className="text-9xl mb-8 animate-float">🎤</div>
                  <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-tertiary bg-clip-text text-transparent">
                    Voice Customer Service
                  </h2>
                  <p className="text-gray-400 text-xl mb-10">Click the microphone to start a voice conversation</p>
                  <button 
                    className="px-12 py-6 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-2xl font-bold text-2xl hover:shadow-neon-lg hover:scale-105 transition-all duration-300 flex items-center gap-4 mx-auto"
                    onClick={startVoiceCall}
                  >
                    <span className="text-4xl">🎙️</span>
                    Start Voice Call
                  </button>
                </div>
              ) : (
                <div className="bg-dark-elevated p-12 rounded-3xl shadow-dark-lg border border-accent-primary/30 max-w-3xl w-full">
                  <div className="bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 p-6 rounded-2xl mb-8 backdrop-blur-sm border border-accent-primary/30 shadow-neon">
                    <div className="flex items-center justify-center gap-4 text-3xl font-mono font-bold">
                      <span className="text-accent-primary animate-glow">⏱️</span>
                      <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                        {Math.floor(callTimer / 60)}:{(callTimer % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center min-h-[300px]">
                    {isListening && (
                      <div className="text-center">
                        <div className="relative w-40 h-40 mx-auto mb-6">
                          <div className="absolute inset-0 border-4 border-neon-green rounded-full animate-ping opacity-75"></div>
                          <div className="absolute inset-4 border-4 border-neon-green rounded-full animate-ping opacity-50" style={{animationDelay: '0.3s'}}></div>
                          <div className="absolute inset-8 border-4 border-neon-green rounded-full animate-ping opacity-25" style={{animationDelay: '0.6s'}}></div>
                        </div>
                        <span className="text-2xl font-semibold text-neon-green drop-shadow-[0_0_20px_rgba(0,255,136,0.8)]">
                          Listening...
                        </span>
                      </div>
                    )}
                    {isSpeaking && (
                      <div className="text-center">
                        <div className="flex items-end justify-center gap-3 h-24 mb-6">
                          <span className="w-3 h-8 bg-gradient-to-t from-accent-primary to-accent-secondary rounded-full animate-wave" style={{animationDelay: '0s'}}></span>
                          <span className="w-3 h-16 bg-gradient-to-t from-accent-primary to-accent-secondary rounded-full animate-wave" style={{animationDelay: '0.15s'}}></span>
                          <span className="w-3 h-24 bg-gradient-to-t from-accent-primary to-accent-secondary rounded-full animate-wave" style={{animationDelay: '0.3s'}}></span>
                          <span className="w-3 h-16 bg-gradient-to-t from-accent-primary to-accent-secondary rounded-full animate-wave" style={{animationDelay: '0.45s'}}></span>
                          <span className="w-3 h-8 bg-gradient-to-t from-accent-primary to-accent-secondary rounded-full animate-wave" style={{animationDelay: '0.6s'}}></span>
                        </div>
                        <span className="text-2xl font-semibold text-accent-primary drop-shadow-[0_0_20px_rgba(0,212,255,0.8)]">
                          Speaking...
                        </span>
                      </div>
                    )}
                    {!isListening && !isSpeaking && (
                      <div className="text-center">
                        <div className="w-20 h-20 border-8 border-accent-primary border-t-accent-secondary rounded-full animate-spin mx-auto mb-6 shadow-neon"></div>
                        <span className="text-2xl font-semibold text-accent-primary drop-shadow-[0_0_20px_rgba(0,212,255,0.8)]">
                          Processing...
                        </span>
                      </div>
                    )}
                  </div>
                  <button 
                    className="w-full mt-8 px-8 py-5 bg-gradient-to-r from-accent-tertiary to-red-600 text-white rounded-2xl font-bold text-xl hover:shadow-neon-pink hover:scale-105 transition-all duration-300 flex items-center justify-center gap-4"
                    onClick={() => endVoiceCall(true)}
                  >
                    <span className="text-3xl">📵</span>
                    End Call
                  </button>
                </div>
              )}
            </div>
          )
        )}
        {currentView === 'history' && renderHistoryView()}
        {currentView === 'analytics' && renderAnalyticsView()}
      </div>

      {/* Floating Text Chat Button */}
      <button
        onClick={() => setIsTextChatOpen(!isTextChatOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-full shadow-neon-lg hover:scale-110 transition-all duration-300 flex items-center justify-center text-3xl z-50"
        title="Open Text Chat"
      >
        {isTextChatOpen ? '✕' : '💬'}
      </button>

      {/* Text Chat Modal */}
      {isTextChatOpen && (
        <div className="fixed bottom-28 right-8 w-96 h-[600px] bg-dark-elevated rounded-2xl shadow-dark-lg border border-accent-primary/30 flex flex-col z-50 animate-float">
          {/* Header */}
          <div className="bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 p-4 rounded-t-2xl border-b border-accent-primary/30">
            <h3 className="text-xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
              💬 Text Chat
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {indexName ? 'Chat about your uploaded document' : 'Upload a document first'}
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {textChatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <div className="text-6xl mb-4 opacity-50">💭</div>
                  <p className="text-gray-400">Start a conversation!</p>
                  <p className="text-xs text-gray-500 mt-2">Type your message below</p>
                </div>
              </div>
            ) : (
              textChatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-neon'
                        : 'bg-dark-card text-gray-200 border border-accent-primary/20'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isTextChatLoading && (
              <div className="flex justify-start">
                <div className="bg-dark-card p-3 rounded-2xl border border-accent-primary/20">
                  <div className="flex gap-2">
                    <span className="w-2 h-2 bg-accent-primary rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-accent-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={textChatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-accent-primary/30">
            <div className="flex gap-2">
              <input
                type="text"
                value={textChatInput}
                onChange={(e) => setTextChatInput(e.target.value)}
                onKeyPress={handleTextChatKeyPress}
                placeholder="Type your message..."
                disabled={isTextChatLoading}
                className="flex-1 px-4 py-3 bg-dark-card border border-accent-primary/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary focus:shadow-neon transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendTextMessage}
                disabled={!textChatInput.trim() || isTextChatLoading}
                className="px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-xl font-semibold hover:shadow-neon transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTextChatLoading ? '⏳' : '📤'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
