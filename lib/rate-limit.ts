import { Redis } from "@upstash/redis";
import { getServerEnv } from "@/lib/env";

// Module-level singleton — reused across warm invocations on the same instance.
// @upstash/redis uses HTTP (fetch), so no persistent TCP connection is held.
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (_redis) return _redis;
  const env = getServerEnv();
  _redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return _redis;
}

/**
 * Increments a rate-limit counter in Redis.
 * Returns true if the caller has exceeded the allowed count within the window.
 *
 * Uses INCR + EXPIRE pattern:
 * - INCR is atomic and creates the key if it doesn't exist (starts at 1).
 * - EXPIRE is only set when count === 1 so the window anchors to the first
 *   request and isn't extended on subsequent calls (fixed window).
 * - Two concurrent first-requests both setting EXPIRE is idempotent — safe.
 *
 * @param key           - Namespaced Redis key, e.g. "rl:support:user-id"
 * @param max           - Maximum requests allowed in the window
 * @param windowSeconds - Window duration in seconds
 * @returns true if the request should be rejected (rate limited)
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const redis = getRedis();
  const count = await redis.incr(key);
  if (count === 1) {
    // First request — set TTL. If this fails, key persists without TTL.
    // Wrap in try/catch so the failure doesn't mask the rate-limit result.
    try {
      await redis.expire(key, windowSeconds);
    } catch (err) {
      console.error("[rate-limit] Failed to set TTL on key:", key, err);
    }
  }
  return count > max;
}
