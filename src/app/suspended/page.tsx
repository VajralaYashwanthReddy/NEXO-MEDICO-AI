'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Mail, Phone, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SuspendedHospitalPage() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-md w-full bg-slate-900 border border-rose-900/60 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-rose-600/20 text-rose-500 border border-rose-500/30 shadow-lg shadow-rose-900/40">
          <ShieldAlert className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-extrabold tracking-widest uppercase text-rose-500 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-800">
            Tenant Access Suspended
          </span>
          <h1 className="text-2xl font-black text-white mt-2">
            Hospital Account Suspended
          </h1>
          <p className="text-sm font-semibold text-rose-200/90 leading-relaxed pt-2">
            Your hospital account has been suspended. Please contact the platform administrator for assistance.
          </p>
        </div>

        {user?.hospitalName && (
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl text-left text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Hospital Organization</span>
            <div className="flex items-center gap-2 text-slate-300 font-extrabold">
              <Building2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{user.hospitalName}</span>
            </div>
          </div>
        )}

        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-left text-xs space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Platform Support Contacts</span>
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
            <a href="mailto:support@nexomedico.ai" className="hover:text-cyan-300 underline font-mono text-[11px]">
              support@nexomedico.ai
            </a>
          </div>
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-[11px]">+1 (800) 555-NEXO</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign In with Different Account
          </button>
        </div>
      </div>
    </div>
  );
}
