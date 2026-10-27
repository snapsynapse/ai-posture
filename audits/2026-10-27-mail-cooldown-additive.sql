CREATE TABLE IF NOT EXISTS mail_cooldown (
  route          TEXT NOT NULL,
  recipient_key  TEXT NOT NULL,
  available_at   INTEGER NOT NULL,
  PRIMARY KEY (route, recipient_key)
);
CREATE INDEX IF NOT EXISTS idx_mail_cooldown_expiry ON mail_cooldown (available_at);
