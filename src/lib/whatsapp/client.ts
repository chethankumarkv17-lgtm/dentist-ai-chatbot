import crypto from 'crypto';
import { getServerEnv } from '@/lib/config/env';

export interface WhatsAppComponent {
  type: string;
  sub_type?: string;
  index?: string;
  parameters: Array<{
    type: string;
    text?: string;
    currency?: {
      fallback_value: string;
      code: string;
      amount_1000: number;
    };
    date_time?: {
      fallback_value: string;
    };
  }>;
}

export class WhatsAppClient {
  private apiVersion = 'v17.0';
  private baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  
  constructor(private accessToken?: string, private phoneNumberId?: string) {}

  private getTokens() {
    const env = getServerEnv();
    const token = this.accessToken || env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = this.phoneNumberId || env.WHATSAPP_PHONE_NUMBER_ID;
    
    return { token, phoneId };
  }

  async sendTextMessage(to: string, text: string) {
    const { token, phoneId } = this.getTokens();
    
    // Mock mode
    if (token === 'placeholder' || !token) {
      console.log(`[MOCK WHATSAPP] Sending text to ${to}: ${text}`);
      return { message_id: `mock_msg_${Date.now()}` };
    }

    const response = await fetch(`${this.baseUrl}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${error}`);
    }

    return response.json();
  }

  async sendTemplateMessage(to: string, templateName: string, languageCode: string, components: WhatsAppComponent[] = []) {
    const { token, phoneId } = this.getTokens();

    // Mock mode
    if (token === 'placeholder' || !token) {
      console.log(`[MOCK WHATSAPP] Sending template ${templateName} to ${to}`);
      return { message_id: `mock_tpl_${Date.now()}` };
    }

    const response = await fetch(`${this.baseUrl}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${error}`);
    }

    return response.json();
  }

  async markAsRead(messageId: string) {
    const { token, phoneId } = this.getTokens();

    // Mock mode
    if (token === 'placeholder' || !token) {
      console.log(`[MOCK WHATSAPP] Marking ${messageId} as read`);
      return { success: true };
    }

    const response = await fetch(`${this.baseUrl}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${error}`);
    }

    return response.json();
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  
  const env = getServerEnv();
  const appSecret = env.WHATSAPP_APP_SECRET;
  
  if (!appSecret || appSecret === 'placeholder_secret') {
    // If we're in mock mode, bypass verification
    return true;
  }
  
  // Format: sha256=....
  const signatureParts = signature.split('=');
  if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') {
    return false;
  }
  
  const hash = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  return hash === signatureParts[1];
}

export function isWithinSessionWindow(lastInboundTimestamp?: Date | null): boolean {
  if (!lastInboundTimestamp) return false;
  const now = new Date();
  const diffInHours = (now.getTime() - lastInboundTimestamp.getTime()) / (1000 * 60 * 60);
  return diffInHours < 24;
}

export function detectLanguage(text: string): 'en' | 'hi' {
  // Check for Devanagari characters
  const devanagariRegex = /[\u0900-\u097F]/;
  if (devanagariRegex.test(text)) {
    return 'hi';
  }
  
  // Basic Hinglish check
  const hinglishWords = ['hai', 'kya', 'kaise', 'kab', 'nahi', 'haan', 'acha', 'theek', 'kal', 'aaj', 'sir', 'madam'];
  const words = text.toLowerCase().split(/\s+/);
  
  let hinglishCount = 0;
  for (const word of words) {
    if (hinglishWords.includes(word)) {
      hinglishCount++;
    }
  }
  
  // If more than 1 Hinglish word found, consider it Hindi/Hinglish (will map to hi template)
  if (hinglishCount > 1) {
    return 'hi';
  }
  
  return 'en';
}
