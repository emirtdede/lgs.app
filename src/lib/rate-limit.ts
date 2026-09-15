/**
 * Sliding-window rate limiter for sensitive endpoints and actions.
 */
interface RateLimitEntry {
  timestamps: number[];
}

const cache = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAfterMs: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { maxRequests: 5, windowMs: 10 * 60 * 1000 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  const entry = cache.get(key) ?? { timestamps: [] };
  // Filter out timestamps outside current window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= options.maxRequests) {
    const oldest = entry.timestamps[0]!;
    const resetAfterMs = oldest + options.windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetAfterMs: Math.max(0, resetAfterMs),
    };
  }

  // Register request
  entry.timestamps.push(now);
  cache.set(key, entry);

  return {
    allowed: true,
    remaining: options.maxRequests - entry.timestamps.length,
    resetAfterMs: options.windowMs,
  };
}

export function resetRateLimit(key: string): void {
  cache.delete(key);
}
