import { createClient } from '@/lib/supabase/server-auth';
import { processReceptionistMessage } from '@/lib/ai/receptionist';
import { verifyVoiceEntitlementServerSide } from '@/lib/billing/entitlements';
import { evaluateVoiceEmergency } from './emergency';
import { verifyCallerForSensitiveOperation } from './verification';

export interface VoiceOrchestrationResult {
  action: 'say_gather' | 'transfer' | 'hangup' | 'reject';
  replyText: string;
  transferPhone?: string;
  voicePersona?: string;
  language?: string;
  outcome: string;
  error?: string;
}

/**
 * Server-Side Voice Receptionist Orchestrator.
 * Connects telephony speech to the unified AI Receptionist layer with strict Pro plan entitlement and safety guardrails.
 */
export async function processVoiceCallTurn(params: {
  callSid: string;
  from: string;
  to: string;
  speechResult?: string;
  clinicId?: string;
}): Promise<VoiceOrchestrationResult> {
  const { callSid, from, to, speechResult } = params;
  const supabase = createClient();

  // 1. Resolve Clinic by Incoming Phone Number or clinicId parameter
  let connectionRecord = null;
  if (params.clinicId) {
    const { data } = await supabase
      .from('voice_connections')
      .select('*, clinics(id, organization_id, name)')
      .eq('clinic_id', params.clinicId)
      .maybeSingle();
    connectionRecord = data;
  } else {
    const { data } = await supabase
      .from('voice_connections')
      .select('*, clinics(id, organization_id, name)')
      .eq('phone_number', to)
      .maybeSingle();
    connectionRecord = data;
  }

  if (!connectionRecord) {
    return {
      action: 'hangup',
      replyText: 'We are sorry, but this dental phone line is currently unassigned. Please visit our website to book an appointment. Goodbye.',
      outcome: 'call_ended',
      error: 'Unassigned voice phone number',
    };
  }

  const clinic = connectionRecord.clinics as unknown as { id: string; organization_id: string; name: string } | null;
  const clinicId = connectionRecord.clinic_id;
  const orgId = clinic?.organization_id || clinicId;
  const humanTransferPhone = connectionRecord.human_transfer_phone || '';
  const voicePersona = connectionRecord.voice_persona || 'nova';
  const language = connectionRecord.language || 'en-IN';

  // 2. Authoritative Server-Side Entitlement Check (Pro / Premium Plan Gate)
  const entitlement = await verifyVoiceEntitlementServerSide(orgId);
  if (!entitlement.authorized) {
    return {
      action: 'hangup',
      replyText: 'This clinic voice assistant is currently unavailable. Please visit our website or send us a WhatsApp message to book an appointment. Goodbye.',
      outcome: 'call_ended',
      error: `Voice entitlement check failed: ${entitlement.reason}`,
    };
  }

  // 3. Initial Call Greeting Turn (When no speech has been gathered yet)
  if (!speechResult || speechResult.trim().length === 0) {
    const greeting = connectionRecord.greeting || 'Thank you for calling Radiant Dental. How can I help you today?';

    // Record initial call session
    await supabase.from('voice_calls').upsert({
      provider_call_id: callSid,
      organization_id: orgId,
      clinic_id: clinicId,
      caller_phone: from,
      status: 'in_progress',
      outcome: 'ai_handled',
      start_time: new Date().toISOString(),
    }, { onConflict: 'provider_call_id' });

    return {
      action: 'say_gather',
      replyText: greeting,
      voicePersona,
      language,
      outcome: 'ai_handled',
    };
  }

  const userSpeech = speechResult.trim();

  // 4. Emergency & Medical Safety Filter
  const emergencyCheck = evaluateVoiceEmergency(userSpeech);
  if (emergencyCheck.isEmergency) {
    await supabase
      .from('voice_calls')
      .update({ outcome: 'emergency_escalated', updated_at: new Date().toISOString() })
      .eq('provider_call_id', callSid);

    if (emergencyCheck.transferImmediately && humanTransferPhone) {
      return {
        action: 'transfer',
        replyText: emergencyCheck.adviceText || 'Please hold while I connect you with our clinic emergency desk.',
        transferPhone: humanTransferPhone,
        outcome: 'emergency_escalated',
      };
    }

    return {
      action: 'hangup',
      replyText: emergencyCheck.adviceText || 'Please call emergency services immediately.',
      outcome: 'emergency_escalated',
    };
  }

  // 5. Human Transfer Trigger Check
  const isHumanRequest =
    /\b(talk to (a )?(human|person|agent|staff|doctor|dentist|receptionist)|speak with (a )?(human|staff|person)|transfer me|front desk)\b/i.test(
      userSpeech
    );

  if (isHumanRequest) {
    await supabase
      .from('voice_calls')
      .update({ outcome: 'human_transferred', status: 'transferred' })
      .eq('provider_call_id', callSid);

    if (humanTransferPhone) {
      return {
        action: 'transfer',
        replyText: 'Certainly. Please hold while I connect you with our front desk staff.',
        transferPhone: humanTransferPhone,
        outcome: 'human_transferred',
      };
    } else {
      return {
        action: 'say_gather',
        replyText: 'Our front desk staff is currently on other calls. You can schedule an appointment directly with me right now, or leave a voicemail.',
        voicePersona,
        language,
        outcome: 'human_requested',
      };
    }
  }

  // 6. Sensitive Intent Verification Gate (Cancellation / Rescheduling)
  const isCancelOrReschedule = /\b(cancel|reschedule|change|lookup)\b/i.test(userSpeech);
  if (isCancelOrReschedule) {
    const verification = await verifyCallerForSensitiveOperation({
      organizationId: orgId,
      callerPhone: from,
      intent: userSpeech.includes('cancel') ? 'cancel' : 'reschedule',
    });

    if (!verification.verified && verification.message) {
      return {
        action: 'say_gather',
        replyText: verification.message,
        voicePersona,
        language,
        outcome: 'ai_handled',
      };
    }
  }

  // 7. Dispatch to Unified AI Receptionist Orchestrator
  const aiResponse = await processReceptionistMessage({
    clinicId,
    message: userSpeech,
    patientPhoneOrEmail: from,
    channel: 'voice',
  });

  const replyText = aiResponse.reply || 'I understand. How else may I assist you today?';
  const tokensUsed = Math.ceil((userSpeech.length + replyText.length) / 4);
  const estimatedCost = tokensUsed * 0.00001;

  // 8. Update Call Records
  let outcome = 'ai_handled';
  if (
    aiResponse.toolCallsExecuted?.some((tc: unknown) =>
      typeof tc === 'string' ? tc === 'createAppointment' : (tc as { tool?: string })?.tool === 'createAppointment'
    )
  ) {
    outcome = 'booking_completed';
  }

  await supabase
    .from('voice_calls')
    .update({
      outcome,
      tokens_used: tokensUsed,
      estimated_cost_usd: estimatedCost,
    })
    .eq('provider_call_id', callSid);

  return {
    action: 'say_gather',
    replyText,
    voicePersona,
    language,
    outcome,
  };
}
