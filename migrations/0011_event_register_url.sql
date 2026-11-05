-- An event's own registration page (Luma, Eventbrite…). When set, the site sends people there to
-- register instead of taking the RSVP itself.
ALTER TABLE events ADD COLUMN register_url TEXT;
