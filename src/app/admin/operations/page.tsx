'use client';

import React, { useEffect, useState } from 'react';
import {
  Layers,
  Building2,
  Calendar,
  BedDouble,
  HeartPulse,
  Pill,
  FlaskConical,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  Search,
  Activity,
  FileText
} from 'lucide-react';

export default function GlobalOperationsPage() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'admissions' | 'prescriptions' | 'labs'>('appointments');
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState('');

  const [appointments, setAppointments] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGlobalOperationsData = () => {
    setLoading(true);

    fetch('/api/admin/hospitals')
      .then(res => res.json())
      .then(data => setHospitals(data.hospitals || []))
      .catch(err => console.error(err));

    Promise.all([
      fetch('/api/appointments').then(r => r.json()),
      fetch('/api/admissions').then(r => r.json()),
      fetch('/api/prescriptions').then(r => r.json()),
      fetch('/api/laboratory/orders').then(r => r.json())
    ])
      .then(([aptData, admData, rxData, labData]) => {
        setAppointments(aptData.appointments || []);
        setAdmissions(admData.admissions || []);
        setPrescriptions(rxData.prescriptions || []);
        setLabOrders(labData.orders || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGlobalOperationsData();
  }, []);

  const filteredAppointments = selectedHospital ? appointments.filter(a => a.hospitalId === selectedHospital) : appointments;
  const filteredAdmissions = selectedHospital ? admissions.filter(a => a.hospitalId === selectedHospital) : admissions;
  const filteredPrescriptions = selectedHospital ? prescriptions.filter(r => r.hospitalId === selectedHospital) : prescriptions;
  const filteredLabOrders = selectedHospital ? labOrders.filter(l => l.hospitalId === selectedHospital) : labOrders;

  return (
    <div className="space-y-6 text-slate-900 select-none max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-cyan-600 uppercase tracking-widest mb-1">
            🌐 Platform Master Operations Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-8 h-8 text-cyan-600" /> Platform Global Operations Control Center
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-1 font-medium">
            Cross-tenant operational oversight for Outpatient Appointments, Inpatient Ward Admissions, Prescriptions Dispensing, and Laboratory Diagnostics across all registered hospitals.
          </p>
        </div>

        {/* Hospital Tenant Filter Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-300 px-3.5 py-2.5 rounded-2xl shadow-2xs">
            <Building2 className="w-4 h-4 text-cyan-600" />
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="bg-transparent font-black text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="">All Hospital Tenants (Global Network)</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchGlobalOperationsData}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-md transition-all flex items-center gap-2 text-xs font-black"
            title="Refresh Live Operations"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Operations KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-cyan-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Total Outpatient Appointments</span>
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-slate-900">{filteredAppointments.length} Bookings</h3>
          <span className="text-[10px] text-cyan-700 font-bold">Cross-Tenant Consultations</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Inpatient Stays</span>
            <BedDouble className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-purple-700">{filteredAdmissions.length} Ward Stays</h3>
          <span className="text-[10px] text-purple-700 font-bold">Admitted Patients</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Prescriptions Issued</span>
            <Pill className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-emerald-700">{filteredPrescriptions.length} Digital Rx</h3>
          <span className="text-[10px] text-emerald-700 font-bold">Pharmacy Dispensing</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[10px] uppercase font-black text-slate-400">Lab Diagnostic Orders</span>
            <FlaskConical className="w-5 h-5" />
          </div>
          <h3 className="text-3xl font-black text-amber-700">{filteredLabOrders.length} Lab Orders</h3>
          <span className="text-[10px] text-amber-700 font-bold">Verified Reports</span>
        </div>
      </div>

      {/* 3. Navigation Workstream Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" /> Appointments ({filteredAppointments.length})
        </button>

        <button
          onClick={() => setActiveTab('admissions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'admissions'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BedDouble className="w-4 h-4" /> Inpatient Admissions ({filteredAdmissions.length})
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'prescriptions'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Pill className="w-4 h-4" /> Digital Prescriptions ({filteredPrescriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'labs'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FlaskConical className="w-4 h-4" /> Diagnostic Lab Orders ({filteredLabOrders.length})
        </button>
      </div>

      {/* 4. Tab Contents */}
      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading global operations data across network...</p>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden text-xs">
          {/* TAB 1: Appointments */}
          {activeTab === 'appointments' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                  <th className="p-4">Appointment Code & Date</th>
                  <th className="p-4">Hospital Tenant</th>
                  <th className="p-4">Patient Details</th>
                  <th className="p-4">Attending Doctor</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-black">
                      No appointments recorded across selected hospital scope.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-black text-cyan-900 text-xs block bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200 w-fit">
                          {a.code || 'APT-1001'}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px] block mt-1">{a.date} at {a.time}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-cyan-600" /> {a.hospital?.name || 'Metropolitan Hospital'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-slate-900 block text-sm">{a.patient?.fullName || 'Patient'}</span>
                        <span className="text-slate-500 font-mono text-[10px]">{a.patient?.patientCode}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">{a.doctor?.user?.name || 'Dr. Sarah Smith'}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-xl font-black text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {a.status || 'CONFIRMED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: Inpatient Admissions */}
          {activeTab === 'admissions' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                  <th className="p-4">Admission Code</th>
                  <th className="p-4">Hospital Tenant</th>
                  <th className="p-4">Patient & Ward Bed</th>
                  <th className="p-4">Diagnosis & Reason</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filteredAdmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-black">
                      No inpatient stay admissions recorded across selected hospital scope.
                    </td>
                  </tr>
                ) : (
                  filteredAdmissions.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-black text-purple-900 text-xs bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 w-fit">
                          {adm.admissionCode}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {adm.hospital?.name || 'Metropolitan General Hospital'}
                      </td>
                      <td className="p-4">
                        <span className="font-black text-slate-900 block text-sm">{adm.patient?.fullName}</span>
                        <span className="text-purple-700 font-bold text-[11px]">Ward: {adm.ward?.name} (Bed {adm.bed?.bedNumber})</span>
                      </td>
                      <td className="p-4">
                        <span className="font-extrabold text-slate-900 block">{adm.diagnosis}</span>
                        <span className="text-slate-500 text-[11px] block">{adm.admissionReason}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-xl font-black text-[10px] bg-purple-100 text-purple-900 border border-purple-300">
                          {adm.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 3: Digital Prescriptions */}
          {activeTab === 'prescriptions' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                  <th className="p-4">Prescription Code</th>
                  <th className="p-4">Hospital Tenant</th>
                  <th className="p-4">Patient Details</th>
                  <th className="p-4">Prescribed Medicines</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-black">
                      No prescriptions issued across selected hospital scope.
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((rx) => (
                    <tr key={rx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-black text-emerald-900 text-xs bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
                          {rx.prescriptionCode}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {rx.hospital?.name || 'Metropolitan General Hospital'}
                      </td>
                      <td className="p-4">
                        <span className="font-black text-slate-900 block text-sm">{rx.patient?.fullName || 'Patient'}</span>
                        <span className="text-slate-500 font-mono text-[10px]">{rx.patient?.patientCode}</span>
                      </td>
                      <td className="p-4">
                        {rx.items?.map((item: any, idx: number) => (
                          <span key={idx} className="block text-slate-900 font-extrabold text-[11px]">
                            💊 {item.medicineName} ({item.dosage}, {item.frequency})
                          </span>
                        ))}
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-xl font-black text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {rx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* TAB 4: Diagnostic Lab Orders */}
          {activeTab === 'labs' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                  <th className="p-4">Lab Order Code</th>
                  <th className="p-4">Hospital Tenant</th>
                  <th className="p-4">Diagnostic Test Name</th>
                  <th className="p-4">Patient Details</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {filteredLabOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-black">
                      No lab diagnostic orders recorded across selected hospital scope.
                    </td>
                  </tr>
                ) : (
                  filteredLabOrders.map((lab) => (
                    <tr key={lab.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-black text-amber-900 text-xs bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 w-fit">
                          {lab.orderCode}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {lab.hospital?.name || 'Metropolitan General Hospital'}
                      </td>
                      <td className="p-4 font-black text-slate-900 text-sm">
                        🧪 {lab.testName}
                      </td>
                      <td className="p-4">
                        <span className="font-black text-slate-900 block text-sm">{lab.patient?.fullName || 'Patient'}</span>
                        <span className="text-slate-500 font-mono text-[10px]">{lab.patient?.patientCode}</span>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-xl font-black text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                          {lab.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
