'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export function PrintEmergencyProfileButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 border border-slate-700 shadow-md transition-all active:scale-95 cursor-pointer w-full sm:w-auto"
      title="Print or Save Emergency Profile as PDF"
    >
      <Printer className="w-4 h-4 text-cyan-400" /> Save / Print Emergency Summary
    </button>
  );
}
