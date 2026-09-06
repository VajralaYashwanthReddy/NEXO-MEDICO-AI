'use client';

import React, { useEffect, useState } from 'react';
import { FlaskConical, FileText, CheckCircle2 } from 'lucide-react';

export default function DoctorLabReportsPage() {
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
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-amber-600" /> Patient Laboratory Diagnostic Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect verified diagnostic test findings, abnormal flag alerts, and OCR lab summaries
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading lab reports...</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-amber-800 text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {order.orderCode}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">{order.testName}</h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  order.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.status}
                </span>
              </div>

              <p className="text-xs text-slate-600">Patient: <strong>{order.patient?.fullName}</strong> ({order.patient?.patientCode})</p>

              {order.report && (
                <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-2">
                  <span className="font-bold text-slate-800 block">AI Summary & Findings:</span>
                  <p className="text-slate-700">{order.report.summary}</p>
                  {order.report.aiInterpretation && (
                    <p className="text-cyan-700 font-semibold">{order.report.aiInterpretation}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
