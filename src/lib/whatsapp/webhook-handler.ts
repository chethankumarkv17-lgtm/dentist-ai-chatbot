import { createClient } from '@/lib/supabase/server-auth';
import { processReceptionistMessage } from '@/lib/ai/receptionist';
import { WhatsAppClient, verifyWebhookSignature, detectLanguage } from './client';
import { requestHumanHandoff } from './handoff';
import { claimWebhookEvent, finalizeWebhookSuccess, finalizeWebhookFailure } from '@/lib/webhooks/reliability';
import { getPlan } from '@/lib/billing/plans';

export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: {
    id?: string;
    changes?: {
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        statuses?: { id: string; status: 'sent' | 'delivered' | 'read' | 'failed'; timestamp?: string; recipient_id?: string }[];
        contacts?: { profile?: { name?: string }; wa_id?: string }[];
        messages?: {
          from: string;
          id: string;
          timestamp?: string;
          type?: string;
          text?: { body: string };
          interactive?: {
            type: 'button_reply' | 'list_reply';
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string; description?: string };
          };
        }[];
      };
    }[];
  }[];
}

export interface WebhookResult {
  success: boolean;
  received: boolean;
  duplicate?: boolean;
  reason?: string;
  error?: string;
  messagesProcessed?: number;
}

// In-memory rate limiting tracker (per phone / clinic)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

function checkWhatsAppRateLimit(key: string, maxRequests = 20, windowSeconds = 60): boolean {
  const now = Date.now();
  const current = rateLimitCache.get(key);

  if (!current || now > current.resetAt) {
    rateLimitCache.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * Authoritative WhatsApp Business Webhook Processor
 * Ensures Multi-Tenant Isolation, Idempotency, Patient Identification, Rate Limiting, and Shared AI Execution.
 */
export async function processWhatsAppWebhook(
  body: WhatsAppWebhookPayload,
  rawBodyString?: string,
  signatureHeader?: string | null
): Promise<WebhookResult> {
  // 1. Signature Verification if signature provided
  if (rawBodyString && signatureHeader) {
    const isSigValid = verifyWebhookSignature(rawBodyString, signatureHeader);
    if (!isSigValid) {
      return { success: false, received: false, error: 'Invalid WhatsApp webhook signature' };
    }
  }

  // 2. Validate Root Object
  if (body.object !== 'whatsapp_business_account') {
    return {
      success: false,
      received: false,
      reason: 'not_whatsapp_business_account',
      error: 'Ignored: Not a whatsapp_business_account object',
    };
  }

  const supabase = createClient();
  const entries = body.entry || [];
  let processedCount = 0;

  for (const entry of entries) {
    const changes = entry.changes || [];

    for (const change of changes) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      const metadata = value?.metadata;
      if (!metadata || !metadata.phone_number_id) continue;

      const phoneNumberId = metadata.phone_number_id;

      // 3. Multi-Tenant Clinic Resolution (Strictly from verified phone_number_id)
      const { data: connection } = await supabase
        .from('whatsapp_connections')
        .select('clinic_id, status, access_token_encrypted, clinics(id, organization_id, name)')
        .eq('phone_number_id', phoneNumberId)
        .maybeSingle();

      if (!connection || connection.status !== 'connected') {
        continue;
      }

      const clinic = connection.clinics as unknown as { id: string; organization_id: string; name: string } | null;
      if (!clinic) continue;

      const clinicId = clinic.id;
      const organizationId = clinic.organization_id;
      const whatsappClient = new WhatsAppClient(undefined, phoneNumberId);

      // 4. Handle Status Receipts (delivered, read, failed)
      if (value.statuses && value.statuses.length > 0) {
        for (const statusObj of value.statuses) {
          await supabase
            .from('messages')
            .update({ delivery_status: statusObj.status })
            .eq('provider_message_id', statusObj.id);
        }
      }

      // 5. Handle Inbound Messages
      if (value.messages && value.messages.length > 0) {
        for (const message of value.messages) {
          const messageId = message.id;
          const senderPhone = message.from;
          const messageTimestamp = message.timestamp ? parseInt(message.timestamp, 10) : Math.floor(Date.now() / 1000);

          // 5.1 Idempotency & Deduplication
          const claim = await claimWebhookEvent(
            'whatsapp',
            messageId,
            message as unknown as Record<string, unknown>,
            messageTimestamp
          );

          if (!claim.shouldProcess) {
            return { success: true, received: true, duplicate: true };
          }

          // 5.2 Rate Limiting Protection
          const isAllowedRate = checkWhatsAppRateLimit(`wa:${clinicId}:${senderPhone}`, 15, 60);
          if (!isAllowedRate) {
            await whatsappClient.sendTextMessage(
              senderPhone,
              'You are sending messages too quickly. Please wait a moment before sending another message.'
            );
            await finalizeWebhookSuccess('whatsapp', messageId, messageTimestamp);
            continue;
          }

          // 5.3 Mark As Read Immediately
          await whatsappClient.markAsRead(messageId).catch(() => null);

          // 5.4 Patient Identification & Scoped Profile Matching (Per Tenant Org)
          let patientRecord = null;
          const { data: existingPatient } = await supabase
            .from('patients')
            .select('id, first_name, last_name, phone')
            .eq('organization_id', organizationId)
            .eq('phone', senderPhone)
            .maybeSingle();

          if (existingPatient) {
            patientRecord = existingPatient;
          } else {
            // Create minimal initial patient profile
            const profileName = value.contacts?.[0]?.profile?.name || 'WhatsApp Patient';
            const nameParts = profileName.trim().split(' ');
            const firstName = nameParts[0] || 'WhatsApp';
            const lastName = nameParts.slice(1).join(' ') || 'Patient';

            const { data: createdPatient } = await supabase
              .from('patients')
              .insert({
                organization_id: organizationId,
                first_name: firstName,
                last_name: lastName,
                phone: senderPhone,
              })
              .select('id, first_name, last_name, phone')
              .maybeSingle();

            patientRecord = createdPatient;
          }

          // 5.5 Extract Message Text
          let messageContent = '';
          if (message.type === 'text') {
            messageContent = message.text?.body || '';
          } else if (message.type === 'interactive') {
            messageContent =
              message.interactive?.button_reply?.title ||
              message.interactive?.list_reply?.title ||
              '';
          } else {
            messageContent = `[${message.type} attachment received]`;
          }

          // 5.6 Check Human Handoff State
          const isHandoffTrigger =
            /(?:talk\s+to\s+(?:a\s+)?(?:human|person|agent|staff|doctor|dentist)|speak\s+with\s+(?:a\s+)?(?:human|staff)|human\s+support|call\s+me)/i.test(
              messageContent
            );

          // Get active conversation
          const { data: activeConv } = await supabase
            .from('conversations')
            .select('id, handoff_status, status')
            .eq('clinic_id', clinicId)
            .eq('channel', 'whatsapp')
            .eq('patient_id', patientRecord?.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const conversationId = activeConv?.id;

          if (isHandoffTrigger && conversationId) {
            await requestHumanHandoff(conversationId, clinicId, 'Patient requested human staff via WhatsApp');
            await whatsappClient.sendTextMessage(
              senderPhone,
              "I have notified our clinic staff. A team member will join this conversation and assist you shortly."
            );
            await finalizeWebhookSuccess('whatsapp', messageId, messageTimestamp);
            processedCount++;
            continue;
          }

          if (activeConv?.handoff_status === 'human_active' || activeConv?.handoff_status === 'human_requested') {
            // Human staff is handling — store message without AI interference
            await finalizeWebhookSuccess('whatsapp', messageId, messageTimestamp);
            processedCount++;
            continue;
          }

          // 5.7 AI Quota & Plan Limit Check
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('plan_id, status')
            .eq('organization_id', organizationId)
            .maybeSingle();

          let planKey = 'starter';
          if (sub?.plan_id) {
            const { data: planRec } = await supabase.from('plans').select('name').eq('id', sub.plan_id).single();
            if (planRec?.name?.toLowerCase().includes('pro')) planKey = 'pro';
            else if (planRec?.name?.toLowerCase().includes('growth')) planKey = 'growth';
          }

          const currentPlan = getPlan(planKey);
          const { count: currentMonthlyMsgs } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('channel', 'whatsapp')
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

          if ((currentMonthlyMsgs || 0) >= currentPlan.limits.whatsappMessagesLimit) {
            await whatsappClient.sendTextMessage(
              senderPhone,
              "Our clinic's automated WhatsApp line has reached its monthly capacity. Please call our clinic directly or book online at our website."
            );
            await finalizeWebhookSuccess('whatsapp', messageId, messageTimestamp);
            continue;
          }

          // 5.8 Feed to Shared AI Receptionist
          const aiResponse = await processReceptionistMessage({
            clinicId,
            message: messageContent,
            patientPhoneOrEmail: senderPhone,
            channel: 'whatsapp',
          });

          // Detect and mirror language
          const detectedLang = detectLanguage(messageContent);
          let responseText = aiResponse.reply;

          if (detectedLang === 'hi' && !/[\u0900-\u097F]/.test(responseText)) {
            responseText = `${responseText}\n\n(यदि आपको हिंदी में सहायता चाहिए, तो कृपया हमें बताएं)`;
          }

          // 5.9 Send Verified WhatsApp Response
          if (responseText) {
            const sendResult = await whatsappClient.sendTextMessage(senderPhone, responseText);

            // Record provider message ID for delivery tracking
            await supabase.from('messages').insert({
              conversation_id: aiResponse.conversationId || conversationId,
              role: 'assistant',
              content: responseText,
              channel: 'whatsapp',
              provider_message_id: sendResult.message_id,
              delivery_status: 'sent',
            });
          }

          // 5.10 Track Token Usage & Estimated Cost
          const inputTokens = Math.ceil(messageContent.length / 4);
          const outputTokens = Math.ceil((responseText?.length || 0) / 4);
          const estimatedCost = (inputTokens * 0.000003) + (outputTokens * 0.000015);

          await supabase.from('ai_usage').insert({
            organization_id: organizationId,
            clinic_id: clinicId,
            prompt_tokens: inputTokens,
            completion_tokens: outputTokens,
            channel: 'whatsapp',
          });

          await finalizeWebhookSuccess('whatsapp', messageId, messageTimestamp);
          processedCount++;
        }
      }
    }
  }

  return { success: true, received: true, messagesProcessed: processedCount };
}
