import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

// Create a new ratelimiter, that allows 10 requests per 10 seconds
// If redis is not configured, we should likely fail open or mock, but here we assume env vars are set or will be.
// For the purpose of this exercise, if no env, we can't really rate limit effectively across instances,
// but we can try an in-memory fallback if the library supports it (it usually requires Redis).
// We'll proceed assuming Redis.

const redis = Redis.fromEnv();

// Define limiters for different categories
const limiters = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: '@vociant/ratelimit/auth',
  }),
  read: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: '@vociant/ratelimit/read',
  }),
  write: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: '@vociant/ratelimit/write',
  }),
  llm: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: '@vociant/ratelimit/llm',
  }),
  default: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: '@vociant/ratelimit/default',
  }),
};

function getLimiter(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;

  if (path.startsWith('/api/auth')) {
    return limiters.auth;
  }
  
  // Heuristic for expensive LLM/TTS operations
  if (path.includes('/generate') || path.includes('/chat') || path.includes('/speak')) {
    return limiters.llm;
  }

  if (method === 'GET') {
    return limiters.read;
  }

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return limiters.write;
  }

  return limiters.default;
}

export async function checkRateLimit(request: NextRequest) {
  // Use IP as identifier
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  
  const limiter = getLimiter(request);

  try {
    const { success, limit, reset, remaining } = await limiter.limit(ip);
    return { success, limit, reset, remaining };
  } catch (error) {
    console.warn('Rate limit check failed:', error);
    // Fail open if Redis is down
    return { success: true, limit: 100, reset: 0, remaining: 100 };
  }
}
