import { createClient } from '@/lib/supabase/server-auth';

export type HandoffStatus = 'ai_active' | 'human_requested' | 'human_active' | 'resolved';

export interface HandoffRecord {
  conversationId: string;
  clinicId: string;
  patientPhone: string;
  patientName?: string;
  status: HandoffStatus;
  assignedStaffId?: string;
  requestedAt: string;
  resolvedAt?: string;
}

/**
 * Flags a WhatsApp conversation for human staff takeover.
 */
export async function requestHumanHandoff(
  conversationId: string,
  clinicId: string,
  reason = 'Patient requested human staff'
): Promise<{ success: boolean; status: HandoffStatus }> {
  const supabase = createClient();

  try {
    // 1. Update conversation status
    await supabase
      .from('conversations')
      .update({
        handoff_status: 'human_requested',
        status: 'human_requested',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    // 2. Create staff notification / audit log
    await supabase.from('notifications').insert({
      organization_id: clinicId, // Will resolve org via RLS or trigger
      recipient: 'staff',
      type: 'whatsapp_human_handoff_requested',
      status: 'pending',
    });

    await supabase.from('audit_logs').insert({
      organization_id: clinicId,
      action: 'WHATSAPP_HUMAN_HANDOFF_REQUESTED',
      entity: 'conversation',
      entity_id: conversationId,
      details: { reason, timestamp: new Date().toISOString() },
    });

    return { success: true, status: 'human_requested' };
  } catch (err: unknown) {
    console.error('Human handoff transition error:', err);
    return { success: false, status: 'ai_active' };
  }
}

/**
 * Assigns a clinic staff member to actively converse with the patient on WhatsApp.
 */
export async function assignStaffToConversation(
  conversationId: string,
  staffUserId: string
): Promise<{ success: boolean; status: HandoffStatus }> {
  const supabase = createClient();

  try {
    await supabase
      .from('conversations')
      .update({
        handoff_status: 'human_active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    await supabase.from('audit_logs').insert({
      organization_id: conversationId,
      user_id: staffUserId,
      action: 'STAFF_TOOK_OVER_WHATSAPP_CONVERSATION',
      entity: 'conversation',
      entity_id: conversationId,
      details: { staffUserId, assignedAt: new Date().toISOString() },
    });

    return { success: true, status: 'human_active' };
  } catch (err: unknown) {
    console.error('Staff assignment error:', err);
    return { success: false, status: 'human_requested' };
  }
}

/**
 * Resolves the human inquiry and hands conversation back to AI receptionist.
 */
export async function resolveHandoffAndResumeAi(
  conversationId: string
): Promise<{ success: boolean; status: HandoffStatus }> {
  const supabase = createClient();

  try {
    await supabase
      .from('conversations')
      .update({
        handoff_status: 'ai_active',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return { success: true, status: 'ai_active' };
  } catch (err: unknown) {
    console.error('Resolve handoff error:', err);
    return { success: false, status: 'human_active' };
  }
}
