// Simple per-IP hourly rate limit backed by D1.
// One row per (route, ip, hour-bucket). Atomic increment via INSERT...ON CONFLICT.
// Returns { allowed: boolean, count: number, limit: number }.

const DEFAULT_LIMIT = 5;

export function clientIp(request) {
  // cf-connecting-ip is set by Cloudflare on every Worker request. Trust it.
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

export async function rateLimit(env, route, ip, limit = DEFAULT_LIMIT) {
  const bucket = Math.floor(Date.now() / 3600_000);
  const row = await env.DB
    .prepare(
      `INSERT INTO rate_limit (route, ip, bucket_hour, count)
         VALUES (?, ?, ?, 1)
       ON CONFLICT(route, ip, bucket_hour) DO UPDATE SET count = count + 1
       RETURNING count`
    )
    .bind(route, ip, bucket)
    .first();

  const count = row?.count ?? 1;

  // Opportunistic GC: 1% of requests reap rows older than 24h.
  if (Math.random() < 0.01) {
    const cutoff = bucket - 24;
    await env.DB.prepare('DELETE FROM rate_limit WHERE bucket_hour < ?').bind(cutoff).run();
  }

  return { allowed: count <= limit, count, limit };
}
