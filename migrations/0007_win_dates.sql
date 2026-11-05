-- Wins get the date of their hackathon, so the site can list them newest first. Each date is the
-- day the project was submitted on Devpost, which is the hackathon's last day. Matched on id and
-- project, so a database where those don't line up is left alone.

ALTER TABLE wins ADD COLUMN date TEXT NOT NULL DEFAULT '';

UPDATE wins SET date = '2026-03-01' WHERE id = 7 AND project = 'EcoApi(Recost)';
UPDATE wins SET date = '2025-10-05' WHERE id = 8 AND project = 'Eyrie';
UPDATE wins SET date = '2026-10-25' WHERE id = 9 AND project = 'Flowcast';
UPDATE wins SET date = '2026-10-25' WHERE id = 10 AND project = 'Hear me Out';
UPDATE wins SET date = '2026-10-18' WHERE id = 11 AND project = 'Nemo';
UPDATE wins SET date = '2025-09-20' WHERE id = 12 AND project = 'noogie';
UPDATE wins SET date = '2026-02-22' WHERE id = 13 AND project = 'Sapling';
UPDATE wins SET date = '2026-03-29' WHERE id = 14 AND project = 'Split World';
UPDATE wins SET date = '2025-10-26' WHERE id = 15 AND project = 'Stalk Market';
UPDATE wins SET date = '2025-10-12' WHERE id = 16 AND project = 'Super Artificial Bros.';
