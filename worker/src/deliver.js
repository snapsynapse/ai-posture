// Artifact-delivery handler.
// Accepts { email, payload } from the result page, stores a per-run record under
// an opaque ID, sends the JSON artifact via Resend, then nulls the email column
// so the stored record carries no direct identifier.

import { json } from './index.js';
import { sendEmail } from './resend.js';
import { rateLimit, clientIp } from './ratelimit.js';
import { isValidEmail, normalizeEmail, generateToken } from './newsletter.js';

const MAX_PAYLOAD_BYTES = 32 * 1024; // 32 KiB — comfortably above any real artifact
const VECTOR_NAMES = ['Infrastructure', 'Regulation', 'People'];
const LEVEL_NAMES = ['N/A', 'Perceiving', 'Assessing', 'Integrating', 'Calibrating', 'Engineering'];
const TOP_LEVEL_KEYS = [
  'type',
  'version',
  'generated_at',
  'source',
  'estimate_label',
  'scope',
  'aggregate',
  'constraining_vectors',
  'vectors',
  'notice',
];

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || Object.getPrototypeOf(proto) === null;
}

function hasExactKeys(value, keys) {
  const actual = Object.keys(value).sort();
  const expected = keys.slice().sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isValidLevel(value) {
  return value === null || (Number.isInteger(value) && value >= 1 && value <= 5);
}

function isValidLevelName(value) {
  return LEVEL_NAMES.includes(value);
}

function isValidPosterior(value) {
  return Array.isArray(value) &&
    value.length === 6 &&
    value.every((entry) => typeof entry === 'number' && Number.isFinite(entry) && entry >= 0 && entry <= 1);
}

function isValidEvidenceChecklist(value) {
  return Array.isArray(value) &&
    value.every((entry) => typeof entry === 'string' && entry.length > 0);
}

function isValidDateTime(value) {
  if (typeof value !== 'string') return false;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z$/);
  if (!match) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second;
}

function isValidScope(value) {
  return isPlainObject(value) &&
    hasExactKeys(value, ['label']) &&
    (value.label === null || typeof value.label === 'string');
}

function isValidAggregate(value) {
  return isPlainObject(value) &&
    hasExactKeys(value, ['level', 'level_name']) &&
    isValidLevel(value.level) &&
    isValidLevelName(value.level_name);
}

function isValidConstrainingVectors(value) {
  if (!Array.isArray(value)) return false;
  const seen = new Set();
  for (const vector of value) {
    if (!VECTOR_NAMES.includes(vector) || seen.has(vector)) return false;
    seen.add(vector);
  }
  return true;
}

function isValidVectorResult(value) {
  return isPlainObject(value) &&
    hasExactKeys(value, ['in_scope', 'level', 'level_name', 'posterior', 'evidence_checklist']) &&
    typeof value.in_scope === 'boolean' &&
    isValidLevel(value.level) &&
    isValidLevelName(value.level_name) &&
    isValidPosterior(value.posterior) &&
    isValidEvidenceChecklist(value.evidence_checklist);
}

function isValidVectors(value) {
  if (!isPlainObject(value) || !hasExactKeys(value, VECTOR_NAMES)) return false;
  return VECTOR_NAMES.every((vector) => isValidVectorResult(value[vector]));
}

export function isValidPayload(p) {
  return isPlainObject(p) &&
    hasExactKeys(p, TOP_LEVEL_KEYS) &&
    p.type === 'AI Posture Pre-Assessment Result' &&
    typeof p.version === 'string' &&
    p.version.length > 0 &&
    isValidDateTime(p.generated_at) &&
    p.source === 'https://aiposture.org/assess/' &&
    p.estimate_label === 'estimated AI Posture' &&
    isValidScope(p.scope) &&
    isValidAggregate(p.aggregate) &&
    isValidConstrainingVectors(p.constraining_vectors) &&
    isValidVectors(p.vectors) &&
    p.notice === 'This is an estimate, not a verified assertion.';
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
