import { Metadata } from 'next';
import { createClient, getCurrentUser } from '@/lib/supabase/server-auth';
import { redirect } from 'next/navigation';
import { getOrganizationEntitlements } from '@/lib/billing/entitlements';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Voice Receptionist | Radiant Nobel',
  description: 'Manage 24/7 AI Voice Phone Receptionist and call routing',
};

export default async function VoiceDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = createClient();

  // Get active organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  let orgId = member?.organization_id;

  if (!orgId) {
    const { data: defaultOrg } = await supabase.from('organizations').select('id').limit(1).maybeSingle();
    orgId = defaultOrg?.id || 'org-1';
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name')
    .eq('organization_id', orgId)
    .maybeSingle();

  const clinicId = clinic?.id;

  // Server-Side Entitlement Check
  const entitlements = await getOrganizationEntitlements(orgId);
  const isVoiceEligible = entitlements.isEntitled('voiceAgent');

  // Fetch Voice Connection & Calls if eligible
  let connection = null;
  let recentCalls: Record<string, unknown>[] = [];

  if (clinicId && isVoiceEligible) {
    const { data: conn } = await supabase
      .from('voice_connections')
      .select('*')
      .eq('clinic_id', clinicId)
      .maybeSingle();
    connection = conn;

    const { data: calls } = await supabase
      .from('voice_calls')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
      .limit(10);
    recentCalls = calls || [];
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">AI Voice Phone Receptionist</h1>
          <p className="text-gray-500 text-sm">
            24/7 autonomous phone scheduling, natural voice conversations, and intelligent front-desk call transfers.
          </p>
        </div>
        <div>
          {isVoiceEligible ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              Pro Plan • Voice Active
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              Pro Feature • Upgrade Required
            </span>
          )}
        </div>
      </div>

      {!isVoiceEligible ? (
        /* NON-ELIGIBLE UPGRADE BANNER */
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-8 shadow-sm text-center md:text-left">
          <div className="max-w-3xl">
            <div className="inline-flex p-3 rounded-xl bg-amber-100 text-amber-800 mb-4 font-bold text-lg">
              📞 Premium Telephony Feature
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Automate Inbound Clinic Calls with 24/7 AI Voice
            </h2>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Never miss an after-hours patient call or emergency. The AI Voice Receptionist answers phone calls in under 2 rings, verifies real-time dentist availability, books appointments without double-booking, and forwards complex inquiries directly to your staff.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 shadow-sm transition"
              >
                Upgrade to Pro Plan (₹11,999/mo)
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 transition"
              >
                View Plan Comparison
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* PRO/PREMIUM ELIGIBLE DASHBOARD */
        <div className="space-y-6">
          {/* Usage Gauges */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Minutes Quota</span>
              <p className="text-2xl font-bold text-gray-900 mt-2">{entitlements.voiceMinutesLimit} mins/mo</p>
              <p className="text-xs text-gray-500 mt-1">Included in Pro Enterprise plan</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Minutes Used This Month</span>
              <p className="text-2xl font-bold text-blue-600 mt-2">{entitlements.voiceMinutesUsed} mins</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{
                    width: `${Math.min(100, (entitlements.voiceMinutesUsed / Math.max(1, entitlements.voiceMinutesLimit)) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Minutes Remaining</span>
              <p className="text-2xl font-bold text-green-600 mt-2">{entitlements.voiceMinutesRemaining} mins</p>
              <p className="text-xs text-gray-500 mt-1">Resets next billing cycle</p>
            </div>
          </div>

          {/* Configuration & Setup */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Voice Agent Persona & Routing</h3>
              <p className="text-xs text-gray-500 mb-4">Configure natural speech parameters and front-desk transfer rules.</p>

              <form className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Agent Name</label>
                  <input
                    type="text"
                    defaultValue={connection?.agent_name || 'Sarah'}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Inbound Phone Number</label>
                  <input
                    type="text"
                    defaultValue={connection?.phone_number || '+91 80 4719 2831'}
                    readOnly
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Front Desk Transfer Phone (Human Escalation)</label>
                  <input
                    type="tel"
                    defaultValue={connection?.human_transfer_phone || '+919876543210'}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Voice Persona</label>
                  <select
                    defaultValue={connection?.voice_persona || 'nova'}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800"
                  >
                    <option value="nova">Nova (Warm & Professional Indian English)</option>
                    <option value="aditi">Aditi (Polly Natural Bilingual English/Hindi)</option>
                    <option value="alloy">Alloy (Clear Healthcare Neutral)</option>
                    <option value="shimmer">Shimmer (Friendly Clinic Host)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Initial Phone Greeting</label>
                  <textarea
                    rows={2}
                    defaultValue={
                      connection?.greeting ||
                      'Thank you for calling Radiant Dental. I am Sarah, the AI receptionist. How can I assist you with scheduling or clinic inquiries today?'
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800"
                  />
                </div>
                <button
                  type="button"
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                >
                  Save Voice Configuration
                </button>
              </form>
            </div>

            {/* Recent Call Records */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Recent Call History</h3>
              <p className="text-xs text-gray-500 mb-4">Live telephony call metadata and scheduling outcomes.</p>

              {recentCalls.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-gray-500 text-xs">
                  No phone calls received yet. Dial your clinic number above to test the AI voice receptionist.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCalls.map((call) => (
                    <div key={call.id as string} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 text-xs">
                      <div>
                        <p className="font-semibold text-gray-900">{call.caller_phone as string}</p>
                        <p className="text-gray-500 mt-0.5">{call.duration_seconds as number} seconds • {new Date(call.start_time as string).toLocaleTimeString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        call.outcome === 'booking_completed' ? 'bg-green-100 text-green-800' :
                        call.outcome === 'human_transferred' ? 'bg-purple-100 text-purple-800' :
                        call.outcome === 'emergency_escalated' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {(call.outcome as string).replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
