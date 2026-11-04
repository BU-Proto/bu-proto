-- Each win gets a full project page: the prize track, a write-up, the stack, links, a gallery,
-- funding and where it's going. All optional.
ALTER TABLE wins ADD COLUMN track TEXT NOT NULL DEFAULT '';
ALTER TABLE wins ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE wins ADD COLUMN stack TEXT NOT NULL DEFAULT '[]';
ALTER TABLE wins ADD COLUMN github TEXT;
ALTER TABLE wins ADD COLUMN funding TEXT NOT NULL DEFAULT '';
ALTER TABLE wins ADD COLUMN next_steps TEXT NOT NULL DEFAULT '';
ALTER TABLE wins ADD COLUMN gallery TEXT NOT NULL DEFAULT '[]';

-- Teams were a list of names; now each teammate is { name, href } so names can link out.
UPDATE wins SET team = (
  SELECT COALESCE(json_group_array(json_object('name', value, 'href', NULL)), '[]')
  FROM json_each(wins.team)
  WHERE type = 'text'
)
WHERE json_valid(team) AND EXISTS (SELECT 1 FROM json_each(wins.team) WHERE type = 'text');

-- Sample write-ups for the sample wins, so the project page shows its structure. Still sample rows.
UPDATE wins SET
  track = 'Sustainability track',
  description = 'Pantry Pal starts with a photo of your fridge. A vision model picks out what''s in it, guesses what''s closest to going off, and suggests three recipes that use those first.

The team built the camera flow and recipe ranking in a weekend, then spent the last six hours making the photo step forgiving: bad lighting, half-open drawers and leftovers in mystery containers.',
  stack = '["React Native","Python","FastAPI","OpenAI Vision","Postgres"]',
  next_steps = 'Testing with two BU dining co-ops this semester, and applying to Spark! to keep building.'
WHERE placeholder = 1 AND project = 'Pantry Pal';

UPDATE wins SET
  track = 'Hardware',
  description = 'A small e-ink display by the door that shows when the next Green Line train leaves your stop, and turns amber when it''s time to go.

It reads the MBTA''s live predictions over Wi-Fi and runs for weeks on a battery. The enclosure was laser-cut at the hackathon.',
  stack = '["ESP32","C++","MBTA V3 API","E-ink","Laser cutting"]'
WHERE placeholder = 1 AND project = 'T-Tracker';

UPDATE wins SET
  description = 'A live, fair queue for TA office hours. Students join from their phone, see where they are in line, and get a ping when they''re up. TAs see who''s waiting and what they need help with.',
  stack = '["Next.js","TypeScript","Supabase","Tailwind"]'
WHERE placeholder = 1 AND project = 'Office Hours Queue';
