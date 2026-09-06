'use client';

import React, { useEffect, useState } from 'react';
import { FlaskConical, Upload, CheckCircle2 } from 'lucide-react';

export default function LabOrdersPage() {
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
            <FlaskConical className="w-6 h-6 text-amber-600" /> Laboratory Diagnostic Test Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test requests, sample tracking, and laboratory report verifications
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading lab orders...</p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-4">Order Code</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Test Name</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-extrabold text-amber-800">{order.orderCode}</td>
                  <td className="p-4 font-bold text-slate-900">{order.patient?.fullName}</td>
                  <td className="p-4 text-slate-700 font-semibold">{order.testName}</td>
                  <td className="p-4 font-bold text-slate-600">{order.priority}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold ${order.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {order.status}
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
