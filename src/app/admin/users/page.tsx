'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, CheckCircle2, XCircle, ShieldCheck, Building2, UserCheck, Key, Lock, X } from 'lucide-react';

export default function GlobalUserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DOCTOR',
    hospitalId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = () => {
    fetch(`/api/admin/users?role=${selectedRole}&hospitalId=${selectedHospital}&status=${selectedStatus}&q=${encodeURIComponent(search)}`)
      .then(res => res.json())
      .then(data => {
        if (data.users && Array.isArray(data.users)) {
          setUsers(prev => {
            const mergedMap = new Map();
            prev.forEach((u: any) => mergedMap.set(u.email || u.id, u));
            data.users.forEach((u: any) => mergedMap.set(u.email || u.id, u));
            return Array.from(mergedMap.values());
          });
        }
        if (data.hospitals) setHospitals(data.hospitals);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, selectedHospital, selectedStatus]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: '', email: '', password: '', role: 'DOCTOR', hospitalId: '' });
        fetchUsers();
      } else {
        alert(data.error || 'Failed to create user');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status: newStatus })
    });
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-600" /> Platform Global User Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user accounts, role assignments, tenant associations, and access privileges across all hospitals
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Provision New User
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              fetchUsers();
            }}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 border rounded-xl"
          />
        </div>

        <div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full py-2 px-3 border rounded-xl font-semibold"
          >
            <option value="">All Roles (SUPER_ADMIN, DOCTOR...)</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="HOSPITAL_ADMIN">HOSPITAL_ADMIN</option>
            <option value="DOCTOR">DOCTOR</option>
            <option value="NURSE">NURSE</option>
            <option value="PHARMACIST">PHARMACIST</option>
            <option value="LAB_TECH">LAB_TECHNICIAN</option>
            <option value="PATIENT">PATIENT</option>
          </select>
        </div>

        <div>
          <select
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
            className="w-full py-2 px-3 border rounded-xl font-semibold"
          >
            <option value="">All Hospital Tenants</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 border rounded-xl font-semibold"
          >
            <option value="">All Statuses (ACTIVE, SUSPENDED)</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading global users directory...</p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-4">User Details</th>
                <th className="p-4">Security Role</th>
                <th className="p-4">Assigned Hospital Tenant</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-slate-900 block text-sm">{u.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{u.email}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                      u.role === 'SUPER_ADMIN'
                        ? 'bg-cyan-100 text-cyan-900 border border-cyan-300 font-mono'
                        : u.role === 'HOSPITAL_ADMIN'
                        ? 'bg-blue-100 text-blue-900'
                        : u.role === 'DOCTOR'
                        ? 'bg-purple-100 text-purple-900'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-700">
                    {u.hospital ? (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-cyan-600" /> {u.hospital.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[10px]">Platform Master (Global)</span>
                    )}
                  </td>
                  <td className="p-4">
                    {u.status === 'ACTIVE' ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-[10px] border border-emerald-200">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-full text-[10px] border border-rose-200">
                        SUSPENDED
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => toggleUserStatus(u.id, u.status)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        u.status === 'ACTIVE'
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Provision User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Provision New User Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dr. Arthur Vance"
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
                  placeholder="user@metrohospital.org"
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg font-bold"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="HOSPITAL_ADMIN">HOSPITAL_ADMIN</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="NURSE">NURSE</option>
                    <option value="PHARMACIST">PHARMACIST</option>
                    <option value="LAB_TECH">LAB_TECHNICIAN</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Assign Hospital</label>
                  <select
                    value={formData.hospitalId}
                    onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg font-semibold"
                  >
                    <option value="">Platform Master (None)</option>
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-cyan-600 text-white font-bold rounded-lg shadow">
                  {submitting ? 'Creating...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
