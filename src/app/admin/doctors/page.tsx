'use client';

import React, { useEffect, useState } from 'react';
import {
  Stethoscope,
  Building2,
  Search,
  Calendar,
  UserCheck,
  CheckCircle2,
  XCircle,
  Plus,
  UserPlus,
  Trash2,
  Eye,
  Key,
  Copy,
  Check,
  Briefcase,
  ShieldCheck,
  Phone,
  Mail,
  RefreshCw,
  Award
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DoctorManagementPage() {
  const { user } = useAuth();
  const isPlatformSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [credentialsModal, setCredentialsModal] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [inspectDoctor, setInspectDoctor] = useState<any>(null);

  const [docFormData, setDocFormData] = useState({
    name: '',
    email: '',
    password: 'doctor123',
    phone: '+1 (555) 019-2831',
    specialization: 'General Medicine',
    departmentId: '',
    licenseNo: '',
    employeeId: '',
    qualification: 'MD, MBBS',
    consultationFee: '150'
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    let url = `/api/admin/doctors?q=${encodeURIComponent(search)}`;
    if (!isPlatformSuperAdmin && user?.hospitalId) {
      url += `&hospitalId=${user.hospitalId}`;
    }
    if (selectedDeptFilter) {
      url += `&departmentId=${selectedDeptFilter}`;
    }

    Promise.all([
      fetch(url).then(res => res.json()),
      fetch('/api/departments').then(res => res.json())
    ])
      .then(([docRes, deptRes]) => {
        setDoctors(docRes.doctors || []);
        setDepartments(deptRes.departments || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedDeptFilter, isPlatformSuperAdmin, user?.hospitalId]);

  const handleOpenAddDoctor = (deptId = '') => {
    setEditingDoctor(null);
    setDocFormData({
      name: '',
      email: '',
      password: 'doctor123',
      phone: '+1 (555) 019-2831',
      specialization: deptId ? (departments.find(d => d.id === deptId)?.name || 'General Medicine') : 'General Medicine',
      departmentId: deptId || (departments[0]?.id || ''),
      licenseNo: '',
      employeeId: '',
      qualification: 'MD, MBBS',
      consultationFee: '150'
    });
    setShowDoctorModal(true);
  };

  const handleOpenEditDoctor = (doc: any) => {
    setEditingDoctor(doc);
    setDocFormData({
      name: doc.user?.name || '',
      email: doc.user?.email || '',
      password: '',
      phone: doc.phone || '+1 (555) 019-2831',
      specialization: doc.specialization || 'General Medicine',
      departmentId: doc.departmentId || '',
      licenseNo: doc.registrationNo || '',
      employeeId: doc.employeeId || '',
      qualification: doc.qualification || 'MD, MBBS',
      consultationFee: String(doc.consultationFee || 150)
    });
    setShowDoctorModal(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingDoctor) {
        // PUT Edit Doctor
        const res = await fetch('/api/admin/doctors', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            doctorId: editingDoctor.id,
            name: docFormData.name,
            email: docFormData.email,
            password: docFormData.password || undefined,
            specialization: docFormData.specialization,
            departmentId: docFormData.departmentId,
            licenseNo: docFormData.licenseNo,
            consultationFee: docFormData.consultationFee
          })
        });
        const data = await res.json();
        if (res.ok) {
          setShowDoctorModal(false);
          setEditingDoctor(null);
          fetchData();
        } else {
          alert(data.error || 'Failed to update doctor details');
        }
      } else {
        // POST Create Doctor
        const res = await fetch('/api/admin/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...docFormData,
            hospitalId: user?.hospitalId || ''
          })
        });
        const data = await res.json();
        if (res.ok) {
          setShowDoctorModal(false);
          setCredentialsModal(data.credentials);
          fetchData();
        } else {
          alert(data.error || 'Failed to onboard doctor');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDoctorStatus = async (doctorId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, status: newStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm('Are you sure you want to remove this doctor profile and revoke portal access?')) return;
    try {
      const res = await fetch(`/api/admin/doctors?id=${doctorId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyCredentials = () => {
    if (!credentialsModal) return;
    const text = `Nexo Medico AI Doctor Portal Access:\nURL: http://localhost:3000/login\nDoctor Name: ${credentialsModal.name}\nDepartment: ${credentialsModal.departmentName}\nLogin Email: ${credentialsModal.email}\nPassword: ${credentialsModal.password}\nLicense: ${credentialsModal.licenseNo}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredDoctors = (!isPlatformSuperAdmin && user?.hospitalId)
    ? doctors.filter(d => d.hospitalId === user.hospitalId)
    : doctors;

  return (
    <div className="space-y-6 select-none text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-purple-600 uppercase tracking-widest mb-0.5">
            {isPlatformSuperAdmin ? '🌐 Global Physician Directory' : '🏥 Hospital Physician Staff Directory'}
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-purple-600" />
            {isPlatformSuperAdmin ? 'Platform Global Physician Directory' : 'Hospital Attending Physicians & Doctors'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPlatformSuperAdmin
              ? 'Directory of attending physicians, medical specializations, license numbers, and appointment activity across hospitals'
              : `Manage attending physicians, department assignments, and portal access credentials for ${user?.hospitalName || 'your hospital'}`}
          </p>
        </div>

        <button
          onClick={() => handleOpenAddDoctor('')}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Onboard New Doctor
        </button>
      </div>

      {/* Search & Department Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search physician by name, specialization, or license..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm"
          />
        </div>

        {departments.length > 0 && (
          <div className="flex items-center gap-2 text-xs bg-white border border-slate-300 px-3 py-1.5 rounded-xl shadow-2xs">
            <Briefcase className="w-4 h-4 text-purple-600" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-white font-extrabold text-slate-900 focus:outline-none"
            >
              <option value="">All Hospital Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Doctors Table */}
      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading physician directory...</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-4">Physician Name / Portal Login</th>
                <th className="p-4">Department & Hospital</th>
                <th className="p-4">Specialization</th>
                <th className="p-4">License / Employee ID</th>
                <th className="p-4">Activity & Fee</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions & Access Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    No attending physicians found matching query.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((d) => {
                  const isSuspended = d.user?.status === 'SUSPENDED';
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <span className="font-extrabold text-slate-900 block text-sm">{d.user?.name || 'Dr. Physician'}</span>
                        <span className="text-slate-500 font-mono text-[11px] block">{d.user?.email}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-extrabold text-blue-700 block text-xs">
                          {d.department?.name || 'General Clinical Department'}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" /> {d.hospital?.name || user?.hospitalName || 'Metropolitan Hospital'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-bold text-[10px] border border-purple-200 inline-block">
                          {d.specialization}
                        </span>
                      </td>
                      <td className="p-4 text-slate-700 font-mono font-bold">
                        <span className="block text-xs text-slate-900">{d.registrationNo || 'MD-LIC-2026'}</span>
                        <span className="text-[10px] text-slate-400">ID: {d.employeeId || 'EMP-DOC'}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-[11px] text-slate-700 font-bold block">
                          📅 {d._count?.appointments || 0} Appts | 📝 {d._count?.prescriptions || 0} Rx
                        </span>
                        <span className="text-[10px] text-emerald-700 font-extrabold block">
                          Fee: ${d.consultationFee || 150} / visit
                        </span>
                      </td>
                      <td className="p-4">
                        {isSuspended ? (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-full text-[10px] border border-rose-200 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" /> Suspended
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active MD
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        <button
                          onClick={() => setInspectDoctor(d)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg text-[11px] inline-flex items-center gap-1 transition-all"
                          title="Inspect Doctor Profile"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" /> Inspect
                        </button>
                        <button
                          onClick={() => handleOpenEditDoctor(d)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold rounded-lg text-[11px] border border-blue-200 inline-flex items-center gap-1 transition-all"
                          title="Edit Details & Department"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleDoctorStatus(d.id, isSuspended ? 'SUSPENDED' : 'ACTIVE')}
                          className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                            isSuspended
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                          }`}
                        >
                          {isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(d.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="Delete Doctor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ----------------- MODAL 1: INSPECT DOCTOR DETAILS ----------------- */}
      {inspectDoctor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{inspectDoctor.user?.name}</h3>
                  <span className="text-[10px] font-extrabold text-purple-600">{inspectDoctor.specialization}</span>
                </div>
              </div>
              <button onClick={() => setInspectDoctor(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div><span className="text-slate-400 font-bold block text-[10px]">MEDICAL LICENSE NO:</span> <strong className="text-slate-900 font-mono">{inspectDoctor.registrationNo}</strong></div>
              <div><span className="text-slate-400 font-bold block text-[10px]">STAFF EMPLOYEE ID:</span> <strong className="text-slate-900 font-mono">{inspectDoctor.employeeId}</strong></div>
              <div><span className="text-slate-400 font-bold block text-[10px]">CLINICAL DEPARTMENT:</span> <strong className="text-blue-700">{inspectDoctor.department?.name || 'General Clinical'}</strong></div>
              <div><span className="text-slate-400 font-bold block text-[10px]">HOSPITAL TENANT:</span> <strong className="text-slate-800">{inspectDoctor.hospital?.name}</strong></div>
              <div><span className="text-slate-400 font-bold block text-[10px]">PORTAL LOGIN EMAIL:</span> <strong className="text-slate-800">{inspectDoctor.user?.email}</strong></div>
              <div><span className="text-slate-400 font-bold block text-[10px]">QUALIFICATIONS:</span> <strong className="text-slate-800">{inspectDoctor.qualification || 'MD, MBBS'}</strong></div>
              <div><span className="text-slate-400 font-bold block text-[10px]">CONSULTATION FEE:</span> <strong className="text-emerald-700">${inspectDoctor.consultationFee || 150} / visit</strong></div>
              <div><span className="text-slate-400 font-bold block text-[10px]">ACCOUNT STATUS:</span> <strong className={inspectDoctor.user?.status === 'SUSPENDED' ? 'text-rose-600' : 'text-emerald-600'}>{inspectDoctor.user?.status || 'ACTIVE'}</strong></div>
            </div>

            <div className="flex justify-end border-t pt-3">
              <button onClick={() => setInspectDoctor(null)} className="px-5 py-2 bg-slate-900 text-white font-extrabold rounded-xl shadow">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: ONBOARD / EDIT DOCTOR ----------------- */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-widest block">
                  🩺 Hospital Physician Governance
                </span>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                  {editingDoctor ? 'Edit Doctor Profile & Access' : 'Onboard Doctor & Grant Portal Access'}
                </h3>
              </div>
              <button onClick={() => setShowDoctorModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-3 text-slate-900">
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Assign Clinical Department *</label>
                <select
                  required
                  value={docFormData.departmentId}
                  onChange={(e) => setDocFormData({ ...docFormData, departmentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                >
                  <option value="">Select Target Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id} className="font-bold text-slate-900 bg-white">
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={docFormData.name}
                    onChange={(e) => setDocFormData({ ...docFormData, name: e.target.value })}
                    placeholder="Dr. Sarah Smith, MD"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Medical Specialization *</label>
                  <input
                    type="text"
                    required
                    value={docFormData.specialization}
                    onChange={(e) => setDocFormData({ ...docFormData, specialization: e.target.value })}
                    placeholder="Interventional Cardiology"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Portal Login Credentials Fields */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Doctor Login Email *</label>
                  <input
                    type="email"
                    required
                    value={docFormData.email}
                    onChange={(e) => setDocFormData({ ...docFormData, email: e.target.value })}
                    placeholder="dr.smith@metrohospital.org"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Portal Password {editingDoctor ? '(Leave blank to keep)' : '*'}</label>
                  <input
                    type="text"
                    required={!editingDoctor}
                    value={docFormData.password}
                    onChange={(e) => setDocFormData({ ...docFormData, password: e.target.value })}
                    placeholder="doctor123"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono font-extrabold bg-white text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Medical License Number *</label>
                  <input
                    type="text"
                    required
                    value={docFormData.licenseNo}
                    onChange={(e) => setDocFormData({ ...docFormData, licenseNo: e.target.value })}
                    placeholder="MD-LIC-2026-881"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono font-extrabold bg-white text-slate-900 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Staff Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={docFormData.phone}
                    onChange={(e) => setDocFormData({ ...docFormData, phone: e.target.value })}
                    placeholder="+1 (555) 019-2831"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 placeholder:text-slate-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Medical Qualifications</label>
                  <input
                    type="text"
                    value={docFormData.qualification}
                    onChange={(e) => setDocFormData({ ...docFormData, qualification: e.target.value })}
                    placeholder="MD, MBBS, FACC"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={docFormData.consultationFee}
                    onChange={(e) => setDocFormData({ ...docFormData, consultationFee: e.target.value })}
                    placeholder="150"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black text-emerald-700 bg-white shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowDoctorModal(false)} className="px-4 py-2 text-slate-500 font-extrabold">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md">
                  {submitting ? 'Saving...' : editingDoctor ? 'Update Doctor Details' : 'Onboard Doctor & Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 3: CREATED DOCTOR LOGIN CREDENTIALS BANNER ----------------- */}
      {credentialsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Doctor Account Onboarded Live!</h3>
                  <span className="text-[10px] font-extrabold text-emerald-600">Portal Access Granted</span>
                </div>
              </div>
              <button onClick={() => setCredentialsModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Doctor Name:</span>
                <span className="text-sm font-black text-slate-900 block">{credentialsModal.name}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Department:</span>
                <span className="font-bold text-blue-700 block text-xs">{credentialsModal.departmentName}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Login Email / Identifier:</span>
                <span className="font-bold text-slate-900 block text-xs">{credentialsModal.email}</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Portal Access Password:</span>
                <span className="font-extrabold text-purple-700 block text-xs">{credentialsModal.password}</span>
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
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow"
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
