-- Backfill slugs for existing teams that don't have one
-- This is an idempotent migration that can be run multiple times safely

-- First, update teams with NULL slugs
UPDATE teams 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      SUBSTRING(name, 1, 50),  -- Limit to 50 chars
      '[^a-zA-Z0-9]+', '-', 'g'  -- Replace non-alphanumeric with hyphens
    ),
    '^-+|-+$', '', 'g'  -- Remove leading/trailing hyphens
  )
)
WHERE slug IS NULL;

-- Handle collisions for teams with duplicate generated slugs
-- This creates a temporary table with unique slugs
WITH numbered_teams AS (
  SELECT 
    id,
    slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM teams
  WHERE slug IS NOT NULL
),
teams_needing_suffix AS (
  SELECT 
    id,
    slug,
    rn
  FROM numbered_teams
  WHERE rn > 1
)
UPDATE teams
SET slug = CONCAT(teams.slug, '-', teams_needing_suffix.rn)
FROM teams_needing_suffix
WHERE teams.id = teams_needing_suffix.id;

-- Verify all teams now have unique slugs
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT slug, COUNT(*) as cnt
    FROM teams
    WHERE slug IS NOT NULL
    GROUP BY slug
    HAVING COUNT(*) > 1
  ) AS duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % duplicate slugs remain', duplicate_count;
  END IF;
END $$;

-- Add a comment to document the migration
COMMENT ON COLUMN teams.slug IS 'URL-friendly identifier for the team, must be unique';