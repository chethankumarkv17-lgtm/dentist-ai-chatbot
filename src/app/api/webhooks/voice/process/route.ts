import { NextRequest, NextResponse } from 'next/server';
import { processVoiceCallTurn } from '@/lib/voice/orchestrator';
import {
  buildConversationTurnTwiML,
  buildTransferTwiML,
  buildHangupTwiML,
  validateTwilioSignature,
} from '@/lib/voice/telephony';

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
      return new NextResponse(buildHangupTwiML('Unauthorized voice request'), {
        status: 401,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const callSid = params.CallSid || `call_${Date.now()}`;
    const from = params.From || '+910000000000';
    const to = params.To || '';
    const speechResult = params.SpeechResult || '';
    const clinicId = req.nextUrl.searchParams.get('clinicId') || undefined;

    const result = await processVoiceCallTurn({
      callSid,
      from,
      to,
      speechResult,
      clinicId,
    });

    const processActionUrl = `/api/webhooks/voice/process?clinicId=${clinicId || ''}`;
    let twiml = '';

    if (result.action === 'transfer' && result.transferPhone) {
      twiml = buildTransferTwiML(result.transferPhone, result.replyText);
    } else if (result.action === 'hangup') {
      twiml = buildHangupTwiML(result.replyText);
    } else {
      twiml = buildConversationTurnTwiML(result.replyText, processActionUrl);
    }

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (err: unknown) {
    console.error('Voice process turn error:', err);
    return new NextResponse(buildHangupTwiML('We are experiencing audio processing difficulties. Please call back shortly.'), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
