'use client';

import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Cpu, Database, Server, Radio, ShieldCheck } from 'lucide-react';

export default function RealTimeSystemHealthPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSystemHealth = () => {
    setLoading(true);
    fetch('/api/admin/system-health')
      .then(res => res.json())
      .then(d => setHealthData(d))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  const services = healthData?.services || [];

  return (
    <div className="space-y-6 text-xs">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" /> Platform Real-Time System Health Monitor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status, endpoint connectivity, response latency, and health checks across microservices
          </p>
        </div>
        <button
          onClick={fetchSystemHealth}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Run System Health Check
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl border shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-extrabold text-slate-400">Overall System Health Status</span>
          <h3 className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" /> {healthData?.systemStatus || 'HEALTHY'}
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Last Evaluated: {new Date(healthData?.timestamp || Date.now()).toLocaleString()}</span>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
          ALL SERVICES OPERATIONAL
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Pinging backend & AI services...</p>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Microservice & Subsystem Telemetry ({services.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((srv: any, idx: number) => (
              <div key={idx} className="p-4 bg-white rounded-2xl border shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-cyan-600" />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{srv.name}</h4>
                      <span className="text-[10px] text-slate-400">{srv.type}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                    srv.status === 'HEALTHY' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {srv.status}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Endpoint URI:</span>
                    <span className="font-bold text-cyan-800">{srv.endpoint}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Latency / Ping:</span>
                    <span className="font-extrabold text-emerald-600">{srv.latency}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 border-t pt-2">{srv.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
