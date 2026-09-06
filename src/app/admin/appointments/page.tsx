'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, UserCheck, Plus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AppointmentsManagementPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => setAppointments(data.appointments || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cyan-600" /> Hospital Appointments Scheduling
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View upcoming patient appointments, time slots, and doctor assignments
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading appointments schedule...</p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-4">Appointment Code</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Date & Time Slot</th>
                <th className="p-4">Department & Doctor</th>
                <th className="p-4">Type / Reason</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <span className="font-extrabold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                      {apt.appointmentCode}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-900 block text-sm">{apt.patient?.fullName}</span>
                    <span className="text-slate-400 text-[11px]">{apt.patient?.patientCode}</span>
                  </td>
                  <td className="p-4 text-slate-700">
                    <span className="font-bold block">{apt.date}</span>
                    <span className="text-slate-500 text-[11px] font-mono">{apt.timeSlot}</span>
                  </td>
                  <td className="p-4 text-slate-600">
                    <span className="font-semibold text-slate-800 block">{apt.department?.name || 'General'}</span>
                  </td>
                  <td className="p-4 text-slate-600">
                    <span className="font-medium text-slate-800 block">{apt.reason}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{apt.type}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
