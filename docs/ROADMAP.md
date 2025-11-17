# Vociant Roadmap: Feature Parity with ElevenLabs Agents

## Gap Analysis Summary

After systematic review of ElevenLabs Agents Platform documentation, here's what Vociant v1 has vs what's missing:

---

## ✅ What We Have (v1)

### Core Architecture
- ✅ Provider abstractions (TTS/STT/LLM)
- ✅ SessionEngine with conversation orchestration
- ✅ Tool execution framework (system, server, client)
- ✅ Basic RAG pipeline
- ✅ Agent builder UI with tabs
- ✅ REST API for agents & sessions
- ✅ Database schema (Prisma)

### Agent Features
- ✅ System prompt configuration
- ✅ Voice provider selection
- ✅ Conversation flow (silence timeout, interruptions)
- ✅ Turn eagerness (low/medium/high)
- ✅ Knowledge base attachment
- ✅ Tool attachment

---

## ❌ What's Missing (ElevenLabs Features)

### Phase 2: Critical Agent Features
- [ ] **First Message** - What agent says when conversation starts
- [ ] **Dynamic Variables** - `{{var_name}}` syntax in prompts/messages
- [ ] **Conversation Overrides** - Runtime override of prompts, voice, language
- [ ] **Language Switching** - Multi-language support per agent
- [ ] **Pronunciation Dictionary** - Custom word pronunciations
- [ ] **Turn Timeout** - How long to wait before prompting user (1-30s)

### Phase 3: Authentication & Security
- [ ] **Signed URLs** - Temporary tokens for client auth (15 min expiry)
- [ ] **Domain Allowlist** - Restrict which domains can request signed URLs
- [ ] **Secrets Management** - Secure storage for tool auth credentials
- [ ] **OAuth 2.0 Support** - Client credentials & JWT bearer flows
- [ ] **HTTP Basic Auth** - Username/password for tools
- [ ] **HMAC Webhook Signatures** - Validate incoming webhooks

### Phase 4: Analytics & Monitoring
- [ ] **Conversation History UI** - Browse past conversations
- [ ] **Transcript Viewer** - View full conversation transcripts
- [ ] **Success Evaluation** - Define custom success criteria
- [ ] **Data Collection** - Extract structured data from conversations
- [ ] **Performance Metrics Dashboard** - Latency, success rate, etc.
- [ ] **Post-Call Webhooks** - Send conversation data to external systems
- [ ] **Conversation Simulation** - Test agents without live calls

### Phase 5: Widget & Embedding
- [ ] **Web Widget SDK** - React/Next.js/Vanilla JS SDKs
- [ ] **Widget Customization** - Colors, shapes, branding
- [ ] **Widget Embed Code** - One-click copy embed snippet
- [ ] **Custom CSS Support** - Advanced styling
- [ ] **Widget State Management** - Open/close programmatically

### Phase 6: Telephony Integration
- [ ] **Twilio Native Integration** - Import phone numbers
- [ ] **Vonage Integration** - WebSocket connector
- [ ] **SIP Trunking** - Connect existing phone infrastructure
- [ ] **Transfer to Human** - System tool for call transfer
- [ ] **Outbound Calling** - Agent-initiated calls
- [ ] **Enterprise Static IPs** - For IP allowlisting

### Phase 7: Advanced Features
- [ ] **Multi-Voice Support** - Switch voices mid-conversation
- [ ] **Latency Optimization Settings** - Flash models, streaming config
- [ ] **Custom LLM Integration** - Bring your own model endpoint
- [ ] **Agent Templates** - Pre-built agents for common use cases
- [ ] **A/B Testing** - Test different prompts/voices
- [ ] **Rate Limiting** - Per-agent usage limits
- [ ] **Usage Analytics** - Cost tracking by provider

---

## Implementation Roadmap

### v2: Critical Agent Features (Phase 2)
**Focus**: Make agents actually conversational
- First message configuration
- Dynamic variables in prompts
- Turn timeout settings
- Language switching
- Pronunciation dictionary

### v3: Auth & Security (Phase 3)
**Focus**: Production-ready security
- Signed URL generation
- Domain allowlist
- Secrets management UI
- OAuth 2.0 & Basic Auth for tools
- HMAC webhook validation

### v4: Analytics & Monitoring (Phase 4)
**Focus**: Visibility into agent performance
- Conversation history UI
- Transcript viewer
- Success evaluation framework
- Data collection engine
- Performance metrics dashboard
- Post-call webhooks

### v5: Widget SDK (Phase 5)
**Focus**: Easy embedding
- React SDK
- Vanilla JS SDK
- Widget customization UI
- Embed code generator
- Widget theming

### v6: Telephony (Phase 6)
**Focus**: Phone integration
- Twilio integration
- SIP trunking
- Transfer to human tool
- Outbound calling

### v7: Advanced Features (Phase 7)
**Focus**: Enterprise polish
- Multi-voice support
- Latency optimization
- Agent templates
- A/B testing
- Usage analytics

---

## Next Steps

Starting implementation of **v2** immediately, proceeding through all phases autonomously.
