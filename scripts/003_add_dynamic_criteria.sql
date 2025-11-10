-- Migration: Add dynamic criteria support to submissions table
-- This migration adds JSONB column for flexible criteria scoring
-- while keeping existing static columns for backward compatibility

-- Add criteria_scores JSONB column to submissions table
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS criteria_scores JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Create index for JSONB queries on criteria_scores
CREATE INDEX IF NOT EXISTS idx_submissions_criteria_scores
ON submissions USING gin(criteria_scores);

-- Ensure sessions table has criteria columns (should already exist from init-db)
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS stage1_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS stage2_criteria JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Create index for JSONB queries on session criteria
CREATE INDEX IF NOT EXISTS idx_sessions_stage1_criteria
ON sessions USING gin(stage1_criteria);

CREATE INDEX IF NOT EXISTS idx_sessions_stage2_criteria
ON sessions USING gin(stage2_criteria);

-- Update existing sessions with default criteria if they have empty arrays
UPDATE sessions
SET stage1_criteria = jsonb_build_array(
  jsonb_build_object('name', 'Professionalism', 'description', 'Uses appropriate business language and tone'),
  jsonb_build_object('name', 'Empathy', 'description', 'Acknowledges customer concerns and shows understanding'),
  jsonb_build_object('name', 'Actionability', 'description', 'Provides clear next steps or solutions'),
  jsonb_build_object('name', 'Completeness', 'description', 'Addresses all aspects of the complaint')
),
stage2_criteria = jsonb_build_array(
  jsonb_build_object('name', 'Strategic Thinking', 'description', 'Shows clear understanding of market positioning'),
  jsonb_build_object('name', 'Audience Targeting', 'description', 'Identifies and addresses specific customer segments'),
  jsonb_build_object('name', 'Channel Strategy', 'description', 'Proposes appropriate marketing channels and tactics'),
  jsonb_build_object('name', 'Measurability', 'description', 'Includes metrics and KPIs for success tracking')
)
WHERE stage1_criteria = '[]'::jsonb OR stage2_criteria = '[]'::jsonb;

-- Optional: Migrate existing static scores to criteria_scores JSONB
-- This preserves backward compatibility while populating the new column
UPDATE submissions
SET criteria_scores = jsonb_build_object(
  'Clarity', clarity_score,
  'Specificity', specificity_score,
  'Efficiency', efficiency_score,
  'Effectiveness', effectiveness_score
)
WHERE criteria_scores = '{}'::jsonb
  AND clarity_score IS NOT NULL
  AND specificity_score IS NOT NULL
  AND efficiency_score IS NOT NULL
  AND effectiveness_score IS NOT NULL;
