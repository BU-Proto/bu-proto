-- Upcoming hackathons pulled from MLH and Devpost each day. They wait here for an admin to add
-- them as a draft hackathon or dismiss them; nothing reaches the site on its own. Re-imports only
-- refresh rows still 'new', so a dismissal sticks and an added row keeps pointing at its draft.

CREATE TABLE hackathon_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL CHECK (source IN ('mlh', 'devpost')),
  -- The source's own id for the event, stable across runs.
  source_id TEXT NOT NULL,
  name TEXT NOT NULL,
  starts TEXT NOT NULL,
  ends TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL CHECK (mode IN ('in-person', 'online', 'hybrid')),
  url TEXT NOT NULL DEFAULT '',
  image TEXT,
  -- The event as the source sent it, for debugging a bad parse.
  raw TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'added', 'dismissed')),
  hackathon_id INTEGER REFERENCES hackathons (id) ON DELETE SET NULL,
  first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (source, source_id)
);
CREATE INDEX hackathon_candidates_status_starts ON hackathon_candidates (status, starts);

-- One row per source per run, scheduled or manual. error is null when the run succeeded.
CREATE TABLE import_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT,
  found INTEGER NOT NULL DEFAULT 0,
  new INTEGER NOT NULL DEFAULT 0,
  error TEXT
);
CREATE INDEX import_runs_source_started ON import_runs (source, started_at);
