-- Create season_recurrences table for storing recurrence patterns
CREATE TABLE IF NOT EXISTS season_recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  pattern VARCHAR(50) NOT NULL, -- 'weekly', 'biweekly', 'monthly', 'custom'
  day_of_week INTEGER[], -- [1,3,5] for Mon/Wed/Fri
  day_of_month INTEGER[], -- [1,15] for 1st and 15th
  time_of_day TIME,
  duration_minutes INTEGER DEFAULT 90,
  template_plan_id INTEGER REFERENCES practice_plans(id) ON DELETE SET NULL,
  skip_dates DATE[] DEFAULT '{}',
  skip_markers BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(season_id, name)
);

-- Create season_generation_logs table for tracking batch generation history
CREATE TABLE IF NOT EXISTS season_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurrence_id UUID NOT NULL REFERENCES season_recurrences(id) ON DELETE CASCADE,
  generated_count INTEGER NOT NULL,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  generated_plan_ids INTEGER[] DEFAULT '{}',
  skip_reasons JSONB,
  generated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  generated_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX idx_season_recurrences_team_id ON season_recurrences(team_id);
CREATE INDEX idx_season_recurrences_season_id ON season_recurrences(season_id);
CREATE INDEX idx_season_recurrences_template_plan_id ON season_recurrences(template_plan_id);
CREATE INDEX idx_season_generation_logs_recurrence_id ON season_generation_logs(recurrence_id);
CREATE INDEX idx_season_generation_logs_generated_at ON season_generation_logs(generated_at);