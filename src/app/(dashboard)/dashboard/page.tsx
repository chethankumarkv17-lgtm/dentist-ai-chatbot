import React from 'react';
import { createClient, getCurrentUser } from '@/lib/supabase/server-auth';
import ErrorState from '@/components/dashboard/ErrorState';
import { Calendar, Users, MessageCircle, TrendingUp, XCircle, Clock, AlertCircle } from 'lucide-react';

export default async function DashboardOverview() {
  const user = await getCurrentUser();

  if (!user) {
    return <ErrorState title="Unauthorized" message="You must be logged in to view this page." />;
  }

  const supabase = createClient();
  let metrics = null;

  try {
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const orgId = member?.organization_id;
    let clinicId: string | undefined;

    if (orgId) {
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('organization_id', orgId)
        .maybeSingle();
      clinicId = clinic?.id;
    }

    if (clinicId) {

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      { count: todayCount },
      { count: upcomingCount },
      { count: newPatientsCount },
      { count: cancellationsCount },
      { count: chatCount }
    ] = await Promise.all([
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('start_time', today.toISOString()).lt('start_time', tomorrow.toISOString()).neq('status', 'cancelled'),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('start_time', tomorrow.toISOString()).neq('status', 'cancelled'),
      supabase.from('patients').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('created_at', today.toISOString()),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).eq('status', 'cancelled').gte('updated_at', today.toISOString()),
      supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('created_at', today.toISOString()),
    ]);
    
      metrics = { todayCount, upcomingCount, newPatientsCount, cancellationsCount, chatCount };
    }
  } catch {
    // Graceful fallback when DB is missing
    metrics = null;
  }

  if (metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-600">Welcome back. Here is what is happening at your clinic today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <MetricCard title="Today's Appointments" value={metrics.todayCount || 0} icon={Calendar} color="bg-blue-50 text-blue-600" />
          <MetricCard title="Upcoming Appointments" value={metrics.upcomingCount || 0} icon={Clock} color="bg-indigo-50 text-indigo-600" />
          <MetricCard title="New Patients" value={metrics.newPatientsCount || 0} icon={Users} color="bg-emerald-50 text-emerald-600" />
          <MetricCard title="Cancellations Today" value={metrics.cancellationsCount || 0} icon={XCircle} color="bg-red-50 text-red-600" />
          <MetricCard title="AI Conversations" value={metrics.chatCount || 0} icon={MessageCircle} color="bg-purple-50 text-purple-600" />
          <MetricCard title="Booking Requests" value={(metrics.todayCount || 0) + (metrics.upcomingCount || 0)} icon={TrendingUp} color="bg-amber-50 text-amber-600" />
        </div>
      </div>
    );
  }

  // Fallback JSX
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-600">Welcome back. Here is what is happening at your clinic today.</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">Database connection is currently unavailable. Displaying demo metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <MetricCard title="Today's Appointments" value={14} icon={Calendar} color="bg-blue-50 text-blue-600" />
        <MetricCard title="Upcoming Appointments" value={82} icon={Clock} color="bg-indigo-50 text-indigo-600" />
        <MetricCard title="New Patients" value={3} icon={Users} color="bg-emerald-50 text-emerald-600" />
        <MetricCard title="Cancellations Today" value={1} icon={XCircle} color="bg-red-50 text-red-600" />
        <MetricCard title="AI Conversations" value={45} icon={MessageCircle} color="bg-purple-50 text-purple-600" />
        <MetricCard title="Booking Requests" value={18} icon={TrendingUp} color="bg-amber-50 text-amber-600" />
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: React.ElementType, color: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
      <div className={`p-4 rounded-lg ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
