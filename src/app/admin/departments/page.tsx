'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Users,
  Calendar,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  Eye,
  Key,
  X,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Briefcase,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DepartmentsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedDeptForDoctor, setSelectedDeptForDoctor] = useState<string>('');
  const [credentialsModal, setCredentialsModal] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);

  // Form states
  const [deptFormData, setDeptFormData] = useState({
    code: '',
    name: '',
    description: '',
    location: '',
    contact: ''
  });

  const [docFormData, setDocFormData] = useState({
    name: '',
    email: '',
    password: 'doctor123',
    phone: '+1 (555) 019-2831',
    specialization: 'Cardiology',
    departmentId: '',
    licenseNo: '',
    employeeId: '',
    qualification: 'MD, MBBS',
    consultationFee: '150'
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchDeptsAndDoctors = () => {
    setLoading(true);
    const targetHospId = user?.hospitalId || '';
    Promise.all([
      fetch('/api/departments').then(res => res.json()),
      fetch(`/api/admin/doctors?hospitalId=${targetHospId}`).then(res => res.json())
    ])
      .then(([deptRes, docRes]) => {
        setDepartments(deptRes.departments || []);
        setDoctors(docRes.doctors || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDeptsAndDoctors();
  }, [user?.hospitalId]);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptFormData)
      });
      if (res.ok) {
        setShowDeptModal(false);
        setDeptFormData({ code: '', name: '', description: '', location: '', contact: '' });
        fetchDeptsAndDoctors();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create department');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddDoctorModal = (departmentId = '') => {
    setEditingDoctor(null);
    setSelectedDeptForDoctor(departmentId);
    setDocFormData({
      name: '',
      email: '',
      password: 'doctor123',
      phone: '+1 (555) 019-2831',
      specialization: departmentId ? (departments.find(d => d.id === departmentId)?.name || 'General Medicine') : 'General Medicine',
      departmentId: departmentId || (departments[0]?.id || ''),
      licenseNo: '',
      employeeId: '',
      qualification: 'MD, MBBS',
      consultationFee: '150'
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
            password: docFormData.password,
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
          fetchDeptsAndDoctors();
        } else {
          alert(data.error || 'Failed to update doctor details');
        }
      } else {
        // POST Create New Doctor
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
          fetchDeptsAndDoctors();
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
        fetchDeptsAndDoctors();
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
        fetchDeptsAndDoctors();
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

  return (
    <div className="space-y-6 select-none text-slate-900">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-widest mb-0.5">
            <Building2 className="w-4 h-4 text-blue-600" /> Department-Wise Staffing & Clinical Governance
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            Hospital Departments & Physician Assignments
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Configure clinical units, onboard doctors department-wise with portal credentials, and manage staff access for {user?.hospitalName || 'your hospital'}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenAddDoctorModal('')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Onboard Doctor
          </button>
          <button
            onClick={() => setShowDeptModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Department
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading hospital departments and physician staff...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const deptDoctors = doctors.filter(d => d.departmentId === dept.id);
            return (
              <div key={dept.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                        {dept.code}
                      </span>
                      <h3 className="font-black text-slate-900 text-lg mt-1">{dept.name}</h3>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" title="Active Department" />
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">{dept.description || 'Clinical specialty medical unit.'}</p>

                  <div className="text-xs space-y-1.5 pt-2 border-t text-slate-600">
                    <p className="flex items-center gap-1.5 font-medium">
                      <span>📍</span> <span className="font-semibold text-slate-800">Location:</span> {dept.location || 'Main Building'}
                    </p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <span>📞</span> <span className="font-semibold text-slate-800">Extension:</span> {dept.contact || 'Ext 100'}
                    </p>
                  </div>

                  {/* Resource Counts */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center text-xs">
                    <div className="bg-blue-50/70 border border-blue-100 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Doctors</span>
                      <span className="font-black text-blue-700 text-base">{deptDoctors.length}</span>
                    </div>
                    <div className="bg-cyan-50/70 border border-cyan-100 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Appts</span>
                      <span className="font-black text-cyan-700 text-base">{dept._count?.appointments || 0}</span>
                    </div>
                    <div className="bg-rose-50/70 border border-rose-100 p-2 rounded-xl">
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Admitted</span>
                      <span className="font-black text-rose-700 text-base">{dept._count?.admissions || 0}</span>
                    </div>
                  </div>

                  {/* Assigned Department Doctors List */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Department Physicians</span>
                      <button
                        onClick={() => handleOpenAddDoctorModal(dept.id)}
                        className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        + Add Doctor
                      </button>
                    </div>

                    {deptDoctors.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-1">No doctors assigned to this department yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                        {deptDoctors.map((doc) => {
                          const isSuspended = doc.user?.status === 'SUSPENDED';
                          return (
                            <div key={doc.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                              <div>
                                <span className="font-extrabold text-slate-900 block leading-tight">{doc.user?.name || 'Dr. Physician'}</span>
                                <span className="text-[10px] text-slate-500 font-semibold">{doc.specialization}</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleDoctorStatus(doc.id, isSuspended ? 'SUSPENDED' : 'ACTIVE')}
                                  className={`px-2 py-0.5 text-[9px] font-black rounded-md border transition-all ${
                                    isSuspended
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                  }`}
                                  title="Toggle Doctor Account Status"
                                >
                                  {isSuspended ? 'Activate' : 'Suspend'}
                                </button>
                                <button
                                  onClick={() => handleDeleteDoctor(doc.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                                  title="Remove Doctor"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAddDoctorModal(dept.id)}
                  className="w-full py-2 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-800 hover:text-blue-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all mt-2"
                >
                  <UserPlus className="w-3.5 h-3.5 text-blue-600" /> Onboard Doctor for {dept.code}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------- MODAL 1: ADD NEW DEPARTMENT ----------------- */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" /> Add New Hospital Department
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-3 text-slate-900">
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Department Code (e.g. CARD, NEUR, ORTH) *</label>
                <input
                  type="text"
                  required
                  value={deptFormData.code}
                  onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value.toUpperCase() })}
                  placeholder="CARD"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono font-extrabold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Department Full Name *</label>
                <input
                  type="text"
                  required
                  value={deptFormData.name}
                  onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                  placeholder="Cardiology & Cardiovascular Center"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Description</label>
                <textarea
                  value={deptFormData.description}
                  onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                  placeholder="Clinical unit specialized in heart health..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900 bg-white"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Location / Wing</label>
                  <input
                    type="text"
                    value={deptFormData.location}
                    onChange={(e) => setDeptFormData({ ...deptFormData, location: e.target.value })}
                    placeholder="Wing A - 3rd Floor"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Extension / Phone</label>
                  <input
                    type="text"
                    value={deptFormData.contact}
                    onChange={(e) => setDeptFormData({ ...deptFormData, contact: e.target.value })}
                    placeholder="Ext 301"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-extrabold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowDeptModal(false)} className="px-4 py-2 text-slate-500 font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow">
                  {submitting ? 'Saving...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: ONBOARD DOCTOR DEPARTMENT-WISE ----------------- */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
                  🩺 Department Physician Access Governance
                </span>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  {editingDoctor ? 'Edit Doctor Details & Access' : 'Onboard Doctor & Grant Portal Access'}
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
                  <label className="font-extrabold text-slate-900 block mb-1">Portal Password *</label>
                  <input
                    type="text"
                    required
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
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md">
                  {submitting ? 'Saving Access...' : editingDoctor ? 'Update Doctor Details' : 'Onboard Doctor & Issue Credentials'}
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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow"
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
