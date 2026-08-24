import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server-auth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = (formData.get('CallStatus') as string) || 'completed';
    const durationStr = formData.get('CallDuration') as string;
    const durationSeconds = durationStr ? parseInt(durationStr, 10) : 0;
    const minutesUsed = Math.max(1, Math.ceil(durationSeconds / 60));

    if (!callSid) {
      return NextResponse.json({ success: false, error: 'Missing CallSid' }, { status: 400 });
    }

    const supabase = createClient();

    // 1. Update voice_calls record
    const { data: callRecord } = await supabase
      .from('voice_calls')
      .update({
        status: callStatus === 'completed' ? 'completed' : 'dropped',
        duration_seconds: durationSeconds,
        end_time: new Date().toISOString(),
      })
      .eq('provider_call_id', callSid)
      .select('organization_id, clinic_id')
      .maybeSingle();

    // 2. Aggregate minutes into voice_usage for the clinic's billing month
    if (callRecord && callRecord.clinic_id && callRecord.organization_id) {
      const startOfMonthIso = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const estimatedCost = minutesUsed * 0.02; // ~$0.02 per minute telephony + AI

      await supabase.from('voice_usage').upsert({
        organization_id: callRecord.organization_id,
        clinic_id: callRecord.clinic_id,
        billing_month: startOfMonthIso,
        minutes_used: minutesUsed,
        call_count: 1,
        estimated_cost_usd: estimatedCost,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'clinic_id,billing_month' });
    }

    return NextResponse.json({ success: true, callSid, durationSeconds, minutesUsed });
  } catch (err: unknown) {
    console.error('Call status tracking error:', err);
    return NextResponse.json({ success: false, error: 'Status update failed' }, { status: 500 });
  }
}
