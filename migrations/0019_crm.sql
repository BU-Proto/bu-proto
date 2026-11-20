-- The CRM: the orgs we work with, the people at them, what happened with each (interactions),
-- what we owe them next (follow-ups), what we're trying to land (deals), the intros we make
-- between members and contacts, and who comes to an event as a guest. Plus roles for admins.
--
-- People stay in two tables for now: members (signed up on the site) and contacts (everyone
-- else: VCs, recruiters, staff, alumni, and students we've scouted who haven't signed up).
-- The portal shows them as one People list, matched by email. Each row below points at a
-- member or a contact, never both.

CREATE TABLE orgs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  -- vc: a fund · company · campus: a BU office, department or club · hackathon: an organizer · other
  kind TEXT NOT NULL DEFAULT 'company' CHECK (kind IN ('vc', 'company', 'campus', 'hackathon', 'other')),
  website TEXT NOT NULL DEFAULT '',
  -- What they care about, in a line: "Seed · AI and dev tools".
  focus TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  -- The teammate who looks after this relationship.
  owner_email TEXT COLLATE NOCASE,
  -- Which logo wall on /track-record it shows on, if any, and where on it (lower first).
  wall TEXT NOT NULL DEFAULT '' CHECK (wall IN ('', 'sponsors', 'partners')),
  wall_order INTEGER NOT NULL DEFAULT 0,
  -- An upload's name (see 0017_uploads), for the logo.
  logo TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Contacts grow into full people: where they work, who owns them, and what kind of person.
-- lead: a student we've scouted who hasn't signed up · contact: anyone outside BU's students · alum
ALTER TABLE contacts ADD COLUMN org_id INTEGER REFERENCES orgs (id) ON DELETE SET NULL;
ALTER TABLE contacts ADD COLUMN title TEXT NOT NULL DEFAULT '';
ALTER TABLE contacts ADD COLUMN kind TEXT NOT NULL DEFAULT 'contact' CHECK (kind IN ('contact', 'lead', 'alum'));
ALTER TABLE contacts ADD COLUMN owner_email TEXT COLLATE NOCASE;
ALTER TABLE contacts ADD COLUMN link TEXT NOT NULL DEFAULT '';
CREATE INDEX contacts_org ON contacts (org_id);

-- Members can be owned too, so a teammate can keep up with them.
ALTER TABLE members ADD COLUMN owner_email TEXT COLLATE NOCASE;

-- What we're trying to land with an org: money, a partnership, a speaker or a visit.
CREATE TABLE deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER NOT NULL REFERENCES orgs (id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts (id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('sponsor', 'partner', 'visit')),
  title TEXT NOT NULL,
  -- What we're asking for, as people say it: "$3,000", "Room + co-brand", "Speaker".
  ask TEXT NOT NULL DEFAULT '',
  -- The money in it, when there is some, in cents (for Fund › Sources).
  amount_cents INTEGER,
  stage TEXT NOT NULL DEFAULT 'identified' CHECK (stage IN ('identified', 'reached_out', 'talking', 'committed', 'delivered')),
  -- Set when it's dropped. A passed deal leaves the board but keeps its stage.
  passed_at TEXT,
  event_id INTEGER REFERENCES events (id) ON DELETE SET NULL,
  notes TEXT NOT NULL DEFAULT '',
  owner_email TEXT COLLATE NOCASE,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX deals_org ON deals (org_id);
CREATE INDEX deals_stage ON deals (stage, passed_at);

-- A call, meeting, coffee, email or campus visit, logged by a teammate.
CREATE TABLE interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('call', 'meeting', 'coffee', 'email', 'visit', 'note')),
  -- The day it happened (yyyy-mm-dd).
  happened_on TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  member_id INTEGER REFERENCES members (id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts (id) ON DELETE CASCADE,
  -- The org it was about. Filled from the contact's org when not given.
  org_id INTEGER REFERENCES orgs (id) ON DELETE SET NULL,
  deal_id INTEGER REFERENCES deals (id) ON DELETE SET NULL,
  created_by TEXT NOT NULL COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (member_id IS NULL OR contact_id IS NULL)
);
CREATE INDEX interactions_member ON interactions (member_id);
CREATE INDEX interactions_contact ON interactions (contact_id);
CREATE INDEX interactions_org ON interactions (org_id);

-- Something someone on the team owes someone, by a day.
CREATE TABLE follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  due_on TEXT NOT NULL,
  owner_email TEXT NOT NULL COLLATE NOCASE,
  done_at TEXT,
  member_id INTEGER REFERENCES members (id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts (id) ON DELETE CASCADE,
  org_id INTEGER REFERENCES orgs (id) ON DELETE CASCADE,
  deal_id INTEGER REFERENCES deals (id) ON DELETE CASCADE,
  -- The interaction it came out of, if any.
  interaction_id INTEGER REFERENCES interactions (id) ON DELETE SET NULL,
  created_by TEXT NOT NULL COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX follow_ups_open ON follow_ups (done_at, due_on);

-- An intro from a student (a member, or a lead in contacts) to a contact.
CREATE TABLE intros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER REFERENCES members (id) ON DELETE CASCADE,
  lead_id INTEGER REFERENCES contacts (id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  -- Why, in a line. Only the reason and the outcome are kept: nothing private about the student.
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'drafting' CHECK (status IN ('drafting', 'sent', 'met', 'hired_or_funded', 'passed')),
  outcome TEXT NOT NULL DEFAULT '',
  made_by TEXT NOT NULL COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((member_id IS NULL) <> (lead_id IS NULL))
);

-- Speakers, judges, sponsors and VCs at an event.
CREATE TABLE event_guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('speaker', 'judge', 'sponsor', 'host', 'moderator', 'guest')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'declined')),
  owner_email TEXT COLLATE NOCASE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (event_id, contact_id)
);

-- Who can change what. Everyone in the portal reads everything; level and areas decide edits.
-- admin: can change everything (what every added admin could do before this) · board: shared
-- work plus their areas · team: shared work only. Owners (ADMIN_EMAILS) are always full.
-- areas: comma-separated, from partnerships, fund, community, scouting.
ALTER TABLE admins ADD COLUMN level TEXT NOT NULL DEFAULT 'admin' CHECK (level IN ('admin', 'board', 'team'));
ALTER TABLE admins ADD COLUMN areas TEXT NOT NULL DEFAULT '';
-- What they're called in the portal ("Head of Community"), shown next to their name.
ALTER TABLE admins ADD COLUMN seat TEXT NOT NULL DEFAULT '';

-- The Inbox's triage for the two queues that had none: a sign-up someone has welcomed or looked
-- at, and board interest someone has answered. NULL is "still waiting".
ALTER TABLE members ADD COLUMN reviewed_at TEXT;
ALTER TABLE board_interest ADD COLUMN reviewed_at TEXT;
-- Everyone who signed up before the Inbox existed has been seen already.
UPDATE members SET reviewed_at = datetime('now');
UPDATE board_interest SET reviewed_at = datetime('now');
