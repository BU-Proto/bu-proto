-- Founders Circle: a small, invite-only group inside Proto for founders already building something
-- real. People apply from /founders, the team reads every application and asks some of them to a
-- call, and those accepted get invite-only events.

CREATE TABLE founder_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  -- Where they study, or ''.
  school TEXT NOT NULL DEFAULT '',
  -- The company or project's name.
  company TEXT NOT NULL,
  -- The product, a site or a profile: a full URL, or ''.
  link TEXT NOT NULL DEFAULT '',
  -- One of FOUNDER_STAGES and FOUNDER_COMMITMENTS (shared/constants.ts), as they picked it.
  stage TEXT NOT NULL,
  commitment TEXT NOT NULL,
  -- What they're building and for whom, and what they've done in the last three months.
  building TEXT NOT NULL,
  progress TEXT NOT NULL,
  -- Who else is on it, and what would help most now. Both optional.
  team TEXT NOT NULL DEFAULT '',
  help TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'interview', 'accepted', 'declined')),
  -- The team's own notes. Never shown to the applicant.
  notes TEXT NOT NULL DEFAULT '',
  -- The day of their call (yyyy-mm-dd), once one is set.
  interview_on TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX founder_applications_email ON founder_applications (email);
CREATE INDEX founder_applications_created ON founder_applications (created_at);

-- An event only Founders Circle members and the people we invite can come to. It still shows on
-- the calendar, but the site takes no RSVPs for it; the team adds who's coming as its guests.
ALTER TABLE events ADD COLUMN invite_only INTEGER NOT NULL DEFAULT 0;
