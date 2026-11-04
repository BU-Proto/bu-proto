-- The sample content the site launched with. Every row is placeholder = 1, so it renders with the
-- "sample" tag until someone replaces it in the portal and unticks "Sample content".

INSERT INTO events (kind, title, date, time, place, text, placeholder, published) VALUES
  ('Why hackathons', 'Why hackathons?', '2026-11-12', '6:30–8:30 PM', 'CDS, 665 Commonwealth Ave', 'Past winners show what they built and what it led to. Pizza, then questions.', 1, 1),
  ('Hack night', 'Weekly hack night', '2026-11-19', '7:00–10:00 PM', 'CDS, 665 Commonwealth Ave', 'Bring a project or find one. Food at 7.', 1, 1),
  ('Panel', 'From side project to startup', '2026-12-03', '6:00–7:30 PM', 'CDS, 665 Commonwealth Ave', 'Alumni founders and a recruiter on what got their projects noticed.', 1, 1),
  ('Prep night', 'Hack@Brown prep night', '2027-01-26', '7:00–9:00 PM', 'CDS, 665 Commonwealth Ave', 'Ideas, team formation and pitch practice the week before.', 1, 1),
  ('Workshop', 'Ship an AI app in an evening', '2027-02-04', '6:30–8:30 PM', 'CDS, 665 Commonwealth Ave', 'A hands-on workshop co-hosted with a sponsor. Laptops required.', 1, 1),
  ('Demo night', 'Spring demo night', '2027-04-22', '6:00–9:00 PM', 'CDS, 665 Commonwealth Ave', 'Anyone can show anything. Five minutes each, half-finished welcome.', 1, 1);

INSERT INTO hackathons (name, starts, ends, location, apply_by, travel_covered, bu_going, href, placeholder, published) VALUES
  ('Hack@Brown', '2027-01-30', '2027-01-31', 'Providence, RI', '2026-12-15', 1, 9, 'https://hackatbrown.org', 1, 1),
  ('TreeHacks', '2027-02-12', '2027-02-14', 'Stanford, CA', '2026-12-01', 0, 3, 'https://www.treehacks.com', 1, 1),
  ('MakeMIT', '2027-02-20', '2027-02-21', 'Cambridge, MA', '2027-01-10', 1, 6, 'https://makemit.org', 1, 1),
  ('Bitcamp', '2027-04-09', '2027-04-11', 'College Park, MD', '2027-03-01', 0, 2, 'https://bit.camp', 1, 1),
  ('HackMIT', '2027-09-18', '2027-09-19', 'Cambridge, MA', '2027-07-15', 1, 12, 'https://hackmit.org', 1, 1),
  ('PennApps', '2027-09-24', '2027-09-26', 'Philadelphia, PA', '2027-08-01', 1, 7, 'https://pennapps.com', 1, 1);

INSERT INTO wins (project, blurb, event, placement, team, photo, devpost, position, placeholder, published) VALUES
  ('Pantry Pal', 'Snap your fridge, get three recipes that use what’s about to expire.', 'Sample Hackathon 2026', '1st overall', '["Sample Student","Sample Student","Sample Student"]', NULL, NULL, 0, 1, 1),
  ('T-Tracker', 'A wall display that tells you when to leave for the Green Line.', 'Sample Hackathon 2026', 'Best hardware hack', '["Sample Student","Sample Student"]', NULL, NULL, 1, 1, 1),
  ('Office Hours Queue', 'A fair, live queue for TA office hours, built in a weekend.', 'Sample Hackathon 2026', '2nd place', '["Sample Student","Sample Student","Sample Student","Sample Student"]', NULL, NULL, 2, 1, 1),
  ('Signbridge', 'Live fingerspelling recognition from a laptop webcam.', 'Sample Hackathon 2026', 'Best accessibility hack', '["Sample Student","Sample Student"]', NULL, NULL, 3, 1, 1),
  ('Lease Lens', 'Reads a Boston lease and flags the clauses worth asking about.', 'Sample Hackathon 2026', '3rd place', '["Sample Student","Sample Student","Sample Student"]', NULL, NULL, 4, 1, 1),
  ('Quiet Room', 'Finds the emptiest study space on campus right now.', 'Sample Hackathon 2026', 'Sponsor prize', '["Sample Student"]', NULL, NULL, 5, 1, 1);

INSERT INTO board_members (name, role, photo, links, position, placeholder, published) VALUES
  ('Sample Person', 'President', NULL, '[]', 0, 1, 1),
  ('Sample Person', 'Start track lead', NULL, '[]', 1, 1, 1),
  ('Sample Person', 'Build track lead', NULL, '[]', 2, 1, 1),
  ('Sample Person', 'Launch track lead', NULL, '[]', 3, 1, 1),
  ('Sample Person', 'Trips and travel', NULL, '[]', 4, 1, 1),
  ('Sample Person', 'Sponsorships', NULL, '[]', 5, 1, 1);
