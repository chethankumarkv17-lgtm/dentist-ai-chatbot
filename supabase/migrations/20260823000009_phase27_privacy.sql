-- Migration for Phase 27 Privacy, Data Retention, and Deletion Requests

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS appointment_retention_days INT DEFAULT 365,
ADD COLUMN IF NOT EXISTS transcript_retention_days INT DEFAULT 90,
ADD COLUMN IF NOT EXISTS analytics_retention_days INT DEFAULT 180,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    request_type VARCHAR(50) NOT NULL, -- 'patient_erasure', 'account_deletion', 'organization_deletion'
    target_identifier VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_org ON data_deletion_requests(organization_id);
