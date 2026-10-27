# AI Posture Worker

Cloudflare Worker backend for AI Posture. Handles newsletter capture (double opt-in) via Resend and assessment-artifact delivery, live at `api.aiposture.org`.

## Endpoints

- `POST /api/newsletter` — accept `{ email, source? }`, store pending row, send Resend confirm mail.
- `GET /api/newsletter/confirm?t=<token>` — confirm subscription, return success page.
- `POST /api/deliver`: accept assessment result payload + email, send JSON artifact via Resend, then store an anonymous run. Delivery email is never written to the assessment record. A failed send creates no record; a post-send storage failure returns `storage_failed` (503), although the message may arrive.
- `GET /healthz` — liveness.

## Data

D1 database `ai_posture`, four tables: `newsletter`, `rate_limit`, `mail_cooldown`, `assessments`. Schema: [schema.sql](schema.sql).

Privacy posture: raw email is stored for newsletter subscriptions, never on new assessment records. Abuse controls store request IPs and separate HMAC recipient keys. Expired cooldown rows are removed on subsequent mail reservations; IP buckets are reaped opportunistically. Manual unsubscribe/deletion is available via privacy@paice.work, as documented in the site policy.

## Request and sending bounds

- Both POST routes require `application/json` (an optional charset is accepted) and reject unknown envelope fields.
- Newsletter bodies are limited to 1 KiB before parsing; fields are `email` and optional `source`.
- Delivery bodies are limited to 33 KiB before parsing; fields are `email` and `payload`. The serialized payload retains its separate 32 KiB limit. Streamed bytes are counted even without an accurate Content-Length.
- Existing per-IP limits remain five attempts per route per hour.
- Recipient cooldowns are rolling: one newsletter attempt per hour and one delivery attempt per ten minutes, across IPs. Newsletter retries return the normal pending response without another send or token rotation. An unexpired pending token is reused on later resends.
- Newsletter confirmation links expire 24 hours after original issuance. Both email formats show that absolute UTC deadline; resending an unexpired token does not extend it. Freshness and token consumption are checked atomically; an expired token cannot confirm, and later subscription creates a new token. Expired pending rows are removed on later subscription requests or when their expired link is used; confirmed rows are preserved. No scheduled cleanup or fixed row-deletion deadline is claimed.
- Delivery checks coherent scope, matching level names, normalized six-slot posteriors, modal levels, the minimum aggregate, and its complete constraining-vector set. Six-decimal rounding is allowed within 3e-6 total posterior mass; rounded modal ties are accepted. Out-of-scope results use null/N/A and posterior `[1,0,0,0,0,0]`. Current in-scope results put no mass on slot zero. Exact version `1.0.0` keeps its legacy nonzero slot-zero probabilities when the declared level remains a modal level from 1-5 and all other checks pass. No level-zero/Ignoring result is admitted, and legacy artifacts are sent/stored unchanged.
- Both mail routes share a budget of 100 attempts per hour. Failed attempts consume reservations. Repeated recipient-suppressed attempts do not consume this global budget.
- Recipient keys use HMAC-SHA-256 with the existing Resend secret and a purpose-specific input prefix. No additional secret is required. Rotating that secret changes cooldown keys; hourly global/IP controls still apply.
- Budgets fail closed on database/secret errors. These limits bound sending; they do not prove that a requested recipient owns an address or prevent an attacker from exhausting the shared quota.

## Local hardening rollout note

The six-medium-finding remediation is prepared locally for review and has not been deployed. Apply the additive `mail_cooldown` table/index in `schema.sql` before an eventual authorized Worker deployment. No schema operation is performed by the tests, except against disposable in-memory SQLite. The old nullable assessment email column remains for compatibility; no migration or deletion of existing production rows is implied. Review any old records separately under the usual production-data authority.

Tests use Node's built-in `node:sqlite` (Node 22 or later) to execute the schema and SQL against an in-memory database. Provider calls are mocked.

## Local dev

```
cd worker
npm install
cp .dev.vars.example .dev.vars       # fill in RESEND_API_KEY
npm run db:apply:local               # creates local D1
npm run dev                          # wrangler dev on localhost:8787
```

## Production setup (one-time)

```
# create D1
wrangler d1 create ai_posture
# → paste the database_id into wrangler.toml

npm run db:apply:remote

# set secret
wrangler secret put RESEND_API_KEY

# deploy
npm run deploy
```

The custom domain `api.aiposture.org` is attached via the `[[routes]] custom_domain = true` block in wrangler.toml (active in production; Cloudflare manages the DNS record automatically).

## Secrets

- `RESEND_API_KEY` — set via `wrangler secret put`. Never commit.

## Public vars (in wrangler.toml)

- `SITE_ORIGIN` — base URL for confirm links.
- `RESEND_FROM` — From header.

## CORS

Allowed origins are hard-coded in `src/index.js`. Update if you add a new domain.
