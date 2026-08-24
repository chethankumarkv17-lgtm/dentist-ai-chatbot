import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server-auth';
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const userEmail = user.email || 'dr.smith@downtowndental.com';

  return (
    <DashboardLayoutClient userEmail={userEmail}>
      {children}
    </DashboardLayoutClient>
  );
}
