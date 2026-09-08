'use client';

import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  FileText,
  ChevronRight,
  Globe,
  Building2,
  Eye,
  X,
  HeartPulse,
  Pill,
  FlaskConical,
  ShieldCheck,
  Calendar,
  AlertCircle,
  XCircle,
  CheckCircle2,
  Lock,
  Key,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function PatientsManagementPage() {
  const { user } = useAuth();
  const isPlatformSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [patients, setPatients] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isGlobalMode, setIsGlobalMode] = useState(isPlatformSuperAdmin);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [detailPatient, setDetailPatient] = useState<any>(null);
  const [credentialsModal, setCredentialsModal] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    dob: '1985-04-12',
    gender: 'Male',
    phone: '+1 (555) 012-3456',
    email: '',
    password: 'password123',
    hospitalId: user?.hospitalId || '',
    address: '123 Hospital Lane',
    emergencyContact: 'Family Contact - +1 (555) 999-0000',
    bloodGroup: 'O+',
    allergies: 'Penicillin',
    conditions: 'Hypertension',
    previousHistory: 'None'
  });

  const handleOpenModal = () => {
    setFormData(prev => ({
      ...prev,
      hospitalId: user?.hospitalId || prev.hospitalId || ''
    }));
    setShowModal(true);
  };

  const fetchPatients = (query = search, global = isGlobalMode, hospitalId = selectedHospitalFilter) => {
    const jwt = typeof window !== 'undefined' ? localStorage.getItem('nexo_jwt') : null;
    let url = `/api/patients?global=${global}&q=${encodeURIComponent(query)}`;
    if (hospitalId) {
      url += `&hospitalId=${hospitalId}`;
    }
    fetch(url, {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.patients) {
          setPatients(data.patients);
        }
      })
      .catch(err => console.error('Fetch patients error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/admin/hospitals')
      .then(res => res.json())
      .then(data => setHospitals(data.hospitals || []));

    fetchPatients(search, isPlatformSuperAdmin ? true : isGlobalMode, selectedHospitalFilter);

    // Real-time automatic polling every 5 seconds
    const pollInterval = setInterval(() => {
      fetchPatients(search, isPlatformSuperAdmin ? true : isGlobalMode, selectedHospitalFilter);
    }, 5000);

    // SSE EventSource for immediate real-time updates when a new patient registers
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === 'PATIENT_REGISTERED' || parsed.event === 'PATIENT_REGISTER_GLOBAL') {
            fetchPatients(search, isPlatformSuperAdmin ? true : isGlobalMode, selectedHospitalFilter);
          }
        } catch (e) {
          // silent parse catch
        }
      };
    } catch (sseErr) {
      console.warn('SSE EventSource subscription error:', sseErr);
    }

    const handleFocus = () => {
      fetchPatients(search, isPlatformSuperAdmin ? true : isGlobalMode, selectedHospitalFilter);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(pollInterval);
      if (eventSource) eventSource.close();
      window.removeEventListener('focus', handleFocus);
    };
  }, [isGlobalMode, selectedHospitalFilter, isPlatformSuperAdmin]);

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        hospitalId: formData.hospitalId || user?.hospitalId || ''
      };
      const jwt = typeof window !== 'undefined' ? localStorage.getItem('nexo_jwt') : null;
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setCredentialsModal(data.credentials);
        setFormData({
          fullName: '',
          dob: '1985-04-12',
          gender: 'Male',
          phone: '+1 (555) 012-3456',
          email: '',
          password: 'password123',
          hospitalId: user?.hospitalId || '',
          address: '123 Hospital Lane',
          emergencyContact: 'Family Contact - +1 (555) 999-0000',
          bloodGroup: 'O+',
          allergies: 'Penicillin',
          conditions: 'Hypertension',
          previousHistory: 'None'
        });
        fetchPatients(search, isGlobalMode, selectedHospitalFilter);
      } else {
        alert(data.error || 'Failed to register patient');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePatientStatus = async (patientId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch('/api/patients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, status: newStatus })
      });
      if (res.ok) {
        fetchPatients(search, isGlobalMode, selectedHospitalFilter);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyCredentials = () => {
    if (!credentialsModal) return;
    const text = `Nexo Medico AI Patient Portal Login:\nURL: http://localhost:3000/login\nUniversal Patient ID: ${credentialsModal.patientCode}\nLogin Email/ID: ${credentialsModal.loginIdentifier}\nPassword: ${credentialsModal.defaultPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPatients = selectedHospitalFilter
    ? patients.filter(p => p.hospitalId === selectedHospitalFilter)
    : patients;

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-0.5">
            {isPlatformSuperAdmin ? '🌐 Global Universal Patient Directory' : '🏥 Hospital Patient Directory'}
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            {isPlatformSuperAdmin ? 'Global Patient Registry & Universal Identity' : 'Hospital Patient Registry & Universal Identity'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPlatformSuperAdmin
              ? "Patients are global entities with Universal Patient IDs (`NEXO-PAT-xxxxxx`). All consultations, prescriptions & lab reports across hospitals store into the patient's global portal."
              : `Manage registered patients, universal IDs, and medical profiles for ${user?.hospitalName || 'your hospital'}.`}
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> {isPlatformSuperAdmin ? 'Register Global Patient' : 'Register New Patient'}
        </button>
      </div>

      {/* Search & Hospital Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              fetchPatients(e.target.value, isGlobalMode, selectedHospitalFilter);
            }}
            placeholder="Search by patient name, Universal ID (NEXO-PAT-...), phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
          />
        </div>

        {isPlatformSuperAdmin && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Hospital Tenant Dropdown Filter */}
            <div className="flex items-center gap-2 text-xs bg-white border border-slate-300 px-3 py-1.5 rounded-xl shadow-2xs">
              <Building2 className="w-4 h-4 text-blue-600" />
              <select
                value={selectedHospitalFilter}
                onChange={(e) => setSelectedHospitalFilter(e.target.value)}
                className="bg-white font-extrabold text-slate-900 focus:outline-none"
              >
                <option value="">All Hospital Tenants (Global View)</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading global patient registry...</p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-4">Universal Patient ID</th>
                <th className="p-4">Patient Demographics</th>
                <th className="p-4">Home Hospital / Primary Center</th>
                <th className="p-4">Allergies & Medical Conditions</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Actions & Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((p) => {
                const isSuspended = p.user?.status === 'SUSPENDED';
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className="font-extrabold text-cyan-800 block text-xs bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200 inline-block font-mono">
                        {p.patientCode}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-extrabold text-slate-900 block text-sm">{p.fullName}</span>
                      <span className="text-slate-500 text-[11px]">
                        {p.gender}, DOB: {p.dob} | Phone: {p.phone} | Blood: <strong className="text-rose-600 font-black">{p.bloodGroup}</strong>
                      </span>
                      <span className="block text-[10px] text-cyan-700 font-mono">Login: {p.email || p.patientCode}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-900 font-extrabold">
                        <Building2 className="w-3.5 h-3.5 text-cyan-600" /> {p.hospital?.name || 'Central Registry'}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">{p.hospital?.city || 'Universal Network'}</span>
                    </td>
                    <td className="p-4">
                      {p.allergies ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold block mb-1">
                          Allergies: {p.allergies}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] block">No known allergies</span>
                      )}
                      <span className="text-slate-600 text-[11px] font-medium block truncate max-w-xs">
                        {p.conditions || 'No chronic conditions'}
                      </span>
                    </td>
                    <td className="p-4">
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-extrabold text-[10px] bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-extrabold text-[10px] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setDetailPatient(p)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg text-[11px] inline-flex items-center gap-1 transition-all"
                        title="Inspect Patient Details & Profile"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" /> View Details
                      </button>

                      <Link
                        href={`/doctor/patient/${p.id}`}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold rounded-lg text-[11px] inline-flex items-center gap-1 transition-all shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" /> Full Timeline <ChevronRight className="w-3 h-3" />
                      </Link>

                      {isPlatformSuperAdmin && (
                        <button
                          onClick={() => togglePatientStatus(p.id, isSuspended ? 'SUSPENDED' : 'ACTIVE')}
                          className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all ${
                            isSuspended
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                          }`}
                        >
                          {isSuspended ? 'Activate' : 'Suspend Account'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ----------------- MODAL 1: PATIENT DETAILS INSPECTION ----------------- */}
      {detailPatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-mono font-extrabold bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded-md">
                  UNIVERSAL ID: {detailPatient.patientCode}
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg mt-1">{detailPatient.fullName}</h3>
              </div>
              <button onClick={() => setDetailPatient(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border">
              <div><span className="text-slate-400 block font-bold">Gender & DOB:</span> <strong className="text-slate-800">{detailPatient.gender}, DOB: {detailPatient.dob}</strong></div>
              <div><span className="text-slate-400 block font-bold">Blood Group:</span> <strong className="text-rose-600">{detailPatient.bloodGroup}</strong></div>
              <div><span className="text-slate-400 block font-bold">Primary Phone:</span> <strong className="text-slate-800">{detailPatient.phone}</strong></div>
              <div><span className="text-slate-400 block font-bold">Portal Login Email:</span> <strong className="text-cyan-800">{detailPatient.email || detailPatient.patientCode}</strong></div>
              <div><span className="text-slate-400 block font-bold">Emergency Contact:</span> <strong className="text-slate-800">{detailPatient.emergencyContact}</strong></div>
              <div><span className="text-slate-400 block font-bold">Account Status:</span> <strong className={detailPatient.user?.status === 'SUSPENDED' ? 'text-rose-600' : 'text-emerald-600'}>{detailPatient.user?.status || 'ACTIVE'}</strong></div>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 text-xs">Medical Profile & Alerts</h4>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <span className="font-extrabold text-rose-800 block text-[10px]">ALLERGIES:</span>
                <p className="text-rose-900 font-semibold">{detailPatient.allergies || 'No known allergies'}</p>
              </div>
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-1">
                <span className="font-extrabold text-slate-700 block text-[10px]">CHRONIC MEDICAL CONDITIONS:</span>
                <p className="text-slate-800 font-semibold">{detailPatient.conditions || 'No recorded conditions'}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <Link
                href={`/doctor/patient/${detailPatient.id}`}
                className="px-4 py-2 bg-cyan-600 text-white font-bold rounded-xl shadow inline-flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Open Universal Clinical Timeline
              </Link>
              <button onClick={() => setDetailPatient(null)} className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl shadow">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: REGISTER GLOBAL PATIENT ----------------- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-widest block">
                  🌐 Universal Identity System
                </span>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                  <UserCheck className="w-5 h-5 text-cyan-600" /> Register Global Patient Account
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-900 text-[11px] font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>Generates a Universal Patient ID (`NEXO-PAT-xxxxxx`). All hospital consultations, prescriptions, and lab reports link into the patient portal automatically.</span>
            </div>

            <form onSubmit={handleRegisterPatient} className="space-y-3 text-slate-900">
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Initial Primary Hospital Center (Optional)</label>
                <select
                  value={formData.hospitalId}
                  onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                >
                  <option value="">Global Central Patient Registry (No Fixed Single Hospital)</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id} className="font-bold text-slate-900 bg-white">{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Yashu"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              {/* Portal Login Credentials Fields */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Portal Login Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="yashu@gmail.com"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Portal Password *</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="password123"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono font-extrabold bg-white text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                  >
                    <option value="Male" className="font-bold text-slate-900 bg-white">Male</option>
                    <option value="Female" className="font-bold text-slate-900 bg-white">Female</option>
                    <option value="Other" className="font-bold text-slate-900 bg-white">Other</option>
                  </select>
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 012-3456"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black bg-white text-rose-600 shadow-2xs"
                  >
                    <option value="A+" className="font-bold text-slate-900 bg-white">A+</option>
                    <option value="A-" className="font-bold text-slate-900 bg-white">A-</option>
                    <option value="B+" className="font-bold text-slate-900 bg-white">B+</option>
                    <option value="B-" className="font-bold text-slate-900 bg-white">B-</option>
                    <option value="O+" className="font-bold text-slate-900 bg-white">O+</option>
                    <option value="O-" className="font-bold text-slate-900 bg-white">O-</option>
                    <option value="AB+" className="font-bold text-slate-900 bg-white">AB+</option>
                    <option value="AB-" className="font-bold text-slate-900 bg-white">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Known Allergies</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Sulfa, Peanuts"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-rose-700 placeholder:text-slate-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Chronic Medical Conditions</label>
                <input
                  type="text"
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  placeholder="e.g. Type 2 Diabetes, Hypertension"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-500 font-extrabold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-md">
                  Register & Generate Universal ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 3: CREATED PATIENT LOGIN CREDENTIALS BANNER ----------------- */}
      {credentialsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Patient Account Created Live!</h3>
                  <span className="text-[10px] font-extrabold text-emerald-600">Universal Access Granted</span>
                </div>
              </div>
              <button onClick={() => setCredentialsModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Universal Patient ID:</span>
                <span className="text-base font-black text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded border border-cyan-200 inline-block">
                  {credentialsModal.patientCode}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Login Email / Identifier:</span>
                <span className="font-bold text-slate-900 block text-xs">{credentialsModal.loginIdentifier}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Portal Access Password:</span>
                <span className="font-extrabold text-purple-700 block text-xs">{credentialsModal.defaultPassword}</span>
              </div>

              <div className="space-y-0.5 pt-1 border-t">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Login URL:</span>
                <span className="font-bold text-blue-600 block text-[11px]">http://localhost:3000/login</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={copyCredentials}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl inline-flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
              </button>

              <button
                onClick={() => setCredentialsModal(null)}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold rounded-xl shadow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
