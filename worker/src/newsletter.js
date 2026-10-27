// Newsletter subscribe + confirm handlers.
// Double opt-in: subscribe → store pending + email token → user clicks → confirm.

import { json } from './index.js';
import { sendEmail } from './resend.js';
import { rateLimit, clientIp, reserveMail } from './ratelimit.js';
import { readJsonBody } from './request.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONFIRM_TTL_SECONDS = 24 * 3600;

export function isValidEmail(input) {
  if (typeof input !== 'string') return false;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  return EMAIL_RE.test(trimmed);
}

export function normalizeEmail(input) {
  return input.trim().toLowerCase();
}

export function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function handleNewsletterSubscribe(request, env, origin) {
  const ip = clientIp(request);
  const rl = await rateLimit(env, 'newsletter_subscribe', ip);
  if (!rl.allowed) {
    return json(
      { error: 'rate_limited', message: 'Too many requests. Try again in an hour.' },
      { status: 429, headers: { 'Retry-After': '3600' } },
      origin
    );
  }

  const parsed = await readJsonBody(request, 1024, ['email'], ['source']);
  if (parsed.error) return json({ error: parsed.error }, { status: parsed.status }, origin);
  const body = parsed.body;

  if (!isValidEmail(body?.email)) {
    return json({ error: 'invalid_email' }, { status: 400 }, origin);
  }

  const email = normalizeEmail(body.email);
  const source = typeof body.source === 'string' ? body.source.slice(0, 64) : null;
  const now = Math.floor(Date.now() / 1000);

  let budget;
  try {
    budget = await reserveMail(env, 'newsletter', email);
  } catch {
    return json({ error: 'service_unavailable' }, { status: 503 }, origin);
  }
  if (!budget.allowed) {
    if (budget.reason === 'recipient') return json({ ok: true, status: 'pending' }, {}, origin);
    return json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': '3600' } }, origin);
  }

  // Expired pending subscriptions do not keep an indefinitely usable token.
  // Cleanup is opportunistic; confirmation independently enforces the deadline.
  await env.DB.prepare("DELETE FROM newsletter WHERE status = 'pending' AND created_at <= ?")
    .bind(now - CONFIRM_TTL_SECONDS).run();

  // Read existing row to decide whether a confirmation email is actually needed.
  // We do NOT leak that information back to the caller — response is uniform.
  const existing = await env.DB
    .prepare('SELECT status FROM newsletter WHERE email = ?')
    .bind(email)
    .first();

  if (existing?.status !== 'confirmed') {
    const pending = await env.DB
      .prepare(
        `INSERT INTO newsletter (email, status, confirm_token, created_at, source)
         VALUES (?, 'pending', ?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           confirm_token = CASE WHEN newsletter.status = 'pending' AND newsletter.confirm_token IS NOT NULL
                                THEN newsletter.confirm_token ELSE excluded.confirm_token END,
           created_at    = CASE WHEN newsletter.status = 'pending' AND newsletter.confirm_token IS NOT NULL
                                THEN newsletter.created_at ELSE excluded.created_at END,
           source        = excluded.source,
           status        = 'pending'
         WHERE newsletter.status != 'confirmed'
         RETURNING confirm_token, created_at`
      )
      .bind(email, generateToken(), now, source)
      .first();

    // A confirmation may have raced the earlier SELECT. Never reset it to pending.
    if (!pending) return json({ ok: true, status: 'pending' }, {}, origin);

    const confirmUrl = `${env.API_ORIGIN}/api/newsletter/confirm?t=${pending.confirm_token}`;
    const expiresAt = new Date((pending.created_at + CONFIRM_TTL_SECONDS) * 1000).toISOString();

    await sendEmail(env, {
      to: email,
      subject: 'Confirm your AI Posture subscription',
      text: confirmText(confirmUrl, expiresAt),
      html: confirmHtml(confirmUrl, expiresAt),
    });
  }

  // Uniform response — does not reveal whether the address was new or already confirmed.
  return json({ ok: true, status: 'pending' }, {}, origin);
}

export async function handleNewsletterConfirm(url, env) {
  const token = url.searchParams.get('t');
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    return htmlPage('Invalid confirmation link', 'This link is not valid.');
  }

  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("DELETE FROM newsletter WHERE confirm_token = ? AND status = 'pending' AND created_at <= ?")
    .bind(token, now - CONFIRM_TTL_SECONDS).run();
  // Check freshness and consume the token in one statement, including races.
  const confirmed = await env.DB
    .prepare(
      `UPDATE newsletter
         SET status = 'confirmed', confirmed_at = ?, confirm_token = NULL
         WHERE confirm_token = ? AND status = 'pending' AND created_at > ? AND created_at <= ?
         RETURNING 1 AS confirmed`
    )
    .bind(now, token, now - CONFIRM_TTL_SECONDS, now)
    .first();

  if (!confirmed) {
    return htmlPage('Link expired or already used', 'Try subscribing again from the site.');
  }

  return htmlPage('Subscription confirmed', 'You will get AI Posture updates from now on.');
}

function confirmText(url, expiresAt) {
  return [
    'Confirm your AI Posture subscription by opening this link:',
    '',
    url,
    '',
    `This link expires at ${expiresAt} (UTC). If it expires, subscribe again.`,
    '',
    'If you did not request this, ignore this email and you will not be subscribed.',
  ].join('\n');
}

function confirmHtml(url, expiresAt) {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;max-width:560px;margin:2rem auto;padding:0 1rem;color:#111">
<h2 style="margin-top:0">Confirm your AI Posture subscription</h2>
<p>Click the link below to confirm.</p>
<p>This link expires at ${expiresAt} (UTC). If it expires, subscribe again.</p>
<p><a href="${url}" style="display:inline-block;padding:.6rem 1rem;background:#111;color:#fff;text-decoration:none;border-radius:4px">Confirm subscription</a></p>
<p style="font-size:.85rem;color:#666">Or paste this URL into your browser:<br><code>${url}</code></p>
<p style="font-size:.85rem;color:#666">If you did not request this, ignore the email and you will not be subscribed.</p>
</body></html>`;
}

function htmlPage(title, body) {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle} — AI Posture</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;max-width:560px;margin:4rem auto;padding:0 1rem;color:#111;line-height:1.5}a{color:#111}</style></head><body><h1>${safeTitle}</h1><p>${safeBody}</p><p><a href="https://aiposture.org/">Back to AI Posture</a></p></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
