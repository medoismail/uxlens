-- Add encrypted key column so users can reveal their API key later
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_encrypted text DEFAULT NULL;
