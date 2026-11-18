-- Head of Growth becomes Head of Scouting: finding BU's builders and founders and bringing them
-- in. Events move to Head of Community, so its summary says so. Same rows, so the ids (and
-- applications already sent) stay put. Earlier applications and board-interest notes keep the
-- title they were sent under.
UPDATE roles
SET title = 'Head of Scouting',
    summary = 'Finds the builders and founders at BU and brings them into Proto: leads a small scouting team, the wins wall, member spotlights and our socials.',
    updated_at = datetime('now')
WHERE title = 'Head of Growth';

UPDATE roles
SET summary = 'Inside BU: runs our hack nights and events, and is our contact for Spark!, Innovate@BU, clubs and departments.',
    updated_at = datetime('now')
WHERE title = 'Head of Community';
