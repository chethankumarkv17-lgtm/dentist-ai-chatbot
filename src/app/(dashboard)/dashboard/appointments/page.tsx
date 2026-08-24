'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreVertical,
  Plus,
  Phone,
  MessageSquare,
  Globe,
} from 'lucide-react';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface AppointmentItem {
  id: string;
  patientName: string;
  patientPhone: string;
  dentistName: string;
  service: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  channel: 'widget' | 'whatsapp' | 'voice';
}

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  const appointments: AppointmentItem[] = [
    {
      id: 'apt-101',
      patientName: 'Ananya Deshmukh',
      patientPhone: '+91 98112 23344',
      dentistName: 'Dr. Rahul Deshpande',
      service: 'Teeth Cleaning & Scaling',
      date: 'Today, 24 Aug',
      time: '11:00 AM - 11:45 AM',
      status: 'confirmed',
      channel: 'whatsapp',
    },
    {
      id: 'apt-102',
      patientName: 'Rajesh Kumar',
      patientPhone: '+91 98450 12345',
      dentistName: 'Dr. Priya Sharma',
      service: 'Root Canal Consultation',
      date: 'Today, 24 Aug',
      time: '02:00 PM - 02:30 PM',
      status: 'confirmed',
      channel: 'voice',
    },
    {
      id: 'apt-103',
      patientName: 'Pooja Sharma',
      patientPhone: '+91 99887 76655',
      dentistName: 'Dr. Rahul Deshpande',
      service: 'Composite Filling',
      date: 'Today, 24 Aug',
      time: '04:15 PM - 05:00 PM',
      status: 'pending',
      channel: 'widget',
    },
    {
      id: 'apt-104',
      patientName: 'Vikram Mehta',
      patientPhone: '+91 97123 45678',
      dentistName: 'Dr. Priya Sharma',
      service: 'Orthodontic Alignment Check',
      date: 'Tomorrow, 25 Aug',
      time: '10:00 AM - 10:30 AM',
      status: 'confirmed',
      channel: 'whatsapp',
    },
    {
      id: 'apt-105',
      patientName: 'Sneha Patel',
      patientPhone: '+91 96543 21098',
      dentistName: 'Dr. Rahul Deshpande',
      service: 'Dental X-Ray & Exam',
      date: 'Yesterday, 23 Aug',
      time: '03:00 PM - 03:30 PM',
      status: 'completed',
      channel: 'voice',
    },
  ];

  const filtered = appointments.filter((apt) => {
    const matchesTab = activeTab === 'all' || apt.status === activeTab;
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientPhone.includes(searchQuery) ||
      apt.service.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadgeVariant = (status: AppointmentItem['status']): BadgeVariant => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Appointments</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time appointment schedule across Website, WhatsApp, and Voice channels.
          </p>
        </div>

        <button
          onClick={() => alert('To create an appointment, test the live chatbot or schedule directly in Calendar.')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all touch-target"
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap touch-target ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, phone, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>
      </div>

      {/* Desktop Table View (>= 768px) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">Patient</th>
              <th className="py-3.5 px-6">Service & Dentist</th>
              <th className="py-3.5 px-6">Schedule Time</th>
              <th className="py-3.5 px-6">Channel</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.map((apt) => (
              <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-900">{apt.patientName}</p>
                  <p className="text-slate-500 text-[11px]">{apt.patientPhone}</p>
                </td>
                <td className="py-4 px-6">
                  <p className="font-semibold text-slate-800">{apt.service}</p>
                  <p className="text-slate-400 text-[11px]">{apt.dentistName}</p>
                </td>
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-900">{apt.date}</p>
                  <p className="text-slate-500 text-[11px]">{apt.time}</p>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                    {apt.channel === 'voice' && <Phone className="w-3 h-3 text-purple-600" />}
                    {apt.channel === 'whatsapp' && <MessageSquare className="w-3 h-3 text-green-600" />}
                    {apt.channel === 'widget' && <Globe className="w-3 h-3 text-blue-600" />}
                    <span>{apt.channel}</span>
                  </span>
                </td>
                <td className="py-4 px-6">
                  <Badge variant={getStatusBadgeVariant(apt.status)} size="sm">
                    {apt.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => setSelectedAppointment(apt)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stack View (< 768px) - Zero Horizontal Overflow */}
      <div className="md:hidden space-y-3">
        {filtered.map((apt) => (
          <div
            key={apt.id}
            onClick={() => setSelectedAppointment(apt)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-sm text-slate-900">{apt.patientName}</p>
                <p className="text-xs text-slate-500">{apt.service}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(apt.status)} size="sm">
                {apt.status.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{apt.date} • {apt.time.split('-')[0]}</span>
              </div>
              <span className="text-[11px] font-bold text-blue-600">Details →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detail View */}
      {selectedAppointment && (
        <Modal
          isOpen={Boolean(selectedAppointment)}
          onClose={() => setSelectedAppointment(null)}
          title="Appointment Details"
          description={`Reference ID: ${selectedAppointment.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.patientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.service}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dentist:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.dentistName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Schedule:</span>
                <span className="font-bold text-slate-900">{selectedAppointment.date}, {selectedAppointment.time}</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  alert('Appointment confirmed with zero double-booking lock.');
                  setSelectedAppointment(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
              >
                Confirm Booking
              </button>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}