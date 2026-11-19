-- The founding board: each of the four seats' applications asks what they'd do in their first
-- month. It goes in as one of the role's own questions, so the form asks it as a required field
-- and the answer is kept with the rest of the application (role_applications.answers), shown in
-- the portal and in the confirmation email. A role that asks it already, or whose questions were
-- hand-edited into something that isn't JSON, is left alone.
UPDATE roles
SET questions = json_insert(questions, '$[#]', 'What would you do in your first month?'),
    updated_at = datetime('now')
WHERE title IN ('Head of Partnerships', 'Head of the Fund', 'Head of Community', 'Head of Growth')
  AND json_valid(questions)
  AND questions NOT LIKE '%What would you do in your first month?%';

-- American spelling on the Partnerships summary.
UPDATE roles
SET summary = replace(summary, 'organisations', 'organizations'),
    updated_at = datetime('now')
WHERE summary LIKE '%organisations%';
