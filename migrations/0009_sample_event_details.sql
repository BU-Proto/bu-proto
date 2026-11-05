-- Fuller sample events, so local dev shows what a well-filled event page looks like. Only rows
-- still marked as samples (placeholder = 1) are touched, matched on id and title; the public site
-- never shows samples, so production looks the same either way.

-- The kind's BU campus cover reads better than the random stand-in photo.
UPDATE events SET photo = NULL
WHERE id = 1 AND title = 'Why hackathons?' AND placeholder = 1 AND photo LIKE 'https://picsum.photos/%';

UPDATE events SET
  description = 'Hack night, but with a few more people in the room. Bring whatever you’re building, or come with nothing and we’ll find you a team or a starter idea. First-timers get paired with someone who has shipped before.

There’s food at 7, a quick round of what everyone’s working on, then three hours to build. We finish with short show-and-tells: anything that runs, or almost runs, counts.'
WHERE id = 2 AND title = 'Weekly hack night' AND placeholder = 1;

UPDATE events SET
  description = 'Three BU students and alums who turned a weekend project into something bigger talk about the messy middle: deciding to keep going after the hackathon, finding the first users, picking co-founders, and what BU’s programs actually helped with.

Bring questions. The second half is open Q&A, and the panelists stay after to look at your projects.',
  agenda = '["6:00 Doors and snacks","6:15 Panel: from a weekend build to a company","6:55 Open Q&A","7:20 Meet the panelists"]'
WHERE id = 3 AND title = 'From side project to startup' AND placeholder = 1;

UPDATE events SET
  description = 'Going to Hack@Brown with us? This is the night to show up with a rough idea and leave with a team, a plan and a demo outline. We go over the tracks and prizes, pitch ideas in two minutes each, and form teams on the spot.

We also sort the trip itself: the bus, what to pack, and who sits with who on the way down.',
  agenda = '["7:00 The tracks and prizes, and how judging works","7:20 Two-minute idea pitches","7:50 Team formation","8:20 Plan your build and your demo","8:45 Trip logistics"]'
WHERE id = 4 AND title = 'Hack@Brown prep night' AND placeholder = 1;

UPDATE events SET
  description = 'A hands-on workshop: by 8:30 you’ll have a small AI app deployed with a link you can send to friends. We start from a template, wire up a model API, add one feature that makes it yours, and ship it.

Laptops required. No AI experience needed, but you should be comfortable running a few commands in a terminal. API credits for the evening are covered.',
  agenda = '["6:30 Set up: the template, keys and deploy","6:50 Call a model and stream the answer","7:20 Add your own feature","8:00 Deploy it","8:15 Quick demos"]'
WHERE id = 5 AND title = 'Ship an AI app in an evening' AND placeholder = 1;

UPDATE events SET
  description = 'The end-of-semester demo night. Anyone at BU can show anything they’ve built this term: a hackathon project, a side project, a class project you’re proud of, or something half finished. Five minutes each, then questions.

It doesn’t have to win and it doesn’t have to work. Sign up to demo at the door, or just come and watch. Food from 6.',
  agenda = '["6:00 Food and setup","6:30 Demos, five minutes each","8:15 Vote for the crowd favourite","8:30 Hang out with the builders"]'
WHERE id = 6 AND title = 'Spring demo night' AND placeholder = 1;
