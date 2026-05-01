CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  device TEXT,
  browser TEXT,
  country_code TEXT,
  country_name TEXT,
  city TEXT,
  region TEXT,
  ip_hash TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_occurred_at ON events (occurred_at DESC);
CREATE INDEX idx_events_visitor_id ON events (visitor_id);
CREATE INDEX idx_events_session_id ON events (session_id);
CREATE INDEX idx_events_path ON events (path);
