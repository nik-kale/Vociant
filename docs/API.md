# Vociant API Reference

Complete documentation for Vociant's REST and WebSocket APIs.

---

## Table of Contents

1. [Authentication](#authentication)
2. [REST API](#rest-api)
3. [WebSocket API](#websocket-api)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)

---

## Authentication

**Current State**: No authentication (development mode)

**Production**: Implement authentication middleware using NextAuth.js or custom JWT.

```typescript
// Example: Add API key header
headers: {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
```

---

## REST API

Base URL: `https://your-domain.com/api`

### Agents

#### `GET /api/agents`

List all agents.

**Response:**
```json
{
  "agents": [
    {
      "id": "clx123abc",
      "name": "Customer Support Agent",
      "slug": "customer-support-agent",
      "status": "active",
      "ttsProvider": "elevenlabs",
      "sttProvider": "deepgram",
      "llmProvider": "openai",
      "llmModel": "gpt-4-turbo-preview",
      "_count": {
        "sessions": 42,
        "agentTools": 3,
        "agentKnowledgeBases": 1
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:22:00Z"
    }
  ]
}
```

---

#### `POST /api/agents`

Create a new agent.

**Request Body:**
```json
{
  "name": "Sales Assistant",
  "description": "Helps with product inquiries and quotes",
  "systemPrompt": "You are a helpful sales assistant...",
  "ttsProvider": "elevenlabs",
  "sttProvider": "deepgram",
  "llmProvider": "openai",
  "llmModel": "gpt-4",
  "status": "draft"
}
```

**Response:**
```json
{
  "agent": {
    "id": "clx456def",
    "name": "Sales Assistant",
    "slug": "sales-assistant",
    ...
  }
}
```

---

#### `GET /api/agents/:id`

Get agent details by ID.

**Response:**
```json
{
  "agent": {
    "id": "clx123abc",
    "name": "Customer Support Agent",
    "slug": "customer-support-agent",
    "systemPrompt": "You are a helpful customer support agent...",
    "agentKnowledgeBases": [
      {
        "id": "akb123",
        "knowledgeSource": {
          "id": "ks789",
          "name": "Product Documentation",
          "type": "url",
          "status": "ready"
        }
      }
    ],
    "agentTools": [
      {
        "id": "at456",
        "tool": {
          "id": "tool123",
          "name": "check_order_status",
          "category": "server",
          "description": "Check order status in backend system"
        }
      }
    ],
    ...
  }
}
```

---

#### `PATCH /api/agents/:id`

Update an agent.

**Request Body:**
```json
{
  "systemPrompt": "Updated system prompt...",
  "status": "active",
  "silenceTimeoutMs": 3000
}
```

**Response:**
```json
{
  "agent": {
    "id": "clx123abc",
    "systemPrompt": "Updated system prompt...",
    ...
  }
}
```

---

#### `DELETE /api/agents/:id`

Delete an agent.

**Response:**
```json
{
  "success": true
}
```

---

### Sessions

#### `GET /api/sessions`

List sessions, optionally filtered by agent.

**Query Parameters:**
- `agentId` (optional): Filter sessions by agent ID

**Request:**
```
GET /api/sessions?agentId=clx123abc
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "sess789xyz",
      "agentId": "clx123abc",
      "channelType": "web",
      "status": "completed",
      "startedAt": "2024-01-20T10:15:00Z",
      "endedAt": "2024-01-20T10:18:30Z",
      "agent": {
        "id": "clx123abc",
        "name": "Customer Support Agent"
      },
      "turns": [
        {
          "id": "turn1",
          "userInput": "I need help with my order",
          "agentResponse": "I'd be happy to help! What's your order number?",
          "latencyMs": 1240,
          "llmLatencyMs": 820,
          "audioLatencyMs": 420
        }
      ]
    }
  ]
}
```

---

#### `POST /api/sessions`

Create a new session.

**Request Body:**
```json
{
  "agentId": "clx123abc",
  "channelType": "web"
}
```

**Response:**
```json
{
  "session": {
    "id": "sess999",
    "agentId": "clx123abc",
    "status": "active",
    "startedAt": "2024-01-20T15:30:00Z"
  }
}
```

---

## WebSocket API

### `/api/voice/:agentId`

Real-time voice conversation endpoint.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:3000/api/voice/customer-support-agent');
```

---

### Client → Server Messages

#### Audio Chunk

Send audio data to be transcribed.

```json
{
  "type": "audio",
  "data": ArrayBuffer,  // PCM 16-bit audio
  "sampleRate": 16000,
  "channels": 1,
  "format": "pcm"
}
```

**Example (JavaScript):**
```javascript
// Capture mic audio
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      const reader = new FileReader();
      reader.onload = () => {
        ws.send(JSON.stringify({
          type: 'audio',
          data: reader.result,
          sampleRate: 16000,
          channels: 1,
          format: 'pcm'
        }));
      };
      reader.readAsArrayBuffer(event.data);
    };
    mediaRecorder.start(100); // 100ms chunks
  });
```

---

#### Session Control

```json
{
  "type": "end_session"
}
```

---

### Server → Client Messages

#### Transcript (Partial)

Interim transcription results.

```json
{
  "type": "transcript.partial",
  "text": "Hello, how can I...",
  "timestamp": 1705761234567
}
```

---

#### Transcript (Final)

Final transcription result.

```json
{
  "type": "transcript.final",
  "text": "Hello, how can I help you today?",
  "timestamp": 1705761235789,
  "confidence": 0.95
}
```

---

#### Agent Thinking

Agent is processing the request.

```json
{
  "type": "agent.thinking",
  "turnId": "turn-abc123"
}
```

---

#### Agent Speaking

Agent has generated a response.

```json
{
  "type": "agent.speaking",
  "text": "I'd be happy to help with that!",
  "turnId": "turn-abc123"
}
```

---

#### Audio Chunk

TTS audio data.

```json
{
  "type": "audio.chunk",
  "data": ArrayBuffer,  // MP3 or PCM audio
  "format": "mp3",
  "sampleRate": 44100,
  "channels": 1,
  "turnId": "turn-abc123"
}
```

**Example (JavaScript):**
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'audio.chunk') {
    const audioContext = new AudioContext();
    const audioBuffer = message.data;

    // Decode and play
    audioContext.decodeAudioData(audioBuffer, (buffer) => {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    });
  }
};
```

---

#### Tool Execution

Tool is being executed.

```json
{
  "type": "tool.executing",
  "tool": "check_order_status",
  "turnId": "turn-abc123"
}
```

```json
{
  "type": "tool.completed",
  "tool": "check_order_status",
  "result": {
    "success": true,
    "data": { "status": "shipped", "tracking": "1Z999AA1" }
  },
  "turnId": "turn-abc123"
}
```

---

#### Error

```json
{
  "type": "error",
  "error": {
    "message": "STT provider failed: API key invalid",
    "code": "PROVIDER_ERROR"
  },
  "turnId": "turn-abc123"
}
```

---

### Complete Example Flow

```javascript
// 1. Connect
const ws = new WebSocket('ws://localhost:3000/api/voice/my-agent');

// 2. Handle server messages
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case 'transcript.partial':
      console.log('User (partial):', msg.text);
      break;

    case 'transcript.final':
      console.log('User (final):', msg.text);
      break;

    case 'agent.thinking':
      console.log('Agent is thinking...');
      break;

    case 'agent.speaking':
      console.log('Agent:', msg.text);
      break;

    case 'audio.chunk':
      playAudio(msg.data);
      break;

    case 'tool.executing':
      console.log('Executing tool:', msg.tool);
      break;
  }
};

// 3. Send audio
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      const reader = new FileReader();
      reader.onload = () => {
        ws.send(JSON.stringify({
          type: 'audio',
          data: reader.result,
          sampleRate: 16000,
          channels: 1
        }));
      };
      reader.readAsArrayBuffer(event.data);
    };
    mediaRecorder.start(100);
  });

// 4. End session
ws.send(JSON.stringify({ type: 'end_session' }));
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "error": "Agent not found",
  "code": "NOT_FOUND",
  "details": {
    "agentId": "invalid-id"
  }
}
```

---

## Rate Limiting

**Current State**: No rate limiting (development)

**Production Recommendations**:
- **REST API**: 100 requests/minute per IP
- **WebSocket**: 10 concurrent connections per user
- **Audio Upload**: Max 10MB/minute

Implement using middleware like `express-rate-limit` or Vercel Edge Config.

---

## Webhooks (Roadmap)

Future support for event webhooks:

```json
POST https://your-app.com/webhooks/vociant
{
  "event": "session.completed",
  "data": {
    "sessionId": "sess123",
    "agentId": "agent456",
    "duration": 180,
    "turns": 5
  }
}
```

---

*For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).*
