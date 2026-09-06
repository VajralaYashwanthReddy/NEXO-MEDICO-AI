'use client';

import React, { useEffect, useState } from 'react';
import { Pill, Calendar, Building2, CheckCircle2, Clock, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/prescriptions')
      .then(res => res.json())
      .then(data => setPrescriptions(data.prescriptions || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900 select-none">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">
            <Pill className="w-4 h-4 text-emerald-600" /> Digital Pharmacy Dispensing Registry
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            My Digital Prescription History
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            View all prescribed medications, dosages, frequency timing, instructions, and real-time pharmacy dispensing status.
          </p>
        </div>

        <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-black text-xs shrink-0">
          {prescriptions.length} Prescriptions Issued
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading digital prescriptions...</p>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-blue-700 text-base bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                    {rx.prescriptionCode}
                  </span>
                  <span className="text-slate-500 font-bold text-xs flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {new Date(rx.date).toLocaleDateString()}
                  </span>
                </div>

                <span className={`px-3 py-1 rounded-xl font-black text-xs ${
                  rx.status === 'DISPENSED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {rx.status}
                </span>
              </div>

              {/* Medication List Cards */}
              <div className="space-y-2.5">
                {rx.items?.map((item: any) => (
                  <div key={item.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-900 shadow-2xs">
                    <div className="space-y-0.5">
                      <span className="font-black text-slate-900 text-sm block">
                        💊 {item.medicineName} ({item.strength})
                      </span>
                      <span className="text-slate-600 font-extrabold text-xs block">
                        Dosage: <strong className="text-blue-700">{item.dosage}</strong> ({item.route || 'Oral'})
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-emerald-700 font-black text-xs block bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 inline-block">
                        {item.frequency}
                      </span>
                      <span className="text-slate-600 font-extrabold text-[11px] block mt-0.5">
                        Duration: {item.durationDays} Days ({item.foodRelation})
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {rx.instructions && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-blue-900 font-semibold flex items-start gap-2">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block text-xs">Prescribing Doctor Instructions:</span>
                    <p className="text-xs text-blue-900 mt-0.5">"{rx.instructions}"</p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {prescriptions.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 font-semibold">
              No digital prescriptions issued yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
