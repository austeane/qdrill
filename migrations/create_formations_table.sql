-- Create formations table
CREATE TABLE IF NOT EXISTS formations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  formation_type VARCHAR(50) NOT NULL DEFAULT 'offense',
  brief_description TEXT,
  detailed_description TEXT,
  diagrams JSONB[],
  created_by INTEGER REFERENCES users(id),
  is_editable_by_others BOOLEAN DEFAULT false,
  visibility VARCHAR(50) DEFAULT 'public',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tags VARCHAR[]
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_formations_name ON formations(name);
CREATE INDEX IF NOT EXISTS idx_formations_created_by ON formations(created_by);
CREATE INDEX IF NOT EXISTS idx_formations_visibility ON formations(visibility);
CREATE INDEX IF NOT EXISTS idx_formations_created_at ON formations(created_at);
CREATE INDEX IF NOT EXISTS idx_formations_formation_type ON formations(formation_type);

-- Comment on table
COMMENT ON TABLE formations IS 'Stores formation data for static player positions';

-- Comments on columns
COMMENT ON COLUMN formations.id IS 'Primary key';
COMMENT ON COLUMN formations.name IS 'Formation name';
COMMENT ON COLUMN formations.formation_type IS 'Type of formation (offense or defense)';
COMMENT ON COLUMN formations.brief_description IS 'Brief description for listing pages';
COMMENT ON COLUMN formations.detailed_description IS 'Full description with HTML content';
COMMENT ON COLUMN formations.diagrams IS 'Array of Excalidraw diagram JSON data';
COMMENT ON COLUMN formations.created_by IS 'User ID who created the formation';
COMMENT ON COLUMN formations.is_editable_by_others IS 'Whether others can edit this formation';
COMMENT ON COLUMN formations.visibility IS 'public, private, or unlisted';
COMMENT ON COLUMN formations.created_at IS 'Creation timestamp';
COMMENT ON COLUMN formations.updated_at IS 'Last update timestamp';
COMMENT ON COLUMN formations.tags IS 'Array of tags associated with the formation';