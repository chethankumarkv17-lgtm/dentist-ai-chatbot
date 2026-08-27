import React from 'react';
import { createClient, getCurrentUser } from '@/lib/supabase/server-auth';
import { redirect } from 'next/navigation';
import { KnowledgeCrawlerClient } from '@/components/knowledge/KnowledgeCrawlerClient';

export default async function ChatbotPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = createClient();

  // 1. Get user's clinic
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  let clinicId = '';
  if (member) {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id')
      .eq('organization_id', member.organization_id)
      .limit(1)
      .maybeSingle();

    if (clinic) {
      clinicId = clinic.id;
    }
  }

  // Fallback demo clinic ID if in sandbox mode
  if (!clinicId) {
    const { data: demoClinic } = await supabase
      .from('clinics')
      .select('id')
      .limit(1)
      .maybeSingle();
    clinicId = demoClinic?.id || 'demo-clinic-1';
  }

  // 2. Fetch active knowledge source if exists
  const { data: source } = await supabase
    .from('clinic_knowledge_sources')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <KnowledgeCrawlerClient
        clinicId={clinicId}
        initialSource={source || null}
      />
    </div>
  );
}