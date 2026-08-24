import React from 'react';
import EmptyState from '@/components/dashboard/EmptyState';

export default async function ChatbotPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 capitalize">chatbot</h1>
      </div>
      <EmptyState title="No chatbot found" message="There is currently no data to display for chatbot." />
    </div>
  );
}