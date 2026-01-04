import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import { formatNumberedText } from '../utils/formatHelper';

const AVATAR_USER = 'https://ui-avatars.com/api/?name=U&background=10a37f&color=fff&size=32&rounded=true&format=svg';
const AVATAR_BOT = 'https://ui-avatars.com/api/?name=AI&background=6b7280&color=fff&size=32&rounded=true&format=svg';

// ✅ CHANGED: URL to localhost
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
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const chatEndRef = useRef(null);

  // --- View State ---
  const [currentView, setCurrentView] = useState('voice'); // 'voice', 'history', 'analytics'
  
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
    
    // Load conversation history and analytics from localStorage
    const savedHistory = localStorage.getItem('conversationHistory');
    if (savedHistory) {
      setConversationHistory(JSON.parse(savedHistory));
    }
    
    const savedAnalytics = localStorage.getItem('analytics');
    if (savedAnalytics) {
      setAnalytics(JSON.parse(savedAnalytics));
    }
  }, []);

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
    setIsTyping(true);

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
    
    const newSession = {
      id: currentSessionId,
      timestamp: new Date().toISOString(),
      duration: callDuration,
      messages: [...messages],
      messageCount: messages.length
    };
    
    const updatedHistory = [newSession, ...conversationHistory].slice(0, 50); // Keep last 50 sessions
    setConversationHistory(updatedHistory);
    localStorage.setItem('conversationHistory', JSON.stringify(updatedHistory));
    
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
      topQueries: analytics.topQueries
    };
    
    setAnalytics(newAnalytics);
    localStorage.setItem('analytics', JSON.stringify(newAnalytics));
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

      {/* Voice Call Control Area */}
      <div className="voice-call-area">
        {!isCallActive ? (
          <button
            onClick={startVoiceCall}
            className="voice-call-btn start-call"
            disabled={isTyping}
          >
            <svg className="mic-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <span>Start Voice Call</span>
          </button>
        ) : (
          <div className="call-controls">
            <div className="call-status">
              {isListening && (
                <div className="listening-indicator">
                  <div className="pulse-ring"></div>
                  <svg className="mic-icon active" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                  <p>Listening...</p>
                </div>
              )}
              {isSpeaking && (
                <div className="speaking-indicator">
                  <div className="sound-wave">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>Speaking...</p>
                </div>
              )}
              {!isListening && !isSpeaking && (
                <div className="processing-indicator">
                  <div className="spinner"></div>
                  <p>Processing...</p>
                </div>
              )}
            </div>
            
            <button
              onClick={endVoiceCall}
              className="voice-call-btn end-call"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
              </svg>
              <span>End Call</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;