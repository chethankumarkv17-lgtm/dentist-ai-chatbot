import { createClient } from '@/lib/supabase/server-auth';
import { executeTool } from './tools';
import { validateInputSafety, validateToolTenantSecurity } from './guardrails';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
}

export interface ReceptionistRequest {
  clinicId: string;
  message: string;
  conversationId?: string;
  patientPhoneOrEmail?: string;
  history?: ChatMessage[];
  timeoutMs?: number;
  channel?: 'widget' | 'website' | 'whatsapp' | 'voice';
}

export interface ReceptionistResponse {
  success: boolean;
  reply: string;
  conversationId: string;
  toolCallsExecuted: { tool: string; args: Record<string, unknown>; result: { success: boolean; data?: unknown; error?: string } }[];
  error?: string;
  rateLimited?: boolean;
}

export const RECEPTIONIST_SYSTEM_PROMPT = `
You are the official, highly professional AI Dental Receptionist for this dental clinic.
Your mission is to assist patients with inquiries, explain services, share business hours, check verified dentist availability, book appointments, reschedule or cancel appointments, and connect patients to clinic staff when necessary.

CRITICAL HEALTHCARE & PRIVACY GUARDRAILS:
1. YOU MUST NEVER INVENT OR HALLUCINATE ANY OF THE FOLLOWING:
   - Clinic information, contact details, or address
   - Available services, descriptions, or prices
   - Dentist names, credentials, or schedules
   - Operating business hours
   - Available appointment dates or time slots
   - Appointment confirmations or booking reference IDs

2. YOU MUST NEVER ACCESS THE DATABASE DIRECTLY.
   - All clinic data and appointment actions MUST be performed through the provided CONTROLLED TOOLS.

3. ONLY THE BACKEND CAN CONFIRM A BOOKING.
   - You may ONLY tell a patient their appointment is booked and confirmed if the 'createAppointment' tool returned { success: true, data: { confirmationId, ... } }.
   - If 'createAppointment' fails or returns an error (e.g. double booking or slot taken), you MUST NOT claim success. You must explain politely that the slot is unavailable and offer to find other open slots.

4. REQUIRED BOOKING FLOW:
   - Identify the requested service and dentist (or ask patient preference).
   - Call 'getAvailableSlots' for the desired date to retrieve genuine availability.
   - Request necessary patient contact details: Full Name, Phone Number, and Email Address.
   - Call 'createAppointment' with the validated parameters.
   - Provide the confirmed details once the tool succeeds.

5. MEDICAL ADVICE & EMERGENCIES:
   - You are an administrative receptionist, not a licensed dentist.
   - Do NOT provide medical diagnosis or dental surgery advice.
   - For dental emergencies or complex medical inquiries, immediately offer 'requestHumanHelp'.
`;

/**
 * Intelligent deterministic / LLM tool-calling intent analyzer
 * Analyzes patient message and history to determine if a controlled tool should be called.
 */
export function determineToolCall(
  message: string,
  clinicId: string,
  _history: ChatMessage[] = [],
  context: {
    selectedDentistId?: string;
    selectedServiceId?: string;
    patientEmail?: string;
    patientPhone?: string;
    patientName?: string;
  } = {}
): { tool: string; args: Record<string, unknown> } | null {
  const lower = message.toLowerCase().trim();

  // 1. Clinic Info & Location
  if (
    lower.includes('where are you') ||
    lower.includes('where is') ||
    lower.includes('location') ||
    lower.includes('located') ||
    lower.includes('address') ||
    lower.includes('phone number') ||
    lower.includes('contact info') ||
    lower.includes('clinic info') ||
    lower.includes('email address')
  ) {
    return {
      tool: 'getClinicInformation',
      args: { clinicId },
    };
  }

  // 2. Business Hours / Opening time
  if (
    lower.includes('hours') ||
    lower.includes('open') ||
    lower.includes('opening time') ||
    lower.includes('close time') ||
    lower.includes('schedule today') ||
    lower.includes('when are you open')
  ) {
    return {
      tool: 'getBusinessHours',
      args: { clinicId },
    };
  }

  // 3. Services & Prices
  if (
    lower.includes('service') ||
    lower.includes('treatment') ||
    lower.includes('pricing') ||
    lower.includes('price') ||
    lower.includes('cost') ||
    lower.includes('teeth whitening') ||
    lower.includes('cleaning') ||
    lower.includes('filling') ||
    lower.includes('root canal') ||
    lower.includes('what do you offer')
  ) {
    return {
      tool: 'getServices',
      args: { clinicId },
    };
  }

  // 4. Dentists / Doctors
  if (
    lower.includes('dentist') ||
    lower.includes('doctor') ||
    lower.includes('practitioner') ||
    lower.includes('who works') ||
    lower.includes('staff')
  ) {
    return {
      tool: 'getDentists',
      args: { clinicId },
    };
  }

  // 4.5. FAQs / Policies / Insurance / Parking
  if (
    lower.includes('faq') ||
    lower.includes('insurance') ||
    lower.includes('parking') ||
    lower.includes('payment plan') ||
    lower.includes('cancellation policy') ||
    lower.includes('accept medicaid') ||
    lower.includes('accept medicare')
  ) {
    return {
      tool: 'getClinicFaqs',
      args: { clinicId, query: message },
    };
  }

  // 5. Human Help / Emergency / Escalation
  if (
    lower.includes('human') ||
    lower.includes('speak to a person') ||
    lower.includes('talk to someone') ||
    lower.includes('agent') ||
    lower.includes('emergency') ||
    lower.includes('severe pain') ||
    lower.includes('bleeding')
  ) {
    return {
      tool: 'requestHumanHelp',
      args: {
        clinicId,
        reason: message,
        patientContact: context.patientPhone || context.patientEmail,
      },
    };
  }

  // 6. Look up existing appointments
  if (
    (lower.includes('my appointment') || lower.includes('existing booking') || lower.includes('check appointment')) &&
    (context.patientEmail || context.patientPhone || lower.includes('@'))
  ) {
    const contact = context.patientEmail || context.patientPhone || message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)?.[0] || '';
    if (contact) {
      return {
        tool: 'getPatientAppointments',
        args: { clinicId, patientPhoneOrEmail: contact },
      };
    }
  }

  // 7. Cancel Appointment
  const cancelMatch = lower.match(/cancel\s+(?:appointment\s+|booking\s+)?([a-z0-9-]{6,})/i);
  if (lower.includes('cancel') && cancelMatch && (context.patientEmail || context.patientPhone)) {
    return {
      tool: 'cancelAppointment',
      args: {
        clinicId,
        appointmentId: cancelMatch[1],
        patientPhoneOrEmail: context.patientEmail || context.patientPhone,
      },
    };
  }

  // 8. Reschedule Appointment
  if (lower.includes('reschedule') && (context.patientEmail || context.patientPhone)) {
    const isoMatch = message.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?/);
    const idMatch = message.match(/[a-z0-9-]{6,}/i);
    if (isoMatch && idMatch) {
      return {
        tool: 'rescheduleAppointment',
        args: {
          clinicId,
          appointmentId: idMatch[0],
          newStartTime: isoMatch[0],
          patientPhoneOrEmail: context.patientEmail || context.patientPhone,
        },
      };
    }
  }

  // 9. Available Slots check (e.g. "slots on 2026-08-24", "availability for tomorrow")
  const dateMatch = message.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (
    (lower.includes('available') || lower.includes('slot') || lower.includes('book') || lower.includes('appointment') || lower.includes('time')) &&
    dateMatch
  ) {
    return {
      tool: 'getAvailableSlots',
      args: {
        clinicId,
        dentistId: context.selectedDentistId || 'd1',
        serviceId: context.selectedServiceId || 's1',
        date: dateMatch[1],
      },
    };
  }

  // 10. Direct Booking intent with full details (e.g. "Book John Doe john@example.com 555-1234 on 2026-08-24T09:00:00Z")
  const isoTimeMatch = message.match(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/);
  const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const phoneMatch = message.match(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);

  if (lower.includes('confirm') || lower.includes('book') || lower.includes('reserve')) {
    if (isoTimeMatch && emailMatch) {
      return {
        tool: 'createAppointment',
        args: {
          clinicId,
          patientName: context.patientName || 'Patient User',
          patientEmail: emailMatch[0],
          patientPhone: phoneMatch ? phoneMatch[0] : '555-0100',
          dentistId: context.selectedDentistId || 'd1',
          serviceId: context.selectedServiceId || 's1',
          startTime: isoTimeMatch[0].endsWith('Z') ? isoTimeMatch[0] : `${isoTimeMatch[0]}Z`,
        },
      };
    }
  }

  return null;
}

/**
 * Formats a reply for a specific channel (Widget, Website, WhatsApp, Voice)
 */
export function formatForChannel(text: string, channel: 'widget' | 'website' | 'whatsapp' | 'voice' = 'widget'): string {
  if (channel === 'voice') {
    // Voice TTS formatting: strip markdown asterisks, emojis, and bullet symbols for clear speech synthesis
    return text
      .replace(/[*_#`~]/g, '')
      .replace(/[📍📞✉️🌍•👤✅❌]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (channel === 'whatsapp') {
    // WhatsApp formatting: replace common bullet points with emojis, ensure good spacing
    return text
      .replace(/- Name:/g, '👤 Name:')
      .replace(/- Address:/g, '📍 Address:')
      .replace(/- Phone:/g, '📞 Phone:')
      .replace(/- Email:/g, '✉️ Email:')
      .replace(/- Timezone:/g, '🌍 Timezone:')
      .replace(/- /g, '• ');
  }

  return text;
}

/**
 * Generates an empathetic, accurate, non-hallucinatory AI receptionist reply
 * synthesizing tool outputs according to strict healthcare guidelines.
 */
export function formatAIResponse(
  userMessage: string,
  toolName: string | null,
  toolResult: { success: boolean; data?: unknown; error?: string } | null
): string {
  if (!toolName || !toolResult) {
    const lower = userMessage.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return "Hello! Welcome to our dental clinic. I can help you check our services, view clinic hours, check real-time dentist availability, or book, reschedule, and cancel appointments. How may I assist you today?";
    }
    if (lower.includes('thank')) {
      return "You are very welcome! Please let me know if there is anything else I can help you with today.";
    }
    return "I can help you with checking our dental services and prices, clinic opening hours, dentist availability, or booking and managing your appointment. What date or service are you interested in?";
  }

  if (!toolResult.success) {
    // If a tool execution failed (e.g. double booking, invalid slot, not found)
    if (toolName === 'createAppointment') {
      return `I could not complete your appointment booking: ${toolResult.error || 'The selected time slot is no longer available'}. Would you like me to check available alternative slots for another time or date?`;
    }
    if (toolName === 'getAvailableSlots') {
      return `I was unable to retrieve available slots: ${toolResult.error}. Please make sure the service and date are valid.`;
    }
    return `I encountered an issue processing that request: ${toolResult.error || 'Information could not be verified'}. Please let me know if you would like me to try again or connect you with clinic staff.`;
  }

  const data = toolResult.data;

  switch (toolName) {
    case 'getClinicInformation': {
      const clinic = data as { name: string; address?: string; phone?: string; email?: string; timezone: string };
      return `Here is our verified clinic information:\n- Name: ${clinic.name}\n- Address: ${clinic.address || 'Available on file'}\n- Phone: ${clinic.phone || 'Available on file'}\n- Email: ${clinic.email || 'Available on file'}\n- Timezone: ${clinic.timezone}`;
    }

    case 'getBusinessHours': {
      const hoursData = data as { hours: { day_of_week: number; open_time: string; close_time: string }[]; timezone: string };
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const hoursList = hoursData.hours?.map((h) => `${days[h.day_of_week]}: ${h.open_time} - ${h.close_time}`).join('\n') || 'Hours currently being updated.';
      return `Our official clinic business hours (${hoursData.timezone}):\n${hoursList}`;
    }

    case 'getServices': {
      const services = data as { name: string; duration_minutes: number; price?: number; description?: string }[];
      if (!services || services.length === 0) {
        return "There are currently no active bookable services listed. Please check back shortly or speak with our staff.";
      }
      const servicesList = services.map((s) => `- ${s.name} (${s.duration_minutes} mins)${s.price ? ` - $${s.price}` : ''}${s.description ? `: ${s.description}` : ''}`).join('\n');
      return `Here are our verified dental services:\n${servicesList}\n\nWould you like to check available appointment dates for any of these services?`;
    }

    case 'getDentists': {
      const dentists = data as { name: string; specialty?: string; bio?: string }[];
      if (!dentists || dentists.length === 0) {
        return "We have general practitioners available for appointments. Would you like to check our upcoming availability?";
      }
      const dentistList = dentists.map((d) => `- Dr. ${d.name} (${d.specialty || 'General Dentistry'})${d.bio ? ` - ${d.bio}` : ''}`).join('\n');
      return `Here are our verified dental practitioners:\n${dentistList}\n\nWould you like to schedule an appointment with one of our dentists?`;
    }

    case 'getClinicFaqs': {
      const faqsData = data as { faqs: { question: string; answer: string }[] };
      const faqs = faqsData?.faqs || [];
      if (faqs.length === 0) {
        return "I do not have a specific FAQ entry matching that question, but our front-desk team would be happy to provide full details.";
      }
      const faqList = faqs.slice(0, 3).map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      return `Here is our approved clinic information:\n\n${faqList}`;
    }

    case 'getAvailableSlots': {
      const slotsData = data as { slots: { start: string; end: string }[] };
      const slots = slotsData?.slots || [];
      if (slots.length === 0) {
        return "There are no available appointment slots for the requested date. The clinic may be closed, fully booked, or on holiday. Would you like to check another date?";
      }
      const formattedTimes = slots.slice(0, 8).map((s) => {
        const d = new Date(s.start);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
      }).join(', ');
      return `We have the following verified openings on that date: ${formattedTimes}${slots.length > 8 ? ' (and more)' : ''}. Would you like to book one of these times?`;
    }

    case 'createAppointment': {
      const appt = data as { confirmationId: string; serviceName: string; dentistName: string; patientName: string; startTime: string; endTime: string };
      return `Your appointment has been officially confirmed!\n\nBooking Confirmation Details:\n- Confirmation ID: ${appt.confirmationId}\n- Status: Confirmed\n- Service: ${appt.serviceName}\n- Dentist: Dr. ${appt.dentistName}\n- Patient: ${appt.patientName}\n- Start Time: ${appt.startTime}\n- End Time: ${appt.endTime}\n\nWe look forward to seeing you at the clinic!`;
    }

    case 'getPatientAppointments': {
      const apptsData = data as { appointments: { id: string; start_time: string; status: string }[] };
      const appts = apptsData?.appointments || [];
      if (appts.length === 0) {
        return "I could not find any active upcoming appointments under that contact information.";
      }
      const list = appts.map((a) => `- ID: ${a.id} | Start: ${a.start_time} | Status: ${a.status}`).join('\n');
      return `Here are your upcoming appointments on record:\n${list}`;
    }

    case 'cancelAppointment': {
      const cancelData = data as { appointmentId: string };
      return `Your appointment (${cancelData.appointmentId}) has been successfully cancelled. Please let us know whenever you wish to schedule a new visit.`;
    }

    case 'rescheduleAppointment': {
      const reschedData = data as { appointmentId: string; newStartTime: string };
      return `Your appointment (${reschedData.appointmentId}) has been successfully rescheduled to ${reschedData.newStartTime}. Status is confirmed.`;
    }

    case 'requestHumanHelp': {
      return "I have flagged your request for our front-desk clinic team. A staff member will follow up with you shortly. If this is an acute dental emergency, please visit the nearest emergency medical room or urgent dental center immediately.";
    }

    default:
      return "Your request has been processed. How else may I assist you today?";
  }
}

export async function processReceptionistMessage(req: ReceptionistRequest): Promise<ReceptionistResponse> {
  const {
    clinicId,
    message,
    conversationId: incomingConvId,
    history = [],
    timeoutMs = 8000,
    channel = 'widget',
  } = req;

  // Empty message guard
  if (!message || !message.trim()) {
    return {
      success: true,
      reply: formatForChannel("Hello! How can I assist you with your dental appointment or clinic inquiries today?", channel),
      conversationId: incomingConvId || `conv-${Date.now()}`,
      toolCallsExecuted: [],
    };
  }

  // Repeated message / spam loop guard
  const trimmed = message.trim().toLowerCase();
  const recentUserMessages = history.filter((h) => h.role === 'user').slice(-4);
  const matchCount = recentUserMessages.filter((h) => h.content.trim().toLowerCase() === trimmed).length;
  if (matchCount >= 2) {
    return {
      success: true,
      reply: formatForChannel("You have sent this exact message multiple times. Please let us know specifically how our clinic reception team can assist you, or feel free to call our front desk directly.", channel),
      conversationId: incomingConvId || `conv-${Date.now()}`,
      toolCallsExecuted: [],
    };
  }

  // Timeout Promise
  const timeoutPromise = new Promise<ReceptionistResponse>((_, reject) => {
    if (timeoutMs <= 0) {
      reject(new Error('AI_RECEPTIONIST_TIMEOUT'));
      return;
    }
    const timer = setTimeout(() => {
      reject(new Error('AI_RECEPTIONIST_TIMEOUT'));
    }, timeoutMs);

    if (timer.unref) {
      timer.unref();
    }
  });

  // Core Processing Task
  const processTask = async (): Promise<ReceptionistResponse> => {
    const supabase = createClient();
    let conversationId = incomingConvId;

    // 1. Retrieve or Initialize Conversation in Database
    try {
      if (!conversationId) {
        const { data: conv } = await supabase
          .from('conversations')
          .insert({
            clinic_id: clinicId,
            status: 'active',
            channel,
          })
          .select('id')
          .single();

        if (conv) {
          conversationId = conv.id;
        }
      }

      // 2. Persist Patient Message
      if (conversationId) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_type: 'patient',
          content: message,
        });
      }
    } catch {
      // Graceful degradation if DB is offline or mock
      if (!conversationId) {
        conversationId = `conv-${Date.now()}`;
      }
    }

    // 0. Safety & Guardrail Check (Prompt Injection, Jailbreaks, Medical Diagnosis, Exfiltration)
    const safetyCheck = validateInputSafety(message);
    if (!safetyCheck.isSafe && safetyCheck.safeResponse) {
      // Persist AI safety response
      try {
        if (conversationId) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_type: 'ai',
            content: safetyCheck.safeResponse,
          });
        }
      } catch {
        // Ignore DB errors on persistence
      }

      return {
        success: true,
        reply: safetyCheck.safeResponse,
        conversationId: conversationId || `conv-${Date.now()}`,
        toolCallsExecuted: [],
      };
    }

    // 3. Determine if a Controlled Tool should be invoked
    const toolCallsExecuted: { tool: string; args: Record<string, unknown>; result: { success: boolean; data?: unknown; error?: string } }[] = [];
    const plannedTool = determineToolCall(message, clinicId, history);

    let finalReply = '';

    if (plannedTool) {
      // Verify tool tenant isolation
      const tenantSecurity = validateToolTenantSecurity(clinicId, plannedTool.args);
      let toolResult: { success: boolean; data?: unknown; error?: string };

      if (!tenantSecurity.isAllowed) {
        toolResult = { success: false, error: tenantSecurity.error || 'Cross-tenant access forbidden.' };
      } else {
        // Execute the controlled tool securely server-side
        toolResult = await executeTool(plannedTool.tool, plannedTool.args);
      }

      toolCallsExecuted.push({
        tool: plannedTool.tool,
        args: plannedTool.args,
        result: toolResult,
      });

      // Format AI Response strictly based on tool result
      finalReply = formatForChannel(formatAIResponse(message, plannedTool.tool, toolResult), channel);
    } else {
      // No tool needed, generate conversational guidance
      finalReply = formatForChannel(formatAIResponse(message, null, null), channel);
    }

    // 4. Persist AI Response Message
    try {
      if (conversationId) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_type: 'ai',
          content: finalReply,
        });
      }
    } catch {
      // Ignore DB errors on persistence
    }

    return {
      success: true,
      reply: finalReply,
      conversationId: conversationId || `conv-${Date.now()}`,
      toolCallsExecuted,
    };
  };

  try {
    return await Promise.race([processTask(), timeoutPromise]);
  } catch (err: unknown) {
    if ((err as Error)?.message === 'AI_RECEPTIONIST_TIMEOUT') {
      return {
        success: false,
        reply: "I apologize, but our scheduling system is taking longer than usual to respond. Please try your request again in a moment, or ask to connect with clinic staff.",
        conversationId: incomingConvId || `conv-${Date.now()}`,
        toolCallsExecuted: [],
        error: 'AI_RECEPTIONIST_TIMEOUT',
      };
    }

    // Other API failures
    return {
      success: false,
      reply: "I am currently experiencing a temporary technical issue connecting to our clinic records. Would you like me to request assistance from a front-desk staff member for you?",
      conversationId: incomingConvId || `conv-${Date.now()}`,
      toolCallsExecuted: [],
      error: (err as Error)?.message || 'API_FAILURE',
    };
  }
}
