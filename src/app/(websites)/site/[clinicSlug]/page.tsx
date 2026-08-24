import React from 'react';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import ModernTemplate from '@/components/templates/ModernTemplate';
import ClassicTemplate from '@/components/templates/ClassicTemplate';
import ElegantTemplate from '@/components/templates/ElegantTemplate';

export default async function ClinicWebsitePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ clinicSlug: string }>; 
  searchParams: Promise<{ preview?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const { clinicSlug } = resolvedParams;
  
  // In a real application, we query the DB:
  // const { data, error } = await supabase.from('clinic_websites').select('*').eq('slug', clinicSlug).single();
  // if (error || !data) return notFound();
  // if (data.status === 'draft' && !resolvedSearch.preview) return notFound(); // Prevent public view of drafts

  // Mocking DB response for demo
  if (clinicSlug === 'invalid-clinic') {
    return notFound();
  }

  // Simulating fetched data
  const mockData = {
    clinic_id: clinicSlug, // passing slug as ID for demo widget injection
    status: 'published',
    template_id: 'modern',
    content: {
      clinicName: "Dr. Smith's Dental",
      description: "Providing exceptional dental services for the whole family.",
      services: "General Dentistry\nTeeth Whitening\nImplants",
    },
    theme_settings: {
      primary_color: '#2563eb'
    }
  };

  // If draft and not previewing, hide it (tenant isolation / draft testing logic)
  if (mockData.status === 'draft' && resolvedSearch.preview !== 'true') {
    return notFound();
  }

  return (
    <>
      {mockData.template_id === 'modern' && (
        <ModernTemplate content={mockData.content} theme={mockData.theme_settings} />
      )}
      {mockData.template_id === 'classic' && (
        <ClassicTemplate content={mockData.content} theme={mockData.theme_settings} />
      )}
      {mockData.template_id === 'elegant' && (
        <ElegantTemplate content={mockData.content} theme={mockData.theme_settings} />
      )}

      {/* Automatically include the Chatbot Widget on platform-created websites */}
      <Script 
        src="/widget.js" 
        strategy="lazyOnload" 
        data-widget-id={mockData.clinic_id}
      />
    </>
  );
}
