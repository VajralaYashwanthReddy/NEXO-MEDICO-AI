'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  Stethoscope,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Pill,
  FlaskConical,
  HeartPulse,
  Users,
  Globe,
  Plus
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);

      if (data.user.role === 'HOSPITAL_ADMIN' || data.user.role === 'SUPER_ADMIN' || data.user.role === 'HR_ADMIN' || data.user.role === 'RECEPTIONIST' || data.user.role === 'STAFF') {
        router.push('/admin/dashboard');
      } else if (data.user.role === 'DOCTOR') {
        router.push('/doctor/dashboard');
      } else if (data.user.role === 'PHARMACIST') {
        router.push('/pharmacy/dashboard');
      } else if (data.user.role === 'LAB_TECH') {
        router.push('/laboratory/dashboard');
      } else if (data.user.role === 'NURSE') {
        router.push('/nurse/dashboard');
      } else {
        router.push('/patient/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'password123' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      login(data.token, data.user);
      if (data.user.role === 'HOSPITAL_ADMIN' || data.user.role === 'SUPER_ADMIN' || data.user.role === 'HR_ADMIN' || data.user.role === 'RECEPTIONIST' || data.user.role === 'STAFF') router.push('/admin/dashboard');
      else if (data.user.role === 'DOCTOR') router.push('/doctor/dashboard');
      else if (data.user.role === 'PHARMACIST') router.push('/pharmacy/dashboard');
      else if (data.user.role === 'LAB_TECH') router.push('/laboratory/dashboard');
      else if (data.user.role === 'NURSE') router.push('/nurse/dashboard');
      else router.push('/patient/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 w-full -m-6 p-6 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/30 mb-3">
          <Stethoscope className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
          Nexo Medico AI
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Universal Healthcare Portal & Hospital Operations Login
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Registration Options Bar */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-bold">
          <Link
            href="/register"
            className="p-3 bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-700 rounded-xl text-center text-cyan-300 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Building2 className="w-4 h-4 text-cyan-400" /> Onboard Hospital
          </Link>
          <Link
            href="/patient/register"
            className="p-3 bg-slate-900 hover:bg-blue-950 border border-slate-800 hover:border-blue-700 rounded-xl text-center text-blue-300 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <UserCheck className="w-4 h-4 text-blue-400" /> Patient Registration
          </Link>
        </div>

        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300">
                Email Address or Universal Patient ID (NEXO-PAT-...)
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@metrohospital.org or NEXO-PAT-000001"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Account Password</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 border-t border-slate-800 pt-5">
            <p className="text-[11px] font-extrabold text-slate-400 mb-3 text-center uppercase tracking-wider">
              ⚡ Quick Demo Role Logins
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => quickDemoLogin('admin@metrohospital.org')}
                className="p-2.5 bg-slate-800/80 hover:bg-blue-950/60 border border-slate-700/60 hover:border-blue-700 rounded-xl text-left transition-all"
              >
                <span className="font-bold text-blue-400 block flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Hospital Admin
                </span>
                <span className="text-[10px] text-slate-400">Metropolitan Hospital</span>
              </button>

              <button
                onClick={() => quickDemoLogin('dr.smith@metrohospital.org')}
                className="p-2.5 bg-slate-800/80 hover:bg-purple-950/60 border border-slate-700/60 hover:border-purple-700 rounded-xl text-left transition-all"
              >
                <span className="font-bold text-purple-400 block flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" /> Doctor
                </span>
                <span className="text-[10px] text-slate-400">Dr. Sarah Smith</span>
              </button>

              <button
                onClick={() => quickDemoLogin('pharma.alex@metrohospital.org')}
                className="p-2.5 bg-slate-800/80 hover:bg-emerald-950/60 border border-slate-700/60 hover:border-emerald-700 rounded-xl text-left transition-all"
              >
                <span className="font-bold text-emerald-400 block flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" /> Pharmacist
                </span>
                <span className="text-[10px] text-slate-400">Alex Rivera</span>
              </button>

              <button
                onClick={() => quickDemoLogin('lab.tech@metrohospital.org')}
                className="p-2.5 bg-slate-800/80 hover:bg-amber-950/60 border border-slate-700/60 hover:border-amber-700 rounded-xl text-left transition-all"
              >
                <span className="font-bold text-amber-400 block flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" /> Lab Tech
                </span>
                <span className="text-[10px] text-slate-400">Elena Rostova</span>
              </button>

              <button
                onClick={() => quickDemoLogin('nurse.sarah@metrohospital.org')}
                className="p-2.5 bg-slate-800/80 hover:bg-rose-950/60 border border-slate-700/60 hover:border-rose-700 rounded-xl text-left transition-all"
              >
                <span className="font-bold text-rose-400 block flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5" /> Nurse
                </span>
                <span className="text-[10px] text-slate-400">Sarah Connor</span>
              </button>

              <button
                onClick={() => quickDemoLogin('john.doe@gmail.com')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition-all"
              >
                <span className="font-bold text-slate-300 block flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Patient
                </span>
                <span className="text-[10px] text-slate-400">John Doe</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
