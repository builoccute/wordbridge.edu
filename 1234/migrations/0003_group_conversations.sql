-- Add a stable link between a community group and its shared conversation.
-- This migration is additive; it does not drop or rewrite existing rows.
ALTER TABLE conversations ADD COLUMN group_id TEXT REFERENCES groups(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_group_id ON conversations(group_id) WHERE group_id IS NOT NULL;
