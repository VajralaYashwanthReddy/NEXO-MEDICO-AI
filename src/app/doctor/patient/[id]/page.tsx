'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  UserCheck,
  Stethoscope,
  Pill,
  FlaskConical,
  Sparkles,
  BedDouble,
  HeartPulse,
  AlertTriangle,
  FileText,
  Plus,
  Activity,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function CompletePatientTimelinePage() {
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'consultation' | 'prescriptions' | 'labs' | 'images' | 'admissions'>('timeline');

  // Consultation form state
  const [symptoms, setSymptoms] = useState('');
  const [vitalsBp, setVitalsBp] = useState('120/80');
  const [vitalsHr, setVitalsHr] = useState('72');
  const [vitalsTemp, setVitalsTemp] = useState('98.6');
  const [vitalsSpo2, setVitalsSpo2] = useState('98');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [savingConsultation, setSavingConsultation] = useState(false);

  const fetchPatientTimeline = () => {
    fetch(`/api/patients/${patientId}/timeline`)
      .then(res => res.json())
      .then(data => setPatient(data.patientTimeline))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (patientId) fetchPatientTimeline();
  }, [patientId]);

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConsultation(true);
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          symptoms,
          vitalsBp,
          vitalsHr,
          vitalsTemp,
          vitalsSpo2,
          clinicalNotes,
          diagnosis
        })
      });
      if (res.ok) {
        setSymptoms('');
        setClinicalNotes('');
        setDiagnosis('');
        fetchPatientTimeline();
        setActiveTab('timeline');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingConsultation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Retrieving Central Patient Medical History...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Patient medical record not found in tenant database.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Central Patient Demographic Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-cyan-600 to-blue-700 text-white rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-lg">
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-cyan-700 text-xs bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                  {patient.patientCode}
                </span>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  Blood Group: {patient.bloodGroup}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">{patient.fullName}</h1>
              <p className="text-xs text-slate-500">
                {patient.gender}, DOB: {patient.dob} | Phone: {patient.phone} | Emergency: {patient.emergencyContact}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/doctor/prescriptions?patientId=${patient.id}`}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
            >
              <Pill className="w-4 h-4" /> Issue Prescription
            </Link>
          </div>
        </div>

        {/* Highlighted Known Allergies & Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-900 block">Documented Allergies:</span>
              <p className="text-rose-800 font-semibold mt-0.5">{patient.allergies || 'No known allergies reported'}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
            <Activity className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block">Chronic Conditions & History:</span>
              <p className="text-slate-600 font-medium mt-0.5">{patient.conditions || 'No chronic conditions'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'timeline'
              ? 'border-cyan-600 text-cyan-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Comprehensive Medical Timeline
        </button>

        <button
          onClick={() => setActiveTab('consultation')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'consultation'
              ? 'border-cyan-600 text-cyan-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" /> New Consultation
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'prescriptions'
              ? 'border-cyan-600 text-cyan-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" /> Prescriptions ({patient.prescriptions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'labs'
              ? 'border-cyan-600 text-cyan-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FlaskConical className="w-4 h-4" /> Lab Reports ({patient.labOrders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('images')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'images'
              ? 'border-cyan-600 text-cyan-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Radiology & AI Heatmaps
        </button>

        <button
          onClick={() => setActiveTab('admissions')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'admissions'
              ? 'border-cyan-600 text-cyan-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BedDouble className="w-4 h-4" /> Admissions & ICU History
        </button>
      </div>

      {/* TAB 1: Unified Medical History Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 text-base border-b pb-3">Complete Medical Timeline for {patient.fullName}</h3>
          
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pl-6">
            {patient.medicalRecords?.map((rec: any) => (
              <div key={rec.id} className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-cyan-600 ring-4 ring-white" />
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">{rec.recordType}</span>
                    <span className="text-slate-400 font-mono">{new Date(rec.visitDate).toLocaleString()}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{rec.title}</h4>
                  <p className="text-xs text-slate-700 font-medium mt-1">{rec.summary}</p>
                  {rec.details && <p className="text-xs text-slate-500 mt-2 bg-white p-2.5 rounded border whitespace-pre-wrap">{rec.details}</p>}
                </div>
              </div>
            ))}

            {patient.medicalRecords?.length === 0 && (
              <p className="text-xs text-slate-400 italic">No historical clinical entries documented yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: New Clinical Consultation Workspace */}
      {activeTab === 'consultation' && (
        <form onSubmit={handleSaveConsultation} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
          <h3 className="font-bold text-slate-900 text-base border-b pb-3 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-cyan-600" /> Record Clinical Encounter & Patient Vitals
          </h3>

          <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="font-semibold text-slate-700">Blood Pressure (BP)</label>
              <input type="text" value={vitalsBp} onChange={(e) => setVitalsBp(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg bg-white" />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Heart Rate (bpm)</label>
              <input type="text" value={vitalsHr} onChange={(e) => setVitalsHr(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg bg-white" />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Temperature (°F)</label>
              <input type="text" value={vitalsTemp} onChange={(e) => setVitalsTemp(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg bg-white" />
            </div>
            <div>
              <label className="font-semibold text-slate-700">SpO2 Oxygen (%)</label>
              <input type="text" value={vitalsSpo2} onChange={(e) => setVitalsSpo2(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg bg-white text-emerald-600 font-bold" />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 text-sm">Presenting Symptoms *</label>
            <textarea required value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g. Sharp retrosternal chest pain radiating to left arm, shortness of breath on exertion for 2 days" className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm" rows={2} />
          </div>

          <div>
            <label className="font-bold text-slate-800 text-sm">Clinical Findings & Examination Notes</label>
            <textarea value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} placeholder="e.g. S1 S2 heard normally. S3 gallop present. Bilateral basal crepitations noted on auscultation." className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm" rows={3} />
          </div>

          <div>
            <label className="font-bold text-slate-800 text-sm">Confirmed Clinical Diagnosis *</label>
            <input type="text" required value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Acute Coronary Syndrome / Essential Hypertension" className="w-full mt-1 px-3 py-2.5 border rounded-xl text-sm font-bold text-cyan-800" />
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button type="submit" disabled={savingConsultation} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2">
              {savingConsultation ? 'Saving Record...' : 'Complete Consultation & Add to Timeline'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-900 text-base">Digital Prescriptions History</h3>
            <Link href={`/doctor/prescriptions?patientId=${patient.id}`} className="px-3.5 py-1.5 bg-cyan-600 text-white text-xs font-bold rounded-lg">
              + Issue New Prescription
            </Link>
          </div>

          <div className="space-y-4">
            {patient.prescriptions?.map((rx: any) => (
              <div key={rx.id} className="p-4 border rounded-xl bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-cyan-800">{rx.prescriptionCode}</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${rx.status === 'DISPENSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {rx.status}
                  </span>
                </div>
                <div className="space-y-1 pt-2">
                  {rx.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between bg-white p-2 rounded border font-medium">
                      <span>💊 <strong>{item.medicineName}</strong> ({item.strength}) — {item.dosage}</span>
                      <span className="text-slate-500">{item.frequency} for {item.durationDays} days ({item.foodRelation})</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
