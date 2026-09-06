'use client';

import React, { useEffect, useState } from 'react';
import { Pill, ClipboardList, PackageCheck } from 'lucide-react';

export default function PharmacyPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRx = () => {
    fetch('/api/prescriptions')
      .then(res => res.json())
      .then(data => setPrescriptions(data.prescriptions || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRx();
  }, []);

  const handleDispense = async (prescriptionId: string) => {
    await fetch('/api/pharmacy/dispense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescriptionId })
    });
    fetchRx();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-600" /> Prescriptions Queue & Dispensing History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify prescription authenticity, dosage, and dispense medications
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading prescriptions...</p>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-cyan-800 text-xs">{rx.prescriptionCode}</span>
                  <span className="text-xs text-slate-500">| Patient: <strong className="text-slate-800">{rx.patient?.fullName}</strong></span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rx.status === 'DISPENSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {rx.status}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {rx.items?.map((item: any) => (
                    <div key={item.id} className="text-xs font-semibold text-slate-700">
                      💊 {item.medicineName} ({item.strength}) — {item.dosage}, {item.frequency} for {item.durationDays} days ({item.quantity} Qty)
                    </div>
                  ))}
                </div>
              </div>

              {rx.status !== 'DISPENSED' && (
                <button
                  onClick={() => handleDispense(rx.id)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 shrink-0"
                >
                  <PackageCheck className="w-4 h-4" /> Verify & Dispense
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
