import { NextRequest, NextResponse } from 'next/server';
import { processStripeWebhookEvent } from '@/lib/billing/webhook-handler';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  try {
    const rawBody = await req.text();
    const result = await processStripeWebhookEvent(rawBody, signature);

    if (!result.success && !result.received) {
      return NextResponse.json(
        { error: result.error || 'Invalid signature' },
        { status: 400 }
      );
    }

    return NextResponse.json({ received: true, eventType: result.eventType });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error)?.message || 'Webhook processing error' },
      { status: 500 }
    );
  }
}
