CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL;

UPDATE projects
SET owner_id = COALESCE(owner_id, user_id)
WHERE owner_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'projects'
      AND column_name = 'user_id'
  ) THEN
    UPDATE projects
    SET owner_id = user_id
    WHERE owner_id IS NULL
      AND user_id IS NOT NULL;
  END IF;
END $$;
