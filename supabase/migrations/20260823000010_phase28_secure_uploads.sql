-- Migration for Phase 28 Secure File Uploads & Asset Management

CREATE TABLE IF NOT EXISTS uploaded_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    asset_type VARCHAR(50) NOT NULL, -- 'logo', 'dentist_photo', 'clinic_image'
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes INT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploaded_assets_org ON uploaded_assets(organization_id, asset_type);
