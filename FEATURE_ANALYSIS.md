# Vociant Feature Discovery Analysis

**Analysis Date**: 2025-12-26
**Repository**: Vociant (Open-source Voice Agent Platform)
**Analyst**: Claude Code (Opus 4.5)

---

## Executive Summary

Vociant is a well-architected, vendor-agnostic voice agent platform with comprehensive feature coverage (~95% parity with ElevenLabs). However, critical gaps exist in security, observability, and testing that must be addressed before production deployment.

**Key Findings:**
- 🔴 **Critical**: No API authentication/authorization on any endpoints
- 🔴 **Critical**: API keys stored in plaintext in database
- 🟠 **High**: No input validation despite Zod being installed
- 🟠 **High**: Zero test coverage (no test files exist)
- 🟡 **Medium**: No structured logging or distributed tracing
- 🟡 **Medium**: RAG implementation is incomplete (stub code)

---

## Priority Summary Table

| # | Feature | Category | Effort | Value | Priority Score |
|---|---------|----------|--------|-------|----------------|
| 1 | Encrypt ProviderCredential API Keys | Security | Low | High | 3.0 |
| 2 | Add Security Headers Middleware | Security | Low | Medium | 2.0 |
| 3 | Implement Rate Limiting | Security | Low | Medium | 2.0 |
| 4 | Add API Authentication Middleware | Security | Medium | High | 1.5 |
| 5 | Implement Input Validation with Zod | Security/Quality | Medium | High | 1.5 |
| 6 | Add Vitest Test Framework | Quality | Medium | High | 1.5 |
| 7 | Implement Structured Logging | Observability | Medium | High | 1.5 |
| 8 | Add OpenTelemetry Tracing | Observability | Medium | Medium | 1.0 |
| 9 | Complete RAG Vector DB Integration | Functional | High | High | 1.0 |
| 10 | Add Response Caching Layer | Performance | Medium | Medium | 1.0 |

---

## Detailed Feature Requests

---

### Feature 1: Encrypt ProviderCredential API Keys

**Category**: Security
**Priority Score**: 3.0 (Quick Win 🚀)

#### Problem Statement

The `ProviderCredential` model stores third-party API keys (OpenAI, ElevenLabs, Anthropic, etc.) in **plaintext** in the database. The schema even includes a TODO comment acknowledging this: `apiKey String // TODO: Encrypt in production`. If the database is compromised, all API keys are immediately exposed, leading to potential financial loss and unauthorized API access.

**Location**: `apps/vociant-console/prisma/schema.prisma:255`

#### Proposed Solution

- [ ] Extend the existing `encryptSecret()`/`decryptSecret()` utilities from `auth.ts` to handle ProviderCredentials
- [ ] Create a migration script to encrypt existing plaintext API keys
- [ ] Update `ProviderCredential` model to store encrypted values with format: `iv.authTag.ciphertext`
- [ ] Modify provider initialization code to decrypt keys at runtime
- [ ] Add key rotation support with re-encryption capability

#### Implementation Notes

The encryption infrastructure already exists in `packages/vociant-core/src/utils/auth.ts` using AES-256-GCM. This is a matter of applying the same pattern to ProviderCredentials.

```typescript
// Existing pattern from auth.ts - reuse for ProviderCredential
export function encryptSecret(plaintext: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  // ...
}
```

#### Impact Assessment

| Metric | Rating |
|--------|--------|
| Effort | Low (1-2 hours) |
| Value | High (prevents credential theft) |
| Risk if not done | Critical - complete credential exposure |

#### Success Metrics

- [ ] All ProviderCredential.apiKey values encrypted in database
- [ ] Decryption works correctly during provider initialization
- [ ] No plaintext API keys visible in database exports or logs
- [ ] Existing functionality unchanged (providers work normally)

---

### Feature 2: Add Security Headers Middleware

**Category**: Security
**Priority Score**: 2.0 (Quick Win 🚀)

#### Problem Statement

The application lacks essential HTTP security headers, leaving it vulnerable to clickjacking, MIME-sniffing attacks, and XSS. No CORS configuration exists, and HSTS is not enforced. These are industry-standard protections that take minimal effort to implement.

**Missing Headers:**
- `X-Frame-Options` (clickjacking protection)
- `X-Content-Type-Options` (MIME-sniffing protection)
- `Content-Security-Policy` (XSS mitigation)
- `Strict-Transport-Security` (HTTPS enforcement)
- `X-XSS-Protection` (legacy XSS filter)
- Proper CORS headers

#### Proposed Solution

- [ ] Create Next.js middleware at `apps/vociant-console/src/middleware.ts`
- [ ] Configure security headers for all responses
- [ ] Add CORS configuration with environment-based allowed origins
- [ ] Enable HSTS with appropriate max-age (1 year recommended)
- [ ] Add CSP with strict policy allowing only necessary sources

#### Implementation Notes

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'");

  return response;
}
```

#### Impact Assessment

| Metric | Rating |
|--------|--------|
| Effort | Low (30 min - 1 hour) |
| Value | Medium (industry standard protection) |
| Risk if not done | Medium - vulnerable to common web attacks |

#### Success Metrics

- [ ] All responses include security headers
- [ ] Security scanner (Mozilla Observatory) scores B or higher
- [ ] CORS properly restricts cross-origin requests
- [ ] HTTPS enforced via HSTS

---

### Feature 3: Implement Rate Limiting

**Category**: Security
**Priority Score**: 2.0 (Quick Win 🚀)

#### Problem Statement

No rate limiting exists on any API endpoint. This leaves the application vulnerable to:
- Brute force attacks on authentication endpoints
- DDoS/DoS attacks consuming resources
- API abuse and cost overruns (LLM/TTS calls)
- Secret enumeration attacks

The roadmap (IMPLEMENTATION_STATUS.md) lists rate limiting as pending since v3.

#### Proposed Solution

- [ ] Install `@upstash/ratelimit` or implement token bucket algorithm
- [ ] Add rate limiting middleware for API routes
- [ ] Configure different limits per endpoint type:
  - Auth endpoints: 5 req/min
  - Read endpoints: 100 req/min
  - Write endpoints: 20 req/min
  - Expensive operations (LLM): 10 req/min
- [ ] Return proper 429 responses with `Retry-After` header
- [ ] Add rate limit headers to all responses

#### Implementation Notes

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
});

// Usage in API route
const { success, limit, reset, remaining } = await ratelimit.limit(ip);
if (!success) {
  return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
}
```

#### Impact Assessment

| Metric | Rating |
|--------|--------|
| Effort | Low (2-3 hours) |
| Value | Medium (essential for production) |
| Risk if not done | High - vulnerable to abuse |

#### Success Metrics

- [ ] All API endpoints protected by rate limits
- [ ] 429 responses returned when limits exceeded
- [ ] Rate limit headers present in responses
- [ ] No service degradation under normal load

---

### Feature 4: Add API Authentication Middleware

**Category**: Security
**Priority Score**: 1.5

#### Problem Statement

**CRITICAL**: All API endpoints are completely unauthenticated. Anyone can:
- Read all agents, sessions, and secrets
- Create, update, or delete any resource
- Access sensitive configuration and credentials

This is the most severe security vulnerability in the codebase. Every endpoint at `/api/*` accepts requests without any authentication or authorization check.

**Affected Files:**
- `apps/vociant-console/src/app/api/agents/route.ts`
- `apps/vociant-console/src/app/api/agents/[id]/route.ts`
- `apps/vociant-console/src/app/api/sessions/route.ts`
- `apps/vociant-console/src/app/api/secrets/route.ts`
- All other API routes

#### Proposed Solution

- [ ] Choose auth strategy: NextAuth.js, Clerk, or custom JWT
- [ ] Create authentication middleware for API routes
- [ ] Implement session/token validation on all endpoints
- [ ] Add role-based access control (RBAC) for multi-tenant support
- [ ] Create API key authentication for programmatic access
- [ ] Protect admin-only operations (secrets, webhooks)

#### Implementation Notes

```typescript
// lib/auth-middleware.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function withAuth(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(request, context, session);
  };
}

// Usage
export const GET = withAuth(async (req, ctx, session) => {
  // Now authenticated
});
```

#### Impact Assessment

| Metric | Rating |
|--------|--------|
| Effort | Medium (1-2 days) |
| Value | High (fundamental security requirement) |
| Risk if not done | **Critical** - complete unauthorized access |

#### Success Metrics

- [ ] All API endpoints require authentication
- [ ] Unauthenticated requests return 401
- [ ] Users can only access their own resources
- [ ] API keys work for programmatic access
- [ ] Admin operations restricted to admin users

---

### Feature 5: Implement Input Validation with Zod

**Category**: Security / Code Quality
**Priority Score**: 1.5

#### Problem Statement

Despite `zod@3.22.4` being installed as a dependency, **no API endpoint validates input**. Request bodies are directly destructured and passed to database operations without any schema validation. This causes:
- Type errors crashing endpoints (undefined/null access)
- Malicious payload injection
- Missing required field handling
- No enforcement of data constraints

**Example vulnerability** (`apps/vociant-console/src/app/api/agents/route.ts`):
```typescript
const body = await request.json();
// NO VALIDATION - body could contain anything
const agent = await db.agent.create({ data: { ...body } });
```

#### Proposed Solution

- [ ] Create Zod schemas for all API request/response types
- [ ] Create validation middleware that parses and validates requests
- [ ] Return detailed 400 errors for validation failures
- [ ] Add response validation for API consistency
- [ ] Share schemas between frontend and backend

#### Implementation Notes

```typescript
// lib/schemas/agent.ts
import { z } from 'zod';

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  systemPrompt: z.string().min(10).max(10000),
  voiceId: z.string().optional(),
  language: z.string().default('en'),
  turnTimeoutSeconds: z.number().min(1).max(30).default(10),
});

// In route handler
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = createAgentSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: result.error.issues
    }, { status: 400 });
  }

  const agent = await db.agent.create({ data: result.data });
}
```

#### Impact Assessment

| Metric | Rating |
|--------|--------|
| Effort | Medium (4-6 hours) |
| Value | High (prevents injection, improves reliability) |
| Risk if not done | High - type errors and injection attacks |

#### Success Metrics

- [ ] All API endpoints validate input with Zod schemas
- [ ] Invalid requests return 400 with detailed error messages
- [ ] No unhandled type errors from malformed input
- [ ] Response types match documented API schema

---

### Feature 6: Add Vitest Test Framework

**Category**: Code Quality
**Priority Score**: 1.5

#### Problem Statement

The codebase has **zero test coverage** - no test files, no test framework, and no CI test pipeline. For a platform handling voice AI with complex orchestration logic, authentication, and encryption, this represents significant risk:
- Regressions go undetected
- Refactoring is dangerous
- No confidence in deployments
- Contributors cannot verify changes

**Evidence**: `Glob("**/*.test.ts")` returned no files.

#### Proposed Solution

- [ ] Install Vitest with TypeScript support
- [ ] Configure workspace-aware test setup for monorepo
- [ ] Create initial test suites for critical paths:
  - `auth.ts` encryption/signing functions
  - `session-engine.ts` state management
  - `flow-engine.ts` flow execution
  - API route handlers
- [ ] Add test scripts to package.json
- [ ] Set up CI workflow for automated testing

#### Implementation Notes

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      threshold: { statements: 60 },
    },
  },
});

// Example test: packages/vociant-core/src/utils/auth.test.ts
import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret } from './auth';

describe('encryptSecret', () => {
  it('encrypts and decrypts correctly', () => {
    const key = crypto.randomBytes(32).toString('hex');
    const plaintext = 'sk-test-key-12345';

    const encrypted = encryptSecret(plaintext, key);
    const decrypted = decryptSecret(encrypted, key);

    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });
});
```

#### Impact Assessment

| Metric | Rating |
|--------|--------|
| Effort | Medium (1-2 days for initial setup + core tests) |
| Value | High (enables safe development) |
| Risk if not done | High - no confidence in changes |

#### Success Metrics

- [ ] Vitest configured and running
- [ ] Core utilities have 80%+ coverage (auth.ts, flow-engine.ts)
- [ ] CI runs tests on every PR
- [ ] Test command documented in CONTRIBUTING.md

---

### Feature 7: Implement Structured Logging

**Category**: Observability
**Priority Score**: 1.5

#### Problem Statement

Logging is limited to raw `console.log/error` calls scattered across 12 files. There is no:
- Structured format (JSON)
- Log levels (debug, info, warn, error)
- Context enrichment (sessionId, agentId, requestId)
- Log aggregation support
- Correlation IDs for tracing

This makes debugging production issues extremely difficult and provides no visibility into system behavior.

**Current state** (example from `api/agents/route.ts`):
```typescript
console.error('Failed to fetch agents:', error);  // Just logs error object
```

#### Proposed Solution

- [ ] Install Winston or Pino for structured logging
- [ ] Create logger factory with context injection
- [ ] Add request ID generation and propagation
- [ ] Configure log levels per environment (debug in dev, info in prod)
- [ ] Format logs as JSON for log aggregation services
- [ ] Add sensitive data redaction (API keys, tokens)

#### Implementation Notes

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: ['apiKey', 'token', 'password', 'secret'],
});

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

// Usage in API route
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = createRequestLogger(requestId);

  log.info({ path: '/api/agents' }, 'Fetching agents');

  try {
    const agents = await db.agent.findMany();
    log.info({ count: agents.length }, 'Agents fetched');
    return NextResponse.json({ agents });
  } catch (error) {
    log.error({ error }, 'Failed to fetch agents');
    return NextResponse.json({ error: 'Failed', requestId }, { status: 500 });
  }
}
```

#### Impact Assessment

| Metric | Rating |
|--------|--------|
| Effort | Medium (4-6 hours) |
| Value | High (essential for production debugging) |
| Risk if not done | Medium - blind to production issues |

#### Success Metrics

- [ ] All log statements use structured logger
- [ ] Request IDs present in all API logs
- [ ] Logs are JSON-formatted in production
- [ ] Sensitive data properly redacted
- [ ] Log levels configurable via environment

---

### Feature 8: Add OpenTelemetry Distributed Tracing

**Category**: Observability
**Priority Score**: 1.0

#### Problem Statement

The system makes multiple external API calls per request (STT → LLM → TTS) plus database operations, tool executions, and webhooks. Currently, there is no way to trace a single user interaction through all these components. When performance degrades or errors occur, identifying the bottleneck requires guesswork.

**Missing capabilities:**
- Trace ID propagation across services
- Span creation for external calls
- Latency breakdown by component
- Error correlation across boundaries
- Integration with observability platforms (Jaeger, Datadog)

#### Proposed Solution

- [ ] Install `@opentelemetry/sdk-node` and related packages
- [ ] Configure automatic instrumentation for HTTP, Prisma, and fetch
- [ ] Create manual spans for custom operations (flow execution, tool calls)
- [ ] Propagate trace context through webhooks and events
- [ ] Export traces to Jaeger or preferred backend
- [ ] Add trace IDs to error responses for debugging

#### Implementation Notes

```typescript
// lib/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  serviceName: 'vociant-console',
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// Manual span creation
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('vociant');

async function executeFlow(flow: Flow) {
  return tracer.startActiveSpan('flow.execute', async (span) => {
    span.setAttribute('flow.id', flow.id);
    span.setAttribute('flow.nodeCount', flow.nodes.length);
    try {
      const result = await flowEngine.execute();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

#### Impact Assessment

| Metric | Rating |
|--------|--------|
| Effort | Medium (1-2 days) |
| Value | Medium (powerful for debugging complex flows) |
| Risk if not done | Low - can operate without, but debugging is harder |

#### Success Metrics

- [ ] Traces visible in Jaeger/preferred backend
- [ ] Each API request generates a complete trace
- [ ] External API calls (OpenAI, ElevenLabs) have spans
- [ ] P95 latency visible per component
- [ ] Error traces include stack traces

---

### Feature 9: Complete RAG Vector Database Integration

**Category**: Functional Enhancement
**Priority Score**: 1.0

#### Problem Statement

The RAG (Retrieval-Augmented Generation) implementation is incomplete - marked with multiple TODO comments indicating stub code. The retriever module simulates vector search but doesn't actually:
- Generate embeddings
- Store vectors in a database
- Perform similarity search

**TODOs in `packages/vociant-core/src/rag/retriever.ts`:**
```typescript
// TODO: Integrate with vector database (pgvector, Pinecone, Weaviate, etc.)
// TODO: Implement actual vector embedding and storage
// TODO: Generate embeddings using configured provider
// TODO: Implement actual vector similarity search
```

This means the Knowledge Base feature advertised in the UI doesn't actually work.

#### Proposed Solution

- [ ] Choose vector database: pgvector (PostgreSQL), Pinecone, or Weaviate
- [ ] Implement embedding generation using OpenAI text-embedding-3-small
- [ ] Create vector storage and indexing pipeline
- [ ] Implement similarity search with configurable threshold
- [ ] Add document chunking with overlap
- [ ] Create knowledge source sync job

#### Implementation Notes

```typescript
// rag/retriever.ts - Updated implementation
import { OpenAI } from 'openai';
import { PrismaClient } from '@prisma/client';

export class RAGRetriever {
  private openai: OpenAI;
  private db: PrismaClient;

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async search(query: string, topK: number = 5): Promise<Chunk[]> {
    const queryEmbedding = await this.generateEmbedding(query);

    // Using pgvector
    const chunks = await this.db.$queryRaw`
      SELECT *, embedding <=> ${queryEmbedding}::vector AS distance
      FROM "KnowledgeChunk"
      WHERE "knowledgeSourceId" IN (${knowledgeSourceIds})
      ORDER BY distance
      LIMIT ${topK}
    `;

    return chunks;
  }
}
```

#### Impact Assessment

| Metric | Rating |
|--------|--------|
| Effort | High (2-3 days) |
| Value | High (completes major feature) |
| Risk if not done | High - advertised feature doesn't work |

#### Success Metrics

- [ ] Documents can be uploaded and chunked
- [ ] Embeddings generated and stored
- [ ] Similarity search returns relevant chunks
- [ ] RAG context injected into LLM prompts
- [ ] Knowledge base visible in agent responses

---

### Feature 10: Add Response Caching Layer

**Category**: Performance
**Priority Score**: 1.0

#### Problem Statement

No caching exists for expensive operations, causing:
- Repeated LLM calls for identical queries
- Voice list fetching on every request (ElevenLabs API)
- Flow validation running on every execution
- Database queries for unchanged data

This increases latency, costs (LLM tokens), and external API load unnecessarily.

**Identified caching opportunities:**
- Voice list from TTS providers (changes rarely)
- Agent configuration (read-heavy, write-rarely)
- Flow validation results (immutable once validated)
- Embedding vectors (deterministic for same text)

#### Proposed Solution

- [ ] Install Redis or use Upstash for managed caching
- [ ] Create caching utilities with TTL and invalidation
- [ ] Cache voice lists from providers (TTL: 1 hour)
- [ ] Cache agent configs with write-through invalidation
- [ ] Implement LRU cache for embedding vectors
- [ ] Add cache headers for API responses

#### Implementation Notes

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached) return cached;

  const value = await fetcher();
  await redis.setex(key, ttlSeconds, value);
  return value;
}

// Usage in provider
async getVoices(): Promise<Voice[]> {
  return cached(
    `elevenlabs:voices:${this.apiKey.slice(-8)}`,
    3600, // 1 hour
    () => this.fetchVoicesFromAPI()
  );
}
```

#### Impact Assessment

| Metric | Rating |
|--------|--------|
| Effort | Medium (4-6 hours) |
| Value | Medium (reduces latency and costs) |
| Risk if not done | Low - functional but slower/costlier |

#### Success Metrics

- [ ] Voice list cached with 1-hour TTL
- [ ] Agent config cache hit rate >90%
- [ ] Average response time reduced by 20%+
- [ ] External API calls reduced by 50%+
- [ ] Cache invalidation works correctly on updates

---

## Implementation Roadmap

### Week 1: Critical Security (Features 1-3)
1. **Day 1**: Encrypt ProviderCredential API keys (#1)
2. **Day 2**: Add security headers middleware (#2)
3. **Day 3**: Implement rate limiting (#3)

### Week 2: Authentication & Validation (Features 4-5)
4. **Days 4-5**: Add API authentication middleware (#4)
5. **Day 6-7**: Implement Zod input validation (#5)

### Week 3: Quality & Observability (Features 6-7)
6. **Days 8-9**: Set up Vitest test framework (#6)
7. **Day 10**: Implement structured logging (#7)

### Week 4: Advanced Features (Features 8-10)
8. **Days 11-12**: Add OpenTelemetry tracing (#8)
9. **Days 13-14**: Complete RAG implementation (#9)
10. **Day 15**: Add caching layer (#10)

---

## Appendix: Competitive Analysis

| Feature | Vociant | ElevenLabs | Retell AI | Vapi |
|---------|---------|------------|-----------|------|
| Multi-provider support | ✅ | ❌ | ❌ | ✅ |
| Open source | ✅ | ❌ | ❌ | ❌ |
| Self-hosted option | ✅ | ❌ | ❌ | ❌ |
| Flow builder | ✅ | ✅ | ✅ | ✅ |
| RAG/Knowledge Base | 🔄 Stub | ✅ | ✅ | ✅ |
| API Authentication | ❌ Missing | ✅ | ✅ | ✅ |
| Rate limiting | ❌ Missing | ✅ | ✅ | ✅ |
| Test coverage | ❌ None | Unknown | Unknown | Unknown |

---

## Conclusion

Vociant has an impressive feature set and clean architecture but requires security hardening and testing before production use. The prioritized features above address critical gaps while maintaining the project's momentum. Quick wins (Features 1-3) can be completed in days, while larger initiatives (Features 4-10) establish production-grade infrastructure.

**Recommended immediate actions:**
1. Encrypt API keys in database (Critical, same-day fix)
2. Add authentication to API endpoints (Critical, blocks production)
3. Set up basic test framework (Enables safe development)

---

*Analysis generated by Claude Code (Opus 4.5) on 2025-12-26*
