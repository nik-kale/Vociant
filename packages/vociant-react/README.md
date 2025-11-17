# @vociant/react

React hooks and components for integrating Vociant voice agents into your React applications.

## Installation

```bash
npm install @vociant/react
```

## Quick Start

### Using the Widget Component

The simplest way to add voice agents to your React app:

```tsx
import { VociantWidget } from '@vociant/react';

function App() {
  return (
    <div>
      <h1>My App</h1>
      <VociantWidget
        baseUrl="https://your-vociant-instance.com"
        agentId="your-agent-slug"
        position="bottom-right"
        theme={{
          primaryColor: '#3b82f6',
          textColor: '#ffffff',
        }}
        greeting="Hi! How can I help you today?"
      />
    </div>
  );
}
```

### Using the useVociant Hook

For custom UI implementations:

```tsx
import { useVociant } from '@vociant/react';

function CustomVoiceAgent() {
  const {
    connect,
    disconnect,
    sendMessage,
    isConnected,
    isSpeaking,
    isListening,
    history,
  } = useVociant({
    baseUrl: 'https://your-vociant-instance.com',
    agentId: 'your-agent-slug',
    autoConnect: false,
  });

  return (
    <div>
      <button onClick={connect} disabled={isConnected}>
        Connect
      </button>
      <button onClick={disconnect} disabled={!isConnected}>
        Disconnect
      </button>

      <div>
        Status: {isSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Idle'}
      </div>

      <div>
        {history.map((turn, index) => (
          <div key={index}>
            {turn.userMessage && <p>You: {turn.userMessage}</p>}
            {turn.assistantMessage && <p>Agent: {turn.assistantMessage}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Components

### VociantWidget

Pre-built widget component with customizable UI.

**Props:**

```tsx
interface VociantWidgetProps {
  baseUrl: string;
  agentId: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: {
    primaryColor?: string;
    textColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    borderRadius?: number;
  };
  greeting?: string;
  avatarUrl?: string;
  autoStart?: boolean;
  token?: string; // For signed URL authentication
  variables?: Record<string, any>; // Dynamic variables
  debug?: boolean;
}
```

### VociantProvider

Context provider for sharing configuration across multiple components:

```tsx
import { VociantProvider, useVociantContext } from '@vociant/react';

function App() {
  return (
    <VociantProvider
      config={{
        baseUrl: 'https://your-vociant-instance.com',
        agentId: 'your-agent-slug',
      }}
    >
      <YourComponents />
    </VociantProvider>
  );
}

function YourComponents() {
  const { config } = useVociantContext();
  // Use shared config
}
```

## Hooks

### useVociant

Main hook for managing voice agent connection and state.

**Options:**

```tsx
interface UseVociantOptions {
  baseUrl: string;
  agentId: string;
  token?: string;
  autoConnect?: boolean;
  autoStart?: boolean;
  debug?: boolean;
  variables?: Record<string, any>;
}
```

**Returns:**

```tsx
interface UseVociantReturn {
  client: VociantClient | null;
  connectionState: ConnectionState;
  history: ConversationTurn[];
  isSpeaking: boolean;
  isListening: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  isConnected: boolean;
}
```

### useVociantWidget

Hook for managing widget lifecycle programmatically:

```tsx
import { useVociantWidget } from '@vociant/react';

function App() {
  useVociantWidget({
    baseUrl: 'https://your-vociant-instance.com',
    agentId: 'your-agent-slug',
    enabled: true, // Can be toggled dynamically
  });

  return <div>Your App</div>;
}
```

## Examples

### Custom UI with Transcript

```tsx
import { useVociant } from '@vociant/react';
import { useState } from 'react';

function VoiceChat() {
  const { connect, disconnect, history, isConnected, isSpeaking } = useVociant({
    baseUrl: process.env.REACT_APP_VOCIANT_URL,
    agentId: 'support-agent',
  });

  return (
    <div className="voice-chat">
      <div className="header">
        <h2>Support Chat</h2>
        {isConnected ? (
          <button onClick={disconnect}>End Call</button>
        ) : (
          <button onClick={connect}>Start Call</button>
        )}
      </div>

      <div className="transcript">
        {history.map((turn, idx) => (
          <div key={idx} className="turn">
            {turn.userMessage && (
              <div className="user-message">{turn.userMessage}</div>
            )}
            {turn.assistantMessage && (
              <div className="agent-message">{turn.assistantMessage}</div>
            )}
          </div>
        ))}
      </div>

      {isSpeaking && <div className="indicator">Agent is speaking...</div>}
    </div>
  );
}
```

### Conditional Widget Display

```tsx
import { VociantWidget } from '@vociant/react';
import { useState } from 'react';

function App() {
  const [showWidget, setShowWidget] = useState(false);

  return (
    <div>
      <button onClick={() => setShowWidget(!showWidget)}>
        Toggle Voice Support
      </button>

      {showWidget && (
        <VociantWidget
          baseUrl={process.env.REACT_APP_VOCIANT_URL}
          agentId="support-agent"
          greeting="Hi! Need help?"
        />
      )}
    </div>
  );
}
```

### With Dynamic Variables

```tsx
import { VociantWidget } from '@vociant/react';

function ProductSupport({ productId, userId }) {
  return (
    <VociantWidget
      baseUrl={process.env.REACT_APP_VOCIANT_URL}
      agentId="product-support"
      variables={{
        product_id: productId,
        user_id: userId,
      }}
      greeting={`Hi! I can help you with product #${productId}`}
    />
  );
}
```

## TypeScript

Full TypeScript support with comprehensive type definitions:

```tsx
import type {
  VociantConfig,
  ConversationTurn,
  ConnectionState,
} from '@vociant/react';
```

## Next.js Support

For Next.js applications, use dynamic imports to avoid SSR issues:

```tsx
import dynamic from 'next/dynamic';

const VociantWidget = dynamic(
  () => import('@vociant/react').then((mod) => mod.VociantWidget),
  { ssr: false }
);

export default function Page() {
  return (
    <div>
      <VociantWidget
        baseUrl={process.env.NEXT_PUBLIC_VOCIANT_URL}
        agentId="support-agent"
      />
    </div>
  );
}
```

## License

MIT
