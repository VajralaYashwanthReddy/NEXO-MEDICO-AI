'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Users,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Calendar,
  BedDouble,
  Pill,
  FlaskConical,
  Cpu,
  Activity,
  ShieldCheck,
  TrendingUp,
  Globe,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  Layers
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

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isPlatformSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchAnalytics = (selectedPeriod = period) => {
    setLoading(true);
    const jwt = typeof window !== 'undefined' ? localStorage.getItem('nexo_jwt') : null;
    fetch(`/api/admin/platform-analytics?period=${selectedPeriod}`, {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
    })
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics(period);

    // Auto-refresh analytics every 5 seconds for real-time patient count & operational updates
    const pollInterval = setInterval(() => {
      fetchAnalytics(period);
    }, 5000);

    // SSE EventSource listener for instant real-time updates when patients register
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === 'PATIENT_REGISTERED' || parsed.event === 'BROADCAST_NOTIFICATION') {
            fetchAnalytics(period);
          }
        } catch (e) {
          // silent parse catch
        }
      };
    } catch (sseErr) {
      console.warn('SSE subscription error in dashboard:', sseErr);
    }

    return () => {
      clearInterval(pollInterval);
      if (eventSource) eventSource.close();
    };
  }, [period]);

  const cards = data?.summaryCards || {
    totalHospitals: 1,
    activeHospitals: 1,
    totalUsers: 8,
    activeUsers: 8,
    totalPatients: 2,
    totalDoctors: 2,
    totalHealthcareStaff: 5,
    totalAppointments: 2,
    currentAdmissions: 2,
    totalPrescriptions: 5,
    totalLabReports: 2,
    totalAiAnalyses: 4
  };

  const charts = data?.growthCharts || {};

  return (
    <div className="space-y-6 select-none">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 rounded-3xl text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-400 uppercase tracking-widest mb-1">
            {isPlatformSuperAdmin ? (
              <>
                <Globe className="w-4 h-4 text-cyan-400" /> Platform Security Scope: SUPER_ADMIN
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 text-blue-400" /> Hospital Scope: HOSPITAL_ADMIN
              </>
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            {isPlatformSuperAdmin ? 'Platform Command Center' : 'Hospital Management Command Center'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {isPlatformSuperAdmin
              ? 'Monitor national healthcare infrastructure, hospital tenant onboarding, and platform analytics.'
              : `Real-time clinical operations, bed availability, staff overview, and patient activity for ${user?.hospitalName || 'your hospital'}.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Filter Dropdown */}
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
            onClick={() => fetchAnalytics(period)}
            className="p-2.5 bg-slate-900 border border-slate-800 text-cyan-400 rounded-xl hover:bg-slate-800 transition-colors"
            title="Refresh Operational Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI CARDS GRID */}
      {isPlatformSuperAdmin ? (
        // Super Admin Cards (Includes Platform Tenants count)
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Total Hospitals</span>
              <Building2 className="w-4 h-4 text-cyan-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{cards.totalHospitals}</h3>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Active Network
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Active Tenants</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{cards.activeHospitals}</h3>
            <span className="text-[10px] font-bold text-slate-500">100% Operational</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Total Users</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{cards.totalUsers}</h3>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Multi-Role Access
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Registered Patients</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{cards.totalPatients}</h3>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Universal IDs
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Attending Doctors</span>
              <Stethoscope className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{cards.totalDoctors}</h3>
            <span className="text-[10px] font-bold text-purple-600">Specialized MDs</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Healthcare Staff</span>
              <HeartPulse className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{cards.totalHealthcareStaff}</h3>
            <span className="text-[10px] font-bold text-slate-500">Nurses & Staff</span>
          </div>
        </div>
      ) : (
        // Hospital Admin Cards (Hospital-focused, NO platform tenant count)
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Attending Doctors</span>
              <Stethoscope className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{cards.totalDoctors}</h3>
            <span className="text-[10px] font-bold text-blue-600">Active MD Staff</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Nursing Staff</span>
              <HeartPulse className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{cards.totalHealthcareStaff}</h3>
            <span className="text-[10px] font-bold text-purple-600">Ward & ICU Nurses</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Hospital Patients</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{cards.totalPatients}</h3>
            <span className="text-[10px] font-bold text-emerald-600">Universal Patient IDs</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Scheduled Appointments</span>
              <Calendar className="w-4 h-4 text-cyan-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{cards.totalAppointments}</h3>
            <span className="text-[10px] font-bold text-cyan-600">Outpatient Visits</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Active Inpatients</span>
              <BedDouble className="w-4 h-4 text-rose-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{cards.currentAdmissions}</h3>
            <span className="text-[10px] font-bold text-rose-600">Ward & ICU Beds</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">Prescriptions</span>
              <Pill className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">{cards.totalPrescriptions}</h3>
            <span className="text-[10px] font-bold text-indigo-600">Digital Rx Issued</span>
          </div>
        </div>
      )}

      {/* OPERATIONAL GROWTH CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Patient Registration & Clinical Visits Trend
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-lg">Period: {period}</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.patientGrowth || []}>
                <defs>
                  <linearGradient id="patGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="count" stroke="#2563eb" fillOpacity={1} fill="url(#patGrad)" name="Registered Patients" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" /> Clinical Activity & Appointment Scheduling
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-lg">Real-time DB</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#6366f1" name="Appointments Scheduled" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
