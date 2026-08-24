import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/whatsapp/client';
import { processWhatsAppWebhook } from '@/lib/whatsapp/webhook-handler';
import { getServerEnv } from '@/lib/config/env';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const env = getServerEnv();
  const verifyToken = env.WHATSAPP_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return NextResponse.json({ success: false }, { status: 403 });
    }
  }

  return NextResponse.json({ success: false }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('WhatsApp Webhook signature verification failed');
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    
    // Process async so we return 200 quickly to Meta
    processWhatsAppWebhook(body).catch(err => {
      console.error('Error processing WhatsApp webhook:', err);
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
