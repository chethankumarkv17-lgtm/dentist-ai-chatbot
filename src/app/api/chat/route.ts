import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { processReceptionistMessage } from '@/lib/ai/receptionist';
import {
  checkIpRateLimit,
  checkUserRateLimit,
  checkClinicRateLimit,
  checkBurstLimit,
} from '@/lib/limits/rate-limiter';
import { enforceAiQuota } from '@/lib/limits/quota-guard';
import { recordAiUsage } from '@/lib/limits/cost-tracker';

const chatRequestSchema = z.object({
  widgetId: z.string().min(1, 'Widget / Clinic ID is required'),
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
  conversationId: z.string().optional(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system', 'tool']),
      content: z.string(),
    })
  ).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Extract client IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'anonymous-client';

    // 2. IP Rate Limit & Burst Protection
    const ipCheck = checkIpRateLimit(ip);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'IP rate limit exceeded. Please wait a moment before sending more messages.',
          reply: 'You are sending messages too quickly. Please wait a moment before trying again.',
          rateLimited: true,
        },
        {
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Retry-After': (ipCheck.retryAfterSeconds || 60).toString(),
          },
        }
      );
    }

    const burstCheck = checkBurstLimit(ip);
    if (!burstCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Burst limit exceeded. Please wait a few seconds.',
          reply: 'You are sending messages too rapidly. Please pause for a few seconds.',
          rateLimited: true,
        },
        {
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Retry-After': (burstCheck.retryAfterSeconds || 10).toString(),
          },
        }
      );
    }

    // 3. Parse & validate request payload
    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.issues.map(i => i.message) },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const { widgetId, message, conversationId, history } = parsed.data;

    // 4. User Session & Clinic Rate Limits
    const userCheck = checkUserRateLimit(conversationId || ip);
    if (!userCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          reply: 'Session rate limit exceeded. Please wait a moment before sending another message.',
          rateLimited: true,
        },
        {
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Retry-After': (userCheck.retryAfterSeconds || 60).toString(),
          },
        }
      );
    }

    const clinicCheck = checkClinicRateLimit(widgetId);
    if (!clinicCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          reply: 'Clinic traffic capacity reached. Please try again in a few moments.',
          rateLimited: true,
        },
        {
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Retry-After': (clinicCheck.retryAfterSeconds || 60).toString(),
          },
        }
      );
    }

    // 5. Server-Side Monthly Plan Quota & Restriction Check
    const quotaCheck = await enforceAiQuota(widgetId);
    if (!quotaCheck.allowed) {
      if (quotaCheck.reason === 'temporarily_restricted') {
        return NextResponse.json(
          {
            error: 'Temporarily Restricted',
            reply: 'AI Receptionist is temporarily paused due to security limits. Please call the dental clinic directly.',
            restricted: true,
          },
          {
            status: 429,
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      return NextResponse.json(
        {
          error: 'Quota Exceeded',
          reply: 'Our AI receptionist service is temporarily unavailable. Please contact our clinic reception directly by phone.',
          quotaExceeded: true,
        },
        {
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 6. Process message through AI receptionist orchestrator
    const result = await processReceptionistMessage({
      clinicId: widgetId,
      message,
      conversationId,
      history,
    });

    // 7. Track Token Usage & Estimated Cost
    // Approximate token counts from message length + reply length
    const approxPromptTokens = Math.max(50, Math.ceil(message.length / 3.5));
    const approxCompletionTokens = Math.max(30, Math.ceil((result.reply || '').length / 3.5));

    await recordAiUsage(widgetId, {
      promptTokens: approxPromptTokens,
      completionTokens: approxCompletionTokens,
      messagesCount: 1,
      requestsCount: 1,
    });

    return NextResponse.json(
      {
        reply: result.reply,
        conversationId: result.conversationId,
        toolCalls: result.toolCallsExecuted,
        success: result.success,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        reply: 'I apologize, but I am currently unable to process your request. Please try again in a few moments.',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
