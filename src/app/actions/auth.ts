'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server-auth';

async function safeSetCookie(name: string, value: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(name, value, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
  } catch {
    // Ignore in non-request test contexts
  }
}

async function safeDeleteCookie(name: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(name);
  } catch {
    // Ignore in non-request test contexts
  }
}

export async function login(formData: FormData) {
  const supabase = createClient();
  const email = (formData.get('email') as string) || 'dr.smith@downtowndental.com';
  const password = (formData.get('password') as string) || 'password123';

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect('/login?error=Could not authenticate user');
  }

  await safeSetCookie('demo_user_email', email);
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function quickDemoLogin() {
  await safeSetCookie('demo_user_email', 'dr.smith@downtowndental.com');
  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = createClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const data = {
    email,
    password,
    options: {
      data: {
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
      },
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect('/signup?error=Could not sign up user');
  }

  await safeSetCookie('demo_user_email', email);
  redirect('/onboarding');
}

export async function logout() {
  const supabase = createClient();

  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore signOut error in demo mode
  }

  await safeDeleteCookie('demo_user_email');
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function resetPassword(formData: FormData) {
  const supabase = createClient();
  const email = formData.get('email') as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
  });

  if (error) {
    redirect('/forgot-password?error=Could not send reset email');
  }

  redirect('/forgot-password?message=Check your email for the reset link');
}

export async function updatePassword(formData: FormData) {
  const supabase = createClient();
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect('/reset-password?error=Could not update password');
  }

  redirect('/dashboard');
}
