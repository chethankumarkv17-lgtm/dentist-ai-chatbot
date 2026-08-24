import { getAllSupportTickets } from '@/lib/support/service';
import AdminSupportClient from './AdminSupportClient';

export default async function AdminSupportPage() {
  const tickets = await getAllSupportTickets();

  return <AdminSupportClient initialTickets={tickets} />;
}
