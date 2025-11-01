-- Add user_rating column to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_rating ON submissions(user_rating);
