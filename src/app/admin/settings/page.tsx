'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building2, Save, Phone, Mail, Globe, MapPin } from 'lucide-react';

export default function HospitalSettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: user?.hospitalName || 'Metropolitan General Hospital & Research Center',
    registrationNo: 'METRO-HOSP-2026-001',
    email: 'contact@metrohospital.org',
    phone: '+1 (555) 019-2831',
    emergencyContact: '+1 (555) 911-0000',
    address: '742 Healthcare Boulevard, Medical District',
    city: 'Metropolis',
    state: 'New York',
    country: 'USA',
    website: 'https://metrohospital.org'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-600" /> Hospital Profile & Tenant Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure organization branding, emergency contact lines, and operating parameters
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl">
          ✓ Hospital Tenant Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
        <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Hospital Organization Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-700">Hospital Legal Name</label>
            <input
              type="text"
              value={formData.hospitalName}
              onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700">Registration Number</label>
            <input
              type="text"
              disabled
              value={formData.registrationNo}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-slate-100 font-mono text-slate-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-slate-700">Primary Official Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <h3 className="font-bold text-slate-800 text-sm border-b pb-2 pt-2">Location & Emergency Protocols</h3>
        <div>
          <label className="font-semibold text-slate-700">Street Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-semibold text-slate-700">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700">State</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700">Emergency Line (24/7)</label>
            <input
              type="text"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg font-bold text-rose-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button type="submit" className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-md">
            <Save className="w-4 h-4" /> Save Profile Settings
          </button>
        </div>
      </form>
    </div>
  );
}
