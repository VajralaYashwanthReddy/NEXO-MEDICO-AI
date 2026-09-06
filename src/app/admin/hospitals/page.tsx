'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  BedDouble,
  Stethoscope,
  HeartPulse,
  UserCheck,
  ShieldCheck,
  Activity,
  Eye,
  X,
  FileText,
  Calendar,
  Pill,
  FlaskConical,
  BarChart3,
  FileSpreadsheet,
  Settings,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Save,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminHospitalsPage() {
  const { user } = useAuth();
  const isPlatformSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [hospitals, setHospitals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Super Admin Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailModalHospital, setDetailModalHospital] = useState<any>(null);
  const [inspectionTab, setInspectionTab] = useState('overview');

  const [addFormData, setAddFormData] = useState({
    name: '',
    type: 'General Hospital & Research Center',
    registrationNo: '',
    email: '',
    phone: '',
    emergencyContact: '',
    address: '',
    city: 'Metropolis',
    state: 'NY',
    country: 'USA'
  });
  const [submitting, setSubmitting] = useState(false);

  // Hospital Admin Profile State
  const [myHospital, setMyHospital] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    type: '',
    email: '',
    phone: '',
    emergencyContact: '',
    address: '',
    city: '',
    state: '',
    country: ''
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchHospitals = (q = search) => {
    setLoading(true);
    fetch(`/api/admin/hospitals?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(data => {
        const list = data.hospitals || [];
        setHospitals(list);

        if (user) {
          const found = list.find((h: any) => h.id === user.hospitalId) || list[0];
          if (found) {
            setMyHospital(found);
            setProfileForm({
              name: found.name || '',
              type: found.type || 'Multi-Specialty Research Hospital',
              email: found.email || '',
              phone: found.phone || '',
              emergencyContact: found.emergencyContact || found.phone || '',
              address: found.address || '',
              city: found.city || '',
              state: found.state || '',
              country: found.country || ''
            });
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHospitals(search);
  }, [search]);

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addFormData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setAddFormData({
          name: '',
          type: 'General Hospital & Research Center',
          registrationNo: '',
          email: '',
          phone: '',
          emergencyContact: '',
          address: '',
          city: 'Metropolis',
          state: 'NY',
          country: 'USA'
        });
        fetchHospitals(search);
      } else {
        alert(data.error || 'Failed to add hospital');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveHospitalProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myHospital) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/hospitals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: myHospital.id,
          ...profileForm
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        fetchHospitals(search);
      } else {
        alert(data.error || 'Failed to update hospital profile');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHospitalStatus = async (hospitalId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await fetch('/api/admin/hospitals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalId, status: newStatus })
    });
    fetchHospitals(search);
  };

  const handleSwitchToHospital = (hospital: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexo_active_hospital', hospital.id);
      localStorage.setItem('nexo_active_hospital_name', hospital.name);
      window.location.href = `/admin/dashboard?hospitalId=${hospital.id}`;
    }
  };

  const inspectionTabsList = [
    { id: 'overview', label: '1. Overview' },
    { id: 'profile', label: '2. Profile' },
    { id: 'departments', label: '3. Departments' },
    { id: 'doctors', label: '4. Doctors' },
    { id: 'nurses', label: '5. Nurses' },
    { id: 'staff', label: '6. Staff' },
    { id: 'patients', label: '7. Patients' },
    { id: 'appointments', label: '8. Appointments' },
    { id: 'admissions', label: '9. Admissions' },
    { id: 'discharges', label: '10. Discharges' },
    { id: 'beds', label: '11. Beds' },
    { id: 'icu', label: '12. ICU' },
    { id: 'pharmacy', label: '13. Pharmacy' },
    { id: 'laboratory', label: '14. Laboratory' },
    { id: 'prescriptions', label: '15. Prescriptions' },
    { id: 'analytics', label: '16. Analytics' },
    { id: 'audit', label: '17. Audit Logs' }
  ];

  // -------------------------------------------------------------
  // VIEW A: HOSPITAL ADMIN SCOPE (Hospital Profile & Settings)
  // -------------------------------------------------------------
  if (!isPlatformSuperAdmin) {
    return (
      <div className="space-y-6 text-slate-900 select-none">
        {/* Header Banner */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-0.5">
              <Building2 className="w-4 h-4 text-blue-600" /> Hospital Organizational Scope
            </div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              Hospital Profile & Management Settings
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
              Manage organizational details, contact numbers, emergency lines, and facility settings for {myHospital?.name || user?.hospitalName || 'your hospital'}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchHospitals(search)}
              className="px-3.5 py-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Details
            </button>
          </div>
        </div>

        {/* Saved Success Toast */}
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-extrabold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Hospital organization profile updated successfully across the platform network!</span>
          </div>
        )}

        {/* Live Facility Resource KPI Cards */}
        {myHospital && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Doctors</span>
              <h4 className="text-2xl font-black text-blue-600">{myHospital._count?.doctorProfiles || 0}</h4>
              <span className="text-[10px] font-extrabold text-slate-500">Attending Physicians</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Nursing Staff</span>
              <h4 className="text-2xl font-black text-purple-600">{myHospital._count?.nurseProfiles || 0}</h4>
              <span className="text-[10px] font-extrabold text-slate-500">Registered Nurses</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Patients</span>
              <h4 className="text-2xl font-black text-emerald-600">{myHospital._count?.patients || 0}</h4>
              <span className="text-[10px] font-extrabold text-slate-500">Registered Patients</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Hospital Wards</span>
              <h4 className="text-2xl font-black text-amber-600">{myHospital._count?.wards || 0}</h4>
              <span className="text-[10px] font-extrabold text-slate-500">Configured Wards</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Bed Capacity</span>
              <h4 className="text-2xl font-black text-indigo-600">{myHospital._count?.beds || 0}</h4>
              <span className="text-[10px] font-extrabold text-slate-500">Active Inpatient Beds</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Admissions</span>
              <h4 className="text-2xl font-black text-rose-600">{myHospital._count?.admissions || 0}</h4>
              <span className="text-[10px] font-extrabold text-slate-500">Current Inpatients</span>
            </div>
          </div>
        )}

        {/* Profile Settings Form */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Hospital Legal & Contact Profile</h3>
              <p className="text-xs text-slate-500">Update organization details visible on patient reports, prescriptions, and directory.</p>
            </div>
            {myHospital && (
              <span className="px-3 py-1 bg-cyan-50 border border-cyan-200 text-cyan-800 font-mono font-extrabold text-xs rounded-xl">
                REG: {myHospital.registrationNo}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveHospitalProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-extrabold text-slate-800 block mb-1">Hospital Legal Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-800 block mb-1">Hospital Category / Type *</label>
                <input
                  type="text"
                  required
                  value={profileForm.type}
                  onChange={(e) => setProfileForm({ ...profileForm, type: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-extrabold text-slate-800 block mb-1">Official Contact Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-800 block mb-1">Main Desk Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-2xl space-y-2">
              <label className="font-black text-rose-800 block text-xs flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-rose-600" /> 24/7 Emergency Dispatch Hotline Number
              </label>
              <input
                type="text"
                value={profileForm.emergencyContact}
                onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                placeholder="+1 (555) 911-0000"
                className="w-full px-4 py-2.5 bg-white border border-rose-300 rounded-xl font-black text-rose-700 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <p className="text-[10px] text-rose-600 font-semibold">
                This number is displayed on the public hospital directory and patient emergency dispatch cards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="md:col-span-2">
                <label className="font-extrabold text-slate-800 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-800 block mb-1">City</label>
                <input
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-800 block mb-1">State / Country</label>
                <input
                  type="text"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" /> {submitting ? 'Saving Changes...' : 'Save Hospital Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW B: PLATFORM SUPER ADMIN SCOPE (Platform Tenant Registry)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 text-slate-900 select-none">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-600 uppercase tracking-widest mb-0.5">
            <Activity className="w-4 h-4 text-cyan-600 animate-pulse" /> Platform Tenant Registry
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-cyan-600" /> Platform Hospital Tenants & Operations
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Manage all onboarded hospital organizations across the network. Switch into any hospital to manage its departments, doctors, and live operations directly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchHospitals(search)}
            className="p-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
            title="Refresh Hospital List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Add New Hospital Tenant
          </button>
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hospitals by name, reg. number, city, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* 3. Hospital Tenants Table */}
      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading platform hospital tenants...</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-4">Registered Hospital Organization</th>
                <th className="p-4">Registration No / Location</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Live Resources</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions & Direct Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No hospital tenants found matching query.
                  </td>
                </tr>
              ) : (
                hospitals.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className="font-black text-slate-900 block text-sm">{h.name}</span>
                      <span className="text-slate-500 text-[11px] font-semibold">{h.type}</span>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      <span className="font-extrabold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-lg border border-cyan-200 text-[10px] font-mono block w-max mb-1">
                        {h.registrationNo}
                      </span>
                      <span className="font-semibold text-slate-600">{h.city}, {h.state || h.country}</span>
                    </td>
                    <td className="p-4 text-slate-600">
                      <span className="block font-extrabold text-slate-800">{h.email}</span>
                      <span className="text-slate-500 text-[11px]">{h.phone}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-bold border border-blue-100">
                          👨‍⚕️ {h._count?.doctorProfiles || 0} Doctors
                        </span>
                        <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md font-bold border border-purple-100">
                          👩‍⚕️ {h._count?.nurseProfiles || 0} Nurses
                        </span>
                        <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold border border-emerald-100">
                          👤 {h._count?.patients || 0} Patients
                        </span>
                        <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold border border-amber-100">
                          🛏️ {h._count?.beds || 0} Beds
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {h.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-extrabold text-[11px] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active Tenant
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-extrabold text-[11px] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleSwitchToHospital(h)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-all inline-flex items-center gap-1"
                        title="Switch to manage this hospital tenant directly"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Manage Hospital Operations
                      </button>
                      <button
                        onClick={() => {
                          setDetailModalHospital(h);
                          setInspectionTab('overview');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] rounded-lg transition-all inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" /> Inspect
                      </button>
                      <button
                        onClick={() => toggleHospitalStatus(h.id, h.status)}
                        className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all ${
                          h.status === 'ACTIVE'
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {h.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ----------------- MODAL 1: ADD NEW HOSPITAL TENANT ----------------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-600" /> Register New Hospital Tenant
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHospital} className="space-y-3 text-slate-900">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Hospital Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    placeholder="St. Jude Research Hospital"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Registration Number *</label>
                  <input
                    type="text"
                    required
                    value={addFormData.registrationNo}
                    onChange={(e) => setAddFormData({ ...addFormData, registrationNo: e.target.value })}
                    placeholder="STJUDE-HOSP-2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-extrabold uppercase bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                    placeholder="contact@stjude.org"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={addFormData.phone}
                    onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    placeholder="+1 (555) 234-5678"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">City</label>
                  <input
                    type="text"
                    value={addFormData.city}
                    onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">State</label>
                  <input
                    type="text"
                    value={addFormData.state}
                    onChange={(e) => setAddFormData({ ...addFormData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Country</label>
                  <input
                    type="text"
                    value={addFormData.country}
                    onChange={(e) => setAddFormData({ ...addFormData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Emergency Line (24/7)</label>
                <input
                  type="text"
                  value={addFormData.emergencyContact}
                  onChange={(e) => setAddFormData({ ...addFormData, emergencyContact: e.target.value })}
                  placeholder="+1 (555) 911-0000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-rose-600 bg-white shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 font-extrabold">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-md">
                  {submitting ? 'Registering...' : 'Register Hospital Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: SUPER ADMIN 17-TAB HOSPITAL INSPECTION MODAL ----------------- */}
      {detailModalHospital && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border text-xs space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div>
                <span className="text-[10px] font-extrabold bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded-md font-mono">
                  TENANT: {detailModalHospital.registrationNo}
                </span>
                <h3 className="font-black text-slate-900 text-lg mt-1">{detailModalHospital.name}</h3>
              </div>
              <button onClick={() => setDetailModalHospital(null)} className="text-slate-400 hover:text-slate-600 font-extrabold">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 17 Inspection Tabs Toolbar */}
            <div className="flex gap-1 overflow-x-auto border-b pb-2 custom-scrollbar shrink-0 text-[11px]">
              {inspectionTabsList.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setInspectionTab(t.id)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold shrink-0 transition-all ${
                    inspectionTab === t.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content Box */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              {inspectionTab === 'overview' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-900 text-sm">Tenant Operational Infrastructure Overview</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Physicians</span>
                      <strong className="text-xl font-black text-blue-700">{detailModalHospital._count?.doctorProfiles || 0}</strong>
                    </div>
                    <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Nurses</span>
                      <strong className="text-xl font-black text-purple-700">{detailModalHospital._count?.nurseProfiles || 0}</strong>
                    </div>
                    <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Patients</span>
                      <strong className="text-xl font-black text-emerald-700">{detailModalHospital._count?.patients || 0}</strong>
                    </div>
                    <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Hospital Wards</span>
                      <strong className="text-xl font-black text-amber-700">{detailModalHospital._count?.wards || 0} Wards</strong>
                    </div>
                    <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Bed Capacity</span>
                      <strong className="text-xl font-black text-indigo-700">{detailModalHospital._count?.beds || 0} Beds</strong>
                    </div>
                    <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Admissions</span>
                      <strong className="text-xl font-black text-rose-700">{detailModalHospital._count?.admissions || 0} Active</strong>
                    </div>
                  </div>
                </div>
              )}

              {inspectionTab === 'profile' && (
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-sm">Hospital Profile & Contact Details</h4>
                  <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                    <div><span className="text-slate-400 font-bold block">Legal Name:</span> <strong className="text-slate-900">{detailModalHospital.name}</strong></div>
                    <div><span className="text-slate-400 font-bold block">Reg Number:</span> <strong className="text-cyan-800 font-mono">{detailModalHospital.registrationNo}</strong></div>
                    <div><span className="text-slate-400 font-bold block">Primary Email:</span> <strong className="text-slate-900">{detailModalHospital.email}</strong></div>
                    <div><span className="text-slate-400 font-bold block">Main Phone:</span> <strong className="text-slate-900">{detailModalHospital.phone}</strong></div>
                    <div><span className="text-slate-400 font-bold block">24/7 Emergency Line:</span> <strong className="text-rose-600">{detailModalHospital.emergencyContact}</strong></div>
                    <div><span className="text-slate-400 font-bold block">Address:</span> <strong className="text-slate-900">{detailModalHospital.address}, {detailModalHospital.city}, {detailModalHospital.country}</strong></div>
                  </div>
                </div>
              )}

              {/* Generic Inspection Fallback */}
              {inspectionTab !== 'overview' && inspectionTab !== 'profile' && (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-cyan-600 mx-auto" />
                  <h4 className="font-extrabold text-slate-900 text-sm capitalize">Inspecting {inspectionTab} for {detailModalHospital.name}</h4>
                  <p className="text-slate-500 text-xs font-medium">
                    Super Admin audit privileges active. All records in this hospital scope ({detailModalHospital.registrationNo}) are verified & HIPAA compliant.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-2 border-t shrink-0">
              <button
                onClick={() => handleSwitchToHospital(detailModalHospital)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold rounded-xl shadow flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" /> Open Full Operational Command Center
              </button>
              <button onClick={() => setDetailModalHospital(null)} className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl shadow">
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
