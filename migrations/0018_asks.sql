-- Asks: emails to people we need something from (a room from Spark!, a form from a sponsor, an
-- answer from a BU office). A teammate says what they need; Claude drafts the email; a teammate
-- checks it and presses Send. Nothing goes out on its own.

-- People and offices we ask things of. `notes` is what we know about them (what they handle, how
-- they like to be asked); Claude reads it when it writes to them.
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  organization TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX contacts_email ON contacts (email);

-- What Proto is, one fact a row, each with where it came from. Claude writes from these and never
-- makes one up; what it can't find it asks, and an answer about Proto itself is kept here so the
-- next email doesn't ask again.
CREATE TABLE facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL UNIQUE COLLATE NOCASE,
  value TEXT NOT NULL,
  -- "the site's copy", "Andres, 11/19, answering ask #4", …
  source TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One ask: who it's to, what we need in the asker's words, and the email waiting to go.
CREATE TABLE asks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER REFERENCES contacts (id) ON DELETE SET NULL,
  -- Copied from the contact when the ask is made, so the ask still reads right if they change.
  to_name TEXT NOT NULL,
  to_email TEXT NOT NULL,
  to_organization TEXT NOT NULL DEFAULT '',
  -- What the teammate needs, in their own words.
  request TEXT NOT NULL,
  -- The latest "Notes for Claude": how to change the draft.
  notes TEXT NOT NULL DEFAULT '',
  -- The email waiting to be sent: the first one, or a follow-up. Empty when nothing is waiting.
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  draft_kind TEXT NOT NULL DEFAULT 'ask' CHECK (draft_kind IN ('ask', 'follow-up')),
  -- JSON [{question, remember}]: what Claude still needs to know. `remember` = a lasting fact about Proto.
  questions TEXT NOT NULL DEFAULT '[]',
  -- JSON [{question, answer, by, at}]: what teammates have told it for this ask.
  answers TEXT NOT NULL DEFAULT '[]',
  -- draft: nothing sent yet · waiting: sent, no reply yet · answered · closed (dropped or done).
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'waiting', 'answered', 'closed')),
  -- A follow-up is drafted when this many days pass with no reply (0 = never).
  follow_up_days INTEGER NOT NULL DEFAULT 5,
  -- The day (yyyy-mm-dd) the next follow-up is due, while waiting.
  follow_up_due TEXT,
  -- The teammate who asked: on Cc, and told when a reply comes in.
  owner_email TEXT NOT NULL COLLATE NOCASE,
  owner_name TEXT NOT NULL DEFAULT '',
  drafted_at TEXT,
  sent_at TEXT,
  closed_at TEXT,
  -- Its conversation, once the first email has gone.
  thread_id INTEGER REFERENCES mail_threads (id) ON DELETE SET NULL,
  -- Set while a Send is under way, so a second press can't send it twice.
  sending_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX asks_status ON asks (status, follow_up_due);

-- A conversation: every email to or from one person (or a group) about one thing.
CREATE TABLE mail_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL,
  -- Replies come back to reply-<id>-<token>@proto.boston; the random token keeps the address unguessable.
  token TEXT NOT NULL,
  contact_id INTEGER REFERENCES contacts (id) ON DELETE SET NULL,
  ask_id INTEGER REFERENCES asks (id) ON DELETE SET NULL,
  -- open: it's on us (new mail, or a reply to write) · waiting: on them · done.
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'done')),
  -- Emails in it nobody has opened yet.
  unread INTEGER NOT NULL DEFAULT 0,
  -- The reply being written, so it survives a reload and any teammate can pick it up.
  draft_body TEXT NOT NULL DEFAULT '',
  draft_notes TEXT NOT NULL DEFAULT '',
  -- JSON [string]: what Claude needs to know to write the reply.
  draft_questions TEXT NOT NULL DEFAULT '[]',
  drafted_at TEXT,
  -- Set while a Send is under way, so a second press can't send it twice.
  sending_at TEXT,
  last_message_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX mail_threads_recent ON mail_threads (status, last_message_at);

-- Every email in a conversation: received (in) or sent from the portal (out).
CREATE TABLE mail_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL REFERENCES mail_threads (id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  -- out: ask, follow-up or reply · in: message.
  kind TEXT NOT NULL CHECK (kind IN ('message', 'ask', 'follow-up', 'reply')),
  -- Resend's id for it: a received email's, so a webhook sent twice is stored once.
  resend_id TEXT UNIQUE,
  -- The email's own Message-ID, In-Reply-To and References, for threading.
  message_id TEXT,
  in_reply_to TEXT,
  refs TEXT NOT NULL DEFAULT '',
  from_name TEXT NOT NULL DEFAULT '',
  from_email TEXT NOT NULL COLLATE NOCASE,
  -- JSON [string]
  to_addrs TEXT NOT NULL DEFAULT '[]',
  cc_addrs TEXT NOT NULL DEFAULT '[]',
  subject TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL DEFAULT '',
  -- A received email's HTML, shown only in a sandboxed frame.
  html TEXT NOT NULL DEFAULT '',
  -- JSON [{id, filename, contentType}]: a received email's files (fetched from Resend when opened),
  -- or the names of the files a sent one carried.
  attachments TEXT NOT NULL DEFAULT '[]',
  -- in: received · out: sent, failed, or logged (no RESEND_API_KEY, so nothing left).
  status TEXT NOT NULL CHECK (status IN ('received', 'sent', 'failed', 'logged')),
  -- out: the teammate who pressed Send.
  sent_by TEXT NOT NULL DEFAULT '',
  -- in: SPF / DKIM / DMARC as Resend saw them, JSON or null.
  authentication TEXT,
  -- in: Claude's reading of it. JSON {summary, category, needsReply, answersAsk, stillNeeded}, or null.
  reading TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX mail_messages_thread ON mail_messages (thread_id, created_at);
CREATE INDEX mail_messages_message_id ON mail_messages (message_id);

-- What the site already says about Proto. Real (from the site's copy), so Claude can use them.
INSERT INTO facts (label, value, source, updated_by) VALUES
  ('Name', 'Proto', 'the site''s copy', 'setup'),
  ('What Proto is', 'A BU-sponsored home base for students who make things: first-time CS students, hackathon regulars and student founders. Hack nights, hackathon trips, prep nights and demo nights. Never call it a club.', 'docs/concept.md', 'setup'),
  ('University', 'Boston University', 'the site''s copy', 'setup'),
  ('Website', 'https://proto.boston', 'wrangler.jsonc', 'setup'),
  ('Email', 'hello@proto.boston', 'wrangler.jsonc', 'setup'),
  ('Microgrants', 'Planned microgrants of $50 to $500 for hackathon travel, registration, API credits or hardware. Still finding funding: no one can apply for money yet.', 'docs/concept.md', 'setup');
