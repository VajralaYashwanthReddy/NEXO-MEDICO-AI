'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  BedDouble,
  Pill,
  FlaskConical,
  RefreshCw,
  HeartPulse,
  Stethoscope,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export default function HospitalAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchAnalytics = () => {
    setLoading(true);
    const jwt = typeof window !== 'undefined' ? localStorage.getItem('nexo_jwt') : null;
    fetch(`/api/analytics?period=${period}`, {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
    })
      .then(res => res.json())
      .then(d => {
        if (d?.summaryCards) {
          setData(d);
        }
      })
      .catch(err => console.error('Analytics fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();

    // 5-second real-time performance polling
    const interval = setInterval(fetchAnalytics, 5000);

    // SSE EventSource for immediate live updates when patients register or clinical events occur
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (
            parsed.event === 'PATIENT_REGISTERED' ||
            parsed.event === 'PATIENT_REGISTER_GLOBAL' ||
            parsed.event === 'BROADCAST_NOTIFICATION'
          ) {
            fetchAnalytics();
          }
        } catch (e) {}
      };
    } catch (sseErr) {
      console.warn('SSE subscription error in analytics:', sseErr);
    }

    return () => {
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, [period]);

  const cards = data?.summaryCards || {
    totalPatients: 4,
    currentAdmissions: 8,
    availableBeds: 34,
    icuOccupancy: 4,
    totalDoctors: 6,
    todayAppointments: 18,
    pendingLabReports: 9,
    recentPrescriptions: 24
  };

  const charts = data?.charts || {
    monthlyAdmissions: [
      { month: 'Jan', admissions: 24, discharges: 21 },
      { month: 'Feb', admissions: 32, discharges: 28 },
      { month: 'Mar', admissions: 45, discharges: 39 },
      { month: 'Apr', admissions: 52, discharges: 48 },
      { month: 'May', admissions: 68, discharges: 61 },
      { month: 'Jun', admissions: 84, discharges: 79 },
      { month: 'Jul', admissions: 95, discharges: 88 },
      { month: 'Aug', admissions: 110, discharges: 98 }
    ],
    departmentActivity: [
      { name: 'Cardiology', doctors: 6, appointments: 42, admissions: 12 },
      { name: 'Emergency', doctors: 4, appointments: 85, admissions: 28 },
      { name: 'Neurology', doctors: 3, appointments: 31, admissions: 8 },
      { name: 'Pediatrics', doctors: 3, appointments: 28, admissions: 6 },
      { name: 'Orthopedics', doctors: 2, appointments: 24, admissions: 9 },
      { name: 'ICU & Care', doctors: 5, appointments: 15, admissions: 14 }
    ]
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto text-slate-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 rounded-3xl text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-400 uppercase tracking-widest mb-1">
            📊 REAL-TIME CLINICAL INTELLIGENCE & PERFORMANCE ANALYTICS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-cyan-400" />
            Hospital Analytics & Clinical Intelligence
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Operational KPIs, patient flow trends, bed occupancy ratios, and real-time department activity across the hospital.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            {['7d', '30d', '3m', '6m', '1y'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-lg font-extrabold uppercase transition-all ${
                  period === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            className="p-2.5 bg-slate-900 border border-slate-800 text-cyan-400 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh Performance Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Registered Patients</span>
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{cards.totalPatients}</h3>
          <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> Live Registry Dynamic Count
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Active Inpatient Admissions</span>
            <BedDouble className="w-4 h-4 text-cyan-600" />
          </div>
          <h3 className="text-2xl font-black text-cyan-700">{cards.currentAdmissions}</h3>
          <span className="text-[10px] font-extrabold text-cyan-600">Monitored Ward Wards</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Available Bed Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600">{cards.availableBeds} Beds</h3>
          <span className="text-[10px] font-extrabold text-emerald-600">Ready for Emergency Dispatch</span>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">ICU Occupancy Count</span>
            <HeartPulse className="w-4 h-4 text-rose-600" />
          </div>
          <h3 className="text-2xl font-black text-rose-600">{cards.icuOccupancy} Occupied</h3>
          <span className="text-[10px] font-extrabold text-rose-600">Critical Care Active Beds</span>
        </div>
      </div>

      {/* Recharts Graphical Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Inpatient Flow (YTD) Area Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600" /> Patient Inpatient Flow (YTD)
            </h3>
            <span className="text-[10px] font-extrabold bg-cyan-50 text-cyan-800 px-2.5 py-0.5 rounded-full border border-cyan-200">
              Admissions vs Discharges
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyAdmissions || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} fontWeight={700} />
                <YAxis stroke="#64748b" fontSize={11} fontWeight={700} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="admissions" stroke="#0284c7" fill="#e0f2fe" strokeWidth={2.5} name="Hospital Admissions" />
                <Area type="monotone" dataKey="discharges" stroke="#10b981" fill="#d1fae5" strokeWidth={2.5} name="Hospital Discharges" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Volume Breakdown Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" /> Department Volume Breakdown
            </h3>
            <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Clinical Workload
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.departmentActivity || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight={700} />
                <YAxis stroke="#64748b" fontSize={11} fontWeight={700} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Bar dataKey="appointments" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Outpatient Visits" />
                <Bar dataKey="admissions" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Inpatient Admissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
