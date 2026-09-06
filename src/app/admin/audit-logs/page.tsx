'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Search } from 'lucide-react';

export default function SecurityAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-logs')
      .then(res => res.json())
      .then(data => setLogs(data.auditLogs || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" /> Security Audit Log Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable tracking of all sensitive patient data access, prescriptions, lab uploads, and admin actions
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading security audit trail...</p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-4">Timestamp</th>
                <th className="p-4">User Account</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">Target Resource</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4 font-sans font-semibold text-slate-800">
                    {log.user ? `${log.user.name} (${log.user.role})` : 'System Automated'}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded font-bold bg-cyan-100 text-cyan-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700 font-sans font-medium">
                    {log.resource}
                  </td>
                  <td className="p-4 text-slate-400">
                    {log.ipAddress || '127.0.0.1'}
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
