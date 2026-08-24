import React from 'react';
import EmptyState from '@/components/dashboard/EmptyState';

export default async function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 capitalize">calendar</h1>
      </div>
      <EmptyState title="No calendar found" message="There is currently no data to display for calendar." />
    </div>
  );
}