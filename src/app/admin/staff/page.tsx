'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Shield, CheckCircle2, XCircle, Key } from 'lucide-react';

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'DOCTOR',
    designation: 'Senior Consultant',
    employeeId: '',
    qualification: 'MD',
    specialization: 'General Medicine',
    consultationFee: '150.0'
  });

  const fetchStaff = () => {
    fetch('/api/staff')
      .then(res => res.json())
      .then(data => setStaffList(data.staffMembers || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchStaff();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (staffUserId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await fetch('/api/staff', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffUserId, status: newStatus })
    });
    fetchStaff();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-600" /> Hospital Staff & Granular RBAC Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage hospital staff accounts, roles, designations, and specific permission overrides
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading hospital staff...</p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Role</th>
                <th className="p-4">Employee ID / Designation</th>
                <th className="p-4">Permissions Granted</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-slate-900 block text-sm">{member.name}</span>
                    <span className="text-slate-400 text-[11px]">{member.email}</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                      {member.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    <span className="font-semibold text-slate-800 block">
                      {member.doctorProfile?.employeeId || member.staffProfile?.employeeId || member.nurseProfile?.employeeId || 'EMP-001'}
                    </span>
                    <span className="text-slate-400">
                      {member.doctorProfile?.specialization || member.staffProfile?.designation || member.nurseProfile?.shift || 'Staff'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {member.role === 'HOSPITAL_ADMIN' ? (
                        <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-2 py-0.5 rounded">ALL_PERMISSIONS (*)</span>
                      ) : (
                        (member.userPermissions || []).map((up: any) => (
                          <span key={up.id} className="bg-slate-100 text-slate-600 text-[9px] font-semibold px-1.5 py-0.5 rounded">
                            {up.permission.code}
                          </span>
                        ))
                      )}
                      {member.userPermissions?.length === 0 && member.role !== 'HOSPITAL_ADMIN' && (
                        <span className="text-slate-400 italic text-[10px]">Inherited Role Permissions</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {member.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px]">
                        <XCircle className="w-3.5 h-3.5" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toggleStatus(member.id, member.status)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        member.status === 'ACTIVE'
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      {member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border">
            <h3 className="text-base font-bold text-slate-800 mb-4">Add New Hospital Staff Account</h3>
            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Dr. Jane Watson"
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane.watson@metrohospital.org"
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Category / Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg font-semibold text-slate-800"
                  >
                    <option value="DOCTOR">Doctor / Physician</option>
                    <option value="NURSE">Nurse</option>
                    <option value="PHARMACIST">Pharmacist</option>
                    <option value="LAB_TECH">Lab Technician</option>
                    <option value="RADIOLOGY_TECH">Radiology Specialist</option>
                    <option value="ICU_STAFF">ICU Specialist</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="HR_ADMIN">HR / Admin Staff</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {formData.role === 'DOCTOR' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
                  <div>
                    <label className="font-semibold text-slate-700">Specialization</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Consultation Fee ($)</label>
                    <input
                      type="number"
                      value={formData.consultationFee}
                      onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                      className="w-full mt-1 px-3 py-1.5 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 text-white font-bold rounded-lg">
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
