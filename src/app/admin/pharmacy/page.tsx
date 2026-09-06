'use client';

import React, { useEffect, useState } from 'react';
import { Pill, Building2, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function GlobalPharmacyManagementPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pharmacy/medicines')
      .then(res => res.json())
      .then(data => {
        setMedicines(data.medicines || []);
        setAlerts(data.alerts || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-emerald-600" /> Platform Global Pharmacy & Drug Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor pharmacy inventories, low stock reorder alerts, drug batch expirations, and dispensing logs across hospital tenants
          </p>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2 text-xs">
          <h3 className="font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Low Stock & Batch Expiry Warnings ({alerts.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading pharmacy inventory...</p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-4">Drug Name / Code</th>
                <th className="p-4">Generic Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Batch Quantities & Status</th>
                <th className="p-4">Unit Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicines.map((med) => (
                <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <span className="font-extrabold text-slate-900 block text-sm">{med.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{med.code}</span>
                  </td>
                  <td className="p-4 text-slate-700 font-medium">{med.genericName}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold text-[10px]">
                      {med.category}
                    </span>
                  </td>
                  <td className="p-4 space-y-1">
                    {med.inventoryItems?.map((inv: any) => (
                      <div key={inv.id} className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{inv.quantity} Units</span>
                        <span className="text-[10px] text-slate-400 font-mono">({inv.batchNo})</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    ))}
                  </td>
                  <td className="p-4 font-bold text-slate-800">${med.inventoryItems?.[0]?.unitPrice || '1.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
