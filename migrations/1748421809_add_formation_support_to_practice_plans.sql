-- Add formation support to practice plans
-- This migration adds a formation_id column to practice_plan_drills table
-- and updates the type check constraint to allow 'formation' type

-- Add formation_id column (already done)
-- ALTER TABLE practice_plan_drills
-- ADD COLUMN formation_id INTEGER REFERENCES formations(id) ON DELETE CASCADE;

-- Update the type check constraint to include 'formation' (already done)
-- ALTER TABLE practice_plan_drills
-- DROP CONSTRAINT practice_plan_drills_type_check;

-- ALTER TABLE practice_plan_drills
-- ADD CONSTRAINT practice_plan_drills_type_check 
-- CHECK (type::text = ANY (ARRAY['drill'::character varying, 'break'::character varying, 'formation'::character varying]::text[]));

-- Create index on formation_id for performance (already done)
-- CREATE INDEX idx_practice_plan_drills_formation_id ON practice_plan_drills(formation_id);

-- Add constraint to ensure either drill_id or formation_id is set for non-break items
-- But make it more flexible to handle existing data
ALTER TABLE practice_plan_drills
ADD CONSTRAINT practice_plan_drills_reference_check
CHECK (
    (type = 'break') OR 
    (type = 'drill' AND (drill_id IS NOT NULL OR name IS NOT NULL)) OR -- Allow drill with just name (one-off)
    (type = 'formation' AND formation_id IS NOT NULL)
);