import { describe, it, expect, vi, beforeEach } from 'vitest';
import { login, signup, logout, resetPassword, updatePassword } from './auth';
import { redirect } from 'next/navigation';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockReset = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/supabase/server-auth', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      resetPasswordForEmail: mockReset,
      updateUser: mockUpdate,
    },
  })),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login redirects to dashboard on success', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null });
    const formData = new FormData();
    formData.append('email', 'test@test.com');
    formData.append('password', 'password');

    await login(formData);
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('login redirects back with error on failure', async () => {
    mockSignIn.mockResolvedValueOnce({ error: new Error('Invalid') });
    const formData = new FormData();
    formData.append('email', 'test@test.com');
    formData.append('password', 'wrong');

    await login(formData);
    expect(redirect).toHaveBeenCalledWith('/login?error=Could not authenticate user');
  });

  it('signup redirects to onboarding on success', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null });
    const formData = new FormData();
    formData.append('email', 'test@test.com');
    formData.append('password', 'password');
    formData.append('first_name', 'Test');
    formData.append('last_name', 'User');

    await signup(formData);
    expect(redirect).toHaveBeenCalledWith('/onboarding');
  });

  it('logout signs out and redirects to login', async () => {
    await logout();
    expect(mockSignOut).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('resetPassword redirects with message on success', async () => {
    mockReset.mockResolvedValueOnce({ error: null });
    const formData = new FormData();
    formData.append('email', 'test@test.com');

    await resetPassword(formData);
    expect(redirect).toHaveBeenCalledWith('/forgot-password?message=Check your email for the reset link');
  });

  it('updatePassword redirects to dashboard on success', async () => {
    mockUpdate.mockResolvedValueOnce({ error: null });
    const formData = new FormData();
    formData.append('password', 'newpass');

    await updatePassword(formData);
    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });
});
