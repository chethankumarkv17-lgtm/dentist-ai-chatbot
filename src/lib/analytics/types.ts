export interface ServicePopularity {
  serviceId: string;
  serviceName: string;
  count: number;
  revenueEstimate: number;
}

export interface DayBusyPeriod {
  dayName: string; // 'Monday', 'Tuesday', etc.
  dayIndex: number; // 0 = Sunday, 1 = Monday...
  appointmentsCount: number;
}

export interface HourBusyPeriod {
  hour: number; // 8 = 8:00 AM, 14 = 2:00 PM
  label: string; // '8 AM', '2 PM'
  appointmentsCount: number;
}

export interface ClinicAnalyticsData {
  timeRangeDays: number;
  totalConversations: number;
  bookingRequests: number;
  successfulBookings: number;
  conversionRate: number; // Percentage (e.g. 78.5)
  appointments: {
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  popularServices: ServicePopularity[];
  busyPeriods: {
    byDay: DayBusyPeriod[];
    byHour: HourBusyPeriod[];
    peakDay: string;
    peakHour: string;
  };
  measuredPageViews: number; // Only from legitimate platform site measurements
}

export interface PlatformAnalyticsData {
  timeRangeDays: number;
  totalOrganizations: number;
  activeSubscriptions: number;
  mrrEstimateUsd: number;
  arrEstimateUsd: number;
  planBreakdown: {
    starter: number;
    growth: number;
    pro: number;
  };
  platformTotalConversations: number;
  platformTotalAppointments: number;
  platformConversionRate: number;
  platformAiCostUsd: number;
}
