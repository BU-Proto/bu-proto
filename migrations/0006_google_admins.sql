-- Sign-in moves from GitHub to Google, so admins are known by email instead of GitHub login.
-- A GitHub login isn't an email and can't be turned into one, so both tables start over:
-- `admins` was empty in production when this ran (owners live in the ADMIN_EMAILS secret, not
-- here), so nobody real is lost; anyone added locally is re-added by email on the Admins page.
-- Dropping admin_sessions signs everyone out, which they'd need anyway to sign in with Google.

DROP TABLE admin_sessions;
DROP TABLE admins;

-- People who may use /admin, on top of the owners in ADMIN_EMAILS. Emails are stored lowercased.
-- invited_at is when the "you're an admin" email last went out, so resending it can be throttled.
CREATE TABLE admins (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  added_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  invited_at TEXT
);

-- Signed-in admins. The cookie holds a random token; only its SHA-256 is stored here.
-- google_sub is Google's stable account id; Google's own tokens are never stored.
CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  google_sub TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX admin_sessions_email ON admin_sessions (email);
