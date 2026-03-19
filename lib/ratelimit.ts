/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Note: state resets on cold starts in serverless environments.
 * This is still effective for rapid-fire abuse within a warm instance.
 * For multi-instance production deployments, replace with an Upstash/Redis limiter.
 */
const store = new Map<string, { count: number; reset: number }>();

/**
 * Returns true if the request is allowed, false if it should be rejected.
 * @param key    Unique key per caller (e.g. user ID or IP)
 * @param limit  Max requests per window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}
