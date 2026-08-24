import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // Platform Subdomain / Custom Domain Routing
  // If the hostname is not localhost and not the primary naked domain, rewrite to the site/[slug] route
  const hostname = request.headers.get('host') || '';
  
  // Example domain matching (mocking a real SaaS environment)
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isPrimaryDomain = hostname === 'dentalai.test' || hostname === 'www.dentalai.test';

  if (!isLocalhost && !isPrimaryDomain) {
    // Assuming subdomain format: slug.dentalai.test
    const slug = hostname.split('.')[0];
    
    // We rewrite the URL to our internal dynamic route that handles public websites
    // E.g. myclinic.dentalai.test/about -> /site/myclinic/about
    return NextResponse.rewrite(new URL(`/site/${slug}${url.pathname}`, request.url));
  }

  // Handle standard auth routing
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
