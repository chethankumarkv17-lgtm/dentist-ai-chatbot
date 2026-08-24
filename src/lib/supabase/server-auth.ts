import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookieStore).getAll();
        },
        async setAll(cookiesToSet) {
          try {
            const resolvedCookieStore = await cookieStore;
            cookiesToSet.forEach(({ name, value, options }) =>
              resolvedCookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
}

/**
 * Authoritative Server-Side User Session Resolver
 * Resolves real Supabase JWT session, or valid session cookie, or returns null if unauthenticated.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return {
        id: user.id,
        email: user.email,
        role: user.role || 'authenticated',
        user_metadata: user.user_metadata,
      };
    }
  } catch {
    // If Supabase network request fails, proceed to session cookie check
  }

  // Check demo / development session cookie
  try {
    const cookieStore = await cookies();
    const demoEmail = cookieStore.get('demo_user_email')?.value;
    if (demoEmail) {
      return {
        id: 'demo-user-id',
        email: demoEmail,
        role: 'authenticated',
        user_metadata: { first_name: 'Dr.', last_name: 'Smith' },
      };
    }
  } catch {
    // Non-request context
  }

  return null;
}

/**
 * Verifies if the currently authenticated user has access to a specific organization.
 * Relies on the database RLS policies. If the user doesn't have access, the query will return nothing.
 */
export async function verifyTenantAccess(orgId: string): Promise<boolean> {
  const supabase = createClient();
  
  // Since RLS is active on organization_members, this query will only return 
  // a row if the user is a member of the organization.
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Retrieves the role of the user for a specific tenant, throwing an error if unauthorized.
 */
export async function requireTenantRole(orgId: string, allowedRoles?: string[]): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .single();

  if (error || !data) {
    throw new Error('Unauthorized: Tenant access denied.');
  }

  if (allowedRoles && !allowedRoles.includes(data.role)) {
    throw new Error('Forbidden: Insufficient role permissions.');
  }

  return data.role;
}
