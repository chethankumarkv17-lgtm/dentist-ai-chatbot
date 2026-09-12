import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  let user = null;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {
    user = null;
  }

  // Check demo session cookie (enabled unless explicitly set to false)
  const isDemoAllowed = process.env.ENABLE_DEMO_LOGIN !== 'false';
  let demoEmail = request.cookies.get('demo_user_email')?.value;
  if (!demoEmail && isDemoAllowed) {
    demoEmail = 'dr.smith@downtowndental.com';
  }

  const hasExplicitCookie = Boolean(request.cookies.get('demo_user_email')?.value);
  const isAuthenticated = Boolean(user || demoEmail);

  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname.startsWith('/dashboard');
  const isAdmin = pathname.startsWith('/admin');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  if (isDashboard || isAdmin) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    if (!hasExplicitCookie && demoEmail) {
      supabaseResponse.cookies.set('demo_user_email', demoEmail, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 7 });
    }
  }

  if (isAuthRoute && (Boolean(user) || hasExplicitCookie)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
