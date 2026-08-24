'use client';

import React, { useState, useTransition } from 'react';
import { saveService } from '@/app/actions/config';
import {
  Briefcase,
  Clock,
  Plus,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Shield,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface ServiceItem {
  id?: string;
  name: string;
  duration_minutes: number;
  buffer_time_minutes: number;
  price?: number;
  category?: string;
}

export default function ServicesPage() {
  const clinicId = 'mock-clinic-id';
  const [isPending, startTransition] = useTransition();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([
    {
      id: 'srv-1',
      name: 'General Dental Examination & Consultation',
      duration_minutes: 30,
      buffer_time_minutes: 15,
      price: 500,
      category: 'Diagnostic',
    },
    {
      id: 'srv-2',
      name: 'Teeth Cleaning & Scaling',
      duration_minutes: 45,
      buffer_time_minutes: 15,
      price: 1500,
      category: 'Preventive',
    },
    {
      id: 'srv-3',
      name: 'Root Canal Consultation & Rotary RCT',
      duration_minutes: 60,
      buffer_time_minutes: 15,
      price: 4500,
      category: 'Endodontics',
    },
    {
      id: 'srv-4',
      name: 'Composite Cosmetic Filling',
      duration_minutes: 45,
      buffer_time_minutes: 15,
      price: 1800,
      category: 'Restorative',
    },
    {
      id: 'srv-5',
      name: 'Dental Implant Consultation',
      duration_minutes: 45,
      buffer_time_minutes: 15,
      price: 1000,
      category: 'Implantology',
    },
  ]);
  const [message, setMessage] = useState('');

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    const fd = new FormData(e.currentTarget);
    const newService: ServiceItem = {
      name: fd.get('name') as string,
      duration_minutes: parseInt(fd.get('duration_minutes') as string, 10) || 30,
      buffer_time_minutes: parseInt(fd.get('buffer_time_minutes') as string, 10) || 15,
      price: fd.get('price') ? parseFloat(fd.get('price') as string) : undefined,
      category: (fd.get('category') as string) || 'General',
    };

    startTransition(async () => {
      const res = await saveService(clinicId, {
        ...newService,
        is_active: true,
        is_bookable: true,
      });
      if (res.success) {
        setServices([...services, newService]);
        setMessage('Treatment service added successfully!');
        setIsAddModalOpen(false);
      } else {
        setMessage('Error saving service: ' + res.error);
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Services & Treatments</h1>
            <Badge variant="pro" size="sm">AI Knowledge Synced</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Treatments, appointment durations, and pricing used by the AI Receptionist.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all touch-target"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Treatment</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((srv) => (
          <div
            key={srv.name}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">
                  {srv.category || 'General'}
                </span>
                <Badge variant="success" size="sm">Bookable</Badge>
              </div>
              <h3 className="font-bold text-base text-slate-900 leading-snug">{srv.name}</h3>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{srv.duration_minutes} mins (+{srv.buffer_time_minutes}m buffer)</span>
              </div>
              <span className="text-slate-900 font-bold text-sm">
                {srv.price ? `₹${srv.price.toLocaleString('en-IN')}` : 'Consultation'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Service Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Treatment Service"
          description="The AI receptionist uses this catalog to quote accurate prices and slot durations."
        >
          <form onSubmit={handleAdd} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Service Name</label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. Teeth Whitening & Polishing"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (mins)</label>
                <input
                  name="duration_minutes"
                  type="number"
                  required
                  defaultValue={45}
                  min={10}
                  step={5}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Buffer Time (mins)</label>
                <input
                  name="buffer_time_minutes"
                  type="number"
                  defaultValue={15}
                  min={0}
                  step={5}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                <input
                  name="price"
                  type="number"
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  name="category"
                  defaultValue="General"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="General">General</option>
                  <option value="Preventive">Preventive</option>
                  <option value="Cosmetic">Cosmetic</option>
                  <option value="Endodontics">Endodontics</option>
                  <option value="Orthodontics">Orthodontics</option>
                  <option value="Surgery">Surgery</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
              >
                {isPending ? 'Saving...' : 'Add Treatment Service'}
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}