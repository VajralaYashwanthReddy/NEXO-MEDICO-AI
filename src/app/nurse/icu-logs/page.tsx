'use client';

import React, { useEffect, useState } from 'react';
import { HeartPulse, Activity } from 'lucide-react';

export default function NurseICULogsPage() {
  const [icuLogs, setIcuLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/icu/logs')
      .then(res => res.json())
      .then(data => setIcuLogs(data.icuLogs || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-purple-600 animate-pulse" /> ICU Hourly Vitals Log History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View continuous ICU vitals trends, ventilator readings, and nursing notes
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading ICU vitals log...</p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-4">Time</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Vitals (BP, HR, Temp, SpO2)</th>
                <th className="p-4">Ventilator</th>
                <th className="p-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {icuLogs.map((log) => {
                let vitals: any = {};
                try { vitals = JSON.parse(log.vitalsJson); } catch (e) {}
                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono text-[11px] text-slate-500">{new Date(log.recordedAt).toLocaleString()}</td>
                    <td className="p-4 font-bold text-slate-900">{log.patient?.fullName}</td>
                    <td className="p-4 font-mono">
                      BP: {vitals.bp || '120/80'} | HR: {vitals.hr || '75'} | Temp: {vitals.temp || '98.6'} | SpO2: <strong className="text-emerald-600">{vitals.spo2 || '98%'}</strong>
                    </td>
                    <td className="p-4">{log.ventilatorSettings || 'Oxygen Mask'}</td>
                    <td className="p-4 text-slate-600 italic">"{log.nurseNotes || 'Stable'}"</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
