import React from 'react';
import EmptyState from '@/components/dashboard/EmptyState';

export default async function StaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 capitalize">staff</h1>
      </div>
      <EmptyState title="No staff found" message="There is currently no data to display for staff." />
    </div>
  );
}