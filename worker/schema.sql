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
