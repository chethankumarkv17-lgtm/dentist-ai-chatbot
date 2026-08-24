import { createClient } from '@/lib/supabase/server-auth';
import { processReceptionistMessage } from '@/lib/ai/receptionist';
import { WhatsAppClient } from './client';

interface WhatsAppWebhookPayload {
  object?: string;
  entry?: {
    changes?: {
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string };
        statuses?: { id: string; status: string }[];
        contacts?: { profile?: { name?: string } }[];
        messages?: {
          from: string;
          id: string;
          type: string;
          text?: { body: string };
          interactive?: { type: string; button_reply?: { title: string } };
        }[];
      };
    }[];
  }[];
}

export async function processWhatsAppWebhook(body: WhatsAppWebhookPayload) {
  // Only process whatsapp_business_account webhooks
  if (body.object !== 'whatsapp_business_account') {
    return { success: false, reason: 'not_whatsapp_business_account' };
  }

  const supabase = createClient();
  const entries = body.entry || [];

  for (const entry of entries) {
    const changes = entry.changes || [];

    for (const change of changes) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      const metadata = value?.metadata;

      if (!metadata || !metadata.phone_number_id) continue;

      const phoneNumberId = metadata.phone_number_id;

      // Look up clinic by phone_number_id
      const { data: connection } = await supabase
        .from('whatsapp_connections')
        .select('clinic_id, access_token_encrypted, clinics(organization_id)')
        .eq('phone_number_id', phoneNumberId)
        .eq('status', 'connected')
        .single();

      if (!connection) {
        continue;
      }

      const clinicId = connection.clinic_id;
      const whatsappClient = new WhatsAppClient(undefined, phoneNumberId);

      // Handle statuses (delivered, read, failed)
      if (value.statuses && value.statuses.length > 0) {
        for (const status of value.statuses) {
          // Status tracking hook
          void status;
        }
      }

      // Handle inbound messages
      if (value.messages && value.messages.length > 0) {
        for (const message of value.messages) {
          const from = message.from;
          const messageId = message.id;

          // Mark as read
          await whatsappClient.markAsRead(messageId).catch(console.error);

          // Find or create patient for this organization
          const clinicData = connection.clinics as unknown as { organization_id: string } | { organization_id: string }[] | null;
          const orgId = Array.isArray(clinicData) ? clinicData[0]?.organization_id : clinicData?.organization_id;

          if (orgId) {
            const { data: patient } = await supabase
              .from('patients')
              .select('id, first_name')
              .eq('organization_id', orgId)
              .eq('phone', from)
              .maybeSingle();

            if (!patient) {
              const contactName = value.contacts?.[0]?.profile?.name || 'WhatsApp User';
              await supabase
                .from('patients')
                .insert({
                  organization_id: orgId,
                  phone: from,
                  first_name: contactName,
                });
            }
          }

          // Extract text
          let text = '';
          if (message.type === 'text') {
            text = message.text?.body || '';
          } else if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
            text = message.interactive.button_reply?.title || '';
          } else {
            text = `[${message.type} received]`;
          }

          // Feed into AI Receptionist
          const aiResponse = await processReceptionistMessage({
            clinicId,
            message: text,
            patientPhoneOrEmail: from,
            channel: 'whatsapp',
          });

          // Send reply
          if (aiResponse.reply) {
            await whatsappClient.sendTextMessage(from, aiResponse.reply);
          }
        }
      }
    }
  }

  return { success: true };
}
