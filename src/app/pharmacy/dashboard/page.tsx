'use client';

import React, { useEffect, useState } from 'react';
import { Pill, CheckCircle2, AlertTriangle, ClipboardList, PackageCheck, Box, TrendingUp, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PharmacistDashboard() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/prescriptions?status=ISSUED').then(r => r.json()).catch(() => ({ prescriptions: [] })),
      fetch('/api/pharmacy/medicines').then(r => r.json()).catch(() => ({ medicines: [], alerts: [] }))
    ]).then(([rxData, medData]) => {
      setPrescriptions(Array.isArray(rxData?.prescriptions) ? rxData.prescriptions : []);
      setMedicines(Array.isArray(medData?.medicines) ? medData.medicines : []);
      setAlerts(Array.isArray(medData?.alerts) ? medData.alerts : []);
    }).catch(err => {
      console.error('Pharmacy dashboard fetch error:', err);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDispense = async (prescriptionId: string) => {
    try {
      const res = await fetch('/api/pharmacy/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptionId })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-emerald-900/40 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">Pharmacy Operations</span>
          <h1 className="text-2xl font-extrabold tracking-tight">Pharmacy Command Center</h1>
          <p className="text-xs text-emerald-200 mt-1">Prescription verification, dispensing workflow, and drug inventory management</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pharmacy/inventory" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all">
            <Box className="w-4 h-4" /> Manage Inventory
          </Link>
          <button onClick={fetchData} className="p-2 bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 rounded-xl hover:bg-emerald-900 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Pending Prescriptions</span>
            <h3 className="text-2xl font-extrabold text-cyan-700 mt-1">{prescriptions.length}</h3>
          </div>
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl"><ClipboardList className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Inventory Items</span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{medicines.length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Pill className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Reorder / Stock Alerts</span>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{alerts.length} Warnings</h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Inventory Stock Alerts */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
          <h3 className="font-bold text-amber-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Pharmacy Reorder & Stock Warnings ({alerts.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {alerts.map((alt, idx) => (
              <div key={idx} className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">{alt.medicineName}</span>
                  <span className="text-[10px] text-amber-700">{alt.details}</span>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">{alt.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Prescriptions Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-cyan-600" /> Issued Prescriptions Pending Dispensing
        </h3>

        {loading ? (
          <p className="text-xs text-slate-500 text-center py-6">Loading prescriptions queue...</p>
        ) : prescriptions.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-xs font-semibold text-slate-700">All issued prescriptions have been dispensed!</p>
            <p className="text-[11px] text-slate-400">Check prescription history or medicine inventory.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="p-4 border rounded-xl bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-cyan-800 text-xs">{rx.prescriptionCode}</span>
                    <span className="text-xs text-slate-500">| Patient: <strong className="text-slate-800">{rx.patient?.fullName}</strong> ({rx.patient?.patientCode})</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {rx.items?.map((item: any) => (
                      <div key={item.id} className="text-xs font-semibold text-slate-700">
                        💊 {item.medicineName} ({item.strength}) — {item.dosage}, {item.frequency} for {item.durationDays} days ({item.quantity} Qty)
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleDispense(rx.id)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 shrink-0 transition-all"
                >
                  <PackageCheck className="w-4 h-4" /> Verify & Dispense Medicines
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
