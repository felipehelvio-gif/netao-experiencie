// Rate limit em memória — suficiente pra single-replica.
// Em multi-replica usar Redis.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(params: {
  key: string;
  windowMs: number;
  max: number;
}): { ok: boolean; restantes: number; resetEm: number } {
  const now = Date.now();
  const b = buckets.get(params.key);
  if (!b || b.resetAt < now) {
    buckets.set(params.key, { count: 1, resetAt: now + params.windowMs });
    return { ok: true, restantes: params.max - 1, resetEm: params.windowMs };
  }
  if (b.count >= params.max) {
    return { ok: false, restantes: 0, resetEm: b.resetAt - now };
  }
  b.count += 1;
  return { ok: true, restantes: params.max - b.count, resetEm: b.resetAt - now };
}

// limpeza simples a cada chamada (best effort)
let lastSweep = 0;
export function sweepRateLimit() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
}
