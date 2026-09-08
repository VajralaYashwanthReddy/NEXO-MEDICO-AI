'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Search, RefreshCw, FileText, CheckCircle2, AlertTriangle, Key } from 'lucide-react';

export default function SecurityAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchAuditLogs = () => {
    const jwt = typeof window !== 'undefined' ? localStorage.getItem('nexo_jwt') : null;
    fetch('/api/audit-logs', {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.auditLogs) {
          setLogs(data.auditLogs);
        }
      })
      .catch(err => console.error('Audit logs fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAuditLogs();
    const interval = setInterval(fetchAuditLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const userName = log.user?.name || 'System Automated';
    const userRole = log.user?.role || '';
    const action = log.action || '';
    const resource = log.resource || '';
    const ip = log.ipAddress || '';

    if (actionFilter && !action.toUpperCase().includes(actionFilter.toUpperCase())) {
      return false;
    }

    if (search) {
      const q = search.toLowerCase();
      return (
        userName.toLowerCase().includes(q) ||
        userRole.toLowerCase().includes(q) ||
        action.toLowerCase().includes(q) ||
        resource.toLowerCase().includes(q) ||
        ip.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 uppercase tracking-widest mb-0.5">
            🛡️ HIPAA & GDPR IMMUTABLE SECURITY AUDIT LOG TRAIL
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" /> Security Audit Log Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable tracking of all sensitive patient data access, prescriptions, emergency QR scans, lab uploads, and admin actions.
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Audit Trail
        </button>
      </div>

      {/* Search & Action Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user account, action type, resource, IP address..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-500">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
          >
            <option value="">All Security Actions</option>
            <option value="PATIENT_REGISTER">PATIENT_REGISTER</option>
            <option value="PATIENT_EMERGENCY_QR">PATIENT_EMERGENCY_QR</option>
            <option value="BROADCAST_NOTIFICATION">BROADCAST_NOTIFICATION</option>
            <option value="PRESCRIPTION">PRESCRIPTION</option>
            <option value="USER_ACCOUNT">USER_ACCOUNT</option>
          </select>
        </div>
      </div>

      {loading && filteredLogs.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading security audit trail...</p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-xs overflow-hidden">
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
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-sans text-xs">
                    No matching audit log records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const act = log.action || '';
                  const isRegister = act.includes('REGISTER');
                  const isQr = act.includes('QR');
                  const isBroadcast = act.includes('BROADCAST');
                  const isPrescription = act.includes('PRESCRIPTION');
                  const isUser = act.includes('USER');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-500 font-mono text-[10px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-sans font-extrabold text-slate-900">
                        {log.user ? (
                          <div>
                            <span className="block text-xs text-slate-900 font-bold">{log.user.name}</span>
                            <span className="text-[9px] font-extrabold text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200 inline-block">
                              {log.user.role}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs font-semibold">System Automated</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border font-mono inline-block ${
                          isRegister
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isQr
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : isBroadcast
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                            : isPrescription
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : isUser
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}>
                          {act}
                        </span>
                      </td>
                      <td className="p-4 text-slate-800 font-sans font-bold text-xs">
                        {log.resource}
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-[10px]">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
