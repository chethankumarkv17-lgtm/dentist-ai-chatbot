import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { appCache, getOptimalCacheHeaders } from '@/lib/performance/cache';

const idSchema = z.string().regex(
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
  'Invalid widget ID'
);

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || 'default';

  const cacheKey = `widget:config:${id}`;
  let widgetConfig = appCache.get<Record<string, unknown>>(cacheKey);

  if (!widgetConfig) {
    widgetConfig = {
      clinicName: "Downtown Smile",
      themeColor: "#007BFF",
      verified: true,
      greeting: "Hello! How can I help you today?",
    };
    appCache.set(cacheKey, widgetConfig, 600);
  }

  // Set permissive CORS and optimal public cache headers
  const headers = getOptimalCacheHeaders('public_dynamic');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Content-Type', 'application/json');

  return NextResponse.json(widgetConfig, { status: 200, headers });
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  return new NextResponse(null, { status: 204, headers });
}
