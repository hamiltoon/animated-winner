-- Recipe Saver Database Schema for Cloudflare D1

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  ingredients TEXT NOT NULL,  -- JSON array
  instructions TEXT NOT NULL, -- JSON array
  prepTime TEXT,
  cookTime TEXT,
  totalTime TEXT,
  servings TEXT,
  category TEXT,
  cuisine TEXT,
  image TEXT,
  author TEXT,
  url TEXT,
  source TEXT,
  dateAdded TEXT NOT NULL,
  dateModified TEXT
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_title ON recipes(title);
CREATE INDEX IF NOT EXISTS idx_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_cuisine ON recipes(cuisine);
CREATE INDEX IF NOT EXISTS idx_source ON recipes(source);
CREATE INDEX IF NOT EXISTS idx_dateAdded ON recipes(dateAdded);
CREATE INDEX IF NOT EXISTS idx_url ON recipes(url);
