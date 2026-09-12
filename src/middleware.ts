import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // Platform Subdomain / Custom Domain Routing
  // If the hostname is not localhost and not the primary naked domain, rewrite to the site/[slug] route
  const hostname = request.headers.get('host') || '';
  
  // Resolve configured primary domain from NEXT_PUBLIC_APP_URL
  let configuredDomain = '';
  try {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      configuredDomain = new URL(process.env.NEXT_PUBLIC_APP_URL).hostname.toLowerCase();
    }
  } catch {
    // fallback
  }

  const cleanHostname = hostname.split(':')[0].toLowerCase();
  const isLocalhost = cleanHostname === 'localhost' || cleanHostname === '127.0.0.1' || cleanHostname.endsWith('.localhost');
  const isPrimaryDomain =
    (configuredDomain && (cleanHostname === configuredDomain || cleanHostname === `www.${configuredDomain}`)) ||
    cleanHostname === 'dentalai.test' ||
    cleanHostname === 'www.dentalai.test' ||
    cleanHostname === 'radiantnobel.com' ||
    cleanHostname === 'www.radiantnobel.com';

  if (!isLocalhost && !isPrimaryDomain && !url.pathname.startsWith('/api')) {
    // Assuming subdomain format: slug.dentalai.test or slug.radiantnobel.com
    const slug = cleanHostname.split('.')[0];
    
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
