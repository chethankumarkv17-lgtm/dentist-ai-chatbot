import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorState({ title, message }: { title?: string, message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-red-100 rounded-lg shadow-sm">
      <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title || 'Failed to load data'}</h3>
      <p className="text-slate-500 max-w-md">
        {message || 'There was an error communicating with the database. Please try again later.'}
      </p>
    </div>
  );
}
