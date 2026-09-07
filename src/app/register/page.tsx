'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Building2, CheckCircle2, ChevronRight, ChevronLeft, Shield, Stethoscope } from 'lucide-react';

export default function HospitalRegisterWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    hospitalName: '',
    hospitalType: 'Multi-Specialty Research Hospital',
    registrationNo: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'USA',
    website: '',
    emergencyContact: '',
    numberDepartments: '5',
    numberBeds: '50',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/hospitals/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed');

      login(data.token, {
        id: data.adminUser.id,
        email: data.adminUser.email,
        name: data.adminUser.name,
        role: data.adminUser.role,
        hospitalId: data.hospital.id,
        hospitalName: data.hospital.name,
        permissions: ['*']
      });

      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8 w-full select-none overflow-x-hidden">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-600 text-white mb-3 shadow-lg shadow-cyan-600/30">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Hospital Onboarding Wizard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Register your hospital organization and initialize tenant infrastructure
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs transition-all ${
                  step === s
                    ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/20'
                    : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step === s ? 'text-cyan-400' : 'text-slate-500'}`}>
                {s === 1 ? 'Hospital Info' : s === 2 ? 'Location' : s === 3 ? 'Capacity' : 'Admin Account'}
              </span>
            </div>
          ))}
        </div>

        {/* Main Wizard Form */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          {error && (
            <div className="mb-6 p-3.5 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            {/* STEP 1: Basic Hospital Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">Step 1: Organization Details</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Hospital Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.hospitalName}
                    onChange={(e) => updateField('hospitalName', e.target.value)}
                    placeholder="e.g. St. Jude Memorial Hospital"
                    className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Registration Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.registrationNo}
                      onChange={(e) => updateField('registrationNo', e.target.value)}
                      placeholder="REG-2026-84920"
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Hospital Type</label>
                    <select
                      value={formData.hospitalType}
                      onChange={(e) => updateField('hospitalType', e.target.value)}
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="Multi-Specialty Research Hospital">Multi-Specialty Research Hospital</option>
                      <option value="General Hospital">General Hospital</option>
                      <option value="Academic Medical Center">Academic Medical Center</option>
                      <option value="Community Clinic">Community Clinic</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Official Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="contact@stjudehospital.org"
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="+1 (555) 019-2831"
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Location & Emergency Contact */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">Step 2: Location & Emergency Contact</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="742 Healthcare Boulevard, Medical District"
                    className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="New York"
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      placeholder="NY"
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      placeholder="USA"
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">24/7 Emergency Line *</label>
                    <input
                      type="text"
                      required
                      value={formData.emergencyContact}
                      onChange={(e) => updateField('emergencyContact', e.target.value)}
                      placeholder="+1 (555) 911-0000"
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Website URL</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="https://stjudehospital.org"
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Scale & Configuration */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">Step 3: Initial Capacity Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Number of Departments</label>
                    <input
                      type="number"
                      value={formData.numberDepartments}
                      onChange={(e) => updateField('numberDepartments', e.target.value)}
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Total Bed Capacity</label>
                    <input
                      type="number"
                      value={formData.numberBeds}
                      onChange={(e) => updateField('numberBeds', e.target.value)}
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                  <p className="font-semibold text-slate-300">Auto-created Modules upon completion:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Core Departments (General Medicine, Emergency, Cardiology, Neurology, ICU)</li>
                    <li>General Wards & Inpatient Beds Grid</li>
                    <li>ICU Monitoring Unit & Emergency Triage Dashboard</li>
                    <li>Pharmacy & Laboratory Catalog</li>
                  </ul>
                </div>
              </div>
            )}

            {/* STEP 4: Admin Account Credentials */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">Step 4: Hospital Administrator Account</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Admin Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.adminName}
                    onChange={(e) => updateField('adminName', e.target.value)}
                    placeholder="Dr. Arthur Vance (Administrator)"
                    className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Admin Login Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => updateField('adminEmail', e.target.value)}
                    placeholder="admin@stjudehospital.org"
                    className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.adminPassword}
                    onChange={(e) => updateField('adminPassword', e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Wizard Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-white">
                  Cancel & Back to Login
                </Link>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && (!formData.hospitalName || !formData.registrationNo || !formData.email)) {
                      setError('Please fill in required hospital fields');
                      return;
                    }
                    setError('');
                    setStep(step + 1);
                  }}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-md shadow-cyan-600/30"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/30"
                >
                  {loading ? 'Initializing Tenant...' : 'Complete Registration & Launch Dashboard'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
