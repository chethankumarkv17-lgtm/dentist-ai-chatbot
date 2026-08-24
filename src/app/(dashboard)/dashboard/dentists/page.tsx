'use client';

import React from 'react';

export default function DentistsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dentists</h1>
          <p className="text-slate-600">Manage practitioners and their individual schedules.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
          Add Dentist
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div>
            <h3 className="font-semibold text-lg">Dr. Jane Smith</h3>
            <p className="text-slate-500 text-sm">General Dentistry</p>
          </div>
          <div className="flex gap-2">
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Active</span>
            <button className="text-blue-600 text-sm font-medium">Edit</button>
          </div>
        </div>
        <div className="text-sm text-slate-600">
          <p><strong>Bio:</strong> Experienced general dentist specializing in preventative care.</p>
          <p className="mt-2"><strong>Custom Schedule:</strong> No</p>
        </div>
      </div>
    </div>
  );
}