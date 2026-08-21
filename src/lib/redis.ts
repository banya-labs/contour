import Redis from "ioredis";

/**
 * Banya Labs Redis Client Singleton (Layer 9 & 10 Standard)
 * 
 * Provides high-performance Redis connections for sliding-window rate limiting,
 * cache-aside operations, and pub/sub background jobs.
 * 
 * Gracefully degrades to null if REDIS_URL is not set or connection fails,
 * allowing local development without a running Redis instance.
 */

const redisUrl = process.env.REDIS_URL;

let redisClient: Redis | null = null;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("[Redis] Exceeded max connection retries. Falling back to in-memory mode.");
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on("error", (err) => {
      console.warn("[Redis] Connection error:", err.message);
    });

    redisClient.on("connect", () => {
      console.log("[Redis] Connected successfully.");
    });
  } catch (err: any) {
    console.warn("[Redis] Failed to initialize Redis client:", err.message);
    redisClient = null;
  }
} else {
  if (process.env.NODE_ENV === "development") {
    console.log("[Redis] REDIS_URL not configured. Operating in graceful in-memory fallback mode.");
  }
}

export const redis = redisClient;

/**
 * Utility to test Redis ping
 */
export async function redisPing(): Promise<boolean> {
  if (!redis) return false;
  try {
    const res = await redis.ping();
    return res === "PONG";
  } catch {
    return false;
  }
}
