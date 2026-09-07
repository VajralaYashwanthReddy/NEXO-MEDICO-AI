'use client';

import React, { useState, useEffect } from 'react';
import { Siren, AlertTriangle, CheckCircle2, ShieldAlert, Zap, X, MapPin, Activity, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { EmergencyAlert, fetchActiveAlerts } from '@/lib/emergencyDispatch';
import { useAuth } from '@/context/AuthContext';

export function EmergencyCodeRedBanner() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    // Only show to medical/admin/staff users
    if (!user || user.role === 'PATIENT') return;

    // Initial fetch
    fetchActiveAlerts().then(data => {
      setAlerts(data);
      if (data.length > 0) {
        setExpandedAlertId(data[0].id);
      }
    });

    // Poll for emergency alerts every 8 seconds
    const interval = setInterval(() => {
      fetchActiveAlerts().then(setAlerts);
    }, 8000);

    return () => clearInterval(interval);
  }, [user]);

  const activeAlerts = alerts.filter(a => !dismissedAlerts.includes(a.id));

  if (!user || user.role === 'PATIENT' || activeAlerts.length === 0) {
    return null;
  }

  const currentAlert = activeAlerts[0];
  const isExpanded = expandedAlertId === currentAlert.id;

  const handleAcknowledge = async (alertId: string) => {
    setLoadingAction(alertId);
    try {
      const responderName = `${user.name} (${user.role.replace('_', ' ')})`;
      const res = await fetch('/api/emergency/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge', alertId, responderName })
      });
      const data = await res.json();
      if (data.alerts) setAlerts(data.alerts);
    } catch (err) {
      console.error('Failed to acknowledge emergency alert:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClear = async (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
    try {
      await fetch('/api/emergency/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', alertId })
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 text-white border-b-2 border-rose-600 shadow-xl relative z-40 select-none animate-pulse-subtle">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6">
        
        {/* Main Alert Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-rose-600 rounded-xl animate-bounce shrink-0 shadow-lg shadow-rose-600/50">
              <Siren className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-sm flex items-center gap-1">
                  <Zap className="w-3 h-3" /> CODE RED EMERGENCY ALERT
                </span>
                <span className="text-xs font-black text-rose-200">{currentAlert.id}</span>
                <span className="text-[10px] text-rose-300 font-mono">• {new Date(currentAlert.timestamp).toLocaleTimeString()}</span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-2 mt-0.5 truncate">
                <span>{currentAlert.patientName} ({currentAlert.age}y {currentAlert.gender})</span>
                <span className="text-rose-300 font-normal">| Location:</span>
                <span className="text-amber-300 font-extrabold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {currentAlert.roomNo}
                </span>
              </h4>
            </div>
          </div>

          {/* Quick Vital Badge & Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2 bg-rose-900/90 border border-rose-700/80 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-rose-100">
              <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>{currentAlert.vitalValue}</span>
            </div>

            {currentAlert.acknowledgedBy ? (
              <div className="bg-emerald-950 border border-emerald-700 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Dispatched: {currentAlert.acknowledgedBy}</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={loadingAction === currentAlert.id}
                onClick={() => handleAcknowledge(currentAlert.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wide shadow-lg shadow-emerald-600/40 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loadingAction === currentAlert.id ? 'Dispatching...' : 'Acknowledge & Dispatch Response'}
              </button>
            )}

            <button
              type="button"
              onClick={() => setExpandedAlertId(isExpanded ? null : currentAlert.id)}
              className="p-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-200 transition-colors"
              title="Toggle AI Resuscitation Guidelines"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => handleClear(currentAlert.id)}
              className="p-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-200 transition-colors"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Collapsible AI Resuscitation Protocols Box */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-rose-800/80 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Nexo AI Clinical Resuscitation Guidelines ({currentAlert.department})
              </span>
              <span className="text-[10px] text-rose-200 font-mono">Spike: {currentAlert.vitalSpike}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentAlert.aiProtocols.map((protocol, idx) => (
                <div key={idx} className="p-2 bg-rose-950/80 border border-rose-800/70 rounded-xl text-slate-100 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium leading-tight">{protocol}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
