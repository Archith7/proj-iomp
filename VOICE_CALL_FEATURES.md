# Voice-to-Voice Customer Service Bot - Feature Updates

## Overview
The chatbot has been transformed into a fully functional speech-to-speech customer service bot with real-time voice interaction capabilities.

## New Features Implemented

### 1. **Voice Call Interface**
- After document upload and embeddings creation, the text input box is replaced with a **"Start Voice Call"** button featuring a microphone icon
- Clean, modern UI with gradient buttons and smooth animations

### 2. **Voice Call Workflow**

#### Starting the Call
- User clicks the **"Start Voice Call"** button
- Microphone access is requested from the browser
- Call session begins immediately

#### Listening Phase
- **"Ding" sound** plays when microphone starts listening
- Visual feedback with:
  - Pulsing ring animation around microphone icon
  - "Listening..." text indicator
  - Bouncing microphone icon animation
- Automatic silence detection (stops recording after 2 seconds of silence)
- **"Dong" sound** plays when microphone stops listening

#### Processing Phase
- User's speech is converted to text using Speech-to-Text (STT) API
- Text is displayed in the chat as a user message
- Query is sent to the backend with the document index
- Response is received from the backend

#### Speaking Phase
- Bot response is converted to speech using Text-to-Speech (TTS) API
- Audio is automatically played through the browser
- Visual feedback with:
  - Animated sound wave bars
  - "Speaking..." text indicator
- No manual play button needed

#### Continuous Loop
- After bot finishes speaking, microphone automatically turns back on with "ding" sound
- Cycle repeats: Listen → Process → Speak → Listen...
- Continues until user clicks **"End Call"** button

### 3. **End Call Functionality**
- Red **"End Call"** button with phone icon
- Stops all recording and playback
- Displays "Voice call ended" message
- Returns user to ready state

### 4. **Visual Indicators**

#### During Listening
- Pulsing circular ring animation
- Animated microphone icon
- "Listening..." status text

#### During Speaking
- Four animated sound wave bars
- "Speaking..." status text
- Bars animate up and down in sequence

#### During Processing
- Spinning loader animation
- "Processing..." status text

## Technical Implementation

### Audio Components
- **Ding Sound**: Plays when recording starts (microphone on)
- **Dong Sound**: Plays when recording stops (after silence detected)
- Embedded as base64 data URIs for instant loading

### Silence Detection
- Uses Web Audio API with AudioContext and AnalyserNode
- Monitors audio volume in real-time
- Automatically stops recording after 2 seconds of silence
- Prevents recording ambient noise

### State Management
- `isCallActive`: Tracks if voice call session is active
- `isListening`: Indicates microphone is recording
- `isSpeaking`: Indicates bot is speaking
- Uses refs for MediaRecorder and AudioContext management

### API Integration
- **STT Endpoint**: `${BASE_URL}/stt?language_code=en-IN`
- **Chat Endpoint**: `${BASE_URL}/chat` (with index_name)
- **TTS Endpoint**: `${BASE_URL}/tts` (with text and speaker)

### Browser Compatibility
- Uses MediaRecorder API for audio recording
- Web Audio API for silence detection
- Modern browser features (requires Chrome/Firefox/Edge)

## User Flow

1. **Upload Document** → PDF is processed and embeddings created
2. **Click "Start Voice Call"** → Microphone access granted
3. **Hear "Ding"** → Start speaking your question
4. **Stop speaking** → Hear "Dong" after 2 seconds of silence
5. **Bot processes** → STT → Backend → TTS
6. **Bot speaks answer** → Audio plays automatically
7. **Hear "Ding" again** → Ask next question or click "End Call"

## Styling Updates

### New CSS Classes
- `.voice-call-area`: Container for voice call controls
- `.voice-call-btn`: Styled button for start/end call
- `.call-controls`: Flex container for call UI
- `.listening-indicator`: Animated mic with pulse ring
- `.speaking-indicator`: Animated sound wave bars
- `.processing-indicator`: Spinner animation
- `.pulse-ring`: Expanding ring animation
- `.sound-wave`: Four bar audio visualization

### Animations
- `pulse`: Ring expansion for listening state
- `bounce`: Microphone icon bounce
- `wave`: Sound wave bars up/down animation
- `spin`: Loading spinner rotation

### Responsive Design
- Mobile-friendly interface
- Adjusts button sizes and spacing
- Maintains functionality on all screen sizes

## Benefits

1. **Hands-Free Operation**: Users can interact naturally without typing
2. **Continuous Conversation**: Automatic mic activation creates seamless dialogue
3. **Clear Audio Feedback**: Ding/dong sounds indicate recording state
4. **Visual Feedback**: Multiple animations show system state
5. **Natural Flow**: Mimics real phone conversation experience
6. **Accessibility**: Easier for users who prefer voice over text

## Future Enhancements (Optional)

- [ ] Add volume level indicator during listening
- [ ] Implement push-to-talk option alongside automatic mode
- [ ] Add language selection for multilingual support
- [ ] Include conversation history export
- [ ] Add keyboard shortcuts (spacebar to interrupt, etc.)
- [ ] Implement echo cancellation for better audio quality
- [ ] Add option to adjust silence detection threshold
- [ ] Include visual transcript with timestamps

## Testing Checklist

- [x] Document upload and embedding creation works
- [x] Voice call button appears after upload
- [x] Microphone access permission requested
- [x] Ding sound plays on recording start
- [x] Silence detection stops recording after 2 seconds
- [x] Dong sound plays on recording stop
- [x] Speech converted to text correctly
- [x] Backend receives query with index_name
- [x] Response converted to speech
- [x] Audio plays automatically
- [x] Mic reactivates after bot finishes speaking
- [x] End call button stops all activity
- [x] Visual indicators display correctly
- [x] Responsive design works on mobile

---

**Version**: 2.0  
**Last Updated**: December 18, 2025  
**Status**: ✅ Fully Implemented
