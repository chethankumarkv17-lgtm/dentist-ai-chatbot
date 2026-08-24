-- Add channel column to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'widget'
  CHECK (channel IN ('widget', 'whatsapp'));

-- WhatsApp business connections (per-clinic)
CREATE TABLE IF NOT EXISTS whatsapp_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,
    phone_number_id VARCHAR(100) NOT NULL,
    display_phone VARCHAR(50),
    waba_id VARCHAR(100),
    status VARCHAR(30) DEFAULT 'pending'
      CHECK (status IN ('pending', 'verifying', 'connected', 'disconnected', 'failed')),
    access_token_encrypted TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp message templates
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

-- Add phone-based patient dedup index (per-org)
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_org_phone
  ON patients(organization_id, phone)
  WHERE phone IS NOT NULL;

-- RLS
ALTER TABLE whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Index for channel-based conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(clinic_id, channel);
