// Newsletter subscribe + confirm handlers.
// Double opt-in: subscribe → store pending + email token → user clicks → confirm.

import { json } from './index.js';
import { sendEmail } from './resend.js';
import { rateLimit, clientIp } from './ratelimit.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, { status: 400 }, origin);
  }

  if (!isValidEmail(body?.email)) {
    return json({ error: 'invalid_email' }, { status: 400 }, origin);
  }

  const email = normalizeEmail(body.email);
  const source = typeof body.source === 'string' ? body.source.slice(0, 64) : null;
  const now = Math.floor(Date.now() / 1000);

  // Read existing row to decide whether a confirmation email is actually needed.
  // We do NOT leak that information back to the caller — response is uniform.
  const existing = await env.DB
    .prepare('SELECT status FROM newsletter WHERE email = ?')
    .bind(email)
    .first();

  if (existing?.status !== 'confirmed') {
    const token = generateToken();
    await env.DB
      .prepare(
        `INSERT INTO newsletter (email, status, confirm_token, created_at, source)
         VALUES (?, 'pending', ?, ?, ?)
         ON CONFLICT(email) DO UPDATE SET
           confirm_token = excluded.confirm_token,
           created_at    = excluded.created_at,
           source        = excluded.source,
           status        = 'pending'`
      )
      .bind(email, token, now, source)
      .run();

    const confirmUrl = `${env.API_ORIGIN}/api/newsletter/confirm?t=${token}`;

    await sendEmail(env, {
      to: email,
      subject: 'Confirm your AI Posture subscription',
      text: confirmText(confirmUrl),
      html: confirmHtml(confirmUrl),
    });
  }

  // Uniform response — does not reveal whether the address was new or already confirmed.
  return json({ ok: true, status: 'pending' }, {}, origin);
}

export async function handleNewsletterConfirm(url, env) {
  const token = url.searchParams.get('t');
  if (!token || token.length !== 64) {
    return htmlPage('Invalid confirmation link', 'This link is not valid.');
  }

  const row = await env.DB
    .prepare('SELECT email, status FROM newsletter WHERE confirm_token = ?')
    .bind(token)
    .first();

  if (!row) {
    return htmlPage('Link expired or already used', 'Try subscribing again from the site.');
  }

  if (row.status === 'confirmed') {
    return htmlPage('Already confirmed', 'You are subscribed. Nothing more to do.');
  }

  const now = Math.floor(Date.now() / 1000);
  await env.DB
    .prepare(
      `UPDATE newsletter
         SET status = 'confirmed', confirmed_at = ?, confirm_token = NULL
         WHERE confirm_token = ?`
    )
    .bind(now, token)
    .run();

  return htmlPage('Subscription confirmed', 'You will get AI Posture updates from now on.');
}

function confirmText(url) {
  return [
    'Confirm your AI Posture subscription by opening this link:',
    '',
    url,
    '',
    'If you did not request this, ignore this email and you will not be subscribed.',
  ].join('\n');
}

function confirmHtml(url) {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;max-width:560px;margin:2rem auto;padding:0 1rem;color:#111">
<h2 style="margin-top:0">Confirm your AI Posture subscription</h2>
<p>Click the link below to confirm.</p>
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
