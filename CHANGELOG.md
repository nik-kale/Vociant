# Changelog

All notable changes to Vociant will be documented in this file.

## [v6.0.0] - 2024-11-17

### Added - Widget SDK & Client Libraries

#### JavaScript SDK (`@vociant/sdk-js`)
- `VociantClient` class for programmatic voice agent control
- `VociantWidget` class for pre-built UI component
- WebSocket-based real-time audio streaming
- Full event system (connected, message, speaking, listening, error)
- Audio configuration (echo cancellation, noise suppression)
- Conversation history management
- TypeScript support with full type definitions
- UMD/ESM/CJS builds for universal compatibility

#### React SDK (`@vociant/react`)
- `useVociant` hook for voice agent integration
- `useVociantWidget` hook for widget lifecycle management
- `VociantWidget` component for declarative usage
- `VociantProvider` context provider for shared configuration
- Full TypeScript support
- Next.js SSR compatibility with dynamic imports
- React 16.8+ hooks API

#### Widget Features
- Customizable positioning (4 corners)
- Full theme customization:
  - Primary color
  - Text color
  - Background color
  - Border radius
  - Custom fonts
- Custom greeting messages
- Avatar image support
- Auto-start option
- Real-time transcript display
- Microphone controls
- Connection state management

#### Widget Customization UI
- Visual widget customizer in agent builder
- Live preview of widget appearance
- Three-tab configuration interface:
  - Appearance (colors, position, styling)
  - Content (greeting, avatar)
  - Behavior (auto-start)
- Code generator for vanilla JS and React
- Copy-to-clipboard functionality
- Installation instructions

#### Embed Code Generator
- Vanilla JavaScript embed code
- React component code
- NPM installation commands
- Customized configuration based on UI settings
- Syntax-highlighted code blocks
- Multiple integration examples

### Documentation
- Comprehensive README for `@vociant/sdk-js`
- Comprehensive README for `@vociant/react`
- Usage examples for both libraries
- TypeScript type documentation
- Browser compatibility information
- Security best practices

### Enhanced
- Agent builder Channels tab completely redesigned
- Removed basic embed code in favor of full customizer
- Added widget configuration persistence (ready for database storage)

**Files Added**: 13 files, 1,500+ lines
**Packages**: 2 new NPM packages (@vociant/sdk-js, @vociant/react)
**Commit**: (pending)

---

## [v5.0.0] - 2024-11-17

### Added - Analytics UI & A/B Testing

#### Conversation History & Transcript Viewer
- Session detail page with full conversation transcript
- Real-time latency metrics display (STT, LLM, TTS)
- Interactive transcript viewer with turn-by-turn breakdown
- Tool execution visibility in transcript
- Audio playback controls (foundation)
- Export transcript functionality

#### Analytics Dashboard
- Aggregated performance metrics across all agents
- Latency breakdown by component (STT, LLM, TTS)
- Session volume trends (30-day chart)
- Agent performance comparison table
- Success rate tracking
- Call scoring and sentiment analysis

#### Call Metrics & Performance
- `CallMetrics` component for latency visualization
- Color-coded latency indicators (excellent/good/needs improvement)
- Latency distribution charts
- Component-level performance tracking

#### Sentiment Analysis
- Real-time sentiment detection in user messages
- Positive/neutral/negative classification
- Sentiment distribution visualization
- Overall conversation sentiment scoring

#### A/B Testing Framework
- New `ABTest` model for experiment management
- `ABTestVariant` model for variant configurations
- Weighted random traffic splitting
- Statistical significance calculation (Chi-squared test)
- Confidence interval computation
- Variant performance tracking
- Automatic winner detection

#### Webhook Event System
- `sendWebhook()` utility with retry logic
- Exponential backoff for failed deliveries
- HMAC signature verification
- Event-specific webhooks:
  - `session.started`
  - `session.completed`
  - `session.failed`
  - `agent.evaluated`

#### Database Enhancements
- Enhanced `Turn` model with detailed latency tracking:
  - `sttLatencyMs`, `llmLatencyMs`, `ttsLatencyMs`, `totalLatencyMs`
  - Renamed fields: `userInput` → `userMessage`, `agentResponse` → `assistantMessage`
- `ConversationEvaluation` model for session quality assessment
- `AgentMetrics` model for daily aggregated performance data
- A/B test support in `Session` model (`abTestId`, `variantId`)

### Components Created
- `TranscriptViewer` - Interactive conversation playback
- `CallMetrics` - Performance metrics card
- `SentimentAnalysis` - Sentiment tracking card
- `LatencyChart` - Component latency visualization
- `AgentPerformanceTable` - Multi-agent comparison
- `SessionVolumeChart` - Volume trends over time

### API Routes
- `GET /dashboard/sessions/[id]` - Session detail page
- `GET /dashboard/analytics` - Analytics dashboard

### Documentation
- Updated implementation status tracking
- A/B testing utility documentation
- Webhook sender documentation

---

## [v3.0.0] - 2024-11-17

### Added - Authentication & Security

#### Signed URL Authentication
- Generate time-limited tokens for WebSocket access (15min expiry)
- Server-side token validation before connection
- `POST /api/auth/signed-url` endpoint
- Database: `Agent.requireSignedUrls`, `Agent.signedUrlSecret`

#### Domain Allowlist
- Restrict signed URL requests to specific origins
- Wildcard subdomain support (`*.example.com`)
- Database: `Agent.domainAllowlist`

#### Secrets Management
- AES-256-GCM encryption for credentials
- New `Secret` model with encrypted storage
- `GET/POST /api/secrets` endpoints
- Environment: `SECRET_ENCRYPTION_KEY`

#### Enhanced Tool Authentication
- OAuth 2.0 client credentials & JWT bearer flows
- HTTP Basic Auth support
- Tool.authType: `oauth2-client-credentials`, `oauth2-jwt-bearer`, `basic`
- Tool.secretId FK to Secret

#### HMAC Webhook Validation
- SHA256 HMAC signatures for webhooks
- New `Webhook` model
- Secure webhook delivery

---

## [v2.0.0] - 2024-11-17

### Added - Critical Agent Features

#### First Message Configuration
- Agents can now speak an introductory message when conversation starts
- Supports dynamic variable replacement with `{{variable_name}}` syntax
- Database field: `Agent.firstMessage`

#### Dynamic Variables System
- Inject runtime values into prompts, first messages, and system prompts
- Syntax: `{{user_name}}`, `{{order_id}}`, etc.
- Full parser utility in `packages/vociant-core/src/utils/dynamic-variables.ts`
- Supports validation and replacement
- Database field: `Agent.dynamicVariables` (JSON array)

#### Multi-Language Support
- Configure primary language per agent (e.g., "en-US", "es-ES")
- Support multiple languages with `supportedLanguages` array
- Database fields: `Agent.language`, `Agent.supportedLanguages`

#### Pronunciation Dictionary
- Custom phonetic spellings for better TTS pronunciation
- Example: `{"API": "A P I", "SQL": "S Q L"}`
- Applied automatically before TTS generation
- Database field: `Agent.pronunciationDictionary` (JSON)

#### Turn Timeout
- Configurable timeout (1-30 seconds) before prompting user
- Separate from general silence timeout
- Auto-prompts with "Are you still there?" message
- Database field: `Agent.turnTimeoutSeconds`

#### Conversation Overrides
- Runtime customization of agent behavior per session
- Override system prompt, first message, language, voice, LLM settings
- Pass dynamic variable values at session start
- Database field: `Session.overrides` (JSON)

### Modified

#### Core Types (`packages/vociant-core/src/types/index.ts`)
- Updated `AgentConfig` with v2 fields
- Added `ConversationOverrides` interface
- Enhanced `ConversationFlowConfig` with `turnTimeoutSeconds`

#### SessionEngine (`packages/vociant-core/src/engine/session-engine.ts`)
- Speaks first message on session initialization
- Applies pronunciation dictionary to all TTS text
- Replaces dynamic variables in prompts and messages
- Supports conversation overrides
- Implements turn timeout timer with auto-prompting

#### Database Schema (`apps/vociant-console/prisma/schema.prisma`)
- Added 6 new fields to `Agent` model
- Added `overrides` field to `Session` model

### Documentation
- Created `/docs/ROADMAP.md` with comprehensive feature gap analysis
- Documented all ElevenLabs parity features across 7 phases

---

## [v1.0.0] - 2024-11-17

### Initial Release

#### Core Engine
- Provider abstractions (TTS/STT/LLM)
- SessionEngine with conversation orchestration
- Tool execution framework
- RAG pipeline
- Mock providers for testing
- ElevenLabs TTS + OpenAI LLM implementations

#### Console
- Next.js 14 App Router application
- Agent builder with 7 tabs
- Dashboard with stats
- Sessions list
- REST API
- Prisma database (SQLite/Postgres)

#### Documentation
- README.md
- ARCHITECTURE.md
- API.md
- PROVIDERS.md
- DEPLOYMENT.md
- CONTRIBUTING.md
