'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, Lock, UserX, Activity, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function PlatformSecurityCenterPage() {
  const [securityData, setSecurityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/security')
      .then(res => res.json())
      .then(d => setSecurityData(d))
      .finally(() => setLoading(false));
  }, []);

  const failedLogins = securityData?.failedLogins || [];
  const activeSessions = securityData?.activeSessions || [];
  const suspiciousActivity = securityData?.suspiciousActivity || [];

  return (
    <div className="space-y-6 text-xs">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-600" /> Platform Security & Audit Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor failed authentication attempts, active user sessions, rate limiting, and suspicious access patterns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Active Security Sessions</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{activeSessions.length}</h3>
          </div>
          <Activity className="w-8 h-8 text-emerald-300" />
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Failed Login Attempts</span>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{failedLogins.length}</h3>
          </div>
          <Lock className="w-8 h-8 text-rose-300" />
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Suspicious Events</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{suspiciousActivity.length} Audited</h3>
          </div>
          <AlertTriangle className="w-8 h-8 text-amber-300" />
        </div>
      </div>

      {/* Active User Sessions */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" /> Active Authenticated User Sessions
        </h3>

        <div className="space-y-2">
          {activeSessions.map((sess: any) => (
            <div key={sess.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between font-mono">
              <div>
                <span className="font-bold text-slate-900 block font-sans text-xs">{sess.user} ({sess.role})</span>
                <span className="text-slate-400 text-[10px]">IP: {sess.ip} | Device: {sess.device}</span>
              </div>
              <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100 px-2 py-0.5 rounded">
                ACTIVE SESSION
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Failed Logins Table */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-600" /> Failed Login Log & IP Blocks
        </h3>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
              <th className="p-3">Source IP</th>
              <th className="p-3">Attempted Account</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {failedLogins.map((fl: any) => (
              <tr key={fl.id} className="hover:bg-slate-50 font-mono text-[11px]">
                <td className="p-3 font-bold text-slate-900">{fl.ip}</td>
                <td className="p-3 text-slate-700">{fl.email}</td>
                <td className="p-3 text-slate-400">{fl.timestamp}</td>
                <td className="p-3 text-rose-700 font-sans font-semibold">{fl.reason}</td>
                <td className="p-3 font-sans">
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[9px] rounded">
                    {fl.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
