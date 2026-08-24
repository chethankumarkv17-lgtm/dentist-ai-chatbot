import React from 'react';
import EmptyState from '@/components/dashboard/EmptyState';

export default async function PatientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 capitalize">patients</h1>
      </div>
      <EmptyState title="No patients found" message="There is currently no data to display for patients." />
    </div>
  );
}