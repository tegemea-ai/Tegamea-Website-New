/** Best-effort limits for one server instance. A cold start resets the counters. */

export function createWindowLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, number[]>();
  return function allow(key: string, now = Date.now()): boolean {
    const recent = (buckets.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
    if (recent.length >= limit) {
      buckets.set(key, recent);
      return false;
    }
    recent.push(now);
    buckets.set(key, recent);
    return true;
  };
}

export function createWindowCounter(limit: number, windowMs: number) {
  let stamps: number[] = [];
  return function allow(now = Date.now()): boolean {
    stamps = stamps.filter((stamp) => now - stamp < windowMs);
    if (stamps.length >= limit) return false;
    stamps.push(now);
    return true;
  };
}
