import { Redis } from '@upstash/redis';

// Initialize Redis if env vars are present
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? Redis.fromEnv()
  : null;

/**
 * Cache wrapper function
 * @param key Cache key
 * @param ttlSeconds Time to live in seconds
 * @param fetcher Function to fetch data if cache miss
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!redis) {
    // If no cache configured, just fetch
    return fetcher();
  }

  try {
    const cachedValue = await redis.get<T>(key);
    if (cachedValue) {
      return cachedValue;
    }
  } catch (error) {
    console.warn(`Cache get failed for ${key}:`, error);
  }

  const value = await fetcher();

  try {
    await redis.setex(key, ttlSeconds, value);
  } catch (error) {
    console.warn(`Cache set failed for ${key}:`, error);
  }

  return value;
}

/**
 * Invalidate cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  if (!redis) return;
  await redis.del(key);
}

