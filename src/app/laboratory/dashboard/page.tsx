'use client';

import React, { useEffect, useState } from 'react';
import { FlaskConical, FileText, Upload, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function LaboratoryDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [reportText, setReportText] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchOrders = () => {
    fetch('/api/laboratory/orders')
      .then(res => res.json())
      .then(data => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUploadOCR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setProcessing(true);
    try {
      const res = await fetch('/api/laboratory/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          reportText
        })
      });
      if (res.ok) {
        setSelectedOrder(null);
        setReportText('');
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-amber-600" /> Diagnostic Laboratory Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process lab test orders, perform OCR extraction, and flag abnormal diagnostic ranges
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading laboratory test orders...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Active Laboratory Orders Queue</h3>

          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="p-4 border rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-amber-800 text-xs">{order.orderCode}</span>
                    <span className="font-bold text-slate-900 text-sm">{order.testName}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patient: <strong>{order.patient?.fullName}</strong> ({order.patient?.patientCode}) | Category: {order.test?.category || 'Biochemistry'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    order.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {order.status}
                  </span>

                  {order.status !== 'VERIFIED' && (
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload & Extract OCR
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OCR Upload Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border text-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Upload OCR Report for {selectedOrder.testName}</h3>
            <form onSubmit={handleUploadOCR} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Report Raw Text / Data</label>
                <textarea
                  rows={6}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Paste or run OCR text extraction: e.g. Hemoglobin 11.2 g/dL, Fasting Blood Sugar 168 mg/dL..."
                  className="w-full mt-1 px-3 py-2 border rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSelectedOrder(null)} className="px-4 py-2 text-slate-500 font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={processing} className="px-5 py-2 bg-amber-600 text-white font-bold rounded-lg shadow">
                  {processing ? 'Extracting & Flagging...' : 'Run OCR & Flag Abnormal Values'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
