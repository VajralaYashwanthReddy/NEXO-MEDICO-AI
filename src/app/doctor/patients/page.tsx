'use client';

import React, { useEffect, useState } from 'react';
import { UserCheck, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPatients = (q = search) => {
    const jwt = typeof window !== 'undefined' ? localStorage.getItem('nexo_jwt') : null;
    fetch(`/api/patients?q=${encodeURIComponent(q)}`, {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (data.patients) setPatients(data.patients);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatients(search);

    const interval = setInterval(() => {
      fetchPatients(search);
    }, 5000);

    return () => clearInterval(interval);
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-cyan-600" /> Physician Patient Search & Central Medical Timelines
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search patient records, view documented allergies, and open single unified clinical timelines
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            fetchPatients(e.target.value);
          }}
          placeholder="Search by name, patient ID, phone..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-xs"
        />
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading patient records...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-extrabold text-cyan-700 text-[10px] bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                    {p.patientCode}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">{p.fullName}</h3>
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{p.bloodGroup}</span>
              </div>

              <p className="text-xs text-slate-500">{p.gender}, DOB: {p.dob} | Phone: {p.phone}</p>

              {p.allergies && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] font-semibold">
                  ⚠️ Allergy: {p.allergies}
                </div>
              )}

              <div className="pt-2 border-t flex justify-end">
                <Link
                  href={`/doctor/patient/${p.id}`}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow"
                >
                  View Full Medical Timeline <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
