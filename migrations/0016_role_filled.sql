-- A role can be filled: someone has taken it. A filled role leaves /roles (and /board, for a board
-- seat), and its own page stays up saying so, without the form. Set from the role in the portal,
-- or from an accepted application.
ALTER TABLE roles ADD COLUMN filled INTEGER NOT NULL DEFAULT 0;

-- Head of the Fund has been taken.
UPDATE roles
SET filled = 1,
    updated_at = datetime('now')
WHERE title = 'Head of the Fund';
