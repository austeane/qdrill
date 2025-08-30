-- Add published status columns to practice_plans table
ALTER TABLE practice_plans
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Create index for performance when filtering by published status
CREATE INDEX IF NOT EXISTS idx_practice_plans_is_published ON practice_plans(is_published);
CREATE INDEX IF NOT EXISTS idx_practice_plans_team_published ON practice_plans(team_id, is_published);

-- Comment on columns for documentation
COMMENT ON COLUMN practice_plans.is_published IS 'Whether the practice plan is published and visible to all team members';
COMMENT ON COLUMN practice_plans.published_at IS 'Timestamp when the practice plan was published';