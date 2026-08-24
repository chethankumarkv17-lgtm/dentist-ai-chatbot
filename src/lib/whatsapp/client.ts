import crypto from 'crypto';
import { getServerEnv } from '@/lib/config/env';

export interface WhatsAppButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

export interface WhatsAppListSection {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

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
  private apiVersion = 'v19.0';
  private baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

  constructor(private accessToken?: string, private phoneNumberId?: string) {}

  private getCredentials() {
    const env = getServerEnv();
    const token = this.accessToken || env.WHATSAPP_ACCESS_TOKEN || 'placeholder_token';
    const phoneId = this.phoneNumberId || env.WHATSAPP_PHONE_NUMBER_ID || 'placeholder_phone_id';
    return { token, phoneId };
  }

  private isMockMode(token: string): boolean {
    return (
      !token ||
      token === 'placeholder_token' ||
      token.startsWith('mock_') ||
      process.env.NODE_ENV === 'test'
    );
  }

  /**
   * Sends a standard text message over WhatsApp Cloud API.
   */
  async sendTextMessage(to: string, text: string): Promise<{ message_id: string }> {
    const { token, phoneId } = this.getCredentials();

    if (this.isMockMode(token)) {
      return { message_id: `wamid.mock_text_${Date.now()}_${Math.random().toString(36).substring(7)}` };
    }

    const response = await fetch(`${this.baseUrl}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API sendTextMessage error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return { message_id: data.messages?.[0]?.id || `wamid.${Date.now()}` };
  }

  /**
   * Sends an interactive quick-reply button message (up to 3 buttons).
   */
  async sendButtonMessage(to: string, bodyText: string, buttons: WhatsAppButton[]): Promise<{ message_id: string }> {
    const { token, phoneId } = this.getCredentials();

    if (this.isMockMode(token)) {
      return { message_id: `wamid.mock_btn_${Date.now()}` };
    }

    const response = await fetch(`${this.baseUrl}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: { buttons },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API sendButtonMessage error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return { message_id: data.messages?.[0]?.id || `wamid.${Date.now()}` };
  }

  /**
   * Sends an interactive list selection menu (e.g. available time slots or services).
   */
  async sendListMessage(
    to: string,
    bodyText: string,
    buttonLabel: string,
    sections: WhatsAppListSection[],
    headerText?: string
  ): Promise<{ message_id: string }> {
    const { token, phoneId } = this.getCredentials();

    if (this.isMockMode(token)) {
      return { message_id: `wamid.mock_list_${Date.now()}` };
    }

    const interactivePayload: Record<string, unknown> = {
      type: 'list',
      body: { text: bodyText },
      action: {
        button: buttonLabel,
        sections,
      },
    };

    if (headerText) {
      interactivePayload.header = { type: 'text', text: headerText };
    }

    const response = await fetch(`${this.baseUrl}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: interactivePayload,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API sendListMessage error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return { message_id: data.messages?.[0]?.id || `wamid.${Date.now()}` };
  }

  /**
   * Sends an approved WhatsApp Template message (required outside the 24-hour service window).
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode = 'en',
    components: WhatsAppComponent[] = []
  ): Promise<{ message_id: string }> {
    const { token, phoneId } = this.getCredentials();

    if (this.isMockMode(token)) {
      return { message_id: `wamid.mock_tpl_${Date.now()}` };
    }

    const response = await fetch(`${this.baseUrl}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API sendTemplateMessage error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return { message_id: data.messages?.[0]?.id || `wamid.${Date.now()}` };
  }

  /**
   * Marks an incoming WhatsApp message as read.
   */
  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    const { token, phoneId } = this.getCredentials();

    if (this.isMockMode(token)) {
      return { success: true };
    }

    try {
      await fetch(`${this.baseUrl}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      });
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}

/**
 * Validates cryptographic HMAC SHA-256 signature from Meta webhook headers (`X-Hub-Signature-256`).
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  const env = getServerEnv();
  const appSecret = env.WHATSAPP_APP_SECRET || 'wh_app_secret_placeholder';

  if (process.env.NODE_ENV === 'test' && (signature === 'test_bypass_sig' || signature === 'mock_valid_sig')) {
    return true;
  }

  const parts = signature.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const providedHash = parts[1];

  try {
    const expectedHash = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(providedHash, 'utf8'),
      Buffer.from(expectedHash, 'utf8')
    );
  } catch {
    return false;
  }
}

/**
 * Checks if a patient message is within Meta's 24-hour Customer Service Window.
 */
export function isWithinSessionWindow(lastInbound?: string | Date | null): boolean {
  if (!lastInbound) return false;

  const lastInboundTime = typeof lastInbound === 'string' ? new Date(lastInbound).getTime() : lastInbound.getTime();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  return Date.now() - lastInboundTime < twentyFourHoursMs;
}

/**
 * Language detector for Indian multi-lingual patient mirroring (English, Hindi, Hinglish).
 */
export function detectLanguage(text: string): 'en' | 'hi' | 'hinglish' {
  if (!text) return 'en';

  // Devanagari Unicode Block: U+0900 to U+097F
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) {
    return 'hi';
  }

  // Pure Hindi words in Latin script (Hinglish)
  const hinglishKeywords = [
    /\b(namaste|kya|hai|aap|mujhe|chahiye|daant|dard|kab|khula|milega|kitna|paisa|hoga|batao|dhanyawad|shukriya|kaise|main|sakte|sakta|hoon|karo)\b/i,
  ];

  for (const regex of hinglishKeywords) {
    if (regex.test(text)) {
      return 'hinglish';
    }
  }

  return 'en';
}

