# Provider Integration Guide

Learn how to integrate custom TTS, STT, and LLM providers into Vociant.

---

## Table of Contents

1. [Overview](#overview)
2. [TTS Provider Integration](#tts-provider-integration)
3. [STT Provider Integration](#stt-provider-integration)
4. [LLM Provider Integration](#llm-provider-integration)
5. [Provider Configuration](#provider-configuration)
6. [Testing Your Provider](#testing-your-provider)

---

## Overview

Vociant's provider system is designed to be **fully extensible**. Each provider type (TTS, STT, LLM) has a well-defined interface. To add a new provider:

1. **Implement the interface** in `packages/vociant-core/src/providers/`
2. **Register in factory** (`packages/vociant-core/src/providers/index.ts`)
3. **Update type definitions** (`packages/vociant-core/src/types/index.ts`)
4. **Add to console UI** (agent builder dropdowns)

---

## TTS Provider Integration

### Interface

```typescript
// packages/vociant-core/src/providers/tts.interface.ts
export interface ITTSProvider {
  readonly name: string;

  initialize(config: TTSProviderConfig): Promise<void>;

  synthesizeStream(
    text: string,
    voice: VoiceProfile,
    config?: TTSRuntimeConfig
  ): AsyncGenerator<AudioChunk>;

  synthesize(
    text: string,
    voice: VoiceProfile,
    config?: TTSRuntimeConfig
  ): Promise<Buffer>;

  listVoices(): Promise<VoiceInfo[]>;
  getVoice(voiceId: string): Promise<VoiceInfo | null>;
  validate(): Promise<boolean>;
}
```

---

### Example: Deepgram TTS Provider

```typescript
// packages/vociant-core/src/providers/deepgram-tts.provider.ts
import { ITTSProvider, TTSProviderConfig, VoiceInfo } from './tts.interface';
import { AudioChunk, VoiceProfile, TTSRuntimeConfig } from '../types';

export class DeepgramTTSProvider implements ITTSProvider {
  readonly name = 'deepgram';
  private apiKey?: string;
  private readonly baseURL = 'https://api.deepgram.com/v1';

  async initialize(config: TTSProviderConfig): Promise<void> {
    this.apiKey = config.apiKey;
    if (!this.apiKey) {
      throw new Error('Deepgram API key required');
    }
  }

  async *synthesizeStream(
    text: string,
    voice: VoiceProfile,
    config?: TTSRuntimeConfig
  ): AsyncGenerator<AudioChunk> {
    const response = await fetch(`${this.baseURL}/speak`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model: voice.voiceId, // e.g., 'aura-asteria-en'
        encoding: 'linear16',
        sample_rate: config?.audioConfig?.sampleRate || 16000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Deepgram TTS failed: ${response.status}`);
    }

    const reader = response.body!.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      yield {
        data: Buffer.from(value),
        sampleRate: config?.audioConfig?.sampleRate || 16000,
        channels: 1,
        format: 'pcm',
        timestamp: Date.now(),
      };
    }
  }

  async synthesize(
    text: string,
    voice: VoiceProfile,
    config?: TTSRuntimeConfig
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of this.synthesizeStream(text, voice, config)) {
      chunks.push(chunk.data);
    }
    return Buffer.concat(chunks);
  }

  async listVoices(): Promise<VoiceInfo[]> {
    // Deepgram doesn't have a voices endpoint, return hardcoded list
    return [
      { id: 'aura-asteria-en', name: 'Aura Asteria', language: 'en-US', gender: 'female' },
      { id: 'aura-luna-en', name: 'Aura Luna', language: 'en-US', gender: 'female' },
      { id: 'aura-orpheus-en', name: 'Aura Orpheus', language: 'en-US', gender: 'male' },
    ];
  }

  async getVoice(voiceId: string): Promise<VoiceInfo | null> {
    const voices = await this.listVoices();
    return voices.find(v => v.id === voiceId) || null;
  }

  async validate(): Promise<boolean> {
    try {
      // Test API key with a simple request
      await this.synthesize('test', {
        id: 'test',
        name: 'test',
        provider: 'deepgram',
        voiceId: 'aura-asteria-en',
        language: 'en-US',
      });
      return true;
    } catch {
      return false;
    }
  }
}
```

---

### Register in Factory

```typescript
// packages/vociant-core/src/providers/index.ts
import { DeepgramTTSProvider } from './deepgram-tts.provider';

export class ProviderFactory {
  static createTTSProvider(type: TTSProvider): ITTSProvider {
    switch (type) {
      case 'elevenlabs':
        return new ElevenLabsTTSProvider();
      case 'deepgram':
        return new DeepgramTTSProvider(); // ← Add this
      case 'google':
        return new GoogleTTSProvider();
      case 'mock':
        return new MockTTSProvider();
      default:
        throw new Error(`Unsupported TTS provider: ${type}`);
    }
  }
}
```

---

### Update Type Definitions

```typescript
// packages/vociant-core/src/types/index.ts
export type TTSProvider =
  | 'elevenlabs'
  | 'google'
  | 'deepgram' // ← Add this
  | 'openai'
  | 'azure'
  | 'mock';
```

---

### Add to Console UI

```tsx
// apps/vociant-console/src/app/dashboard/agents/[slug]/page.tsx
<select defaultValue={agent.ttsProvider}>
  <option value="elevenlabs">ElevenLabs</option>
  <option value="google">Google Cloud TTS</option>
  <option value="deepgram">Deepgram</option> {/* ← Add this */}
  <option value="openai">OpenAI TTS</option>
  <option value="mock">Mock (Testing)</option>
</select>
```

---

## STT Provider Integration

### Interface

```typescript
export interface ISTTProvider {
  readonly name: string;

  initialize(config: STTProviderConfig): Promise<void>;

  transcribeStream(
    audioStream: AsyncIterable<AudioChunk>,
    config?: STTRuntimeConfig
  ): AsyncGenerator<TranscriptResult>;

  transcribe(
    audioBuffer: Buffer,
    config?: STTRuntimeConfig
  ): Promise<string>;

  validate(): Promise<boolean>;
}
```

---

### Example: Deepgram STT Provider

```typescript
import { ISTTProvider, STTProviderConfig } from './stt.interface';
import { AudioChunk, TranscriptResult, STTRuntimeConfig } from '../types';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

export class DeepgramSTTProvider implements ISTTProvider {
  readonly name = 'deepgram';
  private apiKey?: string;

  async initialize(config: STTProviderConfig): Promise<void> {
    this.apiKey = config.apiKey;
  }

  async *transcribeStream(
    audioStream: AsyncIterable<AudioChunk>,
    config?: STTRuntimeConfig
  ): AsyncGenerator<TranscriptResult> {
    const deepgram = createClient(this.apiKey!);

    const connection = deepgram.listen.live({
      model: config?.model || 'nova-2',
      language: config?.language || 'en-US',
      interim_results: config?.interimResults ?? true,
      punctuate: config?.punctuate ?? true,
      smart_format: true,
    });

    // Set up event handlers
    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel.alternatives[0];
      const result: TranscriptResult = {
        partial: data.is_final ? undefined : transcript.transcript,
        final: data.is_final ? transcript.transcript : undefined,
        isFinal: data.is_final,
        confidence: transcript.confidence,
        timestamp: Date.now(),
      };
      // Yield via async generator (complex, need event-to-async-iter adapter)
    });

    // Stream audio
    for await (const chunk of audioStream) {
      connection.send(chunk.data);
    }

    connection.finish();
  }

  async transcribe(audioBuffer: Buffer, config?: STTRuntimeConfig): Promise<string> {
    const deepgram = createClient(this.apiKey!);

    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: config?.model || 'nova-2',
        language: config?.language || 'en-US',
        punctuate: true,
      }
    );

    return result.results.channels[0].alternatives[0].transcript;
  }

  async validate(): Promise<boolean> {
    try {
      const deepgram = createClient(this.apiKey!);
      await deepgram.manage.getProjectBalance(process.env.DEEPGRAM_PROJECT_ID!);
      return true;
    } catch {
      return false;
    }
  }
}
```

**Note**: For streaming STT, you may need to adapt event-based SDKs to async generators. Use libraries like `event-iterator` or implement a queue-based solution.

---

## LLM Provider Integration

### Interface

```typescript
export interface ILLMProvider {
  readonly name: string;

  initialize(config: LLMProviderConfig): Promise<void>;

  chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    config?: LLMRuntimeConfig
  ): Promise<LLMResponse>;

  chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    config?: LLMRuntimeConfig
  ): AsyncGenerator<LLMStreamChunk>;

  validate(): Promise<boolean>;
}
```

---

### Example: Anthropic LLM Provider

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { ILLMProvider, LLMProviderConfig, LLMStreamChunk } from './llm.interface';
import { ChatMessage, LLMResponse, ToolDefinition, LLMRuntimeConfig } from '../types';

export class AnthropicLLMProvider implements ILLMProvider {
  readonly name = 'anthropic';
  private client?: Anthropic;

  async initialize(config: LLMProviderConfig): Promise<void> {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async chat(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    config?: LLMRuntimeConfig
  ): Promise<LLMResponse> {
    if (!this.client) throw new Error('Provider not initialized');

    // Extract system message
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const response = await this.client.messages.create({
      model: config?.model || 'claude-3-opus-20240229',
      max_tokens: config?.maxTokens || 4096,
      temperature: config?.temperature,
      system: systemMessage,
      messages: conversationMessages,
      tools: tools?.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      })),
    });

    // Map Anthropic response to Vociant format
    const content = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('');

    const toolCalls = response.content
      .filter(c => c.type === 'tool_use')
      .map(c => ({
        id: c.id,
        type: 'function' as const,
        function: {
          name: c.name,
          arguments: JSON.stringify(c.input),
        },
      }));

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'tool_calls',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    tools?: ToolDefinition[],
    config?: LLMRuntimeConfig
  ): AsyncGenerator<LLMStreamChunk> {
    if (!this.client) throw new Error('Provider not initialized');

    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    const stream = await this.client.messages.stream({
      model: config?.model || 'claude-3-opus-20240229',
      max_tokens: config?.maxTokens || 4096,
      system: systemMessage,
      messages: conversationMessages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield {
          delta: event.delta.text,
        };
      }
    }
  }

  async validate(): Promise<boolean> {
    try {
      await this.chat([{ role: 'user', content: 'test' }]);
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## Provider Configuration

### Environment Variables

Store API keys in `.env`:

```bash
# apps/vociant-console/.env

# TTS
ELEVENLABS_API_KEY=sk_...
DEEPGRAM_API_KEY=...
GOOGLE_TTS_CREDENTIALS=...

# STT
DEEPGRAM_STT_API_KEY=...

# LLM
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

### Database Credentials

For multi-user scenarios, store per-project credentials in the database:

```typescript
// Create a credential
await db.providerCredential.create({
  data: {
    projectId: 'proj123',
    provider: 'elevenlabs',
    label: 'Production ElevenLabs',
    apiKey: 'sk_...',
    isActive: true,
  },
});

// Fetch at runtime
const credential = await db.providerCredential.findFirst({
  where: {
    projectId: agent.projectId,
    provider: 'elevenlabs',
    isActive: true,
  },
});

// Initialize provider
await ttsProvider.initialize({ apiKey: credential.apiKey });
```

**Security**: Encrypt `apiKey` field using AES-256 in production.

---

## Testing Your Provider

### Unit Tests

```typescript
// packages/vociant-core/src/providers/__tests__/deepgram-tts.test.ts
import { DeepgramTTSProvider } from '../deepgram-tts.provider';

describe('DeepgramTTSProvider', () => {
  it('should synthesize audio', async () => {
    const provider = new DeepgramTTSProvider();
    await provider.initialize({ apiKey: process.env.DEEPGRAM_API_KEY });

    const audio = await provider.synthesize(
      'Hello, world!',
      {
        id: 'test',
        name: 'Test Voice',
        provider: 'deepgram',
        voiceId: 'aura-asteria-en',
        language: 'en-US',
      }
    );

    expect(audio).toBeInstanceOf(Buffer);
    expect(audio.length).toBeGreaterThan(0);
  });
});
```

---

### Integration Test

Create a test agent in the console with your provider and test in the Playground.

---

## Common Patterns

### Handling Audio Formats

Providers may return different audio formats (MP3, PCM, Opus). Vociant's `AudioChunk` type includes a `format` field:

```typescript
yield {
  data: Buffer.from(mp3Data),
  sampleRate: 44100,
  channels: 1,
  format: 'mp3', // ← Specify format
  timestamp: Date.now(),
};
```

The client can then decode based on the format.

---

### Streaming vs Batch

- **Streaming**: Lower latency, better UX (use `synthesizeStream`, `transcribeStream`)
- **Batch**: Simpler implementation, higher latency (use `synthesize`, `transcribe`)

Prioritize streaming for production voice agents.

---

### Error Handling

```typescript
async *synthesizeStream(...) {
  try {
    const response = await fetch(...);
    if (!response.ok) {
      throw new Error(`Provider error: ${response.status}`);
    }
    // ... stream chunks
  } catch (error) {
    // Log error
    console.error('TTS streaming failed:', error);
    // Re-throw for SessionEngine to handle
    throw error;
  }
}
```

---

## Provider Roadmap

**Planned Integrations:**
- **TTS**: Google Cloud TTS, Azure TTS, AWS Polly
- **STT**: Google Speech-to-Text, Azure Speech, AssemblyAI
- **LLM**: Google Gemini, Cohere, Together AI

Contributions welcome! See [CONTRIBUTING.md](../CONTRIBUTING.md).

---

*For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).*
