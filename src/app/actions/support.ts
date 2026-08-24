'use server';

import { createClient } from '@/lib/supabase/server-auth';
import { requirePlatformAdmin } from '@/lib/admin/auth';
import {
  createSupportTicket,
  replyToTicket,
  closeSupportTicket,
  assignSupportTicket,
  updateTicketStatus,
} from '@/lib/support/service';
import { TicketPriority, TicketCategory, TicketStatus } from '@/lib/support/types';
import { revalidatePath } from 'next/cache';

export async function createTicketAction(data: {
  organizationId: string;
  subject: string;
  description: string;
  priority?: TicketPriority;
  category?: TicketCategory;
}) {
  const supabase = createClient();
  let userId = 'user-1';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Fallback
  }

  const res = await createSupportTicket(data.organizationId, userId, data);
  revalidatePath('/dashboard/support');
  return res;
}

export async function replyToTicketAction(
  ticketId: string,
  message: string,
  organizationId?: string,
  isAdmin = false
) {
  const supabase = createClient();
  let userId = 'user-1';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Fallback
  }

  const res = await replyToTicket(
    ticketId,
    userId,
    isAdmin ? 'admin' : 'customer',
    message,
    organizationId
  );

  revalidatePath('/dashboard/support');
  revalidatePath('/admin/support');
  return res;
}

export async function closeTicketAction(ticketId: string, organizationId?: string, isAdmin = false) {
  const supabase = createClient();
  let userId = 'user-1';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) userId = user.id;
  } catch {
    // Fallback
  }

  const res = await closeSupportTicket(ticketId, userId, organizationId, isAdmin);
  revalidatePath('/dashboard/support');
  revalidatePath('/admin/support');
  return res;
}

export async function adminAssignTicketAction(ticketId: string, assignedToUserId: string) {
  try {
    const admin = await requirePlatformAdmin();
    const res = await assignSupportTicket(admin.id, ticketId, assignedToUserId);
    revalidatePath('/admin/support');
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to assign ticket' };
  }
}

export async function adminUpdateTicketStatusAction(ticketId: string, status: TicketStatus) {
  try {
    const admin = await requirePlatformAdmin();
    const res = await updateTicketStatus(admin.id, ticketId, status);
    revalidatePath('/admin/support');
    return res;
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to update ticket status' };
  }
}
