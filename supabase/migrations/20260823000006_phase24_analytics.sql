-- Migration for Phase 24 Clinic & Platform Analytics

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL DEFAULT 'widget', -- 'widget', 'platform_website', 'external_widget', 'dashboard'
    event_name VARCHAR(100) NOT NULL, -- 'widget_opened', 'conversation_started', 'booking_requested', 'booking_confirmed', 'page_view'
    metadata JSONB DEFAULT '{}'::jsonb, -- Privacy-safe: referrer, device_type, service_id. NO PII.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_org_date ON analytics_events(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
