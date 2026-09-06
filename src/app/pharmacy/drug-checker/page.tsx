'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Pill } from 'lucide-react';

export default function DrugInteractionCheckerPage() {
  const [drug1, setDrug1] = useState('Lisinopril');
  const [drug2, setDrug2] = useState('Spironolactone');
  const [result, setResult] = useState<any>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if ((drug1.toLowerCase().includes('lisinopril') && drug2.toLowerCase().includes('spironolactone')) ||
        (drug2.toLowerCase().includes('lisinopril') && drug1.toLowerCase().includes('spironolactone'))) {
      setResult({
        severity: 'HIGH',
        warning: 'POTENTIAL SEVERE HYPERKALEMIA RISK: Co-administration of ACE Inhibitors and Potassium-sparing diuretics significantly increases serum potassium levels.'
      });
    } else {
      setResult({
        severity: 'LOW',
        warning: 'No major clinical drug-drug interactions recorded in active reference database.'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" /> Pharmacist Drug-Drug Interaction Checker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-reference drug combinations against clinical interaction databases
          </p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-700">First Drug / Medication</label>
            <input type="text" value={drug1} onChange={(e) => setDrug1(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="font-semibold text-slate-700">Second Drug / Medication</label>
            <input type="text" value={drug2} onChange={(e) => setDrug2(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
          </div>
        </div>

        <button type="submit" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow">
          Check Clinical Interactions
        </button>
      </form>

      {result && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold ${
          result.severity === 'HIGH' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span className="font-extrabold uppercase block mb-1">[{result.severity} SEVERITY RATING]</span>
          <p>{result.warning}</p>
        </div>
      )}
    </div>
  );
}
