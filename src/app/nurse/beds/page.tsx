'use client';

import React, { useEffect, useState } from 'react';
import {
  BedDouble,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  UserCheck,
  Search,
  Activity,
  HeartPulse,
  LogOut,
  Sparkles,
  UserPlus,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function NurseBedsPage() {
  const { user } = useAuth();
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [admitModalBed, setAdmitModalBed] = useState<any>(null);
  const [vitalsModalBed, setVitalsModalBed] = useState<any>(null);

  // Patient search state for admission modal
  const [patientQuery, setPatientQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState('Acute Clinical Observation');
  const [submitting, setSubmitting] = useState(false);

  // Vitals record form state
  const [bp, setBp] = useState('120/80');
  const [hr, setHr] = useState('75');
  const [temp, setTemp] = useState('98.6');
  const [spo2, setSpo2] = useState('99');
  const [nurseNotes, setNurseNotes] = useState('');

  const fetchWardsAndBeds = () => {
    setLoading(true);
    fetch('/api/beds')
      .then(res => res.json())
      .then(data => setWards(data.wards || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWardsAndBeds();
  }, []);

  const handlePatientSearch = async (q: string) => {
    setPatientQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/patients?global=true&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.patients || []);
    } catch (err) {
      console.error(err);
    }
  };

  const updateBedStatus = async (bedId: string, status: string) => {
    try {
      const res = await fetch('/api/beds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedId, status })
      });
      if (res.ok) {
        fetchWardsAndBeds();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitModalBed || !selectedPatient) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedId: admitModalBed.id,
          patientId: selectedPatient.id,
          diagnosis,
          hospitalId: user?.hospitalId || ''
        })
      });
      if (res.ok) {
        setAdmitModalBed(null);
        setSelectedPatient(null);
        setPatientQuery('');
        fetchWardsAndBeds();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to admit patient');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischargeSubmit = async (admissionId: string, bedId: string) => {
    if (!confirm('Are you sure you want to discharge this patient and mark bed for cleaning?')) return;
    try {
      const res = await fetch('/api/discharges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admissionId, bedId })
      });
      if (res.ok) {
        fetchWardsAndBeds();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecordVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalsModalBed) return;

    setSubmitting(true);
    try {
      const activeAdm = vitalsModalBed.admissions?.find((a: any) => a.status === 'ADMITTED');
      const res = await fetch('/api/icu/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedId: vitalsModalBed.id,
          patientId: activeAdm?.patientId || '',
          vitalsBp: bp,
          vitalsHr: hr,
          vitalsTemp: temp,
          vitalsSpo2: spo2,
          nurseNotes
        })
      });
      if (res.ok) {
        setVitalsModalBed(null);
        setNurseNotes('');
        fetchWardsAndBeds();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 select-none">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-purple-600 uppercase tracking-widest mb-0.5">
            <BedDouble className="w-4 h-4 text-purple-600" /> Nursing Care & Ward Management
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            Inpatient Wards & Real-Time Bed Grid
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Monitor bed allocations, admit patients, record nursing vitals, and manage bed cleaning readiness for {user?.hospitalName || 'your hospital'}.
          </p>
        </div>

        <button
          onClick={fetchWardsAndBeds}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-cyan-400" /> Refresh Bed Grid
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading inpatient ward bed allocations...</p>
      ) : (
        <div className="space-y-6">
          {wards.map((ward) => {
            const occupiedCount = (ward.beds || []).filter((b: any) => b.status === 'OCCUPIED').length;
            const availableCount = (ward.beds || []).filter((b: any) => b.status === 'AVAILABLE').length;
            const cleaningCount = (ward.beds || []).filter((b: any) => b.status === 'CLEANING' || b.status === 'MAINTENANCE').length;

            return (
              <div key={ward.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                      {ward.code}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">{ward.name}</h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                      Occupied: {occupiedCount}
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                      Available: {availableCount}
                    </span>
                    {cleaningCount > 0 && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                        Cleaning: {cleaningCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ward Beds Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
                  {ward.beds?.map((bed: any) => {
                    const activeAdm = bed.admissions?.find((a: any) => a.status === 'ADMITTED');
                    const isOccupied = bed.status === 'OCCUPIED';
                    const isCleaning = bed.status === 'CLEANING' || bed.status === 'MAINTENANCE';

                    return (
                      <div
                        key={bed.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                          isOccupied
                            ? 'bg-rose-50/70 border-rose-200 shadow-2xs'
                            : isCleaning
                            ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                            : 'bg-emerald-50/70 border-emerald-200 shadow-2xs'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-900 text-sm">
                              Bed {bed.bedNumber}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                              isOccupied
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : isCleaning
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}>
                              {bed.status}
                            </span>
                          </div>

                          {isOccupied && activeAdm && (
                            <div className="p-2.5 bg-white rounded-xl border border-rose-200 space-y-1">
                              <span className="font-extrabold text-slate-900 block text-xs truncate">
                                👤 {activeAdm.patient?.fullName || 'Patient'}
                              </span>
                              <span className="text-[10px] font-mono text-cyan-700 font-extrabold block">
                                {activeAdm.patient?.patientCode}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium block truncate">
                                Diagnosis: {activeAdm.diagnosis || 'Clinical Observation'}
                              </span>
                            </div>
                          )}

                          {isCleaning && (
                            <p className="text-[11px] text-amber-800 font-medium italic">
                              Bed undergoing sanitation & linens reset.
                            </p>
                          )}

                          {!isOccupied && !isCleaning && (
                            <p className="text-[11px] text-emerald-800 font-medium italic">
                              Ready for immediate patient admission.
                            </p>
                          )}
                        </div>

                        {/* Interactive Nurse Action Buttons */}
                        <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1.5">
                          {isOccupied && (
                            <>
                              <button
                                onClick={() => {
                                  setVitalsModalBed(bed);
                                  setNurseNotes('');
                                }}
                                className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all"
                              >
                                <HeartPulse className="w-3.5 h-3.5" /> Record Vitals
                              </button>
                              <button
                                onClick={() => handleDischargeSubmit(activeAdm?.id, bed.id)}
                                className="w-full py-1 bg-white hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-[10px] rounded-lg flex items-center justify-center gap-1 transition-all"
                              >
                                <LogOut className="w-3 h-3" /> Discharge & Clean
                              </button>
                            </>
                          )}

                          {isCleaning && (
                            <button
                              onClick={() => updateBedStatus(bed.id, 'AVAILABLE')}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-md transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready & Available
                            </button>
                          )}

                          {!isOccupied && !isCleaning && (
                            <button
                              onClick={() => {
                                setAdmitModalBed(bed);
                                setSelectedPatient(null);
                                setPatientQuery('');
                              }}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 shadow-md transition-all"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Admit Patient
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------- MODAL 1: ADMIT PATIENT TO BED ----------------- */}
      {admitModalBed && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block">
                  🏥 Inpatient Admission
                </span>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                  Admit Patient to Bed {admitModalBed.bedNumber}
                </h3>
              </div>
              <button onClick={() => setAdmitModalBed(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdmitSubmit} className="space-y-3 text-slate-900">
              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 block">Search Patient by Universal ID (`NEXO-PAT-xxxxxx`) *</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={patientQuery}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    placeholder="Search by NEXO-PAT-000001, Name, Phone..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-extrabold text-slate-900 focus:bg-white"
                  />

                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {searchResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setSearchResults([]);
                            setPatientQuery('');
                          }}
                          className="p-3 hover:bg-emerald-50 cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-black text-slate-900 block">{p.fullName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">DOB: {p.dob} | Phone: {p.phone}</span>
                          </div>
                          <span className="font-mono text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                            {p.patientCode}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedPatient && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl font-semibold text-emerald-900 flex items-center justify-between">
                  <div>
                    <span className="font-black block text-sm">{selectedPatient.fullName}</span>
                    <span className="font-mono text-[10px]">{selectedPatient.patientCode}</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              )}

              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Admitting Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Acute Clinical Observation, Pneumonia, Post-Op Care..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setAdmitModalBed(null)} className="px-4 py-2 text-slate-500 font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={submitting || !selectedPatient} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow">
                  {submitting ? 'Admitting...' : 'Confirm Patient Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: RECORD NURSING VITALS ----------------- */}
      {vitalsModalBed && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-purple-600 uppercase tracking-widest block">
                  🩺 Nursing Vitals Log
                </span>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mt-0.5">
                  Record Vitals for Bed {vitalsModalBed.bedNumber}
                </h3>
              </div>
              <button onClick={() => setVitalsModalBed(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordVitalsSubmit} className="space-y-3 text-slate-900">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    required
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Heart Rate (bpm)</label>
                  <input
                    type="text"
                    required
                    value={hr}
                    onChange={(e) => setHr(e.target.value)}
                    placeholder="75"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">Temperature (°F)</label>
                  <input
                    type="text"
                    required
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    placeholder="98.6"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-900 block mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="text"
                    required
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="99"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-bold text-emerald-700 bg-white shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Nursing Care Notes</label>
                <textarea
                  rows={3}
                  value={nurseNotes}
                  onChange={(e) => setNurseNotes(e.target.value)}
                  placeholder="Patient resting comfortably in bed, IV fluids running..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900 bg-white shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setVitalsModalBed(null)} className="px-4 py-2 text-slate-500 font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow">
                  {submitting ? 'Saving Vitals...' : 'Save Vitals & Nursing Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
