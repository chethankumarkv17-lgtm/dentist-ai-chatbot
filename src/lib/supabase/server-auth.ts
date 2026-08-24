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
