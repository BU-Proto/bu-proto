-- Wins aren't only hackathon prizes now: pitch competitions, launches, first customers and money
-- raised count too. Every win so far is a hackathon prize, so that's the default.
ALTER TABLE wins ADD COLUMN kind TEXT NOT NULL DEFAULT 'Hackathon';
