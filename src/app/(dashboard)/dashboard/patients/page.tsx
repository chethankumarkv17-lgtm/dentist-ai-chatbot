'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  MoreVertical,
  Clock,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface PatientItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastVisit: string;
  totalAppointments: number;
  status: 'active' | 'new' | 'inactive';
}

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);

  const patients: PatientItem[] = [
    {
      id: 'pat-1',
      name: 'Ananya Deshmukh',
      phone: '+91 98112 23344',
      email: 'ananya.d@gmail.com',
      lastVisit: '24 Aug 2026',
      totalAppointments: 4,
      status: 'active',
    },
    {
      id: 'pat-2',
      name: 'Rajesh Kumar',
      phone: '+91 98450 12345',
      email: 'rajesh.k@outlook.com',
      lastVisit: '24 Aug 2026',
      totalAppointments: 2,
      status: 'active',
    },
    {
      id: 'pat-3',
      name: 'Pooja Sharma',
      phone: '+91 99887 76655',
      email: 'pooja.s@yahoo.co.in',
      lastVisit: '18 Aug 2026',
      totalAppointments: 1,
      status: 'new',
    },
    {
      id: 'pat-4',
      name: 'Vikram Mehta',
      phone: '+91 97123 45678',
      email: 'vikram.m@gmail.com',
      lastVisit: '12 Aug 2026',
      totalAppointments: 6,
      status: 'active',
    },
    {
      id: 'pat-5',
      name: 'Sneha Patel',
      phone: '+91 96543 21098',
      email: 'sneha.p@techcorp.in',
      lastVisit: '01 Aug 2026',
      totalAppointments: 3,
      status: 'active',
    },
  ];

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Patient Directory</h1>
            <Badge variant="pro" size="sm">HIPAA & PII Encrypted</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered patients and booking history across Web, WhatsApp, and Voice channels.
          </p>
        </div>

        <button
          onClick={() => alert('New patients are automatically created upon scheduling appointments via any channel.')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all touch-target"
        >
          <Plus className="w-4 h-4" />
          <span>Add Patient Record</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Showing <span className="text-slate-900 font-bold">{filtered.length}</span> patient records
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-6">Patient Name</th>
              <th className="py-3.5 px-6">Phone Number</th>
              <th className="py-3.5 px-6">Email Address</th>
              <th className="py-3.5 px-6">Last Visit</th>
              <th className="py-3.5 px-6">Total Visits</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-4 px-6 font-bold text-slate-900">{p.name}</td>
                <td className="py-4 px-6 text-slate-600">{p.phone}</td>
                <td className="py-4 px-6 text-slate-500">{p.email}</td>
                <td className="py-4 px-6 text-slate-700">{p.lastVisit}</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {p.totalAppointments} visits
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => setSelectedPatient(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stack */}
      <div className="md:hidden space-y-3">
        {filtered.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedPatient(p)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-sm text-slate-900">{p.name}</p>
                <p className="text-xs text-slate-500">{p.phone}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {p.totalAppointments} visits
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Last visit: {p.lastVisit}</span>
              <span className="font-bold text-blue-600 text-[11px]">View Profile →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <Modal
          isOpen={Boolean(selectedPatient)}
          onClose={() => setSelectedPatient(null)}
          title={selectedPatient.name}
          description={`Patient ID: ${selectedPatient.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Phone:</span>
                <span className="font-bold text-slate-900">{selectedPatient.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-bold text-slate-900">{selectedPatient.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Appointment:</span>
                <span className="font-bold text-slate-900">{selectedPatient.lastVisit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Clinic Visits:</span>
                <span className="font-bold text-slate-900">{selectedPatient.totalAppointments} completed</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedPatient(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}