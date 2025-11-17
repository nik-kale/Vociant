# @vociant/sdk-js

Vanilla JavaScript SDK for integrating Vociant voice agents into your web applications.

## Installation

```bash
npm install @vociant/sdk-js
```

Or use via CDN:

```html
<script src="https://unpkg.com/@vociant/sdk-js@latest/dist/index.umd.js"></script>
```

## Quick Start

### Using the Widget (Easiest)

The widget provides a pre-built UI for voice agent interaction:

```javascript
import { VociantWidget } from '@vociant/sdk-js';

const widget = new VociantWidget({
  baseUrl: 'https://your-vociant-instance.com',
  agentId: 'your-agent-slug',
  position: 'bottom-right',
  theme: {
    primaryColor: '#3b82f6',
    textColor: '#ffffff',
    backgroundColor: '#ffffff',
  },
  greeting: 'Hi! How can I help you today?',
  autoStart: false,
});
```

### Using the Client (Advanced)

For custom integrations, use the VociantClient directly:

```javascript
import { VociantClient } from '@vociant/sdk-js';

const client = new VociantClient({
  baseUrl: 'https://your-vociant-instance.com',
  agentId: 'your-agent-slug',
  debug: true,
});

// Listen for events
client.on('connected', () => {
  console.log('Connected to agent');
});

client.on('message', (data) => {
  console.log(`${data.role}: ${data.text}`);
});

client.on('error', (error) => {
  console.error('Error:', error);
});

// Connect to the agent
await client.connect();

// Send a text message
client.sendMessage('Hello, agent!');

// Disconnect when done
client.disconnect();
```

## Widget Configuration

### Position

Control where the widget appears on screen:

- `bottom-right` (default)
- `bottom-left`
- `top-right`
- `top-left`

### Theme Customization

```javascript
{
  theme: {
    primaryColor: '#3b82f6',  // Main widget color
    textColor: '#ffffff',      // Text on primary color
    backgroundColor: '#ffffff',// Widget background
    fontFamily: 'Arial, sans-serif',
    borderRadius: 12,          // Border radius in pixels
  }
}
```

### Content Options

```javascript
{
  greeting: 'Welcome! How can I assist you?',
  avatarUrl: 'https://example.com/avatar.png',
  autoStart: true, // Auto-open and connect
}
```

## Events

The VociantClient emits the following events:

- `ready` - SDK is ready
- `connected` - Connected to agent
- `disconnected` - Disconnected from agent
- `message` - New message (user or assistant)
- `speaking` - Agent is speaking
- `listening` - Agent is listening
- `turn-start` - Conversation turn started
- `turn-end` - Conversation turn ended
- `error` - Error occurred

## Audio Configuration

Configure audio input settings:

```javascript
await client.connect({
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 16000,
});
```

## Advanced Features

### Signed URL Authentication

For production deployments, use signed URLs for enhanced security:

```javascript
const client = new VociantClient({
  baseUrl: 'https://your-vociant-instance.com',
  agentId: 'your-agent-slug',
  token: 'signed-url-token', // Generated server-side
});
```

### Dynamic Variables

Pass runtime variables to your agent:

```javascript
const client = new VociantClient({
  baseUrl: 'https://your-vociant-instance.com',
  agentId: 'your-agent-slug',
  variables: {
    user_name: 'John Doe',
    order_id: '12345',
  },
});
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import { VociantWidget, VociantWidgetConfig } from '@vociant/sdk-js';

const config: VociantWidgetConfig = {
  baseUrl: 'https://your-vociant-instance.com',
  agentId: 'your-agent-slug',
  position: 'bottom-right',
};

const widget = new VociantWidget(config);
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Requires WebRTC support for real-time audio streaming.

## License

MIT
