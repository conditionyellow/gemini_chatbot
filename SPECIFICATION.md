# GEMINI CHATBOT WITH LIVE2D PERSONAS - SYSTEM SPECIFICATION

## PROJECT OVERVIEW

This is an AI chatbot system that integrates Google Gemini API with Live2D character models, featuring multiple distinct personas with unique personalities and visual representations. The system is deployed on Google Cloud Run and provides an interactive chat interface with animated characters.

## ARCHITECTURE

### Frontend
- **HTML/CSS/JavaScript** - Interactive web interface
- **PIXI.js** - Graphics rendering engine for Live2D models
- **PIXI Live2D Display** - Live2D model integration library
- **Live2D Cubism Core** - Live2D runtime engine

### Backend
- **Google Cloud Run** - Serverless deployment platform
- **Node.js/Express** - Backend API server
- **Google Gemini API** - AI language model
- **@google/generative-ai** - Official Gemini JavaScript SDK

## SYSTEM COMPONENTS

### 1. Live2D Character Models

#### Available Characters:
- **Natori** - Gentle and intellectual female assistant
- **Mark** - Cool and logical male assistant  
- **Hiyori** - Bright and energetic girl
- **Kei** - Calm and literary female character
- **Miku** - Energetic music-loving character
- **Simple** - Minimalist practical character
- **Epsilon** - Scientific and futuristic character
- **Hibiki** - Additional character model

#### Model Structure:
```
models/live2d/{character}/runtime/
├── {character}.model3.json     # Model definition
├── {character}.moc3            # Model data
├── {character}.4096/           # Textures
│   └── texture_00.png
├── motions/                    # Motion data
│   ├── mtn_00.motion3.json
│   ├── mtn_01.motion3.json
│   └── mtn_02.motion3.json
├── {character}.pose3.json      # Pose data (optional)
└── {character}.physics3.json   # Physics simulation (optional)
```

### 2. Persona System

Each Live2D model has an associated persona with:
- **Unique personality traits**
- **Specialized knowledge areas**
- **Distinct speaking styles**
- **Custom system prompts for Gemini API**
- **Character-specific greetings**

#### Persona Configuration Example:
```javascript
{
    id: 'natori',
    name: 'ナトリ',
    personality: '優しくて知的な女性。親しみやすく、丁寧な言葉遣いを心がける。',
    specialties: ['日常会話', '学習サポート', '心理カウンセリング'],
    speakingStyle: '敬語を基調としつつも親しみやすい口調',
    greeting: 'こんにちは！ナトリです。何かお困りのことがあれば、お気軽にお話しくださいね。',
    systemPrompt: 'あなたは「ナトリ」という名前の優しくて知的なAIアシスタント...'
}
```

### 3. Google Cloud Run Service

**Endpoint:** `https://gemini-chatbot-proxy-770321957231.asia-northeast1.run.app`

#### API Endpoints:
- **POST /chat** - Main chat endpoint
- **GET /** - Health check endpoint

#### Request Format:
```json
{
    "message": "User message text",
    "history": [
        {"role": "user", "parts": [{"text": "Previous user message"}]},
        {"role": "model", "parts": [{"text": "Previous bot response"}]}
    ],
    "systemInstruction": "Character-specific system prompt"
}
```

#### Response Format:
```json
{
    "success": true,
    "response": "Generated response text",
    "history": [...] // Updated conversation history
}
```

## KEY FEATURES

### 1. Live2D Model Integration
- **Model Loading** - Dynamic loading of Live2D models from JSON definitions
- **Animation System** - Motion playback on click, idle animations, speaking animations
- **Interactive Elements** - Click-to-interact with motion responses
- **Model Switching** - Real-time character switching with preserved chat history

### 2. Chat Functionality
- **Gemini API Integration** - Advanced language model responses
- **Persona-Aware Responses** - Character-specific personality and knowledge
- **Conversation History** - Persistent chat memory during session
- **Message Display** - User and bot message bubbles with timestamps

### 3. Production Features
- **Error Handling** - Comprehensive error catching and logging
- **Debug Interface** - Hidden debug log monitor (display:none in production)
- **Cross-Origin Support** - CORS headers for frontend-backend communication
- **Responsive Design** - Mobile and desktop compatible interface

## TECHNICAL IMPLEMENTATION

### Frontend Architecture

#### Core JavaScript Functions:
```javascript
// Model and persona management
getModelIdFromPath(modelPath)        // Extract model ID from file path
updateCharacterInfoUI()              // Update character display information
initializeLive2D(modelPath)          // Initialize Live2D model

// Chat system
handleSendMessage()                  // Process user input and API calls
addMessageToDisplay(role, text)      // Add message to chat interface
addMessageToInternalHistory(role, text) // Manage conversation history

// Live2D interactions
playRandomMotion()                   // Trigger random character animation
playIdleMotion()                     // Background idle animations
playSpeakingMotion()                 // Animation during bot responses
```

#### Model Loading Process:
1. Load model definition from JSON file
2. Create PIXI.js application and stage
3. Initialize Live2D model with pixi-live2d-display
4. Set up event listeners for interactions
5. Configure animation systems (motion, physics, expressions)

### Backend Architecture

#### Chat Processing Flow:
1. Receive chat request with message, history, and system instruction
2. Validate and sanitize input data
3. Apply chat history safeguards (ensure proper role ordering)
4. Initialize Gemini model with system instruction
5. Generate response using conversation history
6. Return formatted response with updated history

#### Critical Safeguards:
```javascript
// Gemini API requires chat history to start with 'user' role when system instruction is present
if (finalHistoryForGemini.length > 0 && finalHistoryForGemini[0].role === 'model') {
    const firstUserMessageIndex = finalHistoryForGemini.findIndex(msg => msg.role === 'user');
    if (firstUserMessageIndex !== -1) {
        finalHistoryForGemini = finalHistoryForGemini.slice(firstUserMessageIndex);
    } else {
        finalHistoryForGemini = [];
    }
}
```

## RESOLVED ISSUES

### 1. Chat History API Compliance ✅
- **Problem**: Gemini API rejected chat history starting with 'model' role
- **Solution**: Backend safeguard to detect and fix improper role ordering
- **Implementation**: Remove initial bot greetings from API history

### 2. Persona Differentiation ✅
- **Problem**: "Epsilon" character was using "Natori" persona due to case-sensitivity
- **Solution**: Added toLowerCase() normalization in model path recognition
- **Result**: All characters now use correct personas

### 3. Production Interface Cleanup ✅
- **Problem**: Debug elements visible in production
- **Solution**: Added `display:none` styles to debug log and test buttons
- **Result**: Clean production interface

### 4. API Endpoint Configuration ✅
- **Problem**: Frontend was calling root URL instead of /chat endpoint
- **Solution**: Updated frontend to use correct `/chat` endpoint
- **Result**: Proper API communication

## DEPLOYMENT STATUS

### Current Deployment:
- **Service Name**: gemini-chatbot-proxy
- **Region**: asia-northeast1  
- **URL**: https://gemini-chatbot-proxy-770321957231.asia-northeast1.run.app
- **Status**: ✅ Active and functional
- **Last Deployed**: Recently updated with all fixes

### Deployment Configuration:
```json
{
    "name": "gemini-chatbot-personas",
    "version": "1.0.0",
    "main": "index.js",
    "engines": { "node": ">=18.0.0" }
}
```

## FILE STRUCTURE

```
gemini_chatbot/
├── index.html                      # Main web interface
├── script.js                       # Frontend JavaScript logic
├── style.css                       # Styling and layout
├── favicon.ico                     # Site icon
├── SPECIFICATION.md                # This document
│
├── cloud-function/                 # Backend service
│   ├── index.js                    # Cloud Run server code
│   ├── package.json                # Node.js dependencies
│   └── package-lock.json           # Dependency lock file
│
├── models/live2d/                  # Live2D character models
│   ├── natori_pro/                 # Natori character
│   ├── mark/                       # Mark character
│   ├── hiyori/                     # Hiyori character
│   ├── kei/                        # Kei character
│   ├── miku/                       # Miku character
│   ├── simple/                     # Simple character
│   ├── Epsilon/                    # Epsilon character
│   └── hibiki/                     # Hibiki character
│
├── libs/                           # Live2D integration libraries
│   └── pixi-live2d-display-master/ # PIXI Live2D Display library
│
└── docs/                           # Documentation
    └── LIVE2D_IMPLEMENTATION.md    # Live2D technical documentation
```

## TESTING AND VALIDATION

### Validated Features:
- ✅ All Live2D models load correctly
- ✅ Character switching works properly
- ✅ Persona differentiation functioning
- ✅ Chat API integration stable
- ✅ Google Cloud Run deployment active
- ✅ Error handling in place
- ✅ Cross-platform compatibility

### Performance Metrics:
- **Model Loading Time**: ~2-3 seconds per character
- **API Response Time**: ~1-3 seconds depending on query complexity
- **Memory Usage**: Optimized for web browser constraints
- **Mobile Compatibility**: Responsive design implemented

## FUTURE ENHANCEMENTS

### Potential Improvements:
1. **Voice Integration** - Add text-to-speech for character voices
2. **Advanced Animations** - More sophisticated Live2D motion sequences
3. **Memory Persistence** - Save conversation history across sessions
4. **Multi-language Support** - International language options
5. **Custom Personas** - User-defined character personalities
6. **Real-time Collaboration** - Multi-user chat sessions

### Technical Optimizations:
1. **Model Preloading** - Cache frequently used models
2. **Compression** - Optimize model file sizes
3. **CDN Integration** - Faster global content delivery
4. **Analytics** - Usage tracking and performance monitoring

## MAINTENANCE NOTES

### Regular Maintenance Tasks:
- Monitor Google Cloud Run service health
- Update Gemini API dependencies when new versions are released
- Review and optimize chat response quality
- Update Live2D library if newer versions become available
- Monitor API usage costs and quotas

### Security Considerations:
- API key protection through environment variables
- CORS configuration for trusted domains only
- Input sanitization for chat messages
- Rate limiting for API calls (future implementation)

## DEVELOPMENT TEAM NOTES

### Key Implementation Decisions:
1. **Persona System**: Chose to implement client-side persona mapping for real-time switching
2. **Live2D Integration**: Used PIXI.js for optimal web performance
3. **Backend Architecture**: Serverless Cloud Run for scalability and cost efficiency
4. **Chat History Management**: Client-side history with server-side safeguards

### Known Limitations:
1. **Model Size**: Large Live2D models may have longer loading times
2. **Browser Compatibility**: Requires modern browsers with WebGL support
3. **Mobile Performance**: May be slower on older mobile devices
4. **Session Persistence**: Chat history is not saved between browser sessions

---

**Document Version**: 1.0  
**Last Updated**: Current  
**Status**: Production Ready ✅
