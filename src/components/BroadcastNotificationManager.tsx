'use client';

import React, { useState } from 'react';
import { Bell, Send, ShieldAlert, Sparkles, CheckCircle2, Users, Radio, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface BroadcastNotificationManagerProps {
  onNotificationDispatched?: () => void;
}

export function BroadcastNotificationManager({ onNotificationDispatched }: BroadcastNotificationManagerProps = {}) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL' | 'ANNOUNCEMENT'>('ANNOUNCEMENT');
  const [targetRole, setTargetRole] = useState<'ALL' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'LAB_TECH' | 'PATIENT'>('ALL');
  
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Only allow admin roles to access broadcast dispatcher
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'HOSPITAL_ADMIN')) {
    return null;
  }

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      setErrorMsg('Please provide both a Title and Message content.');
      return;
    }

    setSending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/broadcast-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          severity,
          targetRole,
          senderName: `${user.name} (${user.role === 'SUPER_ADMIN' ? 'Platform Super Admin' : 'Hospital Admin'})`,
          hospitalId: user.hospitalId || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Broadcast failed');

      setSuccessMsg(`🚀 Notification Dispatched Successfully to ${targetRole === 'ALL' ? 'ALL Accounts' : targetRole.replace('_', ' ')}!`);
      setTitle('');
      setMessage('');
      if (onNotificationDispatched) {
        onNotificationDispatched();
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-5 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Platform Real-Time Notification Dispatcher</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/80 px-2 py-0.5 rounded-full font-mono uppercase">Global Broadcast</span>
            </h3>
            <p className="text-xs text-slate-400">
              Compose and send real-time system notifications directly to all user role accounts platform-wide.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-700 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm animate-fadeIn">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleDispatch} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Target Audience */}
          <div>
            <label className="font-bold text-slate-300 block mb-1">Target Account Audience *</label>
            <select
              value={targetRole}
              onChange={(e: any) => setTargetRole(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ALL">🌐 All User Accounts (Global Broadcast)</option>
              <option value="DOCTOR">🩺 Doctors & Physicians Only</option>
              <option value="NURSE">🩺 Nurses & Care Staff Only</option>
              <option value="PATIENT">👤 Patients Only</option>
              <option value="PHARMACIST">💊 Pharmacists Only</option>
              <option value="LAB_TECH">🧪 Lab Technicians Only</option>
              <option value="HOSPITAL_ADMIN">🏥 Hospital Administrators Only</option>
            </select>
          </div>

          {/* Severity Level */}
          <div>
            <label className="font-bold text-slate-300 block mb-1">Notification Severity *</label>
            <select
              value={severity}
              onChange={(e: any) => setSeverity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="ANNOUNCEMENT">📢 General Announcement</option>
              <option value="INFO">ℹ️ Information Update</option>
              <option value="WARNING">⚠️ System Warning / Maintenance</option>
              <option value="CRITICAL">🚨 Critical Alert</option>
            </select>
          </div>

        </div>

        {/* Title */}
        <div>
          <label className="font-bold text-slate-300 block mb-1">Notification Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled System Maintenance / New Clinical Protocol Available"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-600"
          />
        </div>

        {/* Message */}
        <div>
          <label className="font-bold text-slate-300 block mb-1">Notification Content / Message Body *</label>
          <textarea
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter detailed broadcast notification details..."
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-600 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <Send className="w-4 h-4 text-white" />
          {sending ? 'Broadcasting Notification...' : 'Broadcast Real-Time Notification to Accounts'}
        </button>

      </form>
    </div>
  );
}
