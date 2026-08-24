'use client';

import React, { useState, useTransition } from 'react';
import { addCustomDomain, verifyDomainStatus, removeCustomDomain } from '@/app/actions/domains';
import { Globe, ShieldAlert, CheckCircle2, Loader2, Trash2 } from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  status: 'pending' | 'verifying' | 'verified' | 'failed' | 'disabled';
}

export default function DomainsPage() {
  const clinicId = 'mock-clinic-id'; // Context in real app
  const platformSubdomain = 'mock-clinic-id.dentalai.test';
  
  const [isPending, startTransition] = useTransition();
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState('');
  
  // Mocking state that would come from Server Components / DB
  const [customDomains, setCustomDomains] = useState<Domain[]>([
    // { id: '1', name: 'www.myclinic.com', status: 'pending' }
  ]);

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!newDomain.trim()) return;

    startTransition(async () => {
      const res = await addCustomDomain(clinicId, newDomain);
      if (res.success && res.domain && res.status) {
        setCustomDomains(prev => [...prev, { id: Date.now().toString(), name: res.domain!, status: res.status as Domain['status'] }]);
        setNewDomain('');
      } else {
        setError(res.error || 'Failed to add domain');
      }
    });
  };

  const handleVerify = (id: string, domainName: string) => {
    setCustomDomains(prev => prev.map(d => d.id === id ? { ...d, status: 'verifying' } : d));
    
    startTransition(async () => {
      const res = await verifyDomainStatus(domainName);
      if (res.success && res.status) {
        setCustomDomains(prev => prev.map(d => d.id === id ? { ...d, status: res.status as Domain['status'] } : d));
      } else {
        setCustomDomains(prev => prev.map(d => d.id === id ? { ...d, status: 'failed' } : d));
      }
    });
  };

  const handleRemove = (id: string, domainName: string) => {
    if (!confirm(`Are you sure you want to remove ${domainName}? Your website will no longer be accessible via this domain.`)) return;

    startTransition(async () => {
      const res = await removeCustomDomain(domainName);
      if (res.success) {
        setCustomDomains(prev => prev.filter(d => d.id !== id));
      } else {
        setError('Failed to remove domain');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Domains</h1>
        <p className="text-slate-600">Manage how patients access your platform-hosted website.</p>
      </div>

      {/* Platform Subdomain Section */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Globe className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Platform Subdomain</h2>
            <p className="text-slate-600 text-sm mb-4">
              Your free, secure subdomain provided by DentalAI. It is always active and cannot be removed.
            </p>
            <div className="flex items-center gap-3 p-3 bg-slate-50 border rounded text-slate-700 font-mono text-sm">
              <span className="flex-1">{platformSubdomain}</span>
              <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">Active</span>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Domains Section */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Custom Domains</h2>
        <p className="text-slate-600 text-sm mb-6">
          Connect a domain you already own (e.g., www.yourclinic.com) to your DentalAI website.
        </p>

        <form onSubmit={handleAddDomain} className="flex gap-3 mb-6">
          <input 
            type="text" 
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="www.yourclinic.com"
            disabled={isPending}
            className="flex-1 border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            type="submit"
            disabled={isPending || !newDomain.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Add Domain
          </button>
        </form>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded text-sm flex gap-2 items-center">
            <ShieldAlert className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {customDomains.map(domain => (
            <div key={domain.id} className="border rounded-lg overflow-hidden">
              <div className="p-4 flex items-center justify-between bg-slate-50">
                <span className="font-mono text-slate-800">{domain.name}</span>
                
                <div className="flex items-center gap-4">
                  {domain.status === 'verified' && <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Verified</span>}
                  {domain.status === 'verifying' && <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Verifying</span>}
                  {domain.status === 'pending' && <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Pending</span>}
                  {domain.status === 'failed' && <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-full">Failed</span>}
                  
                  <button 
                    onClick={() => handleRemove(domain.id, domain.name)}
                    disabled={isPending}
                    className="text-slate-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DNS Instructions for non-verified domains */}
              {domain.status !== 'verified' && (
                <div className="p-4 border-t bg-white">
                  <p className="text-sm font-medium mb-2">Please configure your DNS provider:</p>
                  
                  <div className="grid grid-cols-4 gap-4 p-3 bg-slate-100 rounded text-sm font-mono text-slate-700 mb-3">
                    <div><strong>Type</strong></div>
                    <div><strong>Name</strong></div>
                    <div className="col-span-2"><strong>Value / Target</strong></div>
                    
                    {domain.name.startsWith('www.') ? (
                      <>
                        <div>CNAME</div>
                        <div>www</div>
                        <div className="col-span-2">cname.dentalai.test</div>
                      </>
                    ) : (
                      <>
                        <div>A</div>
                        <div>@</div>
                        <div className="col-span-2">76.76.21.21</div>
                      </>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleVerify(domain.id, domain.name)}
                    disabled={isPending || domain.status === 'verifying'}
                    className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                  >
                    Check Configuration
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {customDomains.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-500">
              No custom domains configured yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
