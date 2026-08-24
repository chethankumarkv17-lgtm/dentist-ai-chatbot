export interface EmergencyCheckResult {
  isEmergency: boolean;
  severity: 'none' | 'urgent' | 'critical';
  adviceText?: string;
  transferImmediately: boolean;
}

/**
 * Evaluates caller speech for life-threatening medical or severe dental emergencies.
 * Strictly adheres to non-diagnostic safety boundaries.
 */
export function evaluateVoiceEmergency(speechInput: string): EmergencyCheckResult {
  if (!speechInput) {
    return { isEmergency: false, severity: 'none', transferImmediately: false };
  }

  const text = speechInput.toLowerCase();

  // Critical life-safety signals: airway obstruction, uncontrolled hemorrhaging, severe trauma
  const criticalSignals = [
    /\b(can't breathe|cannot breathe|choking|uncontrolled bleeding|bleeding profusely|broken jaw|fractured jaw|throat closing|lost consciousness|fainted|head injury)\b/i,
  ];

  for (const regex of criticalSignals) {
    if (regex.test(text)) {
      return {
        isEmergency: true,
        severity: 'critical',
        transferImmediately: true,
        adviceText:
          'This sounds like a severe medical emergency. Please call emergency services (112 or 911) or go to the nearest emergency room immediately. I am also attempting to transfer you to our clinic staff right now.',
      };
    }
  }

  // Urgent dental signals: severe sudden throbbing pain, knocked out adult tooth, swelling spreading to eye
  const urgentSignals = [
    /\b(knocked out tooth|avulsed tooth|tooth fell out|severe swelling|eye swelling|fever and toothache|pus draining)\b/i,
  ];

  for (const regex of urgentSignals) {
    if (regex.test(text)) {
      return {
        isEmergency: true,
        severity: 'urgent',
        transferImmediately: true,
        adviceText:
          'You may need urgent dental attention. If you have a knocked-out tooth, keep it in milk or saliva and avoid touching the root. Let me transfer you directly to our front desk staff.',
      };
    }
  }

  return { isEmergency: false, severity: 'none', transferImmediately: false };
}
