-- Add UNIQUE constraint to teams.slug column to prevent duplicate slugs
-- This prevents race conditions when multiple users create teams with the same name simultaneously

ALTER TABLE teams 
ADD CONSTRAINT teams_slug_unique UNIQUE (slug);

-- Also add an index for better query performance on slug lookups
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);