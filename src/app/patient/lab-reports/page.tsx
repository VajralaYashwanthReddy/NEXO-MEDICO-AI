'use client';

import React, { useEffect, useState } from 'react';
import { FlaskConical } from 'lucide-react';

export default function PatientLabReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/laboratory/orders')
      .then(res => res.json())
      .then(data => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-indigo-600" /> My Laboratory Test Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnostic lab test results, extracted parameter values, and AI interpretations
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading lab reports...</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-800">{order.orderCode} — {order.testName}</span>
                <span className={`px-2 py-0.5 rounded font-bold ${order.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {order.status}
                </span>
              </div>
              {order.report && (
                <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                  <p className="font-semibold text-slate-800">{order.report.summary}</p>
                  {order.report.aiInterpretation && <p className="text-cyan-700 font-bold">{order.report.aiInterpretation}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
