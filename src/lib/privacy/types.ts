export interface RetentionPolicy {
  appointmentDays: number; // e.g. 90, 180, 365, 2555 (7 yrs)
  transcriptDays: number; // e.g. 30, 60, 90, 365
  analyticsDays: number; // e.g. 90, 180, 365
}

export type DeletionType = 'patient_erasure' | 'account_deletion' | 'organization_deletion';
export type DeletionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DeletionRequest {
  id: string;
  organizationId?: string;
  requestedBy?: string;
  requestType: DeletionType;
  targetIdentifier: string;
  status: DeletionStatus;
  details?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

export interface ClinicExportData {
  exportDate: string;
  organization: {
    id: string;
    name: string;
    createdAt: string;
    retentionPolicy: RetentionPolicy;
  };
  clinics: {
    id: string;
    name: string;
    timezone: string;
    address?: string;
    phone?: string;
  }[];
  services: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number;
  }[];
  dentists: {
    id: string;
    name: string;
    specialty?: string;
  }[];
  appointments: {
    id: string;
    serviceId: string;
    dentistId: string;
    startTime: string;
    endTime: string;
    status: string;
    createdAt: string;
  }[];
  conversationsCount: number;
  supportTicketsCount: number;
}
