import { WhatsAppComponent } from './client';
import { createClient } from '@/lib/supabase/server-auth';

interface TemplateParams {
  patientName: string;
  clinicName: string;
  datetime: string;
  service?: string;
}

export function buildAppointmentConfirmationTemplate(params: TemplateParams): WhatsAppComponent[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.patientName },
        { type: 'text', text: params.service || 'Appointment' },
        { type: 'text', text: params.clinicName },
        { type: 'text', text: params.datetime },
      ],
    },
  ];
}

export function buildAppointmentReminderTemplate(params: TemplateParams): WhatsAppComponent[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.patientName },
        { type: 'text', text: params.datetime },
        { type: 'text', text: params.clinicName },
      ],
    },
  ];
}

export function buildAppointmentCancelledTemplate(params: TemplateParams): WhatsAppComponent[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.patientName },
        { type: 'text', text: params.datetime },
        { type: 'text', text: params.clinicName },
      ],
    },
  ];
}

export async function isTemplateApproved(clinicId: string, templateName: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('whatsapp_templates')
    .select('status')
    .eq('clinic_id', clinicId)
    .eq('template_name', templateName)
    .single();
    
  return data?.status === 'approved';
}

export function checkSessionWindow(lastInboundTime?: Date | null): boolean {
  if (!lastInboundTime) return false;
  const now = new Date();
  const diffInMs = now.getTime() - lastInboundTime.getTime();
  // 24 hours
  return diffInMs < 24 * 60 * 60 * 1000;
}
