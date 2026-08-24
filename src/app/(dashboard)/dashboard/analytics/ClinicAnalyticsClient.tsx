'use client';

import { useState } from 'react';
import { ClinicAnalyticsData } from '@/lib/analytics/types';
import { getClinicAnalyticsAction } from '@/app/actions/analytics';
import {
  TrendingUp,
  MessageSquare,
  CalendarCheck,
  CheckCircle,
  Clock,
  Award,
  BarChart3,
  Calendar,
  Globe,
  Loader2,
} from 'lucide-react';

interface ClinicAnalyticsClientProps {
  organizationId: string;
  initialData: ClinicAnalyticsData;
}

export default function ClinicAnalyticsClient({
  organizationId,
  initialData,
}: ClinicAnalyticsClientProps) {
  const [data, setData] = useState<ClinicAnalyticsData>(initialData);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);

  const handleRangeChange = async (days: number) => {
    setTimeRange(days);
    setLoading(true);
    try {
      const res = await getClinicAnalyticsAction(organizationId, days);
      if (res.success && res.data) {
        setData(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinic Analytics</h1>
          <p className="text-sm text-slate-500">
            Real data from your AI receptionist, appointment booking funnel, and patient traffic.
          </p>
        </div>

        {/* Time range selector */}
        <div className="bg-slate-200 p-1 rounded-xl flex items-center shadow-inner">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => handleRangeChange(days)}
              disabled={loading}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === days
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {days === 7 ? 'Last 7 Days' : days === 30 ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 text-sky-600 animate-spin mr-2" />
          <span className="text-sm text-slate-600 font-medium">Updating clinic analytics...</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Conversations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Conversations</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.totalConversations}</div>
          <p className="text-xs text-slate-500">Total patient chat sessions handled</p>
        </div>

        {/* Booking Requests */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Booking Requests</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.bookingRequests}</div>
          <p className="text-xs text-slate-500">Slot requests & appointment flows started</p>
        </div>

        {/* Successful Bookings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Successful Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.successfulBookings}</div>
          <p className="text-xs text-slate-500">Confirmed & completed appointments</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Booking Conversion</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mb-1">{data.conversionRate}%</div>
          <p className="text-xs text-slate-500">Conversion from booking request to confirmed</p>
        </div>
      </div>

      {/* Appointment Status Breakdown & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Funnel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            Patient Booking Funnel
          </h3>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-medium mb-1.5">
                <span className="text-slate-700">1. Conversations Initiated</span>
                <span className="font-bold text-slate-900">{data.totalConversations} (100%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-1.5">
                <span className="text-slate-700">2. Booking Inquiries / Requests</span>
                <span className="font-bold text-slate-900">
                  {data.bookingRequests} ({data.totalConversations > 0 ? Math.round((data.bookingRequests / data.totalConversations) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full"
                  style={{
                    width: `${data.totalConversations > 0 ? Math.min(100, (data.bookingRequests / data.totalConversations) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-1.5">
                <span className="text-slate-700">3. Confirmed Bookings</span>
                <span className="font-bold text-slate-900">
                  {data.successfulBookings} ({data.totalConversations > 0 ? Math.round((data.successfulBookings / data.totalConversations) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${data.totalConversations > 0 ? Math.min(100, (data.successfulBookings / data.totalConversations) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Status Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Appointment Statuses
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
              <span className="text-xs font-semibold text-emerald-800 uppercase">Confirmed / Completed</span>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{data.appointments.confirmed + data.appointments.completed}</p>
            </div>
            <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-xl">
              <span className="text-xs font-semibold text-rose-800 uppercase">Cancellations</span>
              <p className="text-2xl font-bold text-rose-900 mt-1">{data.appointments.cancelled}</p>
            </div>
            <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-xl">
              <span className="text-xs font-semibold text-amber-800 uppercase">No-Shows</span>
              <p className="text-2xl font-bold text-amber-900 mt-1">{data.appointments.noShow}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <span className="text-xs font-semibold text-slate-600 uppercase">Platform Page Views</span>
              <p className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                {data.measuredPageViews}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Services & Busy Periods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Services */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Popular Dental Services
          </h3>

          {data.popularServices.length > 0 ? (
            <div className="space-y-4">
              {data.popularServices.map((service, idx) => (
                <div
                  key={service.serviceId}
                  className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{service.serviceName}</h4>
                      <p className="text-xs text-slate-500">{service.count} appointments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-800">${service.revenueEstimate}</span>
                    <p className="text-xs text-slate-400">Est. Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">
              No service booking data recorded in this period.
            </div>
          )}
        </div>

        {/* Busy Periods */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Busy Periods & Peak Times
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-sky-50 rounded-xl border border-sky-100">
              <span className="text-xs font-semibold text-sky-800 uppercase">Busiest Day</span>
              <p className="text-xl font-bold text-sky-950 mt-1">{data.busyPeriods.peakDay}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <span className="text-xs font-semibold text-purple-800 uppercase">Peak Booking Hour</span>
              <p className="text-xl font-bold text-purple-950 mt-1">{data.busyPeriods.peakHour}</p>
            </div>
          </div>

          {/* Day of week distribution */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">
              Day of Week Distribution
            </h4>
            <div className="grid grid-cols-7 gap-2 text-center">
              {data.busyPeriods.byDay.map((d) => (
                <div key={d.dayIndex} className="flex flex-col items-center">
                  <div className="w-full bg-slate-100 h-20 rounded-lg flex items-end justify-center p-1 overflow-hidden">
                    <div
                      className="bg-indigo-600 rounded-md w-full transition-all"
                      style={{
                        height: `${Math.max(10, Math.min(100, d.appointmentsCount * 20))}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 mt-1.5">{d.dayName.slice(0, 3)}</span>
                  <span className="text-[10px] text-slate-400">{d.appointmentsCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
