-- AI Posture Worker — D1 schema
-- Applied via: npm run db:apply:local | db:apply:remote

CREATE TABLE IF NOT EXISTS newsletter (
  email           TEXT PRIMARY KEY,
  status          TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  confirm_token   TEXT,
  created_at      INTEGER NOT NULL,
  confirmed_at    INTEGER,
  source          TEXT
);

CREATE INDEX IF NOT EXISTS idx_newsletter_token ON newsletter (confirm_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter (status);

-- Abuse throttle. One row per (route, ip) per hour bucket. Old rows reaped opportunistically.
CREATE TABLE IF NOT EXISTS rate_limit (
  route        TEXT NOT NULL,
  ip           TEXT NOT NULL,
  bucket_hour  INTEGER NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (route, ip, bucket_hour)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_bucket ON rate_limit (bucket_hour);

-- Completed assessment records. Stored under a random opaque run_id.
-- email is captured only for delivery and is nulled out after a successful send.
-- payload is the JSON artifact (aggregate, vectors, constraining vectors, etc).
CREATE TABLE IF NOT EXISTS assessments (
  run_id        TEXT PRIMARY KEY,
  created_at    INTEGER NOT NULL,
  email         TEXT,
  delivered_at  INTEGER,
  payload       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assessments_created ON assessments (created_at);
