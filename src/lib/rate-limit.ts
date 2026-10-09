/**
 * Minimal in-process rate limiter for public write endpoints.
 *
 * Scope and limits: this is a per-instance, in-memory window. On a single
 * server or a warm serverless instance it stops the obvious cases — a stuck
 * retry loop, a form spammer, a scripted flood from one address. It is NOT a
 * distributed limiter: a platform that fans requests across many cold
 * instances will let more through. For a hard global limit, put the
 * platform's own WAF/rate limiting in front, or swap this module's `hit()` for
 * a Redis/Upstash counter — every caller goes through this one function.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

/** Drop expired buckets occasionally so the map cannot grow without bound. */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

export function hit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  return { ok: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/**
 * Best-effort client address. Proxy headers are client-controllable, so this
 * is a throttling hint only — never an identity or an authorisation check.
 */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}
