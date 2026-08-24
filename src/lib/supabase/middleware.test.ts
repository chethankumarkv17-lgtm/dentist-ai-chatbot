import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateSession } from './middleware';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users from /dashboard to /login', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const req = new NextRequest('http://localhost:3000/dashboard');
    const res = await updateSession(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('redirects unauthenticated users from /admin to /login', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const req = new NextRequest('http://localhost:3000/admin');
    const res = await updateSession(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('allows authenticated users to access /dashboard', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: '123' } } });
    const req = new NextRequest('http://localhost:3000/dashboard');
    const res = await updateSession(req);

    // If it allows access, it just returns the response (status 200 or no redirect)
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects authenticated users away from /login to /dashboard', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: '123' } } });
    const req = new NextRequest('http://localhost:3000/login');
    const res = await updateSession(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });

  it('redirects authenticated users away from /signup to /dashboard', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: '123' } } });
    const req = new NextRequest('http://localhost:3000/signup');
    const res = await updateSession(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });
});
