import { NextRequest, NextResponse } from 'next/server';
import { processVoiceCallTurn } from '@/lib/voice/orchestrator';
import { buildGreetingTwiML, buildHangupTwiML, validateTwilioSignature } from '@/lib/voice/telephony';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const signature = req.headers.get('x-twilio-signature');
    const isValid = validateTwilioSignature(req.url, params, signature);

    if (!isValid && process.env.NODE_ENV === 'production') {
      return new NextResponse(buildHangupTwiML('Unauthorized call connection'), {
        status: 401,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const callSid = params.CallSid || `call_${Date.now()}`;
    const from = params.From || '+910000000000';
    const to = params.To || '';
    const clinicId = req.nextUrl.searchParams.get('clinicId') || undefined;

    const result = await processVoiceCallTurn({
      callSid,
      from,
      to,
      clinicId,
    });

    const processActionUrl = `/api/webhooks/voice/process?clinicId=${clinicId || ''}`;
    const twiml =
      result.action === 'hangup'
        ? buildHangupTwiML(result.replyText)
        : buildGreetingTwiML(result.replyText, processActionUrl);

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (err: unknown) {
    console.error('Inbound voice error:', err);
    return new NextResponse(buildHangupTwiML('We are experiencing technical difficulties. Please try again later.'), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
