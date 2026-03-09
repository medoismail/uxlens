-- Performance indexes for production queries
-- Run this in the Supabase SQL Editor

-- Dashboard: fetch audits by user, sorted by date
CREATE INDEX IF NOT EXISTS idx_audits_user_created
  ON audits(user_id, created_at DESC);

-- Chat: fetch messages for an audit by user
CREATE INDEX IF NOT EXISTS idx_chat_messages_audit_user
  ON chat_messages(audit_id, user_id, created_at);

-- Chat credits: unique constraint for upsert (may already exist)
-- This also serves as an index for lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_chat_credits_user_month'
  ) THEN
    CREATE UNIQUE INDEX idx_chat_credits_user_month
      ON chat_credits(user_id, month);
  END IF;
END $$;

-- User lookup by email (for LemonSqueezy webhook → plan update)
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email);
