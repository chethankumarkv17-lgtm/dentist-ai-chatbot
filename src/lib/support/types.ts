export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TicketCategory = 'billing' | 'ai_receptionist' | 'calendar_sync' | 'widget' | 'general';
export type MessageSenderRole = 'customer' | 'admin';

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId?: string;
  senderName?: string;
  senderRole: MessageSenderRole;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  organizationId: string;
  organizationName?: string;
  createdBy?: string;
  createdByName?: string;
  assignedTo?: string;
  assignedToName?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  messages?: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  updatedAt: string;
}
