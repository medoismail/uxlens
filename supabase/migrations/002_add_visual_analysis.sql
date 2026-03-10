-- Add visual_analysis column for AI vision design analysis data
ALTER TABLE audits ADD COLUMN IF NOT EXISTS visual_analysis jsonb DEFAULT NULL;
