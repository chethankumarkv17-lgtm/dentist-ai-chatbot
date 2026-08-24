-- Migration for Phase 23 Usage Limits and AI Cost Control

ALTER TABLE ai_usage
ADD COLUMN IF NOT EXISTS requests_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS messages_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(10, 4) DEFAULT 0;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS ai_restricted_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_abuse_flag BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS usage_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'quota_80', 'quota_100', 'burst_abuse', 'abnormal_spike'
    severity VARCHAR(20) DEFAULT 'warning', -- 'info', 'warning', 'critical'
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_alerts_org ON usage_alerts(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_date ON ai_usage(organization_id, usage_date);
