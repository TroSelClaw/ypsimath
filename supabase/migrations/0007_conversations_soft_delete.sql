-- Add soft-delete column to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for filtering active conversations efficiently
CREATE INDEX IF NOT EXISTS idx_conversations_active
  ON conversations (student_id, updated_at DESC)
  WHERE deleted_at IS NULL;
