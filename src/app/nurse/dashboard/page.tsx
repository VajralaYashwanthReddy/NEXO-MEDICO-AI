'use client';

import React, { useEffect, useState } from 'react';
import { HeartPulse, Activity, BedDouble, Plus, CheckCircle2 } from 'lucide-react';

export default function NurseDashboard() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Hourly ICU Log Form State
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [bp, setBp] = useState('124/82');
  const [hr, setHr] = useState('78');
  const [temp, setTemp] = useState('98.4');
  const [spo2, setSpo2] = useState('99');
  const [nurseNotes, setNurseNotes] = useState('');
  const [savingLog, setSavingLog] = useState(false);

  const fetchAdmissions = () => {
    fetch('/api/admissions')
      .then(res => res.json())
      .then(data => setAdmissions(data.admissions?.filter((a: any) => a.status === 'ADMITTED') || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    setSavingLog(true);
    try {
      const res = await fetch('/api/icu/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedId: selectedAdmission.bedId,
          patientId: selectedAdmission.patientId,
          vitalsBp: bp,
          vitalsHr: hr,
          vitalsTemp: temp,
          vitalsSpo2: spo2,
          nurseNotes
        })
      });
      if (res.ok) {
        setSelectedAdmission(null);
        setNurseNotes('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingLog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-purple-600" /> Nursing Care & Inpatient Vitals Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hourly patient vitals logs, medication administration tasks, and bed monitoring
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading assigned inpatient wards...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Active Inpatients & Bed Assignments</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {admissions.map((adm) => (
              <div key={adm.id} className="p-4 border rounded-xl bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-800 text-xs bg-purple-100 px-2 py-0.5 rounded">
                    Bed {adm.bed?.bedNumber} ({adm.ward?.name})
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    ADMITTED
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{adm.patient?.fullName}</h4>
                  <p className="text-xs text-slate-500">Diagnosis: {adm.diagnosis}</p>
                </div>

                <div className="pt-2 border-t flex justify-end">
                  <button
                    onClick={() => setSelectedAdmission(adm)}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" /> Record Vitals & Nursing Log
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Vitals Modal */}
      {selectedAdmission && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Record Vitals for {selectedAdmission.patient?.fullName}</h3>
            <form onSubmit={handleRecordVitals} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">BP (mmHg)</label>
                  <input type="text" value={bp} onChange={(e) => setBp(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Heart Rate (bpm)</label>
                  <input type="text" value={hr} onChange={(e) => setHr(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Temp (°F)</label>
                  <input type="text" value={temp} onChange={(e) => setTemp(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">SpO2 (%)</label>
                  <input type="text" value={spo2} onChange={(e) => setSpo2(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg font-bold text-emerald-600" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Nursing Notes</label>
                <textarea rows={2} value={nurseNotes} onChange={(e) => setNurseNotes(e.target.value)} placeholder="Patient resting comfortably..." className="w-full mt-1 px-3 py-2 border rounded-lg" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSelectedAdmission(null)} className="px-4 py-2 text-slate-500 font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={savingLog} className="px-5 py-2 bg-purple-600 text-white font-bold rounded-lg shadow">
                  {savingLog ? 'Saving Log...' : 'Save Vitals Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
