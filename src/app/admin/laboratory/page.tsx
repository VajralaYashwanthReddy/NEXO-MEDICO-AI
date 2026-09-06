'use client';

import React, { useEffect, useState } from 'react';
import { FlaskConical, Building2, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export default function GlobalLaboratoryManagementPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/laboratory/orders')
      .then(res => res.json())
      .then(data => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-amber-600" /> Platform Global Laboratory Diagnostics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor laboratory diagnostic orders, OCR report value extractions, and test verification across all hospital tenants
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <span className="text-[10px] uppercase font-extrabold text-slate-400">Total Diagnostic Orders</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{orders.length}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <span className="text-[10px] uppercase font-extrabold text-slate-400">Verified Reports</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{orders.filter(o => o.status === 'VERIFIED').length}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm">
          <span className="text-[10px] uppercase font-extrabold text-slate-400">Processing Orders</span>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{orders.filter(o => o.status !== 'VERIFIED').length}</h3>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading laboratory diagnostics...</p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-4">Order Code & Test Name</th>
                <th className="p-4">Hospital Tenant</th>
                <th className="p-4">Patient Details</th>
                <th className="p-4">OCR Summary / Values</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-slate-900 block text-sm">{o.testName}</span>
                    <span className="text-cyan-800 font-mono text-[11px] font-bold">{o.orderCode}</span>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-cyan-600" /> {o.hospital?.name || 'Metropolitan Hospital'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-900 block">{o.patient?.fullName}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{o.patient?.patientCode}</span>
                  </td>
                  <td className="p-4 text-slate-700">
                    {o.report ? (
                      <div>
                        <span className="font-semibold block">{o.report.summary}</span>
                        {o.report.aiInterpretation && <span className="text-cyan-700 font-bold text-[10px]">{o.report.aiInterpretation}</span>}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Processing lab analysis...</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      o.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
