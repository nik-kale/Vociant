# Vociant

> **The ElevenLabs Agents Platform... but vendor-agnostic and open.**

Vociant is a production-grade, vendor-agnostic voice agent control plane. Build conversational AI experiences with your choice of TTS, STT, and LLM providers—no vendor lock-in, full control over your stack.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

---

## 🎯 What is Vociant?

Vociant provides the same agent-building capabilities as ElevenLabs Agents, but with a critical difference: **you're not locked into a single provider**. Mix and match best-in-class services:

- **TTS**: ElevenLabs, Google Cloud, Deepgram, OpenAI, Azure
- **STT**: ElevenLabs Scribe, Deepgram, Google Speech, OpenAI Whisper
- **LLM**: OpenAI, Anthropic, Google Gemini, OpenRouter

All controlled through a unified, elegant Next.js console.

### Why Vociant?

| Challenge | Vociant's Solution |
|-----------|-------------------|
| **Vendor Lock-In** | Plugin architecture for TTS/STT/LLM providers |
| **Limited Control** | Full access to conversation flow, tool execution, RAG pipelines |
| **Closed Source** | Open-source TypeScript monorepo—audit, extend, deploy anywhere |
| **One-Size-Fits-All** | Configure per-agent provider mix (e.g., Deepgram STT + OpenAI LLM + ElevenLabs TTS) |

---

## ✨ Features

### 🎙️ **Voice Agent Builder**
- Configure agent personality, system prompts, and conversation style
- Real-time voice streaming via WebSocket
- Conversation flow controls: silence timeouts, interruptions, turn eagerness
- Support for barge-in and multi-turn dialogues

### 🔌 **Provider Flexibility**
- **TTS Providers**: ElevenLabs (streaming), Google Cloud TTS, Deepgram, OpenAI TTS, Azure
- **STT Providers**: ElevenLabs Scribe (real-time), Deepgram, Google STT, OpenAI Whisper
- **LLM Providers**: OpenAI (GPT-4, GPT-3.5), Anthropic (Claude), Google Gemini, OpenRouter

### 🛠️ **Tool & Function Calling**
- **System Tools**: Update internal conversation state (variables, context)
- **Server Tools**: Call backend APIs (CRM, databases, webhooks)
- **Client Tools**: Trigger frontend actions (navigation, UI updates)
- OpenAI-compatible function schemas work across providers

### 📚 **RAG (Retrieval-Augmented Generation)**
- Attach knowledge sources (docs, URLs, files) to agents
- Automatic chunking and embedding (pluggable vector stores)
- Inject relevant context into LLM prompts at runtime

### 📊 **Analytics & Monitoring**
- Session transcripts with latency metrics (TTS, STT, LLM)
- Turn-by-turn conversation logs
- Provider usage tracking for cost observability

### 🌐 **Multi-Channel Support**
- **Web Widget**: Embed voice chat in any web app
- **Telephony** (roadmap): Twilio, Vonage, Telnyx, SIP trunking

---

## 🏗️ Architecture

Vociant is a **TypeScript monorepo** with two main packages:

```
vociant/
├── packages/
│   └── vociant-core/          # Core orchestration engine
│       ├── providers/          # TTS/STT/LLM abstractions
│       ├── engine/             # SessionEngine (conversation orchestrator)
│       ├── tools/              # Tool execution framework
│       └── rag/                # Knowledge retrieval pipeline
└── apps/
    └── vociant-console/        # Next.js control plane
        ├── src/app/            # UI pages (agents, sessions, playground)
        └── prisma/             # Database schema (SQLite/Postgres)
```

### Key Concepts

1. **`@vociant/core`**: Pure TypeScript library
   - Provider interfaces (`ITTSProvider`, `ISTTProvider`, `ILLMProvider`)
   - `SessionEngine`: Orchestrates STT → LLM → TTS for each conversation turn
   - Adapters for each provider (e.g., `ElevenLabsTTSProvider`, `OpenAILLMProvider`)

2. **`vociant-console`**: Next.js App Router application
   - REST API routes (`/api/agents`, `/api/sessions`)
   - WebSocket route (`/api/voice/:agentId`) for real-time audio streaming
   - Agent builder UI with tabs for persona, voice, tools, RAG, channels

For detailed architecture, see [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm 8+
- API keys for your chosen providers (OpenAI, ElevenLabs, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vociant.git
cd vociant

# Install dependencies
pnpm install

# Set up environment variables
cp apps/vociant-console/.env.example apps/vociant-console/.env
# Edit .env with your API keys

# Initialize the database
pnpm db:push

# Start the development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the console.

### Create Your First Agent

1. Navigate to **Dashboard** → **Agents** → **Create Agent**
2. Configure:
   - **Persona**: Write a system prompt (e.g., "You are a helpful customer support agent")
   - **Voice**: Select TTS provider and voice ID
   - **Flow**: Set silence timeout, enable interruptions
   - **LLM**: Choose model (e.g., `gpt-4-turbo-preview`)
3. Save and test in the **Playground**

---

## 📖 Documentation

- [**Architecture Guide**](./docs/ARCHITECTURE.md) – System design, provider abstractions, SessionEngine
- [**API Reference**](./docs/API.md) – REST endpoints, WebSocket protocol
- [**Provider Integration**](./docs/PROVIDERS.md) – Adding custom TTS/STT/LLM providers
- [**Deployment Guide**](./docs/DEPLOYMENT.md) – Deploy to Vercel, AWS, or self-hosted

---

## 🔧 Provider Integration

Vociant's provider system is **fully extensible**. To add a new TTS provider:

```typescript
// packages/vociant-core/src/providers/my-tts.provider.ts
import { ITTSProvider } from './tts.interface';

export class MyTTSProvider implements ITTSProvider {
  readonly name = 'my-tts';

  async *synthesizeStream(text: string, voice: VoiceProfile) {
    // Your streaming TTS implementation
    yield audioChunk;
  }
}
```

Then register it in `ProviderFactory`. See [**PROVIDERS.md**](./docs/PROVIDERS.md) for details.

---

## 🎨 Use Cases

| Industry | Example Agent |
|----------|---------------|
| **Customer Support** | Voice agent with CRM tool integration, knowledge base from help docs |
| **Healthcare** | HIPAA-compliant agent (self-hosted) with medical terminology RAG |
| **E-commerce** | Order tracking agent with Shopify API tools |
| **Education** | Tutoring agent with course material knowledge base |
| **Finance** | Account inquiry agent with secure backend tool calls |

---

## 🌟 Why Open Source?

Commercial platforms like ElevenLabs Agents are powerful, but they come with tradeoffs:

- **Vendor Lock-In**: Tied to one provider's pricing and roadmap
- **Limited Customization**: Can't modify core orchestration logic
- **Data Privacy**: Audio and transcripts flow through third-party infrastructure

Vociant solves this by:

1. **Open-source orchestration engine** (audit, fork, extend)
2. **Provider plugins** (swap providers without rewriting code)
3. **Self-hosting option** (full data control for regulated industries)

We believe conversational AI infrastructure should be **open, composable, and developer-friendly**.

---

## 🤝 Contributing

We welcome contributions! Please see [**CONTRIBUTING.md**](./CONTRIBUTING.md) for guidelines.

**Current Roadmap:**
- [ ] Additional provider adapters (Deepgram STT, Azure TTS)
- [ ] Telephony channel support (Twilio, Vonage)
- [ ] Advanced RAG with vector database integrations (Pinecone, Weaviate)
- [ ] Multi-language support and localization
- [ ] Observability integrations (OpenTelemetry, DataDog)

---

## 📜 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

Inspired by ElevenLabs Agents, this project aims to bring vendor-agnostic flexibility to voice AI while maintaining production-grade quality. Built for developers who value:

- **Control** over their infrastructure
- **Flexibility** to choose best-in-class providers
- **Transparency** in how their agents work

---

## 📧 Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/vociant/issues)
- **Discussions**: [Join the community](https://github.com/yourusername/vociant/discussions)

---

**Vociant** — Voice agents, your way. 🎤
