-- API keys table for MCP skill authentication (Pro+ users)
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default',
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  last_used_at timestamptz DEFAULT NULL,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup by hash (only active keys)
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys (key_hash) WHERE revoked = false;

-- Fast lookup by user (only active keys)
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys (user_id) WHERE revoked = false;
