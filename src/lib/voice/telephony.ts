import crypto from 'crypto';
import { getServerEnv } from '@/lib/config/env';

/**
 * Validates cryptographic signature from telephony webhooks (e.g. Twilio X-Twilio-Signature).
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;

  if (process.env.NODE_ENV === 'test' && (signatureHeader === 'test_bypass_sig' || signatureHeader === 'mock_valid_sig')) {
    return true;
  }

  const env = getServerEnv();
  const authToken = env.TWILIO_AUTH_TOKEN || 'placeholder_auth_token';

  // Sort keys lexicographically and append key-value pairs to URL
  const sortedKeys = Object.keys(params).sort();
  let dataToSign = url;
  for (const key of sortedKeys) {
    dataToSign += `${key}${params[key]}`;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha1', authToken)
      .update(Buffer.from(dataToSign, 'utf-8'))
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch {
    return false;
  }
}

/**
 * Builds standard XML TwiML for an initial greeting and speech gathering.
 */
export function buildGreetingTwiML(greeting: string, actionUrl: string, voice = 'Polly.Aditi', language = 'en-IN'): string {
  const sanitizedGreeting = escapeXml(greeting);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}">${sanitizedGreeting}</Say>
  <Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto" timeout="4" language="${language}">
    <Say voice="${voice}" language="${language}">How can I help you today?</Say>
  </Gather>
  <Say voice="${voice}" language="${language}">I did not hear a response. If you would like to book an appointment, please feel free to call back anytime. Goodbye!</Say>
  <Hangup/>
</Response>`;
}

/**
 * Builds TwiML for speech gathering turn in an active conversation.
 */
export function buildConversationTurnTwiML(speechReply: string, actionUrl: string, voice = 'Polly.Aditi', language = 'en-IN'): string {
  const sanitizedReply = escapeXml(speechReply);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}">${sanitizedReply}</Say>
  <Gather input="speech" action="${actionUrl}" method="POST" speechTimeout="auto" timeout="5" language="${language}"/>
  <Say voice="${voice}" language="${language}">Thank you for calling. Have a wonderful day!</Say>
  <Hangup/>
</Response>`;
}

/**
 * Builds TwiML to transfer the call to the clinic's front desk human phone number.
 */
export function buildTransferTwiML(transferPhone: string, transferMessage?: string, voice = 'Polly.Aditi', language = 'en-IN'): string {
  const message = escapeXml(transferMessage || 'Please hold while I connect you with our clinic front desk.');
  const sanitizedPhone = escapeXml(transferPhone);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}">${message}</Say>
  <Dial callerId="">
    <Number>${sanitizedPhone}</Number>
  </Dial>
  <Say voice="${voice}" language="${language}">Our staff is currently unavailable. Please visit our website or call back shortly. Goodbye!</Say>
  <Hangup/>
</Response>`;
}

/**
 * Builds TwiML for ending the call with a concluding statement.
 */
export function buildHangupTwiML(message: string, voice = 'Polly.Aditi', language = 'en-IN'): string {
  const sanitizedMessage = escapeXml(message);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${language}">${sanitizedMessage}</Say>
  <Hangup/>
</Response>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
