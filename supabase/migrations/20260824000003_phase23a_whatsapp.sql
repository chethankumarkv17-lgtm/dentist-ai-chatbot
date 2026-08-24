-- PHASE 23A: WhatsApp AI Receptionist & Multi-Tenant Integration Migration

-- 1. Ensure whatsapp_connections has all required status values and config
CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,
    phone_number_id VARCHAR(100) NOT NULL UNIQUE,
    display_phone VARCHAR(50),
    waba_id VARCHAR(100),
    status VARCHAR(30) DEFAULT 'not_connected'
      CHECK (status IN ('not_connected', 'pending', 'connected', 'error', 'disconnected')),
    access_token_encrypted TEXT,
    webhook_verified_at TIMESTAMPTZ,
    config JSONB DEFAULT '{"language_mirror": true, "reminder_24h": true, "reminder_2h": true, "human_handoff_enabled": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure whatsapp_templates exists
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    template_language VARCHAR(10) DEFAULT 'en',
    category VARCHAR(50) DEFAULT 'UTILITY',
    status VARCHAR(30) DEFAULT 'pending'
      CHECK (status IN ('pending', 'approved', 'rejected')),
    components JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, template_name, template_language)
);

-- 3. WhatsApp Appointment Reminders
CREATE TABLE IF NOT EXISTS whatsapp_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    recipient_phone VARCHAR(50) NOT NULL,
    reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('24h', '2h', 'confirmation', 'cancellation')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'delivered', 'failed')),
    provider_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(appointment_id, reminder_type)
);

-- 4. WhatsApp Channel Usage & AI Cost Tracking
CREATE TABLE IF NOT EXISTS whatsapp_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    billing_month DATE NOT NULL,
    message_count INT DEFAULT 0,
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    estimated_cost_usd DECIMAL(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, billing_month)
);

-- 5. Extend conversations with handoff_status and channel
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'website'
  CHECK (channel IN ('website', 'widget', 'whatsapp'));

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS handoff_status VARCHAR(30) DEFAULT 'ai_active'
  CHECK (handoff_status IN ('ai_active', 'human_requested', 'human_active', 'resolved'));

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS provider_conversation_id VARCHAR(255);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_inbound_at TIMESTAMPTZ;

-- 6. Extend messages with provider_message_id and delivery_status
ALTER TABLE messages ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(30) DEFAULT 'sent'
  CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'website';

-- 7. Add Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_reminders_status ON whatsapp_reminders(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_phone ON whatsapp_connections(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_conversations_handoff ON conversations(clinic_id, handoff_status);
CREATE INDEX IF NOT EXISTS idx_messages_provider_id ON messages(provider_message_id);

-- 8. Row Level Security (RLS)
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_usage ENABLE ROW LEVEL SECURITY;
