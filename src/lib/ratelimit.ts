// Simple in-memory sliding-window rate limiter.
// Good enough for a single-instance deployment; swap for Upstash/Redis
// if the app is ever deployed across multiple instances.

const buckets = new Map<string, number[]>();
let lastPrune = 0;

function prune(now: number, windowMs: number) {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [key, hits] of buckets) {
    const alive = hits.filter((t) => now - t < windowMs);
    if (alive.length === 0) buckets.delete(key);
    else buckets.set(key, alive);
  }
}

/** Returns true when the call is allowed, false when rate-limited. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  prune(now, windowMs);
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** Best-effort client IP for rate-limit keys. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}
