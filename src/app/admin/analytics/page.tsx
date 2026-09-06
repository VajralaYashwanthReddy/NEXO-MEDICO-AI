'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Activity, Users, BedDouble, Pill, FlaskConical } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

export default function HospitalAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading analytics performance metrics...</div>;
  }

  const cards = data?.summaryCards || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-600" /> Hospital Analytics & Clinical Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational KPIs, patient flow trends, bed occupancy ratios, and department activity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Registered Patients</span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{cards.totalPatients || 0}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Active Inpatient Admissions</span>
          <h3 className="text-2xl font-extrabold text-cyan-700 mt-1">{cards.currentAdmissions || 0}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">Available Bed Rate</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{cards.availableBeds || 0} Beds</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400">ICU Occupancy Count</span>
          <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{cards.icuOccupancy || 0} Occupied</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-600" /> Patient Inpatient Flow (YTD)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyAdmissions || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="admissions" stroke="#0284c7" fill="#e0f2fe" name="Admissions" />
                <Area type="monotone" dataKey="discharges" stroke="#10b981" fill="#d1fae5" name="Discharges" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" /> Department Volume Breakdown
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.departmentActivity || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="appointments" fill="#06b6d4" name="Appointments" />
                <Bar dataKey="admissions" fill="#f59e0b" name="Admissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
