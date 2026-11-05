-- Hackathons list as cards, like MLH's season page: a background photo with the event's logo
-- over it, and whether it's in person, hybrid or online. Only adds columns and fills empty ones,
-- so it's safe to run against production.

ALTER TABLE hackathons ADD COLUMN logo TEXT;
ALTER TABLE hackathons ADD COLUMN mode TEXT NOT NULL DEFAULT 'in-person' CHECK (mode IN ('in-person', 'online', 'hybrid'));

-- Hackathons added from the import queue never got the source's imagery. Each takes it from the
-- candidate that points at it (the latest, should two ever do). MLH's event JSON has both a
-- backgroundUrl and a logoUrl; `image` is the logo when there is one, so it only stands in for
-- the photo when MLH sent no logo. A Devpost thumbnail is the event's logo.

UPDATE hackathons SET photo = (
  SELECT COALESCE(
    json_extract(c.raw, '$.backgroundUrl'),
    CASE WHEN c.source = 'mlh' AND json_extract(c.raw, '$.logoUrl') IS NULL THEN c.image END
  )
  FROM hackathon_candidates c
  WHERE c.hackathon_id = hackathons.id
  ORDER BY c.id DESC
  LIMIT 1
)
WHERE (photo IS NULL OR photo = '')
  AND EXISTS (SELECT 1 FROM hackathon_candidates c WHERE c.hackathon_id = hackathons.id);

UPDATE hackathons SET logo = (
  SELECT COALESCE(
    json_extract(c.raw, '$.logoUrl'),
    CASE WHEN c.source = 'devpost' THEN c.image END
  )
  FROM hackathon_candidates c
  WHERE c.hackathon_id = hackathons.id
  ORDER BY c.id DESC
  LIMIT 1
)
WHERE (logo IS NULL OR logo = '')
  AND EXISTS (SELECT 1 FROM hackathon_candidates c WHERE c.hackathon_id = hackathons.id);

-- The column is new, so every row is still on the default; this only moves the ones the source
-- says are online or hybrid.
UPDATE hackathons SET mode = (
  SELECT c.mode
  FROM hackathon_candidates c
  WHERE c.hackathon_id = hackathons.id
  ORDER BY c.id DESC
  LIMIT 1
)
WHERE mode = 'in-person'
  AND EXISTS (SELECT 1 FROM hackathon_candidates c WHERE c.hackathon_id = hackathons.id AND c.mode <> 'in-person');
