-- Proto is open to anyone in Boston who builds, from any school or none. A member now says where
-- they study (or that they don't), which field they're in, and what they're building, so the team
-- can see who's coming: business, engineering, CS, design or something else.
ALTER TABLE members ADD COLUMN school TEXT NOT NULL DEFAULT '';
ALTER TABLE members ADD COLUMN field TEXT NOT NULL DEFAULT '';
ALTER TABLE members ADD COLUMN building TEXT NOT NULL DEFAULT '';
