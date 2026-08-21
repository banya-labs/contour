import { redis } from "./redis";

/**
 * Banya Labs Sliding-Window Rate Limiter (Layer 9 Standard)
 * 
 * Enforces strict request throttling across API endpoints and MCP servers.
 * Uses atomic Redis Lua sorted sets (ZSET) in production for sub-millisecond
 * sliding-window accuracy across horizontally scaled Dokploy containers.
 * 
 * Automatically falls back to an in-memory sliding-window store if Redis
 * is absent or disconnected (local dev & testing).
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

// In-Memory Fallback Store (Map of key -> timestamps array)
const memoryStore = new Map<string, number[]>();

// Periodic cleanup of memory store every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of memoryStore.entries()) {
      const valid = timestamps.filter((ts) => ts > now - 300000); // 5 min max window
      if (valid.length === 0) {
        memoryStore.delete(key);
      } else {
        memoryStore.set(key, valid);
      }
    }
  }, 300000);
  // Ensure unref if available in Node environment
  if (cleanup && typeof cleanup === "object" && "unref" in cleanup) {
    (cleanup as any).unref();
  }
}

/**
 * Lua Script for Atomic Sliding-Window Rate Limiting in Redis
 */
const LUA_SLIDING_WINDOW = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

local clearBefore = now - (window * 1000)
redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
local current = redis.call('ZCARD', key)

if current < limit then
  redis.call('ZADD', key, now, member)
  redis.call('EXPIRE', key, window)
  return {1, limit - current - 1, window}
else
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local resetSeconds = window
  if #oldest > 1 then
    resetSeconds = math.ceil((tonumber(oldest[2]) + (window * 1000) - now) / 1000)
  end
  if resetSeconds < 1 then resetSeconds = 1 end
  return {0, 0, resetSeconds}
end
`;

/**
 * Checks sliding-window rate limit for a given key.
 * 
 * @param key Unique identifier (e.g. `mcp:ip:127.0.0.1`, `mcp:key:key_abc123`, `mcp:org:org_123`)
 * @param limit Maximum allowed requests within the window
 * @param windowSeconds Rolling window size in seconds (default 60s)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const fullKey = `ratelimit:${key}`;
  const now = Date.now();

  // 1. Redis Sliding Window Evaluation
  if (redis && redis.status === "ready") {
    try {
      const member = `${now}_${Math.random().toString(36).substring(2, 7)}`;
      const result = (await redis.eval(
        LUA_SLIDING_WINDOW,
        1,
        fullKey,
        now.toString(),
        windowSeconds.toString(),
        limit.toString(),
        member
      )) as [number, number, number];

      const allowed = result[0] === 1;
      const remaining = result[1];
      const resetSeconds = result[2];

      return { allowed, limit, remaining, resetSeconds };
    } catch (err: any) {
      console.warn(`[RateLimiter] Redis error for key ${key}, falling back to in-memory:`, err.message);
    }
  }

  // 2. In-Memory Fallback Evaluation
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  let timestamps = memoryStore.get(fullKey) || [];
  timestamps = timestamps.filter((ts) => ts > cutoff);

  if (timestamps.length < limit) {
    timestamps.push(now);
    memoryStore.set(fullKey, timestamps);
    return {
      allowed: true,
      limit,
      remaining: limit - timestamps.length,
      resetSeconds: windowSeconds,
    };
  }

  const oldest = timestamps[0] || now;
  const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));

  return {
    allowed: false,
    limit,
    remaining: 0,
    resetSeconds,
  };
}
