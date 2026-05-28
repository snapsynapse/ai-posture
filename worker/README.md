# AI Posture Worker

Cloudflare Worker backend for AI Posture. Handles newsletter capture (double opt-in) via Resend, and is the planned host for the future assessment-artifact delivery endpoint.

## Endpoints

- `POST /api/newsletter` — accept `{ email, source? }`, store pending row, send Resend confirm mail.
- `GET /api/newsletter/confirm?t=<token>` — confirm subscription, return success page.
- `GET /healthz` — liveness.

## Data

D1 database `ai_posture`, single table `newsletter`. Schema: [schema.sql](schema.sql).

Privacy posture: emails are stored only for newsletter delivery. Unsubscribe path TBD (Resend-managed list link). No PII beyond email + timestamps + token.

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

After the first deploy, attach the custom domain `api.aiposture.org` (DNS → CNAME → workers.dev hostname is created automatically by the `[[routes]] custom_domain = true` block; uncomment in wrangler.toml).

## Secrets

- `RESEND_API_KEY` — set via `wrangler secret put`. Never commit.

## Public vars (in wrangler.toml)

- `SITE_ORIGIN` — base URL for confirm links.
- `RESEND_FROM` — From header.

## CORS

Allowed origins are hard-coded in `src/index.js`. Update if you add a new domain.
