-- Six more sample wins, so a local grid is as full as a real one. Local D1 only:
--   npx wrangler d1 execute DB --local --file scripts/more-sample-wins.sql
INSERT INTO wins (project, blurb, event, placement, team, photo, devpost, position, placeholder, published) VALUES
  ('Dining Dash', 'Live line lengths for every dining hall, from a camera at the door.', 'Sample Hackathon 2026', '1st overall', '[{"name":"Sample Student","href":null},{"name":"Sample Student","href":null},{"name":"Sample Student","href":null}]', NULL, NULL, 6, 1, 1),
  ('Bluebook', 'Turns a syllabus into a study plan you can actually keep.', 'Sample Hackathon 2026', 'Best education hack', '[{"name":"Sample Student","href":null},{"name":"Sample Student","href":null}]', NULL, NULL, 7, 1, 1),
  ('Commonwealth', 'A shared ride board for the long way home at break.', 'Sample Hackathon 2026', '2nd place', '[{"name":"Sample Student","href":null},{"name":"Sample Student","href":null},{"name":"Sample Student","href":null},{"name":"Sample Student","href":null}]', NULL, NULL, 8, 1, 1),
  ('Lab Notes', 'Speak your lab results and get a clean write-up back.', 'Sample Hackathon 2026', 'Best use of AI', '[{"name":"Sample Student","href":null},{"name":"Sample Student","href":null}]', NULL, NULL, 9, 1, 1),
  ('Night Walk', 'Picks the best-lit route back to your dorm after dark.', 'Sample Hackathon 2026', '3rd place', '[{"name":"Sample Student","href":null},{"name":"Sample Student","href":null},{"name":"Sample Student","href":null}]', NULL, NULL, 10, 1, 1),
  ('Thrift Map', 'Every student swap and free shelf near campus on one map.', 'Sample Hackathon 2026', 'Sponsor prize', '[{"name":"Sample Student","href":null}]', NULL, NULL, 11, 1, 1);
