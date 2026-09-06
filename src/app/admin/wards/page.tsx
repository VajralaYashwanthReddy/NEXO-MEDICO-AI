'use client';

import React, { useEffect, useState } from 'react';
import {
  BedDouble,
  CheckCircle2,
  Plus,
  Trash2,
  UserPlus,
  UserCheck,
  Stethoscope,
  X,
  AlertCircle,
  FileText,
  LogOut,
  Sparkles,
  Search,
  Globe,
  Building2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function WardsAndBedsPage() {
  const { user } = useAuth();
  const [wards, setWards] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [selectedWardId, setSelectedWardId] = useState('');
  const [newBedNumber, setNewBedNumber] = useState('');

  // Assign Bed Modal State
  const [assignBedModal, setAssignBedModal] = useState<any>(null); // target bed object
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [admissionReason, setAdmissionReason] = useState('Inpatient Medical Observation & Care');
  const [diagnosis, setDiagnosis] = useState('Acute Clinical Observation');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const [occupantModal, setOccupantModal] = useState<any>(null); // occupied bed object
  const [dischargeReason, setDischargeReason] = useState('Recovered - Fit for Discharge');
  const [submittingDischarge, setSubmittingDischarge] = useState(false);

  const fetchData = () => {
    fetch('/api/beds')
      .then(res => res.json())
      .then(data => {
        setWards(data.wards || []);
        setDoctors(data.doctors || []);
        setPatients(data.patients || []);
        if (data.wards?.length > 0 && !selectedWardId) {
          setSelectedWardId(data.wards[0].id);
        }
        if (data.doctors?.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(data.doctors[0].id);
        }
        if (data.patients?.length > 0 && !selectedPatient) {
          setSelectedPatient(data.patients[0]);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Global Patient Search Handler for Bed Admission
  const handlePatientSearch = async (query: string) => {
    setPatientSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/patients?global=true&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.patients || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Add new Bed handler
  const handleAddBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWardId || !newBedNumber.trim()) return;

    try {
      const res = await fetch('/api/beds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wardId: selectedWardId, bedNumber: newBedNumber })
      });
      if (res.ok) {
        setNewBedNumber('');
        setShowAddBedModal(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add bed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Bed handler
  const handleDeleteBed = async (bedId: string, bedNumber: string) => {
    if (!confirm(`Are you sure you want to delete Bed '${bedNumber}'?`)) return;

    try {
      const res = await fetch(`/api/beds?bedId=${bedId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete bed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Assign Bed & Admit Patient handler
  const handleAdmitPatientToBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignBedModal || !selectedPatient || !selectedDoctorId) return;

    setSubmittingAssign(true);
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          doctorId: selectedDoctorId,
          wardId: assignBedModal.wardId,
          bedId: assignBedModal.id,
          admissionReason,
          diagnosis
        })
      });

      if (res.ok) {
        setAssignBedModal(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Admission failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Initiate Discharge handler
  const handleDischargePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!occupantModal || !occupantModal.admissions?.[0]) return;

    const activeAdmission = occupantModal.admissions[0];
    setSubmittingDischarge(true);

    try {
      const res = await fetch('/api/discharges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId: activeAdmission.id,
          dischargeReason,
          diagnosis: activeAdmission.diagnosis || 'Clinical Recovery',
          hospitalCourse: 'Patient responded well to treatment and has been cleared by physician.',
          followUpInstructions: 'Review in Outpatient Department (OPD) in 1 week.'
        })
      });

      if (res.ok) {
        setOccupantModal(null);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Discharge failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingDischarge(false);
    }
  };

  // Change status (e.g. Mark Clean)
  const updateBedStatus = async (bedId: string, status: string) => {
    await fetch('/api/beds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bedId, status })
    });
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BedDouble className="w-6 h-6 text-cyan-600" /> Inpatient Wards & Real-Time Bed Grid
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time bed tracking, bed creation/deletion, and patient bed assignment by Universal Patient ID (`NEXO-PAT-xxxxxx`)
          </p>
        </div>
        <button
          onClick={() => setShowAddBedModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Bed
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading Ward & Bed infrastructure...</p>
      ) : (
        <div className="space-y-8">
          {wards.map((ward) => {
            const availableCount = ward.beds.filter((b: any) => b.status === 'AVAILABLE').length;
            const occupiedCount = ward.beds.filter((b: any) => b.status === 'OCCUPIED').length;
            const cleaningCount = ward.beds.filter((b: any) => b.status === 'CLEANING').length;

            return (
              <div key={ward.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-3 gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                      {ward.type} Ward
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{ward.name} ({ward.code})</h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Available: {availableCount}
                    </span>
                    <span className="text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      Occupied: {occupiedCount}
                    </span>
                    <span className="text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      Cleaning: {cleaningCount}
                    </span>
                  </div>
                </div>

                {/* Interactive Bed Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {ward.beds.map((bed: any) => {
                    const activeAdmission = bed.admissions?.[0];
                    const activePatient = activeAdmission?.patient;

                    return (
                      <div
                        key={bed.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between transition-all relative group ${
                          bed.status === 'AVAILABLE'
                            ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400 hover:shadow-md cursor-pointer'
                            : bed.status === 'OCCUPIED'
                            ? 'bg-rose-50/60 border-rose-200 hover:border-rose-400 hover:shadow-md cursor-pointer'
                            : bed.status === 'CLEANING'
                            ? 'bg-amber-50/60 border-amber-200'
                            : 'bg-slate-100 border-slate-300'
                        }`}
                        onClick={() => {
                          if (bed.status === 'AVAILABLE') {
                            setAssignBedModal({ ...bed, wardName: ward.name });
                          } else if (bed.status === 'OCCUPIED') {
                            setOccupantModal({ ...bed, wardName: ward.name });
                          }
                        }}
                      >
                        <div>
                          {/* Card Header: Bed Number & Status Badge */}
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                              <BedDouble className="w-4 h-4 text-slate-600" />
                              {bed.bedNumber}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                bed.status === 'AVAILABLE'
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : bed.status === 'OCCUPIED'
                                  ? 'bg-rose-200 text-rose-900'
                                  : bed.status === 'CLEANING'
                                  ? 'bg-amber-200 text-amber-900'
                                  : 'bg-slate-300 text-slate-800'
                              }`}
                            >
                              {bed.status}
                            </span>
                          </div>

                          {/* Occupant Details Card */}
                          {bed.status === 'OCCUPIED' && activePatient ? (
                            <div className="mt-3 text-xs bg-white p-2.5 rounded-lg border border-rose-100 shadow-2xs space-y-0.5">
                              <span className="text-[10px] text-rose-600 font-bold uppercase block">Occupant Patient:</span>
                              <span className="font-extrabold text-slate-900 block truncate">{activePatient.fullName}</span>
                              <span className="text-[10px] text-slate-500 font-mono block">{activePatient.patientCode}</span>
                              <p className="text-[10px] text-slate-600 mt-1 truncate">Diagnosis: {activeAdmission.diagnosis || 'Observation'}</p>
                            </div>
                          ) : bed.status === 'AVAILABLE' ? (
                            <div className="mt-3 text-center py-2 border border-dashed border-emerald-300 rounded-lg bg-emerald-50/70 text-emerald-700 font-bold text-[11px]">
                              + Click to Assign Bed
                            </div>
                          ) : null}
                        </div>

                        {/* Card Controls & Actions */}
                        <div className="mt-4 pt-2 border-t flex items-center justify-between text-[10px]">
                          {bed.status === 'CLEANING' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBedStatus(bed.id, 'AVAILABLE');
                              }}
                              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-1 shadow"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Clean & Ready
                            </button>
                          )}

                          {bed.status === 'AVAILABLE' && (
                            <div className="w-full flex items-center justify-between">
                              <span className="text-emerald-700 font-bold text-[10px]">Ready for Admission</span>
                              <button
                                title="Delete Bed"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBed(bed.id, bed.bedNumber);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {bed.status === 'OCCUPIED' && (
                            <span className="text-rose-700 font-bold text-[10px] w-full text-right">Click to View / Discharge</span>
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

      {/* ----------------- MODAL 1: ADD NEW BED ----------------- */}
      {showAddBedModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-600" /> Add New Hospital Bed
              </h3>
              <button onClick={() => setShowAddBedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBed} className="space-y-4">
              <div>
                <label className="font-semibold text-slate-700">Target Hospital Ward *</label>
                <select
                  value={selectedWardId}
                  onChange={(e) => setSelectedWardId(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 border rounded-xl font-semibold text-slate-800"
                >
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.type} Ward)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">New Bed Number / Code *</label>
                <input
                  type="text"
                  required
                  value={newBedNumber}
                  onChange={(e) => setNewBedNumber(e.target.value)}
                  placeholder="e.g. GEN-11 or ICU-06"
                  className="w-full mt-1 px-3.5 py-2.5 border rounded-xl font-extrabold text-slate-900 uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowAddBedModal(false)} className="px-4 py-2 text-slate-500 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow">
                  Create Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: ASSIGN BED BY UNIVERSAL PATIENT ID ----------------- */}
      {assignBedModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  AVAILABLE BED
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  Admit Patient to Bed {assignBedModal.bedNumber} ({assignBedModal.wardName})
                </h3>
              </div>
              <button onClick={() => setAssignBedModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdmitPatientToBed} className="space-y-4">
              {/* Universal Patient ID Search / Selection */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-cyan-600" /> Search Patient by Universal ID (`NEXO-PAT-xxxxxx`) *
                </label>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={patientSearchQuery}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    placeholder="Search by NEXO-PAT-000001, Name, Phone..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-cyan-500"
                  />

                  {/* Autocomplete Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {searchResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setSearchResults([]);
                            setPatientSearchQuery('');
                          }}
                          className="p-3 hover:bg-cyan-50/60 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <span className="font-extrabold text-cyan-800 text-xs mr-2">{p.patientCode}</span>
                            <span className="font-bold text-slate-900">{p.fullName}</span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {p.gender}, DOB: {p.dob} | Blood: {p.bloodGroup} | Hospital: {p.hospital?.name || 'Central'}
                            </p>
                          </div>
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Patient Identity Card */}
                {selectedPatient && (
                  <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between border border-slate-800">
                    <div>
                      <span className="font-extrabold text-cyan-400 text-xs mr-2">{selectedPatient.patientCode}</span>
                      <span className="font-bold text-white text-sm">{selectedPatient.fullName}</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {selectedPatient.gender}, DOB: {selectedPatient.dob} | Blood: <strong className="text-rose-400">{selectedPatient.bloodGroup}</strong>
                      </p>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded">
                      {selectedPatient.hospital?.name || 'Master Profile'}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-800 text-sm">Assigned Attending Physician *</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 border rounded-xl font-bold text-cyan-900 bg-slate-50"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.userId}>
                      {d.user?.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Reason for Inpatient Admission *</label>
                <input
                  type="text"
                  required
                  value={admissionReason}
                  onChange={(e) => setAdmissionReason(e.target.value)}
                  placeholder="e.g. Severe Dehydration / Cardiac Monitoring"
                  className="w-full mt-1 px-3.5 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Initial Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Gastroenteritis / Hypertensive Urgency"
                  className="w-full mt-1 px-3.5 py-2 border rounded-xl font-semibold text-cyan-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setAssignBedModal(null)} className="px-4 py-2 text-slate-500 font-bold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign || !selectedPatient}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow flex items-center gap-1.5 disabled:bg-slate-300"
                >
                  <UserCheck className="w-4 h-4" /> {submittingAssign ? 'Admitting Patient...' : 'Admit Patient & Assign Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 3: OCCUPIED BED DETAILS & DISCHARGE ----------------- */}
      {occupantModal && occupantModal.admissions?.[0] && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                  OCCUPIED BED DETAILS
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  Bed {occupantModal.bedNumber} ({occupantModal.wardName})
                </h3>
              </div>
              <button onClick={() => setOccupantModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase">Occupant Patient</span>
                <h4 className="text-base font-extrabold text-slate-900">
                  {occupantModal.admissions[0].patient?.fullName}
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  ID: {occupantModal.admissions[0].patient?.patientCode} | Blood: {occupantModal.admissions[0].patient?.bloodGroup}
                </span>
              </div>

              <div className="pt-2 border-t text-slate-700 space-y-1">
                <p><strong>Diagnosis:</strong> {occupantModal.admissions[0].diagnosis}</p>
                <p><strong>Reason:</strong> {occupantModal.admissions[0].admissionReason}</p>
                <p><strong>Admitted On:</strong> {new Date(occupantModal.admissions[0].admissionDate).toLocaleString()}</p>
              </div>
            </div>

            <form onSubmit={handleDischargePatient} className="space-y-3 pt-2">
              <div>
                <label className="font-semibold text-slate-700">Discharge Reason / Summary Notes</label>
                <input
                  type="text"
                  required
                  value={dischargeReason}
                  onChange={(e) => setDischargeReason(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <button type="button" onClick={() => setOccupantModal(null)} className="px-4 py-2 text-slate-500 font-bold">
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingDischarge}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" /> {submittingDischarge ? 'Processing Discharge...' : 'Initiate Discharge & Release Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
