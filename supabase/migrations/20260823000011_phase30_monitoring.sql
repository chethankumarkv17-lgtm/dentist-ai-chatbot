-- Migration for Phase 30 Production Monitoring, Observability, and Health Tracking

CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL, -- 'api_latency', 'ai_latency', 'db_query_time', 'error_rate', 'uptime_heartbeat'
    value NUMERIC NOT NULL,
    service_name VARCHAR(100) NOT NULL, -- 'ai_receptionist', 'booking_engine', 'stripe_webhooks', 'email_service', 'widget_service', 'database'
    tags JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_service_time ON system_metrics(service_name, created_at DESC);

CREATE TABLE IF NOT EXISTS system_error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    error_type VARCHAR(100) NOT NULL, -- 'AI_FAILURE', 'BOOKING_FAILURE', 'STRIPE_WEBHOOK_FAILURE', 'EMAIL_FAILURE', 'WIDGET_FAILURE', 'DATABASE_ERROR', 'API_ERROR'
    message TEXT NOT NULL,
    stack_trace TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_error_logs_created ON system_error_logs(created_at DESC, severity);

CREATE TABLE IF NOT EXISTS critical_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'high',
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_critical_alerts_active ON critical_alerts(acknowledged, triggered_at DESC);
