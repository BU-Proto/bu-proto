-- Roles: the pieces of Proto that need someone, posted from the portal, and the applications
-- people send for them from each role's page.

CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  -- The part of Proto it belongs to ("Events", "Design"), or '' for none.
  team TEXT NOT NULL DEFAULT '',
  -- One or two lines for the list.
  summary TEXT NOT NULL DEFAULT '',
  -- The full write-up on the role's own page: plain text, blank lines between paragraphs.
  description TEXT NOT NULL DEFAULT '',
  -- How much time it takes, in words: "About 3 hours a week".
  commitment TEXT NOT NULL DEFAULT '',
  -- The last day to apply (yyyy-mm-dd), or '' while it's open until filled.
  apply_by TEXT NOT NULL DEFAULT '',
  -- Extra questions the application asks for this role, as a JSON list of strings.
  questions TEXT NOT NULL DEFAULT '[]',
  position INTEGER NOT NULL DEFAULT 0,
  placeholder INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One application per person per role: applying again with the same email replaces the answers
-- and the résumé, and keeps the status and notes. A deleted role leaves its applications behind (role_id NULL),
-- which is why the title is copied onto each one.
CREATE TABLE role_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER REFERENCES roles (id) ON DELETE SET NULL,
  role_title TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  year TEXT NOT NULL,
  -- Something they've made, or a profile: a full URL, or ''.
  link TEXT NOT NULL DEFAULT '',
  -- The résumé they uploaded: its file name and size in bytes. The file itself is in
  -- role_application_resume_parts.
  resume_name TEXT NOT NULL DEFAULT '',
  resume_size INTEGER NOT NULL DEFAULT 0,
  -- The role's own questions as they were asked, with the answers: JSON [{ question, answer }].
  answers TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'accepted', 'declined')),
  -- Admins' own notes. Never shown to the applicant.
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (role_id, email)
);
CREATE INDEX role_applications_email ON role_applications (email);
CREATE INDEX role_applications_created ON role_applications (created_at);

-- An application's résumé (a PDF), cut into parts: D1 holds at most 2 MB in one value, and a
-- résumé may run to 5 MB. Read back in `part` order. Goes when its application does.
CREATE TABLE role_application_resume_parts (
  application_id INTEGER NOT NULL REFERENCES role_applications (id) ON DELETE CASCADE,
  part INTEGER NOT NULL,
  data BLOB NOT NULL,
  PRIMARY KEY (application_id, part)
);

-- The roles open when this shipped: the four board seats the board page lists, in its words. They
-- are real, so not samples. Their write-ups are left for the portal.
INSERT INTO roles (title, team, summary, description, commitment, apply_by, questions, position, placeholder, published) VALUES
  ('Head of Partnerships', 'Board', 'Outside BU: sponsors, companies, and partner organisations and hackathons.', '', '', '', '[]', 0, 0, 1),
  ('Head of the Fund', 'Board', 'Sets up the hackathon travel fund, then runs it once it opens.', '', '', '', '[]', 1, 0, 1),
  ('Head of Community', 'Board', 'Inside BU: our contact for Spark!, Innovate@BU, departments and other student groups, keeping those relationships going for every event we run together.', '', '', '', '[]', 2, 0, 1),
  ('Head of Growth', 'Board', 'Runs our events and reaches more BU students: outreach, socials, posters and getting each event in front of the right people.', '', '', '', '[]', 3, 0, 1);
