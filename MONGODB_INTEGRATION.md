# MongoDB Integration - Conversation History & Analytics

## Overview
The application now stores conversation history and analytics data in MongoDB instead of localStorage, providing persistent storage across sessions and devices.

## Backend Changes (main.py)

### New Collections
1. **conversations_collection** - Stores individual call sessions
2. **analytics_collection** - Stores aggregated analytics data

### New Pydantic Models
```python
class MessageModel(BaseModel):
    role: str  # 'user' or 'bot'
    text: str
    timestamp: str

class ConversationRequest(BaseModel):
    sessionId: str
    timestamp: str
    duration: int  # in seconds
    messageCount: int
    messages: List[MessageModel]
    userId: Optional[str]

class AnalyticsData(BaseModel):
    totalCalls: int
    totalDuration: int  # in seconds
    avgCallDuration: float
    callsToday: int
    lastUpdated: str
```

### New API Endpoints

#### POST /save-conversation
Saves a conversation session to MongoDB after call ends.

**Request Body:**
```json
{
  "sessionId": "uuid-string",
  "timestamp": "2024-01-01T10:00:00.000Z",
  "duration": 120,
  "messageCount": 6,
  "messages": [
    {
      "role": "user",
      "text": "Hello",
      "timestamp": "2024-01-01T10:00:00.000Z"
    },
    {
      "role": "bot",
      "text": "Hi, how can I help?",
      "timestamp": "2024-01-01T10:00:05.000Z"
    }
  ],
  "userId": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation saved successfully",
  "id": "mongodb-object-id"
}
```

#### GET /get-conversations?limit=50
Retrieves conversation history from MongoDB.

**Query Parameters:**
- `limit` (optional): Number of conversations to retrieve (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "conversations": [
    {
      "_id": "mongodb-object-id",
      "sessionId": "uuid-string",
      "timestamp": "2024-01-01T10:00:00.000Z",
      "duration": 120,
      "messageCount": 6,
      "messages": [...],
      "userId": null,
      "createdAt": "2024-01-01T10:02:00.000Z"
    }
  ],
  "count": 1
}
```

#### POST /save-analytics
Updates analytics data in MongoDB (upsert pattern).

**Request Body:**
```json
{
  "totalCalls": 10,
  "totalDuration": 1200,
  "avgCallDuration": 120,
  "callsToday": 3,
  "lastUpdated": "2024-01-01T10:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Analytics saved successfully"
}
```

#### GET /get-analytics
Retrieves current analytics data.

**Response:**
```json
{
  "success": true,
  "analytics": {
    "_id": "mongodb-object-id",
    "totalCalls": 10,
    "totalDuration": 1200,
    "avgCallDuration": 120,
    "callsToday": 3,
    "lastUpdated": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

## Frontend Changes (Chatbot.js)

### Updated Functions

#### fetchConversationHistory()
- Fetches conversation history from MongoDB on component mount
- Called after each conversation is saved
- Replaces localStorage.getItem('conversationHistory')

#### fetchAnalytics()
- Fetches analytics data from MongoDB on component mount
- Called after analytics are updated
- Replaces localStorage.getItem('analytics')

#### saveConversationToHistory() (now async)
- POSTs conversation data to `/save-conversation` endpoint
- Calls `fetchConversationHistory()` to refresh UI
- Calls `updateAnalytics()` to update statistics
- No longer uses localStorage.setItem()

#### updateAnalytics() (now async)
- POSTs analytics data to `/save-analytics` endpoint
- Calls `fetchAnalytics()` to refresh UI
- No longer uses localStorage.setItem()

### Data Flow

1. **On Component Mount:**
   - `fetchConversationHistory()` → GET /get-conversations
   - `fetchAnalytics()` → GET /get-analytics
   - UI updates with MongoDB data

2. **On Call End:**
   - `saveConversationToHistory()` → POST /save-conversation
   - `fetchConversationHistory()` → GET /get-conversations (refresh)
   - `updateAnalytics()` → POST /save-analytics
   - `fetchAnalytics()` → GET /get-analytics (refresh)
   - UI updates with latest data

### Render Updates

#### renderHistoryView()
- Updated to use `session.sessionId || session._id` as key
- Updated to use `msg.role` instead of `msg.sender`
- Supports both localStorage format and MongoDB format

## Data Migration

### Old Format (localStorage)
```javascript
{
  id: "uuid-string",
  timestamp: "2024-01-01T10:00:00.000Z",
  duration: 120,
  messages: [
    { sender: 'user', text: 'Hello' },
    { sender: 'bot', text: 'Hi!' }
  ],
  messageCount: 2
}
```

### New Format (MongoDB)
```javascript
{
  _id: ObjectId("..."),
  sessionId: "uuid-string",
  timestamp: "2024-01-01T10:00:00.000Z",
  duration: 120,
  messages: [
    { role: 'user', text: 'Hello', timestamp: '...' },
    { role: 'bot', text: 'Hi!', timestamp: '...' }
  ],
  messageCount: 2,
  userId: null,
  createdAt: "2024-01-01T10:02:00.000Z"
}
```

## Benefits

1. **Persistence**: Data survives browser cache clear and device changes
2. **Scalability**: MongoDB can handle large volumes of conversations
3. **Multi-device**: Access same history from any device with authentication
4. **Analytics**: Aggregate analytics across all users
5. **Backup**: Automatic MongoDB backup and replication
6. **Security**: Server-side data storage with proper authentication

## Testing

To test the integration:

1. Start a voice call
2. Have a conversation
3. End the call
4. Check browser console for "Conversation saved to MongoDB" and "Analytics saved to MongoDB"
5. Navigate to History tab - should show the conversation
6. Navigate to Analytics tab - should show updated metrics
7. Refresh the page - data should persist from MongoDB
8. Check MongoDB database for `conversations` and `analytics` collections

## Environment Variables Required

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGO_DB_NAME=your_database_name
MONGO_USERS_COLLECTION=users
```

## Future Enhancements

1. Add user authentication to link conversations to specific users
2. Add search/filter functionality for conversation history
3. Add export functionality (CSV, PDF)
4. Add analytics charts with date ranges
5. Add conversation tagging and categorization
6. Add sentiment analysis for conversations
7. Implement pagination for large conversation lists
