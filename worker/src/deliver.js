// Artifact-delivery handler.
// Accepts { email, payload }, sends via Resend, then stores an anonymous record.
// Delivery email exists only in the active request, never in the assessment row.

import { json } from './index.js';
import { sendEmail } from './resend.js';
import { rateLimit, clientIp, reserveMail } from './ratelimit.js';
import { readJsonBody } from './request.js';
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

function isCoherentEstimate(payload) {
  const inScope = [];
  // The deployed 1.0.0 engine included slot-zero probability in otherwise valid
  // in-scope estimates. Preserve those clients without relaxing other checks.
  const legacyPosterior = payload.version === '1.0.0';
  for (const name of VECTOR_NAMES) {
    const vector = payload.vectors[name];
    // Six probabilities rounded to six decimals can lose up to 3e-6 total mass.
    const mass = vector.posterior.reduce((sum, value) => sum + value, 0);
    if (Math.abs(mass - 1) > 3e-6 + 1e-12) return false;
    if (!vector.in_scope) {
      if (vector.level !== null || vector.level_name !== 'N/A' ||
          vector.posterior[0] !== 1 || vector.posterior.slice(1).some(value => value !== 0) ||
          vector.evidence_checklist.length !== 0) return false;
    } else {
      if (vector.level === null || vector.level_name !== LEVEL_NAMES[vector.level]) return false;
      if (!legacyPosterior && vector.posterior[0] !== 0) return false;
      // Export rounding can tie modes. Accept any tied maximum, not just the first.
      if (vector.posterior[vector.level] !== Math.max(...vector.posterior)) return false;
      inScope.push(name);
    }
  }
  if (inScope.length === 0) {
    return payload.aggregate.level === null && payload.aggregate.level_name === 'N/A' && payload.constraining_vectors.length === 0;
  }
  const minimum = Math.min(...inScope.map(name => payload.vectors[name].level));
  const expected = inScope.filter(name => payload.vectors[name].level === minimum).sort();
  return payload.aggregate.level === minimum && payload.aggregate.level_name === LEVEL_NAMES[minimum] &&
    JSON.stringify(payload.constraining_vectors.slice().sort()) === JSON.stringify(expected);
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
    p.notice === 'This is an estimate, not a verified assertion.' &&
    isCoherentEstimate(p);
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

  const parsed = await readJsonBody(request, MAX_PAYLOAD_BYTES + 1024, ['email', 'payload']);
  if (parsed.error) return json({ error: parsed.error }, { status: parsed.status }, origin);
  const body = parsed.body;

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
  let budget;
  try {
    budget = await reserveMail(env, 'deliver', email);
  } catch {
    return json({ error: 'service_unavailable' }, { status: 503 }, origin);
  }
  if (!budget.allowed) {
    return json({ error: 'rate_limited' }, { status: 429, headers: { 'Retry-After': budget.reason === 'recipient' ? '600' : '3600' } }, origin);
  }
  const runId = generateRunId();
  const now = Math.floor(Date.now() / 1000);

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
  } catch {
    // No assessment exists yet, so failure cannot strand email or a partial row.
    return json({ error: 'delivery_failed' }, { status: 502 }, origin);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO assessments (run_id, created_at, delivered_at, payload)
       VALUES (?, ?, ?, ?)`
    ).bind(runId, now, Math.floor(Date.now() / 1000), serialized).run();
  } catch {
    // Mail may already have arrived. No email was persisted, even on this path.
    return json({ error: 'storage_failed', message: 'The email was sent, but the assessment record could not be saved.' }, { status: 503 }, origin);
  }

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
