'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function DoctorAppointmentsPage() {
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
            <Calendar className="w-6 h-6 text-blue-600" /> Physician Schedule & Patient Consultations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View your assigned patient consultation appointments, scheduled time slots, and medical complaints
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading doctor schedule...</p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b font-bold text-xs text-slate-700">Scheduled Clinical Encounters</div>
          <div className="divide-y divide-slate-100 p-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-3 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 text-center min-w-[70px]">
                    <Clock className="w-3.5 h-3.5 text-blue-600 mx-auto mb-0.5" />
                    <span className="text-xs font-bold text-blue-800">{apt.timeSlot}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-700 block">{apt.patient?.patientCode}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{apt.patient?.fullName}</h4>
                    <p className="text-xs text-slate-500">Reason: {apt.reason}</p>
                  </div>
                </div>

                <Link
                  href={`/doctor/patient/${apt.patientId}`}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow"
                >
                  Open Record <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
