-- Events and hackathons get their own pages, like wins: a cover, a full write-up, and photos.
ALTER TABLE events ADD COLUMN photo TEXT;
ALTER TABLE events ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN agenda TEXT NOT NULL DEFAULT '[]';
ALTER TABLE events ADD COLUMN hosts TEXT NOT NULL DEFAULT '[]';
ALTER TABLE events ADD COLUMN gallery TEXT NOT NULL DEFAULT '[]';

ALTER TABLE hackathons ADD COLUMN photo TEXT;
ALTER TABLE hackathons ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE hackathons ADD COLUMN trip TEXT NOT NULL DEFAULT '';
ALTER TABLE hackathons ADD COLUMN trip_signup TEXT;
ALTER TABLE hackathons ADD COLUMN gallery TEXT NOT NULL DEFAULT '[]';

-- Sample write-ups for the sample rows, so the new pages show their structure. Still samples.
UPDATE events SET
  description = 'Every semester we bring back people who won something at a hackathon and ask them to show what they built, how the weekend actually went, and what it led to afterwards: internships, startups, a project they still work on.

It''s the best place to start if you''ve never been to a hackathon. Come with questions; there''s pizza.',
  agenda = '["6:30 Pizza","6:50 Three short demos","7:30 Q&A with the builders","8:00 Find a team for the next trip"]'
WHERE placeholder = 1 AND kind = 'Why hackathons';

UPDATE events SET
  description = 'Bring a project, or come find one. Hack night is open to every track: first-timers get paired with someone who has shipped before, and regulars use it to keep side projects moving.',
  agenda = '["7:00 Food","7:15 Quick intros: what are you working on?","7:30 Build","9:45 Show what you got done"]'
WHERE placeholder = 1 AND kind = 'Hack night';

UPDATE hackathons SET
  description = 'A weekend-long hackathon run by students, with workshops for first-timers, mentors on site and prizes across several tracks.',
  trip = 'We go as a group. Meet at CDS on Friday afternoon; we travel together and come back Sunday night. Sign up so we know how many seats to book.'
WHERE placeholder = 1;
