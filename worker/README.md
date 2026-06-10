# AI Posture Worker

Cloudflare Worker backend for AI Posture. Handles newsletter capture (double opt-in) via Resend and assessment-artifact delivery, live at `api.aiposture.org`.

## Endpoints

- `POST /api/newsletter` — accept `{ email, source? }`, store pending row, send Resend confirm mail.
- `GET /api/newsletter/confirm?t=<token>` — confirm subscription, return success page.
- `POST /api/deliver` — accept assessment result payload + email, store run, send JSON artifact via Resend. Email column is nulled after successful send; partial record deleted on failure.
- `GET /healthz` — liveness.

## Data

D1 database `ai_posture`, three tables: `newsletter`, `rate_limit`, `assessments`. Schema: [schema.sql](schema.sql).

Privacy posture: emails are stored only for newsletter delivery and artifact delivery (dissociated after send). Unsubscribe path TBD (Resend-managed list link). No PII beyond email + timestamps + token.

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
