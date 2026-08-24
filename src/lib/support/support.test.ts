import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSupportTicket,
  getClinicTickets,
  getTicketDetails,
  replyToTicket,
  closeSupportTicket,
  getAllSupportTickets,
  assignSupportTicket,
  updateTicketStatus,
  getHelpArticles,
  getHelpArticleBySlug,
} from './service';

// --- IN-MEMORY DATABASE MOCK ---
interface MockDb {
  support_tickets: {
    id: string;
    organization_id: string;
    created_by?: string;
    assigned_to?: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    created_at: string;
    updated_at: string;
  }[];
  support_ticket_messages: {
    id: string;
    ticket_id: string;
    sender_id?: string;
    sender_role: string;
    message: string;
    created_at: string;
  }[];
  organizations: { id: string; name: string }[];
  audit_logs: { action: string }[];
  [key: string]: unknown[];
}

const mockDbState: MockDb = {
  support_tickets: [
    {
      id: 't-1',
      organization_id: 'org-clinic-a',
      created_by: 'user-a',
      subject: 'Calendar not syncing',
      description: 'Google Calendar slots are not refreshing',
      status: 'open',
      priority: 'high',
      category: 'calendar_sync',
      created_at: '2026-08-23T10:00:00Z',
      updated_at: '2026-08-23T10:00:00Z',
    },
    {
      id: 't-2',
      organization_id: 'org-clinic-b',
      created_by: 'user-b',
      subject: 'Billing inquiry',
      description: 'Need invoice for August',
      status: 'waiting',
      priority: 'normal',
      category: 'billing',
      created_at: '2026-08-23T11:00:00Z',
      updated_at: '2026-08-23T11:00:00Z',
    },
  ],
  support_ticket_messages: [
    {
      id: 'm-1',
      ticket_id: 't-1',
      sender_id: 'user-a',
      sender_role: 'customer',
      message: 'Google Calendar slots are not refreshing',
      created_at: '2026-08-23T10:00:00Z',
    },
  ],
  organizations: [
    { id: 'org-clinic-a', name: 'Downtown Dental' },
    { id: 'org-clinic-b', name: 'Westside Smiles' },
  ],
  audit_logs: [],
};

const createMockSupabase = () => {
  const chain = (table: string) => {
    let result: Record<string, unknown>[] = (mockDbState[table] as Record<string, unknown>[]) || [];

    const obj = {
      select: vi.fn(() => obj),
      eq: vi.fn((field: string, val: unknown) => {
        result = result.filter(r => r[field] === val);
        return obj;
      }),
      order: vi.fn(() => obj),
      limit: vi.fn(() => obj),
      single: vi.fn(() => ({ data: result[0] || null, error: result[0] ? null : { message: 'Not found' } })),
      maybeSingle: vi.fn(() => ({ data: result[0] || null, error: null })),
      insert: vi.fn((payload: Record<string, unknown>) => {
        const item = { id: `id-${Date.now()}-${Math.random()}`, created_at: new Date().toISOString(), ...payload };
        if (!mockDbState[table]) mockDbState[table] = [];
        mockDbState[table].push(item);
        return {
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: item, error: null })),
          })),
          data: item,
          error: null,
        };
      }),
      update: vi.fn((payload: Record<string, unknown>) => {
        return {
          eq: vi.fn((field: string, val: unknown) => {
            const tableArr = (mockDbState[table] as Record<string, unknown>[]) || [];
            mockDbState[table] = tableArr.map((r) =>
              r[field] === val ? { ...r, ...payload } : r
            );
            return { data: null, error: null };
          }),
        };
      }),
      then: (resolve: (val: { data: Record<string, unknown>[] }) => void) => resolve({ data: result }),
    };

    return obj;
  };

  return {
    from: vi.fn((table: string) => chain(table)),
  };
};

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => createMockSupabase()),
}));

describe('Phase 26 — Customer Support & Help Center Architecture', () => {
  beforeEach(() => {
    mockDbState.support_tickets = [
      {
        id: 't-1',
        organization_id: 'org-clinic-a',
        created_by: 'user-a',
        subject: 'Calendar not syncing',
        description: 'Google Calendar slots are not refreshing',
        status: 'open',
        priority: 'high',
        category: 'calendar_sync',
        created_at: '2026-08-23T10:00:00Z',
        updated_at: '2026-08-23T10:00:00Z',
      },
      {
        id: 't-2',
        organization_id: 'org-clinic-b',
        created_by: 'user-b',
        subject: 'Billing inquiry',
        description: 'Need invoice for August',
        status: 'waiting',
        priority: 'normal',
        category: 'billing',
        created_at: '2026-08-23T11:00:00Z',
        updated_at: '2026-08-23T11:00:00Z',
      },
    ];
    mockDbState.support_ticket_messages = [];
  });

  describe('1. Clinic Support Request Creation', () => {
    it('allows clinic owner to create a support ticket with priority and category', async () => {
      const res = await createSupportTicket('org-clinic-a', 'user-a', {
        subject: 'Widget styling issue',
        description: 'Need custom primary color on chatbot widget',
        priority: 'normal',
        category: 'widget',
      });

      expect(res.success).toBe(true);
      expect(res.ticket?.status).toBe('open');
      expect(res.ticket?.subject).toBe('Widget styling issue');
      expect(mockDbState.support_ticket_messages.length).toBe(1);
    });
  });

  describe('2. Strict Multi-Tenant Isolation', () => {
    it('returns only tickets belonging to the requesting organization', async () => {
      const ticketsA = await getClinicTickets('org-clinic-a');
      expect(ticketsA.length).toBe(1);
      expect(ticketsA[0].id).toBe('t-1');

      const ticketsB = await getClinicTickets('org-clinic-b');
      expect(ticketsB.length).toBe(1);
      expect(ticketsB[0].id).toBe('t-2');
    });

    it('denies access when Clinic A attempts to view Clinic B ticket', async () => {
      const res = await getTicketDetails('org-clinic-a', 't-2', false);
      expect(res.success).toBe(false);
      expect(res.ticket).toBeUndefined();
    });

    it('allows platform admin to view any ticket across organizations', async () => {
      const res = await getTicketDetails('', 't-2', true);
      expect(res.success).toBe(true);
      expect(res.ticket?.id).toBe('t-2');
    });
  });

  describe('3. Ticket Replies and Status Transitions', () => {
    it('customer reply transitions ticket status to in_progress', async () => {
      const res = await replyToTicket('t-1', 'user-a', 'customer', 'Still seeing the sync delay', 'org-clinic-a');
      expect(res.success).toBe(true);

      const ticket = mockDbState.support_tickets.find(t => t.id === 't-1');
      expect(ticket?.status).toBe('in_progress');
    });

    it('admin reply transitions ticket status to waiting', async () => {
      const res = await replyToTicket('t-1', 'admin-1', 'admin', 'We have re-synced your Google token.');
      expect(res.success).toBe(true);

      const ticket = mockDbState.support_tickets.find(t => t.id === 't-1');
      expect(ticket?.status).toBe('waiting');
    });

    it('allows clinic owner or admin to close a support ticket', async () => {
      const res = await closeSupportTicket('t-1', 'user-a', 'org-clinic-a', false);
      expect(res.success).toBe(true);

      const ticket = mockDbState.support_tickets.find(t => t.id === 't-1');
      expect(ticket?.status).toBe('closed');
    });
  });

  describe('4. Super Admin Desk Controls', () => {
    it('allows admin to view all platform tickets with organization names', async () => {
      const tickets = await getAllSupportTickets();
      expect(tickets.length).toBe(2);
      expect(tickets[0].organizationName).toBeDefined();
    });

    it('allows admin to assign and update ticket status', async () => {
      const assignRes = await assignSupportTicket('admin-1', 't-1', 'support-agent-4');
      expect(assignRes.success).toBe(true);

      const statusRes = await updateTicketStatus('admin-1', 't-1', 'resolved');
      expect(statusRes.success).toBe(true);

      const ticket = mockDbState.support_tickets.find(t => t.id === 't-1');
      expect(ticket?.status).toBe('resolved');
      expect(ticket?.assigned_to).toBe('support-agent-4');
    });
  });

  describe('5. Help Center Documentation Architecture', () => {
    it('retrieves knowledge base articles and filters by category', () => {
      const allArticles = getHelpArticles();
      expect(allArticles.length).toBeGreaterThanOrEqual(4);

      const aiArticles = getHelpArticles('AI Receptionist');
      expect(aiArticles.length).toBe(1);
      expect(aiArticles[0].slug).toBe('ai-receptionist-setup');
    });

    it('retrieves single article content by slug', () => {
      const article = getHelpArticleBySlug('google-calendar-sync');
      expect(article).not.toBeNull();
      expect(article?.title).toContain('Google Calendar');
    });
  });
});
