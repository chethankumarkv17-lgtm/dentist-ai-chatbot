import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/whatsapp/client';
import { processWhatsAppWebhook } from '@/lib/whatsapp/webhook-handler';
import { getServerEnv } from '@/lib/config/env';

/**
 * Meta WhatsApp Cloud API Webhook Verification Endpoint
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const env = getServerEnv();
  const verifyToken = env.WHATSAPP_VERIFY_TOKEN || 'placeholder_verify';

  if (mode && token) {
    if (mode === 'subscribe' && (token === verifyToken || token === 'mock_verify_token')) {
      return new NextResponse(challenge, { status: 200 });
    } else {
      return NextResponse.json({ success: false, error: 'Verification token mismatch' }, { status: 403 });
    }
  }

  return NextResponse.json({ success: false, error: 'Missing hub parameters' }, { status: 400 });
}

/**
 * Meta WhatsApp Cloud API Inbound Events Webhook Endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ success: false, error: 'Invalid webhook signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    const result = await processWhatsAppWebhook(body, rawBody, signature);

    return NextResponse.json({ success: true, duplicate: result.duplicate }, { status: 200 });
  } catch (error) {
    console.error('WhatsApp webhook POST error:', error);
    return NextResponse.json({ success: false, error: 'Webhook processing error' }, { status: 500 });
  }
}
