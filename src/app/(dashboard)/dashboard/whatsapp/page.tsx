import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server-auth';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'WhatsApp Integration | Radiant Nobel',
  description: 'Manage WhatsApp Business connection and templates',
};

export default async function WhatsAppPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Get user's active clinic
  const { data: userClinic } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  const orgId = userClinic?.organization_id;
  let clinicId: string | undefined;

  if (orgId) {
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, name')
      .eq('organization_id', orgId)
      .maybeSingle();
    clinicId = clinic?.id;
  }

  if (!clinicId) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Please complete clinic setup before configuring WhatsApp.</p>
      </div>
    );
  }

  // Get WhatsApp connection status
  const { data: connection } = await supabase
    .from('whatsapp_connections')
    .select('*')
    .eq('clinic_id', clinicId)
    .maybeSingle();

  // Get templates
  const { data: templates } = await supabase
    .from('whatsapp_templates')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  const isConnected = connection?.status === 'connected';
  const cleanPhone = connection?.display_phone ? connection.display_phone.replace(/[^0-9]/g, '') : '';
  const waLink = `https://wa.me/${cleanPhone}`;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">WhatsApp Business Integration</h1>
        <p className="text-gray-500">
          Connect your WhatsApp Business account to allow patients to book appointments directly through WhatsApp.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Connection Status</h2>
            <p className="text-sm text-gray-500">Manage your WhatsApp Business API connection</p>
          </div>

          {connection ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="font-medium capitalize text-gray-900">{connection.status}</span>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Phone Number ID</label>
                <input
                  type="text"
                  value={connection.phone_number_id}
                  readOnly
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Display Phone</label>
                <input
                  type="text"
                  value={connection.display_phone || ''}
                  readOnly
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                />
              </div>
              <Button variant="destructive">Disconnect</Button>

              {isConnected && cleanPhone && (
                <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">Patient Instructions</h3>
                  <p className="text-xs text-blue-700 mb-3">Share this link with patients to chat with your AI receptionist:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={waLink}
                      readOnly
                      className="w-full rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs text-gray-700"
                    />
                    <Button variant="outline" size="sm">Copy</Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">You have not connected a WhatsApp Business account yet.</p>
              <form className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Phone Number ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789012345"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">WhatsApp Business Account ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 123456789012345"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                <Button type="button">Connect Account</Button>
              </form>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Message Templates</h2>
            <p className="text-sm text-gray-500">Manage approved templates for notifications</p>
          </div>

          {!connection ? (
            <p className="text-sm text-gray-500">Connect your account first to manage templates.</p>
          ) : templates && templates.length > 0 ? (
            <div className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{template.template_name}</p>
                    <p className="text-xs text-gray-500">{template.template_language} • {template.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    template.status === 'approved' ? 'bg-green-100 text-green-800' :
                    template.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {template.status}
                  </span>
                </div>
              ))}
              <Button variant="outline" className="w-full">Sync Templates</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">No templates synced yet.</p>
              <Button variant="outline">Sync Default Templates</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
