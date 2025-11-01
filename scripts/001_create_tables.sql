-- Create sessions table to manage workshop sessions
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  stage1_goal TEXT NOT NULL,
  stage2_goal TEXT NOT NULL,
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create submissions table to track all prompt evaluations
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  stage INTEGER NOT NULL CHECK (stage IN (1, 2)),
  prompt TEXT NOT NULL,
  goal TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  clarity_score INTEGER NOT NULL,
  specificity_score INTEGER NOT NULL,
  efficiency_score INTEGER NOT NULL,
  effectiveness_score INTEGER NOT NULL,
  token_count INTEGER NOT NULL,
  co2_grams DECIMAL(10, 4) NOT NULL,
  feedback TEXT NOT NULL,
  improved_prompt TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_session_id ON submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_stage ON submissions(stage);
CREATE INDEX IF NOT EXISTS idx_sessions_is_open ON sessions(is_open);

-- Insert a default session
INSERT INTO sessions (name, stage1_goal, stage2_goal, is_open)
VALUES (
  'Default Workshop Session',
  'Write a prompt that generates a professional email response to a customer complaint',
  'Write a prompt that generates a comprehensive marketing strategy for a new product launch',
  true
);
