import { createClient } from '@/lib/supabase/server-auth';
import {
  SupportTicket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  HelpArticle,
} from './types';
import { logAdminAuditAction } from '@/lib/admin/auth';

export const HELP_CENTER_ARTICLES: HelpArticle[] = [
  {
    id: 'help-ai-setup',
    slug: 'ai-receptionist-setup',
    title: 'How to Configure Your 24/7 AI Receptionist',
    category: 'AI Receptionist',
    summary: 'Learn how to customize your AI assistant tone, clinic services, working hours, and booking rules.',
    content: `
# Configuring Your 24/7 AI Receptionist

Your AI receptionist acts as your clinic's first line of communication for patient booking and inquiries.

### 1. Define Clinic Services
Head to **Dashboard -> Services** to list all available dental treatments (e.g. Teeth Cleaning, Root Canal, Orthodontic Consultation). Add accurate durations and optional pricing.

### 2. Set Business & Dentist Working Hours
In **Dashboard -> Availability**, define weekly opening hours for each chair and dentist. The AI will never book outside these active shifts.

### 3. Add Custom Clinic FAQs
Under **Dashboard -> Chatbot**, enter custom FAQs like parking instructions, insurance providers, and emergency contact details.
    `,
    updatedAt: '2026-08-20',
  },
  {
    id: 'help-calendar-sync',
    slug: 'google-calendar-sync',
    title: 'Connecting Google Calendar & Preventing Double Bookings',
    category: 'Calendar Sync',
    summary: 'Step-by-step guide to connecting dentist Google Calendars via secure OAuth 2.0.',
    content: `
# Connecting Google Calendar

Radiant Nobel connects to your external calendars using standard, secure OAuth 2.0 without ever requesting your password.

### Key Benefits:
- **Instant Busy Interval Detection**: Any personal or external events on Google Calendar are recognized as busy times.
- **Zero Double Bookings**: The AI booking engine automatically excludes conflicting slots.
- **Automatic Token Refresh**: Secure token rotation ensures uninterrupted syncing.
    `,
    updatedAt: '2026-08-21',
  },
  {
    id: 'help-widget-embed',
    slug: 'embedding-chat-widget',
    title: 'Embedding the Chatbot Widget on WordPress & Custom Sites',
    category: 'Widget & Website',
    summary: 'How to install the embeddable chat widget script or WordPress plugin in under 2 minutes.',
    content: `
# Embedding the Chat Widget

Easily embed the dental chat widget on any website by pasting a simple \`<script>\` tag into your site's \`<body>\` or \`<head>\`.

### Embed Script:
\`\`\`html
<script 
  src="https://radiantnobel.com/widget.js" 
  data-clinic-id="YOUR_CLINIC_ID" 
  data-theme="sky" 
  async>
</script>
\`\`\`

For WordPress websites, download and install our official **DentalAI WordPress Plugin** from **Dashboard -> Website**.
    `,
    updatedAt: '2026-08-22',
  },
  {
    id: 'help-billing-invoices',
    slug: 'managing-subscriptions-billing',
    title: 'Managing Plans, Invoices, and Stripe Customer Portal',
    category: 'Billing & Plans',
    summary: 'How to upgrade, downgrade, update payment methods, and download invoices.',
    content: `
# Subscriptions and Billing

Manage your plan tiers (Starter, Growth, Pro Enterprise) seamlessly inside **Dashboard -> Billing**.

- **Stripe Self-Service Portal**: Click *Manage in Stripe* to change credit cards or update billing addresses.
- **Yearly Discounts**: Switch to annual billing anytime to receive 2 months free.
    `,
    updatedAt: '2026-08-23',
  },
  {
    id: 'help-privacy-retention',
    slug: 'privacy-and-data-management',
    title: 'Privacy Controls, Data Retention Schedules, and Right to Erasure',
    category: 'Privacy & Data',
    summary: 'How to manage clinic data retention, export your database, and trigger patient erasure requests.',
    content: `
# Privacy Controls & Data Management

Radiant Nobel is built on strict data minimization and multi-tenant isolation.

### 1. Configurable Data Retention
Inside **Dashboard -> Settings**, customize background cleanup intervals:
- **Appointments**: 90 days, 180 days, 1 year, or 7 years.
- **AI Chat Transcripts**: 30 days, 60 days, 90 days, or 1 year.
- **Analytics Events**: 90 days, 180 days, or 1 year.

### 2. Machine-Readable Data Portability
Click **Download JSON Export** in Settings to retrieve your entire practice roster, services, appointments, and support threads.

### 3. Patient Right to Erasure
To satisfy privacy requests, enter the patient's email or phone number in the **Patient Right to Erasure** tool to immediately anonymize their personal identifiers.
    `,
    updatedAt: '2026-08-23',
  },
];

/**
 * Creates a new support ticket for a clinic owner.
 */
export async function createSupportTicket(
  organizationId: string,
  userId: string,
  data: {
    subject: string;
    description: string;
    priority?: TicketPriority;
    category?: TicketCategory;
  }
): Promise<{ success: boolean; ticket?: SupportTicket; error?: string }> {
  if (!organizationId || !data.subject || !data.description) {
    return { success: false, error: 'Missing required ticket fields' };
  }

  const supabase = createClient();
  const priority = data.priority || 'normal';
  const category = data.category || 'general';

  try {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        organization_id: organizationId,
        created_by: userId,
        subject: data.subject,
        description: data.description,
        status: 'open',
        priority,
        category,
        updated_at: new Date().toISOString(),
      })
      .select('id, organization_id, created_by, subject, description, status, priority, category, created_at, updated_at')
      .single();

    if (error || !ticket) {
      return { success: false, error: error?.message || 'Failed to create ticket' };
    }

    // Insert initial message
    await supabase.from('support_ticket_messages').insert({
      ticket_id: ticket.id,
      sender_id: userId,
      sender_role: 'customer',
      message: data.description,
    });

    return { success: true, ticket: ticket as unknown as SupportTicket };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to create ticket' };
  }
}

/**
 * Fetches all tickets belonging to a specific organization (Strict Tenant Isolation).
 */
export async function getClinicTickets(organizationId: string): Promise<SupportTicket[]> {
  if (!organizationId) return [];

  const supabase = createClient();

  try {
    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('id, organization_id, created_by, subject, description, status, priority, category, created_at, updated_at')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    return (tickets as unknown as SupportTicket[]) || [];
  } catch {
    return [];
  }
}

/**
 * Fetches ticket details with messages. Enforces strict tenant authorization:
 * A non-admin user from Org A CANNOT read Org B's ticket.
 */
export async function getTicketDetails(
  organizationId: string,
  ticketId: string,
  isAdmin = false
): Promise<{ success: boolean; ticket?: SupportTicket; error?: string }> {
  if (!ticketId) return { success: false, error: 'Ticket ID is required' };

  const supabase = createClient();

  try {
    const query = supabase
      .from('support_tickets')
      .select('id, organization_id, created_by, assigned_to, subject, description, status, priority, category, created_at, updated_at')
      .eq('id', ticketId);

    // If not super admin, enforce organization_id isolation
    if (!isAdmin) {
      query.eq('organization_id', organizationId);
    }

    const { data: ticket, error } = await query.single();

    if (error || !ticket) {
      return { success: false, error: 'Ticket not found or access denied' };
    }

    const { data: messages } = await supabase
      .from('support_ticket_messages')
      .select('id, ticket_id, sender_id, sender_role, message, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    return {
      success: true,
      ticket: {
        ...(ticket as unknown as SupportTicket),
        messages: (messages as unknown as TicketMessage[]) || [],
      },
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to load ticket' };
  }
}

/**
 * Replies to a ticket and updates ticket updated_at / status.
 */
export async function replyToTicket(
  ticketId: string,
  senderId: string,
  senderRole: 'customer' | 'admin',
  message: string,
  organizationId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!ticketId || !message.trim()) {
    return { success: false, error: 'Message content is required' };
  }

  const supabase = createClient();

  try {
    // If customer, verify ownership
    if (senderRole === 'customer' && organizationId) {
      const { data: check } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('id', ticketId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (!check) {
        return { success: false, error: 'Forbidden: Access denied to this ticket' };
      }
    }

    await supabase.from('support_ticket_messages').insert({
      ticket_id: ticketId,
      sender_id: senderId,
      sender_role: senderRole,
      message,
    });

    const newStatus: TicketStatus = senderRole === 'admin' ? 'waiting' : 'in_progress';

    await supabase
      .from('support_tickets')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to submit reply' };
  }
}

/**
 * Closes a support ticket.
 */
export async function closeSupportTicket(
  ticketId: string,
  userId: string,
  organizationId?: string,
  isAdmin = false
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    if (!isAdmin && organizationId) {
      const { data: check } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('id', ticketId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (!check) return { success: false, error: 'Access denied' };
    }

    await supabase
      .from('support_tickets')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (isAdmin) {
      await logAdminAuditAction({
        userId,
        action: 'support_ticket.close',
        entity: 'support_ticket',
        entityId: ticketId,
      });
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to close ticket' };
  }
}

/**
 * Admin: Fetches all support tickets across the platform.
 */
export async function getAllSupportTickets(
  filters?: { status?: string; priority?: string }
): Promise<SupportTicket[]> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('support_tickets')
      .select('id, organization_id, created_by, assigned_to, subject, description, status, priority, category, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);

    const [ticketsRes, orgsRes] = await Promise.all([
      query,
      supabase.from('organizations').select('id, name'),
    ]);

    const orgs = orgsRes.data || [];
    return (ticketsRes.data || []).map((t) => {
      const org = orgs.find((o) => o.id === t.organization_id);
      return {
        ...(t as unknown as SupportTicket),
        organizationName: org?.name || 'Dental Clinic',
      };
    });
  } catch {
    return [];
  }
}

/**
 * Admin: Assigns a support ticket to an admin agent.
 */
export async function assignSupportTicket(
  adminUserId: string,
  ticketId: string,
  assignedToUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    await supabase
      .from('support_tickets')
      .update({
        assigned_to: assignedToUserId,
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    await logAdminAuditAction({
      userId: adminUserId,
      action: 'support_ticket.assign',
      entity: 'support_ticket',
      entityId: ticketId,
      details: { assignedToUserId },
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to assign ticket' };
  }
}

/**
 * Admin: Updates ticket status.
 */
export async function updateTicketStatus(
  adminUserId: string,
  ticketId: string,
  status: TicketStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    await supabase
      .from('support_tickets')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    await logAdminAuditAction({
      userId: adminUserId,
      action: `support_ticket.status_${status}`,
      entity: 'support_ticket',
      entityId: ticketId,
    });

    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to update ticket status' };
  }
}

/**
 * Help Center: Fetches articles
 */
export function getHelpArticles(category?: string): HelpArticle[] {
  if (category) {
    return HELP_CENTER_ARTICLES.filter(
      (a) => a.category.toLowerCase() === category.toLowerCase()
    );
  }
  return HELP_CENTER_ARTICLES;
}

/**
 * Help Center: Fetches single article by slug
 */
export function getHelpArticleBySlug(slug: string): HelpArticle | null {
  return HELP_CENTER_ARTICLES.find((a) => a.slug === slug) || null;
}
