'use client';

import { useState } from 'react';
import { SupportTicket, TicketStatus } from '@/lib/support/types';
import {
  replyToTicketAction,
  closeTicketAction,
  adminAssignTicketAction,
  adminUpdateTicketStatusAction,
} from '@/app/actions/support';
import {
  LifeBuoy,
  Send,
  Loader2,
  User,
  ShieldCheck,
  Building2,
  Lock,
  UserCheck,
} from 'lucide-react';

interface AdminSupportClientProps {
  initialTickets: SupportTicket[];
}

export default function AdminSupportClient({ initialTickets }: AdminSupportClientProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(initialTickets[0] || null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTickets = statusFilter === 'all'
    ? tickets
    : tickets.filter((t) => t.status === statusFilter);

  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await replyToTicketAction(activeTicket.id, replyText, undefined, true);
      if (res.success) {
        const newMessage = {
          id: `msg-${Date.now()}`,
          ticketId: activeTicket.id,
          senderRole: 'admin' as const,
          message: replyText,
          createdAt: new Date().toISOString(),
        };

        const updated = {
          ...activeTicket,
          status: 'waiting' as const,
          messages: [...(activeTicket.messages || []), newMessage],
        };

        setActiveTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updated : t)));
        setReplyText('');
      }
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!activeTicket) return;

    try {
      const res = await adminUpdateTicketStatusAction(activeTicket.id, newStatus);
      if (res.success) {
        const updated = { ...activeTicket, status: newStatus };
        setActiveTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updated : t)));
      }
    } catch {
      // Fallback
    }
  };

  const handleAssignToSelf = async () => {
    if (!activeTicket) return;

    try {
      const res = await adminAssignTicketAction(activeTicket.id, 'admin-1');
      if (res.success) {
        const updated = {
          ...activeTicket,
          assignedTo: 'admin-1',
          status: 'in_progress' as const,
        };
        setActiveTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updated : t)));
      }
    } catch {
      // Fallback
    }
  };

  const handleClose = async () => {
    if (!activeTicket) return;
    try {
      const res = await closeTicketAction(activeTicket.id, undefined, true);
      if (res.success) {
        const updated = { ...activeTicket, status: 'closed' as const };
        setActiveTicket(updated);
        setTickets((prev) => prev.map((t) => (t.id === activeTicket.id ? updated : t)));
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Desk & Inquiries</h1>
          <p className="text-sm text-slate-500">
            Manage, assign, and respond to support tickets across all dental clinics on the platform.
          </p>
        </div>

        {/* Status Filters */}
        <div className="bg-slate-200 p-1 rounded-xl flex items-center shadow-inner">
          {['all', 'open', 'in_progress', 'waiting', 'resolved', 'closed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Support Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Tickets Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[700px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Tickets Queue ({filteredTickets.length})
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => {
                const isActive = activeTicket?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setActiveTicket(ticket)}
                    className={`w-full text-left p-4 transition-all flex flex-col space-y-1.5 ${
                      isActive ? 'bg-purple-50/70 border-l-4 border-purple-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 line-clamp-1">
                        {ticket.subject}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          ticket.status === 'open'
                            ? 'bg-sky-100 text-sky-800'
                            : ticket.status === 'in_progress'
                            ? 'bg-indigo-100 text-indigo-800'
                            : ticket.status === 'waiting'
                            ? 'bg-amber-100 text-amber-800'
                            : ticket.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{ticket.organizationName || 'Dental Clinic'}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="capitalize">{ticket.category}</span>
                      <span>•</span>
                      <span className="capitalize font-semibold text-rose-600">
                        {ticket.priority} priority
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No tickets matching &quot;{statusFilter}&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Ticket Thread & Actions */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[700px] overflow-hidden">
          {activeTicket ? (
            <>
              {/* Ticket Control Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/40 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{activeTicket.subject}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{activeTicket.organizationName}</span>
                      <span>({activeTicket.organizationId})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAssignToSelf}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg transition-all"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {activeTicket.assignedTo ? 'Assigned' : 'Assign to Me'}
                    </button>
                    {activeTicket.status !== 'closed' && (
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Selector */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 pt-1">
                  <span>Status:</span>
                  {(['open', 'in_progress', 'waiting', 'resolved', 'closed'] as TicketStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                        activeTicket.status === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {/* Initial Description */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-600" />
                    <span>Clinic Owner Inquiry</span>
                    <span className="text-slate-400 font-normal ml-auto">
                      {activeTicket.createdAt ? new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{activeTicket.description}</p>
                </div>

                {/* Replies */}
                {(activeTicket.messages || []).map((msg, i) => {
                  const isAdmin = msg.senderRole === 'admin';
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl space-y-2 ${
                        isAdmin
                          ? 'bg-purple-50/70 border border-purple-100 ml-6'
                          : 'bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-bold">
                        {isAdmin ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span className="text-purple-900">Admin Staff Reply</span>
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-slate-600" />
                            <span className="text-slate-800">Clinic Owner</span>
                          </>
                        )}
                        <span className="text-slate-400 font-normal ml-auto">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  );
                })}
              </div>

              {/* Staff Reply Box */}
              {activeTicket.status !== 'closed' ? (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Reply to clinic as platform administrator..."
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={submittingReply || !replyText.trim()}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
                  >
                    {submittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Reply as Staff
                  </button>
                </div>
              ) : (
                <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  This support ticket is closed.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <LifeBuoy className="w-10 h-10 text-slate-300 mb-3" />
              <h4 className="font-semibold text-slate-700 text-sm">No Ticket Selected</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Select a support ticket from the queue on the left to view customer conversation and reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
