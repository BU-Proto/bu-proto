-- People putting themselves forward for a board seat, from the board page's form.
CREATE TABLE board_interest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  year TEXT NOT NULL,
  role TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX board_interest_created ON board_interest (created_at);
