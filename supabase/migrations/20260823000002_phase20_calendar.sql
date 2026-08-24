-- Migration for Phase 20 Calendar Integrations

ALTER TABLE calendar_connections 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'connected',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS calendar_id VARCHAR(255) DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS email VARCHAR(255);
