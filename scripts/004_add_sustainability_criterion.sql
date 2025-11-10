-- Migration: Add Sustainability as a default criterion to all sessions
-- This adds "Sustainability" to both Stage 1 and Stage 2 criteria

-- Update all existing sessions to include Sustainability criterion
UPDATE sessions
SET stage1_criteria = stage1_criteria || jsonb_build_array(
  jsonb_build_object(
    'name', 'Sustainability',
    'description', 'Efficiently uses resources and minimizes token consumption while maintaining effectiveness'
  )
),
stage2_criteria = stage2_criteria || jsonb_build_array(
  jsonb_build_object(
    'name', 'Sustainability',
    'description', 'Optimizes resource usage and token efficiency without compromising quality or completeness'
  )
)
WHERE NOT (
  stage1_criteria @> '[{"name": "Sustainability"}]'::jsonb
  OR stage2_criteria @> '[{"name": "Sustainability"}]'::jsonb
);

-- Set default criteria for future sessions with Sustainability included
-- This ensures new sessions created will have sustainability by default
COMMENT ON COLUMN sessions.stage1_criteria IS 'JSONB array of evaluation criteria for Stage 1, should include Sustainability';
COMMENT ON COLUMN sessions.stage2_criteria IS 'JSONB array of evaluation criteria for Stage 2, should include Sustainability';
