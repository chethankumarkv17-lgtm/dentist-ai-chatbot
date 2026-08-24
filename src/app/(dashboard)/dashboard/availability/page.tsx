'use client';

import React, { useState, useTransition } from 'react';
import { saveBusinessHours, addBlockedTime } from '@/app/actions/config';

export default function AvailabilityPage() {
  const clinicId = 'mock-clinic-id';
  const [isPending, startTransition] = useTransition();
  const [timezone, setTimezone] = useState('America/New_York');
  const [hours, setHours] = useState([
    { day_of_week: 1, open_time: '09:00', close_time: '17:00' },
    { day_of_week: 2, open_time: '09:00', close_time: '17:00' },
    { day_of_week: 3, open_time: '09:00', close_time: '17:00' },
    { day_of_week: 4, open_time: '09:00', close_time: '17:00' },
    { day_of_week: 5, open_time: '09:00', close_time: '17:00' },
  ]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSaveHours = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    startTransition(async () => {
      const res = await saveBusinessHours(clinicId, hours, timezone);
      if (res.success) {
        setSuccess('Business hours and timezone saved');
      } else {
        setError(res.error || 'Failed to save');
      }
    });
  };

  const handleTimeChange = (index: number, field: 'open_time' | 'close_time', value: string) => {
    const newHours = [...hours];
    newHours[index][field] = value;
    setHours(newHours);
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Availability & Hours</h1>
        <p className="text-slate-600">Set clinic working hours, timezone, and block specific dates.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Clinic Hours & Timezone</h2>
        
        <form onSubmit={handleSaveHours} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Timezone</label>
            <select 
              value={timezone} 
              onChange={e => setTimezone(e.target.value)} 
              className="w-full max-w-sm border p-2 rounded"
            >
              <option value="America/New_York">Eastern Time (US & Canada)</option>
              <option value="America/Chicago">Central Time (US & Canada)</option>
              <option value="America/Denver">Mountain Time (US & Canada)</option>
              <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
              <option value="Europe/London">London</option>
              <option value="Invalid/Timezone">Invalid Timezone (Test Error)</option>
            </select>
          </div>

          <div className="space-y-3">
            {hours.map((h, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-32 font-medium">{days[h.day_of_week]}</div>
                <input 
                  type="time" 
                  value={h.open_time} 
                  onChange={e => handleTimeChange(i, 'open_time', e.target.value)}
                  className="border p-2 rounded w-32" 
                />
                <span className="text-slate-500">to</span>
                <input 
                  type="time" 
                  value={h.close_time} 
                  onChange={e => handleTimeChange(i, 'close_time', e.target.value)}
                  className="border p-2 rounded w-32" 
                />
              </div>
            ))}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button disabled={isPending} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50">
            Save Hours
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold mb-2">Blocked Times & Holidays</h2>
        <p className="text-slate-600 text-sm mb-4">Add exceptions to standard availability (e.g. lunch breaks, vacations).</p>
        <button className="text-blue-600 font-medium hover:underline text-sm">
          + Add Time Block
        </button>
      </div>
    </div>
  );
}