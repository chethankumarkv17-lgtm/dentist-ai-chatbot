-- PHASE 23B: Premium AI Voice Receptionist & Telephony Migration

-- 1. Table voice_connections
CREATE TABLE IF NOT EXISTS voice_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,
    phone_number VARCHAR(50),
    provider VARCHAR(50) DEFAULT 'twilio',
    provider_phone_sid VARCHAR(100),
    status VARCHAR(30) DEFAULT 'not_connected'
      CHECK (status IN ('not_connected', 'pending', 'connected', 'disabled', 'error')),
    agent_name VARCHAR(100) DEFAULT 'Sarah',
    greeting TEXT DEFAULT 'Thank you for calling Radiant Dental. I am Sarah, the AI receptionist. How can I help you book or manage your appointment today?',
    voice_persona VARCHAR(50) DEFAULT 'nova',
    language VARCHAR(20) DEFAULT 'en-IN',
    human_transfer_phone VARCHAR(50),
    max_duration_seconds INT DEFAULT 600,
    config JSONB DEFAULT '{"emergency_transfer": true, "after_hours_voicemail": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table voice_calls (Call metadata without sensitive audio recording)
CREATE TABLE IF NOT EXISTS voice_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    provider_call_id VARCHAR(100) UNIQUE NOT NULL,
    caller_phone VARCHAR(50) NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'in_progress'
      CHECK (status IN ('in_progress', 'completed', 'transferred', 'failed', 'dropped')),
    outcome VARCHAR(50) DEFAULT 'ai_handled'
      CHECK (outcome IN ('ai_handled', 'human_requested', 'human_transferred', 'booking_completed', 'info_provided', 'call_ended', 'emergency_escalated')),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    tokens_used INT DEFAULT 0,
    estimated_cost_usd DECIMAL(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table voice_usage (Track minutes and cost per billing cycle)
CREATE TABLE IF NOT EXISTS voice_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    billing_month DATE NOT NULL,
    minutes_used INT DEFAULT 0,
    call_count INT DEFAULT 0,
    estimated_cost_usd DECIMAL(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, billing_month)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_voice_connections_phone ON voice_connections(phone_number);
CREATE INDEX IF NOT EXISTS idx_voice_calls_clinic ON voice_calls(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_calls_provider_id ON voice_calls(provider_call_id);
CREATE INDEX IF NOT EXISTS idx_voice_usage_org_month ON voice_usage(organization_id, billing_month);

-- 5. Row Level Security
ALTER TABLE voice_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_usage ENABLE ROW LEVEL SECURITY;
