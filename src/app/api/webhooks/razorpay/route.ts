import { NextResponse } from 'next/server';
import { processRazorpayWebhookEvent } from '@/lib/billing/webhook-handler';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('X-Razorpay-Signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing X-Razorpay-Signature header' },
        { status: 400 }
      );
    }

    const result = await processRazorpayWebhookEvent(rawBody, signature);

    if (!result.success) {
      console.error('Razorpay Webhook processing error:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    if (result.duplicate) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Unhandled Razorpay Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal webhook error' },
      { status: 500 }
    );
  }
}
