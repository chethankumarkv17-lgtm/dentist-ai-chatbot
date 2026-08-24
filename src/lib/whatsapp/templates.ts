import { WhatsAppComponent } from './client';
import { createClient } from '@/lib/supabase/server-auth';

export interface TemplateParams {
  patientName?: string;
  clinicName: string;
  datetime: string;
  service?: string;
}

export function buildAppointmentConfirmationTemplate(params: TemplateParams): WhatsAppComponent[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.patientName || 'Valued Patient' },
        { type: 'text', text: params.service || 'Dental Appointment' },
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
        { type: 'text', text: params.patientName || 'Valued Patient' },
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
        { type: 'text', text: params.patientName || 'Valued Patient' },
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

export function checkSessionWindow(lastInboundTime?: Date | string | null): boolean {
  if (!lastInboundTime) return false;
  const timeMs = typeof lastInboundTime === 'string' ? new Date(lastInboundTime).getTime() : lastInboundTime.getTime();
  const now = Date.now();
  const diffInMs = now - timeMs;
  return diffInMs < 24 * 60 * 60 * 1000;
}
