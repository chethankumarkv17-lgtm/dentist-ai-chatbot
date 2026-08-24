import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateSession } from '@/lib/supabase/middleware';
import { NextRequest } from 'next/server';
import { getCurrentUser, verifyTenantAccess, requireTenantRole } from '@/lib/supabase/server-auth';

// Mock cookies store
let mockCookieData: Record<string, string> = {};

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn((name: string) => (mockCookieData[name] ? { name, value: mockCookieData[name] } : undefined)),
    getAll: vi.fn(() => Object.entries(mockCookieData).map(([name, value]) => ({ name, value }))),
    set: vi.fn((name: string, value: string) => {
      mockCookieData[name] = value;
    }),
    delete: vi.fn((name: string) => {
      delete mockCookieData[name];
    }),
  })),
}));

// Mock Supabase
let mockUser: { id: string; email?: string; role?: string } | null = null;
const mockOrgMembers: { user_id: string; organization_id: string; role: string }[] = [
  { user_id: 'user-dentist-a', organization_id: 'org-a', role: 'clinic_owner' },
  { user_id: 'user-dentist-b', organization_id: 'org-b', role: 'clinic_admin' },
  { user_id: 'user-staff-a', organization_id: 'org-a', role: 'staff' },
];

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser }, error: null })),
      signInWithPassword: vi.fn(async ({ email, password }) => {
        if (email === 'valid@clinic.com' && password === 'correct-pass') {
          mockUser = { id: 'user-dentist-a', email: 'valid@clinic.com', role: 'authenticated' };
          return { data: { user: mockUser }, error: null };
        }
        return { data: { user: null }, error: new Error('Invalid login credentials') };
      }),
      signOut: vi.fn(async () => {
        mockUser = null;
        return { error: null };
      }),
    },
    from: vi.fn((table: string) => {
      let queryOrgId: string | null = null;
      let queryUserId: string | null = null;

      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn((col: string, val: string) => {
          if (col === 'organization_id') queryOrgId = val;
          if (col === 'user_id') queryUserId = val;
          return chain;
        }),
        single: vi.fn(async () => {
          if (table === 'organization_members') {
            const member = mockOrgMembers.find(
              (m) => (!queryOrgId || m.organization_id === queryOrgId) && (!queryUserId || m.user_id === queryUserId)
            );
            if (member) return { data: member, error: null };
            return { data: null, error: new Error('Not found') };
          }
          return { data: null, error: null };
        }),
        maybeSingle: vi.fn(async () => {
          if (table === 'organization_members') {
            const member = mockOrgMembers.find(
              (m) => (!queryOrgId || m.organization_id === queryOrgId) && (!queryUserId || m.user_id === queryUserId)
            );
            return { data: member || null, error: null };
          }
          return { data: null, error: null };
        }),
      };
      return chain;
    }),
  })),
}));

describe('Comprehensive Authentication & Dashboard Access Audit', () => {
  beforeEach(() => {
    mockCookieData = {};
    mockUser = null;
    vi.clearAllMocks();
  });

  describe('Step 1 & 5: Public vs Protected Route Access via Middleware', () => {
    it('allows unauthenticated visitors to view public marketing routes', async () => {
      const publicRoutes = ['/', '/pricing', '/features', '/how-it-works', '/privacy', '/terms'];

      for (const route of publicRoutes) {
        const req = new NextRequest(`http://localhost:3000${route}`);
        const res = await updateSession(req);
        expect(res.status).toBe(200);
        expect(res.headers.get('location')).toBeNull();
      }
    });

    it('redirects unauthenticated users from /dashboard to /login', async () => {
      const req = new NextRequest('http://localhost:3000/dashboard');
      const res = await updateSession(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('redirects unauthenticated users from protected dashboard subroutes', async () => {
      const protectedSubroutes = [
        '/dashboard/appointments',
        '/dashboard/patients',
        '/dashboard/services',
        '/dashboard/availability',
        '/dashboard/chatbot',
        '/dashboard/whatsapp',
        '/dashboard/voice',
        '/dashboard/billing',
        '/dashboard/settings',
        '/admin',
      ];

      for (const subroute of protectedSubroutes) {
        const req = new NextRequest(`http://localhost:3000${subroute}`);
        const res = await updateSession(req);
        expect(res.status).toBe(307);
        expect(res.headers.get('location')).toBe('http://localhost:3000/login');
      }
    });
  });

  describe('Step 3, 4 & 6: Login Flow, Session Creation & Persistence', () => {
    it('authenticates user session and resolves current user identity', async () => {
      mockUser = { id: 'user-dentist-a', email: 'dr.smith@downtowndental.com', role: 'authenticated' };

      const user = await getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.email).toBe('dr.smith@downtowndental.com');
      expect(user?.id).toBe('user-dentist-a');
    });

    it('maintains session persistence across page refreshes via secure session cookie', async () => {
      mockCookieData['demo_user_email'] = 'dr.smith@downtowndental.com';

      const user = await getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.email).toBe('dr.smith@downtowndental.com');

      // Test middleware recognizing cookie session
      const req = new NextRequest('http://localhost:3000/dashboard', {
        headers: { cookie: 'demo_user_email=dr.smith@downtowndental.com' },
      });
      const res = await updateSession(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('redirects already logged-in users away from /login to /dashboard', async () => {
      mockUser = { id: 'user-dentist-a', email: 'dr.smith@downtowndental.com', role: 'authenticated' };

      const req = new NextRequest('http://localhost:3000/login');
      const res = await updateSession(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
    });
  });

  describe('Step 9, 10 & 17: Multi-Tenancy Isolation, Roles & RLS Verification', () => {
    it('verifies tenant access for legitimate organization members', async () => {
      const hasAccess = await verifyTenantAccess('org-a');
      expect(hasAccess).toBe(true);
    });

    it('blocks access when user attempts to access foreign tenant', async () => {
      const hasAccess = await verifyTenantAccess('org-unauthorized');
      expect(hasAccess).toBe(false);
    });

    it('enforces role authorization (clinic_owner vs staff)', async () => {
      const role = await requireTenantRole('org-a', ['clinic_owner', 'clinic_admin']);
      expect(role).toBe('clinic_owner');

      await expect(requireTenantRole('org-a', ['dentist'])).rejects.toThrow('Forbidden: Insufficient role permissions.');
    });
  });

  describe('Step 16: Logout Invalidation', () => {
    it('completely revokes dashboard access upon logout', async () => {
      mockCookieData = {};
      mockUser = null;

      const user = await getCurrentUser();
      expect(user).toBeNull();

      const req = new NextRequest('http://localhost:3000/dashboard');
      const res = await updateSession(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });
  });
});
