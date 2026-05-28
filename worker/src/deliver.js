// Artifact-delivery handler.
// Accepts { email, payload } from the result page, stores a per-run record under
// an opaque ID, sends the JSON artifact via Resend, then nulls the email column
// so the stored record carries no direct identifier.

import { json } from './index.js';
import { sendEmail } from './resend.js';
import { rateLimit, clientIp } from './ratelimit.js';
import { isValidEmail, normalizeEmail, generateToken } from './newsletter.js';

const MAX_PAYLOAD_BYTES = 32 * 1024; // 32 KiB — comfortably above any real artifact

export function isValidPayload(p) {
  if (!p || typeof p !== 'object') return false;
  if (typeof p.type !== 'string' || !p.type.toLowerCase().includes('ai posture')) return false;
  if (!p.aggregate || typeof p.aggregate !== 'object') return false;
  if (!p.vectors || typeof p.vectors !== 'object') return false;
  return true;
}

export function generateRunId() {
  return generateToken(); // 64 hex chars, 256-bit opaque
}

function payloadSize(serialized) {
  return new TextEncoder().encode(serialized).byteLength;
}

export async function handleDeliver(request, env, origin) {
  const ip = clientIp(request);
  const rl = await rateLimit(env, 'deliver', ip);
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
  if (!isValidPayload(body?.payload)) {
    return json({ error: 'invalid_payload' }, { status: 400 }, origin);
  }

  const serialized = JSON.stringify(body.payload);
  if (payloadSize(serialized) > MAX_PAYLOAD_BYTES) {
    return json({ error: 'payload_too_large' }, { status: 413 }, origin);
  }

  const email = normalizeEmail(body.email);
  const runId = generateRunId();
  const now = Math.floor(Date.now() / 1000);

  await env.DB
    .prepare(
      `INSERT INTO assessments (run_id, created_at, email, payload)
       VALUES (?, ?, ?, ?)`
    )
    .bind(runId, now, email, serialized)
    .run();

  const attachment = {
    filename: 'ai-posture-estimate.json',
    content: btoa(unescape(encodeURIComponent(serialized))),
  };

  try {
    await sendEmail(env, {
      to: email,
      subject: 'Your AI Posture estimate',
      text: deliveryText(runId, body.payload),
      html: deliveryHtml(runId, body.payload),
      attachments: [attachment],
    });
  } catch (err) {
    // Delivery failed. Per PRD acceptance criteria, do not retain a delivery-failed
    // record with the email attached. Remove the row so no stale PII is held.
    await env.DB.prepare('DELETE FROM assessments WHERE run_id = ?').bind(runId).run();
    return json({ error: 'delivery_failed' }, { status: 502 }, origin);
  }

  // Dissociate email from the stored record now that delivery succeeded.
  await env.DB
    .prepare('UPDATE assessments SET email = NULL, delivered_at = ? WHERE run_id = ?')
    .bind(now, runId)
    .run();

  return json({ ok: true, run_id: runId }, {}, origin);
}

function deliveryText(runId, payload) {
  const agg = payload?.aggregate?.level_name || payload?.aggregate?.level || 'see attached';
  return [
    'Your AI Posture estimate is attached as JSON.',
    '',
    `Aggregate posture: ${agg}`,
    `Run ID: ${runId}`,
    '',
    'This is an estimate, not a verified assertion. Retain the JSON if you want',
    'to compare against a future verified per-vector assessment.',
    '',
    'To request deletion of this stored record, email privacy@paice.work and',
    `include the run ID above. Records are retained for up to three years.`,
  ].join('\n');
}

function deliveryHtml(runId, payload) {
  const agg = escapeHtml(payload?.aggregate?.level_name || payload?.aggregate?.level || 'see attached');
  const safeRun = escapeHtml(runId);
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;max-width:560px;margin:2rem auto;padding:0 1rem;color:#111">
<h2 style="margin-top:0">Your AI Posture estimate</h2>
<p>The full estimate is attached to this email as JSON.</p>
<p><strong>Aggregate posture:</strong> ${agg}<br><strong>Run ID:</strong> <code>${safeRun}</code></p>
<p style="font-size:.85rem;color:#666">This is an estimate, not a verified assertion. Retain the JSON if you want to compare against a future verified per-vector assessment.</p>
<p style="font-size:.85rem;color:#666">To request deletion of this stored record, email <a href="mailto:privacy@paice.work">privacy@paice.work</a> and include the run ID above. Records are retained for up to three years.</p>
</body></html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
