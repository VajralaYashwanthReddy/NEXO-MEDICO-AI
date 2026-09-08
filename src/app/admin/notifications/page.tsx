'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Radio, Bell, ShieldAlert, CheckCircle2, RefreshCw, Send, Users, AlertTriangle, Info, Megaphone } from 'lucide-react';
import { BroadcastNotificationManager } from '@/components/BroadcastNotificationManager';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notificationsHistory, setNotificationsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    setLoading(true);
    fetch('/api/admin/broadcast-notifications')
      .then(res => res.json())
      .then(data => {
        if (data?.notifications) {
          setNotificationsHistory(data.notifications);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 text-slate-900 select-none max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-600 uppercase tracking-widest mb-0.5">
            📢 PLATFORM SYSTEM OPERATIONS & REAL-TIME BROADCASTS
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Radio className="w-6 h-6 text-cyan-600 animate-pulse" />
            Platform Real-Time Notification Dispatcher
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compose and broadcast real-time announcements, alerts, and system notifications to targeted account roles across all hospital tenants.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Sent Log
        </button>
      </div>

      {/* 1. Main Broadcast Dispatcher Tool */}
      <BroadcastNotificationManager onNotificationDispatched={fetchHistory} />

      {/* 2. Sent Broadcast Notifications History List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">Dispatched Broadcast Notification History</h3>
          </div>
          <span className="text-xs bg-cyan-100 text-cyan-800 font-bold px-2.5 py-0.5 rounded-full">
            {notificationsHistory.length} Active Records
          </span>
        </div>

        {loading && notificationsHistory.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">Loading broadcast history...</p>
        ) : notificationsHistory.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">No broadcast notifications dispatched yet.</p>
        ) : (
          <div className="space-y-3">
            {notificationsHistory.map((n) => {
              const isCritical = n.severity === 'CRITICAL';
              const isWarning = n.severity === 'WARNING';
              const isInfo = n.severity === 'INFO';
              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-1.5 ${
                    isCritical
                      ? 'bg-rose-50/70 border-rose-200'
                      : isWarning
                      ? 'bg-amber-50/70 border-amber-200'
                      : isInfo
                      ? 'bg-blue-50/70 border-blue-200'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        isCritical
                          ? 'bg-rose-600 text-white border-rose-700'
                          : isWarning
                          ? 'bg-amber-600 text-white border-amber-700'
                          : isInfo
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-cyan-600 text-white border-cyan-700'
                      }`}>
                        {n.severity}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-400">ID: {n.id}</span>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                        Target: {n.targetRole === 'ALL' ? '🌐 ALL User Accounts' : n.targetRole}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(n.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm pt-1">{n.title}</h4>
                  <p className="text-slate-600 leading-relaxed text-xs">{n.message}</p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>Sender: <strong className="text-slate-700">{n.senderName || 'Platform Super Admin'}</strong></span>
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SSE Live Stream Active
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
