'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Stethoscope, Calendar, UserCheck, Pill, FlaskConical, Sparkles, ChevronRight, Clock, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DoctorDashboard() {
  const { user } = useAuth();
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
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-blue-900/40 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">Physician Clinical Portal</span>
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome, {user?.name || 'Dr. Sarah Smith'}</h1>
          <p className="text-xs text-blue-200 mt-1">Interventional Cardiology | Schedule & Clinical Workspace</p>
        </div>
        <Link
          href="/doctor/prescriptions"
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all"
        >
          <Pill className="w-4 h-4" /> Issue Digital Prescription
        </Link>
      </div>

      {/* Quick Clinical Links */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Link href="/doctor/patients" className="bg-white p-4 rounded-xl border hover:border-cyan-500 shadow-sm flex items-center gap-3 transition-all">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl"><UserCheck className="w-5 h-5" /></div>
          <div><h4 className="font-bold text-slate-800 text-sm">Patient Registry</h4><p className="text-[11px] text-slate-400">View medical timelines</p></div>
        </Link>

        <Link href="/doctor/prescriptions" className="bg-white p-4 rounded-xl border hover:border-emerald-500 shadow-sm flex items-center gap-3 transition-all">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Pill className="w-5 h-5" /></div>
          <div><h4 className="font-bold text-slate-800 text-sm">Prescription Engine</h4><p className="text-[11px] text-slate-400">With Drug Interaction Check</p></div>
        </Link>

        <Link href="/doctor/radiology" className="bg-white p-4 rounded-xl border hover:border-purple-500 shadow-sm flex items-center gap-3 transition-all">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Sparkles className="w-5 h-5" /></div>
          <div><h4 className="font-bold text-slate-800 text-sm">Medical Image AI</h4><p className="text-[11px] text-slate-400">Grad-CAM Heatmaps</p></div>
        </Link>

        <Link href="/doctor/ai-assistant" className="bg-white p-4 rounded-xl border hover:border-blue-500 shadow-sm flex items-center gap-3 transition-all">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Stethoscope className="w-5 h-5" /></div>
          <div><h4 className="font-bold text-slate-800 text-sm">AI Disease Prediction</h4><p className="text-[11px] text-slate-400">SHAP / LIME Decision Support</p></div>
        </Link>
      </div>

      {/* Today's Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-600" /> Today's Patient Schedule
          </h3>
          <span className="text-xs text-slate-500 font-medium">Real-time Appointments Queue</span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500 text-center py-6">Loading schedule...</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((apt) => (
              <div key={apt.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-3 rounded-xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center bg-cyan-50 px-3 py-1.5 rounded-xl border border-cyan-100 min-w-[70px]">
                    <Clock className="w-3.5 h-3.5 text-cyan-600 mb-0.5" />
                    <span className="text-xs font-bold text-cyan-800">{apt.timeSlot}</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-cyan-700 block">{apt.patient?.patientCode}</span>
                    <h4 className="font-bold text-slate-900 text-sm">{apt.patient?.fullName}</h4>
                    <p className="text-xs text-slate-500">Reason: {apt.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {apt.status}
                  </span>
                  <Link
                    href={`/doctor/patient/${apt.patientId}`}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-sm"
                  >
                    Open Patient Record <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
