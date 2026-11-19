-- Asks: emails to people we need something from (a room from Spark!, a form from a sponsor, an
-- answer from a BU office). A teammate says what they need; Claude drafts the email and fills
-- in any forms it carries; a teammate checks it and presses Send. Nothing goes out on its own.

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

-- What Proto is, one fact a row, each with where it came from. Claude writes and fills forms from
-- these and never makes one up; what it can't find it asks, and an answer about Proto itself is
-- kept here so the next form doesn't ask again.
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
  -- The teammate who asked: the email's Reply-To and Cc, so replies reach them.
  owner_email TEXT NOT NULL COLLATE NOCASE,
  owner_name TEXT NOT NULL DEFAULT '',
  drafted_at TEXT,
  sent_at TEXT,
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX asks_status ON asks (status, follow_up_due);

-- Every email that went out for an ask: the first, then each follow-up.
CREATE TABLE ask_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ask_id INTEGER NOT NULL REFERENCES asks (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('ask', 'follow-up')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  -- JSON [string]: the names of the files it carried.
  attachments TEXT NOT NULL DEFAULT '[]',
  -- 'logged' = no RESEND_API_KEY, so nothing actually left (local dev).
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'logged')),
  sent_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX ask_messages_ask ON ask_messages (ask_id);

-- Forms an ask carries. A PDF is filled in its own boxes and can ride on the email; a web form
-- (Google Forms, Engage, anything with a link) gets an answer sheet, and a Google Form a
-- prefilled link, for a teammate to check and submit.
CREATE TABLE ask_forms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ask_id INTEGER NOT NULL REFERENCES asks (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('pdf', 'web')),
  name TEXT NOT NULL,
  -- web: the form's address.
  url TEXT NOT NULL DEFAULT '',
  -- web: the questions, pasted by a teammate or read from a public Google Form.
  questions TEXT NOT NULL DEFAULT '',
  -- JSON: a PDF's own boxes, or a Google Form's questions, as read when it was added.
  fields TEXT NOT NULL DEFAULT '[]',
  -- JSON [{field, value, source}]: Claude's answers, each with where it came from.
  answers TEXT NOT NULL DEFAULT '[]',
  -- JSON [string]: what it left empty and why.
  missing TEXT NOT NULL DEFAULT '[]',
  -- pdf: send the filled copy with the email.
  attach INTEGER NOT NULL DEFAULT 1,
  blank_size INTEGER NOT NULL DEFAULT 0,
  filled_size INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX ask_forms_ask ON ask_forms (ask_id);

-- A PDF form's bytes, blank and filled, cut into parts: D1 holds at most 2 MB in one value.
CREATE TABLE ask_form_parts (
  form_id INTEGER NOT NULL REFERENCES ask_forms (id) ON DELETE CASCADE,
  copy TEXT NOT NULL CHECK (copy IN ('blank', 'filled')),
  part INTEGER NOT NULL,
  data BLOB NOT NULL,
  PRIMARY KEY (form_id, copy, part)
);

-- What the site already says about Proto. Real (from the site's copy), so Claude can use them.
INSERT INTO facts (label, value, source, updated_by) VALUES
  ('Name', 'Proto', 'the site''s copy', 'setup'),
  ('What Proto is', 'A BU-sponsored home base for students who make things: first-time CS students, hackathon regulars and student founders. Hack nights, hackathon trips, prep nights and demo nights. Never call it a club.', 'docs/concept.md', 'setup'),
  ('University', 'Boston University', 'the site''s copy', 'setup'),
  ('Website', 'https://proto.boston', 'wrangler.jsonc', 'setup'),
  ('Email', 'hello@proto.boston', 'wrangler.jsonc', 'setup'),
  ('Microgrants', 'Planned microgrants of $50 to $500 for hackathon travel, registration, API credits or hardware. Still finding funding: no one can apply for money yet.', 'docs/concept.md', 'setup');
