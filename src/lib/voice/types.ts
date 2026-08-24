export type VoiceConnectionStatus = 'not_connected' | 'pending' | 'connected' | 'disabled' | 'error';
export type VoiceCallStatus = 'in_progress' | 'completed' | 'transferred' | 'failed' | 'dropped';
export type VoiceCallOutcome =
  | 'ai_handled'
  | 'human_requested'
  | 'human_transferred'
  | 'booking_completed'
  | 'info_provided'
  | 'call_ended'
  | 'emergency_escalated';

export interface VoiceConnectionConfig {
  id?: string;
  clinicId: string;
  phoneNumber?: string;
  provider: 'twilio' | 'exotel' | 'custom';
  providerPhoneSid?: string;
  status: VoiceConnectionStatus;
  agentName: string;
  greeting: string;
  voicePersona: 'nova' | 'alloy' | 'echo' | 'shimmer' | 'fable' | 'onyx' | 'aditi' | 'raveena';
  language: string;
  humanTransferPhone?: string;
  maxDurationSeconds: number;
}

export interface InboundCallParams {
  CallSid: string;
  From: string;
  To: string;
  CallStatus?: string;
  SpeechResult?: string;
  Confidence?: string;
  Digits?: string;
}

export interface VoiceSessionState {
  callSid: string;
  clinicId: string;
  organizationId: string;
  callerPhone: string;
  verifiedPatientId?: string;
  verificationLevel: 'none' | 'partial' | 'verified';
  startTimeIso: string;
  conversationId?: string;
  turns: number;
  durationSeconds: number;
}
