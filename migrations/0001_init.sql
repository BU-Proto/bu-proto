-- Everything BU Proto stores. Times are ISO-8601 UTC text (datetime('now')); content dates are
-- plain ISO days (yyyy-mm-dd). Booleans are 0/1. List fields are JSON text.

-- People who may use /admin, on top of the owners in ADMIN_GITHUB_LOGINS.
CREATE TABLE admins (
  login TEXT PRIMARY KEY COLLATE NOCASE,
  added_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Signed-in admins. The cookie holds a random token; only its SHA-256 is stored here.
CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  login TEXT NOT NULL COLLATE NOCASE,
  github_id INTEGER NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX admin_sessions_login ON admin_sessions (login);

-- ---- Content the portal edits -------------------------------------------------------------

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  place TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  placeholder INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX events_date ON events (date);

CREATE TABLE hackathons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  starts TEXT NOT NULL,
  ends TEXT NOT NULL,
  location TEXT NOT NULL,
  apply_by TEXT NOT NULL,
  travel_covered INTEGER NOT NULL DEFAULT 0,
  bu_going INTEGER NOT NULL DEFAULT 0,
  href TEXT NOT NULL DEFAULT '',
  placeholder INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE wins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project TEXT NOT NULL,
  blurb TEXT NOT NULL DEFAULT '',
  event TEXT NOT NULL,
  placement TEXT NOT NULL,
  team TEXT NOT NULL DEFAULT '[]',
  photo TEXT,
  devpost TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  placeholder INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE board_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  photo TEXT,
  links TEXT NOT NULL DEFAULT '[]',
  position INTEGER NOT NULL DEFAULT 0,
  placeholder INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---- What the public sends in -------------------------------------------------------------

CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  year TEXT NOT NULL,
  track TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  unsubscribed INTEGER NOT NULL DEFAULT 0,
  -- Random token for the one-click unsubscribe link in member emails.
  unsubscribe_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (event_id, email)
);
CREATE INDEX rsvps_email ON rsvps (email);

-- The fund isn't open: these are "I'd use this" sign-ups, triaged in the portal.
CREATE TABLE fund_interest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  year TEXT NOT NULL,
  target TEXT NOT NULL,
  spend TEXT NOT NULL,
  amount TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'approved', 'declined')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX fund_interest_email ON fund_interest (email);

-- ---- Email sent from the portal -----------------------------------------------------------

CREATE TABLE email_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  -- JSON EmailAudience, e.g. {"type":"event","eventId":3}
  audience TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  -- 'logged' = no RESEND_API_KEY, so nothing actually left (local dev).
  status TEXT NOT NULL CHECK (status IN ('sent', 'partial', 'failed', 'logged')),
  sent_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
