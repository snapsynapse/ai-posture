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

// Separate rolling recipient cooldowns for newsletter (1h) and delivery (10m),
// with one shared 100-attempt/hour provider budget. Reservations count failures
// too: provider or database errors must not open an unlimited retry path.
export async function reserveMail(env, route, email) {
  if (!env.RESEND_API_KEY) throw new Error('mail secret unavailable');
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.RESEND_API_KEY),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key,
    encoder.encode('ai-posture-mail-recipient:v1:' + email));
  const recipient = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const now = Math.floor(Date.now() / 1000);
  const cooldown = route === 'newsletter' ? 3600 : 600;
  await env.DB.prepare('DELETE FROM mail_cooldown WHERE available_at <= ?').bind(now).run();
  const claimed = await env.DB.prepare(
    `INSERT INTO mail_cooldown (route, recipient_key, available_at) VALUES (?, ?, ?)
     ON CONFLICT(route, recipient_key) DO UPDATE SET available_at = excluded.available_at
     WHERE mail_cooldown.available_at <= ? RETURNING recipient_key`
  ).bind(route, recipient, now + cooldown, now).first();
  if (!claimed) return { allowed: false, reason: 'recipient' };
  const global = await rateLimit(env, 'mail_global', 'all', 100);
  return { allowed: global.allowed, reason: global.allowed ? null : 'global' };
}
