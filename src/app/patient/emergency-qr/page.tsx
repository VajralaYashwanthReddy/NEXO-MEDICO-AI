'use client';

import React from 'react';
import { PatientEmergencyQrCard } from '@/components/PatientEmergencyQrCard';
import { useAuth } from '@/context/AuthContext';
import { QrCode, ArrowLeft, ShieldCheck, HeartPulse } from 'lucide-react';
import Link from 'next/link';

export default function PatientEmergencyQrPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 text-slate-900 select-none max-w-6xl mx-auto py-4">
      {/* Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/patient/dashboard"
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-md">
                INDIA VITAL PASSPORT
              </span>
              <span className="text-xs text-slate-500 font-semibold">112 Helpline Integrated</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              My Patient Emergency QR ID
            </h1>
          </div>
        </div>

        <Link
          href="/patient/dashboard"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
        >
          Return to Medical Dashboard &rarr;
        </Link>
      </div>

      {/* Main Emergency QR Card & Privacy Controls */}
      <PatientEmergencyQrCard />
    </div>
  );
}
