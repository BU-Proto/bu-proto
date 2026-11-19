-- Pictures uploaded in the portal (board portraits, event covers, win photos), kept in D1 so the
-- site needs nothing else to hold them. The portal shrinks each one before it's sent, so a row
-- stays well under D1's 2 MB limit for one value. Served at /api/uploads/<key>.<ext>; the key is
-- random, so the addresses can't be guessed in order.
CREATE TABLE uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  bytes BLOB NOT NULL,
  size INTEGER NOT NULL,
  -- The file's name on the uploader's computer, for our own reference.
  name TEXT NOT NULL DEFAULT '',
  -- Who uploaded it: an admin's email.
  uploaded_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
