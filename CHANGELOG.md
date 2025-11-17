# Changelog

All notable changes to Vociant will be documented in this file.

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
