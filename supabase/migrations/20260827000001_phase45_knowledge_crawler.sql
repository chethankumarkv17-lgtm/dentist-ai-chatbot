-- Migration: 20260827000001_phase45_knowledge_crawler.sql
-- Description: Clinic Knowledge Sources and Website Crawl Extractor storage with Tenant RLS

CREATE TABLE IF NOT EXISTS clinic_knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scanning', 'crawled', 'approved', 'published', 'failed')),
    pages_discovered INT DEFAULT 0,
    crawled_pages JSONB DEFAULT '[]'::jsonb,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    warnings TEXT[] DEFAULT '{}',
    last_scanned_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_clinic_knowledge_url UNIQUE (clinic_id, url)
);

-- Indexes for fast tenant lookup
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_clinic ON clinic_knowledge_sources(clinic_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_org ON clinic_knowledge_sources(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status ON clinic_knowledge_sources(status);

-- Enable Row Level Security (RLS)
ALTER TABLE clinic_knowledge_sources ENABLE ROW LEVEL SECURITY;

-- Organization Members can manage their own clinic knowledge sources
CREATE POLICY "org_members_manage_knowledge_sources" ON clinic_knowledge_sources
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );
