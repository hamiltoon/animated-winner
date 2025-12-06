-- Add users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  name TEXT,
  created_at TEXT NOT NULL,
  last_login TEXT NOT NULL
);

-- Add user_id to recipes table
ALTER TABLE recipes ADD COLUMN user_id TEXT REFERENCES users(id);

-- Create index for user recipes
CREATE INDEX IF NOT EXISTS idx_user_recipes ON recipes(user_id);

-- Create index for GitHub ID lookups
CREATE INDEX IF NOT EXISTS idx_github_id ON users(github_id);
