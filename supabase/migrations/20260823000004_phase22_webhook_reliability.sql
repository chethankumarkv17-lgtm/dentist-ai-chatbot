-- Migration for Phase 22 Webhook Reliability & Out-of-Order Handling

ALTER TABLE webhook_events
ADD COLUMN IF NOT EXISTS event_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event ON webhook_events(provider, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
