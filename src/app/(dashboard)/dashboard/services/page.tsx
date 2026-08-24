'use client';

import React, { useState, useTransition } from 'react';
import { saveService } from '@/app/actions/config';

export default function ServicesPage() {
  const clinicId = 'mock-clinic-id';
  const [isPending, startTransition] = useTransition();
  const [services, setServices] = useState<{name: string, duration_minutes: number, buffer_time_minutes: number, price?: number}[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      duration_minutes: parseInt(fd.get('duration_minutes') as string, 10),
      buffer_time_minutes: parseInt(fd.get('buffer_time_minutes') as string, 10) || 0,
      price: fd.get('price') ? parseFloat(fd.get('price') as string) : undefined,
      is_active: true,
      is_bookable: true,
    };

    startTransition(async () => {
      const res = await saveService(clinicId, data);
      if (res.success && res.data) {
        setServices([...services, res.data]);
        setSuccess('Service added successfully');
      } else {
        setError(res.error || 'Failed to add service');
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Services</h1>
        <p className="text-slate-600">Manage your clinic treatments and durations.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Add New Service</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Service Name</label>
            <input name="name" type="text" required className="w-full border p-2 rounded" placeholder="e.g. Teeth Whitening" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <input name="duration_minutes" type="number" required min="1" className="w-full border p-2 rounded" placeholder="60" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Buffer Time (minutes)</label>
            <input name="buffer_time_minutes" type="number" min="0" defaultValue="15" className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price (Optional)</label>
            <input name="price" type="number" min="0" step="0.01" className="w-full border p-2 rounded" placeholder="199.99" />
          </div>
          
          <div className="col-span-2 mt-2">
            <button disabled={isPending} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50">
              Save Service
            </button>
          </div>
        </form>
        {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
        {success && <p className="text-green-600 mt-4 text-sm">{success}</p>}
      </div>

      <div className="space-y-4">
        {services.map((s, i) => (
          <div key={i} className="bg-white p-4 rounded border flex justify-between items-center">
            <div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-slate-500">{s.duration_minutes}m duration • {s.buffer_time_minutes}m buffer</p>
            </div>
            {s.price && <div className="font-medium">${s.price}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}