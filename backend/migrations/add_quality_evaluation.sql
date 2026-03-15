-- Add quality_evaluation column to validation_sessions table
ALTER TABLE validation_sessions 
ADD COLUMN IF NOT EXISTS quality_evaluation JSON;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_validation_sessions_quality 
ON validation_sessions(structured_idea_id) 
WHERE quality_evaluation IS NOT NULL;

-- Add comment
COMMENT ON COLUMN validation_sessions.quality_evaluation IS 
'Stores critic agent evaluation results including scores, pass/fail status, and required improvements';
