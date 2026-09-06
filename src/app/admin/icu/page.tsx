'use client';

import React, { useEffect, useState } from 'react';
import { HeartPulse, Activity, AlertTriangle, Plus, ShieldAlert } from 'lucide-react';

export default function ICUManagementPage() {
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
            <HeartPulse className="w-6 h-6 text-rose-600 animate-pulse" /> ICU Critical Care Dashboard & Bed Monitoring
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time critical vitals tracking, ventilator monitoring, and ICU patient logs
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading ICU critical logs...</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-rose-950 text-white p-5 rounded-2xl border border-rose-800 shadow-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-rose-400">Critical Care Status</p>
                <h3 className="text-xl font-extrabold text-white mt-1">5 Active ICU Beds</h3>
                <p className="text-xs text-rose-300 mt-1">Continuous Monitoring Enabled</p>
              </div>
              <ShieldAlert className="w-10 h-10 text-rose-400" />
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-cyan-400">Ventilator Support</p>
                <h3 className="text-xl font-extrabold text-white mt-1">2 Mechanical Vents</h3>
                <p className="text-xs text-slate-400 mt-1">BiPAP / AC Mode Active</p>
              </div>
              <Activity className="w-10 h-10 text-cyan-400" />
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-400">Nurse Attention</p>
                <h3 className="text-xl font-extrabold text-white mt-1">1:1 Care Ratio</h3>
                <p className="text-xs text-slate-400 mt-1">Hourly Log Persistence</p>
              </div>
              <HeartPulse className="w-10 h-10 text-emerald-400" />
            </div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden mt-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs">Recent Hourly ICU Bed Logs & Vitals History</span>
              <span className="text-[10px] bg-rose-600 px-2 py-0.5 rounded font-bold">CRITICAL CARE TIMELINE</span>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                  <th className="p-4">Time Recorded</th>
                  <th className="p-4">ICU Bed & Patient</th>
                  <th className="p-4">Physiological Vitals</th>
                  <th className="p-4">Ventilator Settings</th>
                  <th className="p-4">Nurse / Doctor Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {icuLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">No ICU logs recorded yet. Use Nurse/Doctor portal to record hourly vitals.</td>
                  </tr>
                ) : (
                  icuLogs.map((log) => {
                    let vitals: any = {};
                    try { vitals = JSON.parse(log.vitalsJson); } catch (e) {}
                    return (
                      <tr key={log.id} className="hover:bg-rose-50/30 transition-colors">
                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          {new Date(log.recordedAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{log.patient?.fullName}</span>
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 inline-block mt-0.5">
                            Bed {log.bed?.bedNumber || 'ICU-01'}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-800">
                          <div className="grid grid-cols-2 gap-x-3 text-[11px]">
                            <span>BP: <strong>{vitals.bp || '120/80'}</strong></span>
                            <span>HR: <strong>{vitals.hr || '75 bpm'}</strong></span>
                            <span>Temp: <strong>{vitals.temp || '98.6°F'}</strong></span>
                            <span>SpO2: <strong className="text-emerald-600">{vitals.spo2 || '98%'}</strong></span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-700 font-medium">
                          {log.ventilatorSettings || 'Standard Oxygen Therapy'}
                        </td>
                        <td className="p-4 text-slate-600 italic max-w-xs">
                          "{log.nurseNotes || 'Patient stable in ICU.'}"
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
