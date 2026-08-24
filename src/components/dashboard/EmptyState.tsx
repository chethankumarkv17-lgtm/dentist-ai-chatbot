import React from 'react';
import { FileQuestion } from 'lucide-react';

export default function EmptyState({ title, message, actionLabel, onAction }: { title: string, message: string, actionLabel?: string, onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="bg-slate-50 text-slate-400 p-4 rounded-full mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-md mb-6">
        {message}
      </p>
      {actionLabel && (
        <button onClick={onAction} className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
