'use client';

import { useState } from 'react';
import { SupportTicket, TicketCategory, TicketPriority } from '@/lib/support/types';
import {
  createTicketAction,
  replyToTicketAction,
  closeTicketAction,
} from '@/app/actions/support';
import {
  LifeBuoy,
  Plus,
  Send,
  Loader2,
  User,
  ShieldCheck,
  ChevronRight,
  Lock,
} from 'lucide-react';

interface SupportClientProps {
  organizationId: string;
  initialTickets: SupportTicket[];
}

export default function SupportClient({
  organizationId,
  initialTickets,
}: SupportClientProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(
    initialTickets[0] || null
  );
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  const [creatingTicket, setCreatingTicket] = useState<boolean>(false);

  // New Ticket Form State
  const [newSubject, setNewSubject] = useState<string>('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('general');
  const [newPriority, setNewPriority] = useState<TicketPriority>('normal');
  const [newDescription, setNewDescription] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    setCreatingTicket(true);
    setErrorMsg(null);
    try {
      const res = await createTicketAction({
        organizationId,
        subject: newSubject,
        description: newDescription,
        category: newCategory,
        priority: newPriority,
      });

      if (res.success && res.ticket) {
        setTickets((prev) => [res.ticket as SupportTicket, ...prev]);
        setActiveTicket(res.ticket as SupportTicket);
        setShowCreateModal(false);
        setNewSubject('');
        setNewDescription('');
      } else {
        setErrorMsg(res.error || 'Failed to create ticket');
      }
    } catch {
      setErrorMsg('An unexpected error occurred');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeTicket || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await replyToTicketAction(activeTicket.id, replyText, organizationId, false);
      if (res.success) {
        const newMessage = {
          id: `msg-${Date.now()}`,
          ticketId: activeTicket.id,
          senderRole: 'customer' as const,
          message: replyText,
          createdAt: new Date().toISOString(),
        };

        const updated = {
          ...activeTicket,
          status: 'in_progress' as const,
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

  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    if (!confirm('Are you sure you want to mark this support ticket as closed?')) return;

    try {
      const res = await closeTicketAction(activeTicket.id, organizationId, false);
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
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinic Customer Support</h1>
          <p className="text-sm text-slate-500">
            Submit inquiries, report technical issues, or request configuration help from our engineering team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Support Ticket
        </button>
      </div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Tickets List */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[650px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 font-bold text-xs text-slate-700 uppercase tracking-wider">
            Your Support Requests ({tickets.length})
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {tickets.length > 0 ? (
              tickets.map((ticket) => {
                const isActive = activeTicket?.id === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setActiveTicket(ticket)}
                    className={`w-full text-left p-4 transition-all flex items-start justify-between ${
                      isActive ? 'bg-sky-50/70 border-l-4 border-sky-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 line-clamp-1">
                          {ticket.subject}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{ticket.description}</p>
                      <div className="flex items-center gap-2 pt-1 text-[11px]">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {ticket.category.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No support tickets found. Click &quot;New Support Ticket&quot; to reach our team.
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Ticket Thread Viewer */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[650px] overflow-hidden">
          {activeTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{activeTicket.subject}</h3>
                    {activeTicket.status === 'open' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                        Open
                      </span>
                    )}
                    {activeTicket.status === 'in_progress' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                        In Progress
                      </span>
                    )}
                    {activeTicket.status === 'waiting' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        Waiting for Support
                      </span>
                    )}
                    {activeTicket.status === 'resolved' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        Resolved
                      </span>
                    )}
                    {activeTicket.status === 'closed' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    Category: <span className="font-semibold text-slate-700 capitalize">{activeTicket.category}</span> • Priority: <span className="font-semibold text-slate-700 capitalize">{activeTicket.priority}</span>
                  </div>
                </div>

                {activeTicket.status !== 'closed' && (
                  <button
                    type="button"
                    onClick={handleCloseTicket}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
                  >
                    Close Ticket
                  </button>
                )}
              </div>

              {/* Message History */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {/* Initial Description */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <User className="w-3.5 h-3.5" />
                    <span>Clinic Request</span>
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
                            <span className="text-purple-900">Radiant Nobel Support Specialist</span>
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

              {/* Reply Input */}
              {activeTicket.status !== 'closed' ? (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Type your reply to customer support..."
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={submittingReply || !replyText.trim()}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
                  >
                    {submittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Reply
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
                Select a ticket on the left or create a new support ticket to connect with our team.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Create Support Ticket</h3>
            <p className="text-xs text-slate-500 mb-6">
              Our engineering team responds to all clinic inquiries in under 2 hours.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Issue connecting Google Calendar for Dr. Smith"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="ai_receptionist">AI Receptionist</option>
                    <option value="calendar_sync">Calendar Sync</option>
                    <option value="widget">Chat Widget</option>
                    <option value="billing">Billing & Plans</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description / Error Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Please describe the question, error message, or configuration steps..."
                  className="w-full p-3.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket || !newSubject.trim() || !newDescription.trim()}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  {creatingTicket && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
