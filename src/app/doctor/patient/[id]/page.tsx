'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
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
  Trash2,
  Activity,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  Search,
  Printer,
  ShieldAlert,
  ArrowRight,
  Thermometer,
  Gauge,
  Info,
  Check,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// Common ICD-10 diagnostic options
const COMMON_DIAGNOSES = [
  'Essential (Primary) Hypertension',
  'Type 2 Diabetes Mellitus without complications',
  'Acute Bronchitis, unspecified',
  'Gastro-esophageal Reflux Disease without esophagitis',
  'Migraine, unspecified, not intractable',
  'Bronchial Asthma, mild intermittent',
  'Acute Pharyngitis / Upper Respiratory Infection',
  'Acute Coronary Syndrome / Angina Pectoris',
  'Osteoarthritis, generalized',
  'Allergic Rhinitis, cause unspecified',
  'Acute Gastroenteritis and Colitis',
  'Urinary Tract Infection, site not specified',
  'Generalized Anxiety Disorder',
  'Major Depressive Disorder, single episode',
  'Lumbar Disc Disorder / Low Back Pain'
];

function CompletePatientTimelineContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const patientId = params.id as string;
  const appointmentId = searchParams.get('appointmentId') || '';

  const [patient, setPatient] = useState<any>(null);
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'encounter' | 'timeline' | 'prescriptions' | 'labs' | 'admissions'>('encounter');

  // 7-Step Guided Consultation Stepper
  const [currentStep, setCurrentStep] = useState<number>(1);

  // STEP 2: Vitals State
  const [vitalsSys, setVitalsSys] = useState('120');
  const [vitalsDia, setVitalsDia] = useState('80');
  const [vitalsHr, setVitalsHr] = useState('72');
  const [vitalsTemp, setVitalsTemp] = useState('98.6');
  const [vitalsSpo2, setVitalsSpo2] = useState('98');
  const [vitalsRr, setVitalsRr] = useState('16');
  const [vitalsHeight, setVitalsHeight] = useState('170');
  const [vitalsWeight, setVitalsWeight] = useState('70');
  const [painScore, setPainScore] = useState<number>(0);

  // STEP 3: Clinical Notes State
  const [symptoms, setSymptoms] = useState('');
  const [hpi, setHpi] = useState('');
  const [physicalExam, setPhysicalExam] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // STEP 4: Diagnosis State
  const [diagnosisQuery, setDiagnosisQuery] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [secondaryDiagnosis, setSecondaryDiagnosis] = useState('');
  const [certainty, setCertainty] = useState<'CONFIRMED' | 'PROVISIONAL'>('CONFIRMED');

  // STEP 5: Orders & Prescriptions State
  const [pharmacyStock, setPharmacyStock] = useState<any[]>([]);
  const [labTestCatalog, setLabTestCatalog] = useState<any[]>([]);
  const [rxItems, setRxItems] = useState<any[]>([
    {
      name: '',
      strength: '500 mg',
      dosage: '1 tablet',
      route: 'Oral',
      frequency: 'Twice daily',
      durationDays: 5,
      quantity: 10,
      foodRelation: 'After food',
      instructions: 'Take with plenty of water'
    }
  ]);
  const [rxGeneralInstructions, setRxGeneralInstructions] = useState('Take medications as prescribed after meals.');
  const [orderedLabs, setOrderedLabs] = useState<any[]>([]);

  // STEP 6: Follow-up State
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDays, setFollowUpDays] = useState(7);
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [followUpSlot, setFollowUpSlot] = useState('10:00 AM');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // STEP 7: Completion & Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionSummary, setCompletionSummary] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch patient timeline
  const fetchPatientTimeline = async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}/timeline`);
      const data = await res.json();
      if (res.ok) {
        setPatient(data.patientTimeline);
      }
    } catch (err) {
      console.error('Failed to load patient timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch appointment if appointmentId provided
  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return;
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`);
      const data = await res.json();
      if (res.ok && data.appointment) {
        setAppointment(data.appointment);
        if (data.appointment.reason && !symptoms) {
          setSymptoms(data.appointment.reason);
        }
      }
    } catch (err) {
      console.error('Failed to load appointment details:', err);
    }
  };

  // Fetch pharmacy stock and lab tests catalog
  useEffect(() => {
    // Pharmacy stock
    fetch('/api/pharmacy/medicines')
      .then(res => res.json())
      .then(data => {
        const meds = (data.medicines || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          genericName: m.genericName,
          category: m.category,
          totalQty: (m.inventoryItems || []).reduce((acc: number, inv: any) => acc + inv.quantity, 0)
        }));
        setPharmacyStock(meds);
        if (meds.length > 0 && !rxItems[0]?.name) {
          setRxItems([{ ...rxItems[0], name: meds[0].name }]);
        }
      })
      .catch(e => console.error(e));

    // Lab tests catalog
    fetch('/api/laboratory/orders')
      .then(res => res.json())
      .then(data => {
        if (data.availableTests) {
          setLabTestCatalog(data.availableTests);
        }
      })
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    if (patientId) {
      fetchPatientTimeline();
      if (appointmentId) fetchAppointmentDetails();
    }
  }, [patientId, appointmentId]);

  // Real-time BMI calculation
  const bmiInfo = useMemo(() => {
    const h = parseFloat(vitalsHeight);
    const w = parseFloat(vitalsWeight);
    if (!h || !w || h <= 0 || w <= 0) return { bmi: 'N/A', category: 'Unknown', color: 'text-slate-500' };
    const heightInMeters = h / 100;
    const val = (w / (heightInMeters * heightInMeters)).toFixed(1);
    const num = parseFloat(val);
    if (num < 18.5) return { bmi: val, category: 'Underweight', color: 'text-blue-600 bg-blue-50' };
    if (num < 25) return { bmi: val, category: 'Normal weight', color: 'text-emerald-700 bg-emerald-50' };
    if (num < 30) return { bmi: val, category: 'Overweight', color: 'text-amber-700 bg-amber-50' };
    return { bmi: val, category: 'Obesity', color: 'text-rose-700 bg-rose-50' };
  }, [vitalsHeight, vitalsWeight]);

  // Vitals Warnings Detection
  const vitalsWarnings = useMemo(() => {
    const warnings: string[] = [];
    const sys = parseInt(vitalsSys);
    const dia = parseInt(vitalsDia);
    const hr = parseInt(vitalsHr);
    const temp = parseFloat(vitalsTemp);
    const spo2 = parseInt(vitalsSpo2);
    const rr = parseInt(vitalsRr);

    if (sys >= 140 || dia >= 90) warnings.push(`Elevated BP (${vitalsSys}/${vitalsDia} mmHg) indicates Stage 1/2 Hypertension.`);
    if (sys < 90 || dia < 60) warnings.push(`Low BP (${vitalsSys}/${vitalsDia} mmHg) indicates Hypotension.`);
    if (hr > 100) warnings.push(`Elevated Heart Rate (${vitalsHr} bpm) indicates Tachycardia.`);
    if (hr < 60) warnings.push(`Low Heart Rate (${vitalsHr} bpm) indicates Bradycardia.`);
    if (temp >= 100.4) warnings.push(`Elevated Body Temp (${vitalsTemp}°F) indicates Pyrexia / Fever.`);
    if (spo2 < 95) warnings.push(`Low Oxygen Saturation (${vitalsSpo2}%) indicates Hypoxia risk.`);
    if (rr > 20) warnings.push(`Elevated Respiratory Rate (${vitalsRr} breaths/min) indicates Tachypnea.`);

    return warnings;
  }, [vitalsSys, vitalsDia, vitalsHr, vitalsTemp, vitalsSpo2, vitalsRr]);

  // Allergy safety warnings for selected medicines
  const allergyAlerts = useMemo(() => {
    if (!patient?.allergies) return [];
    const patientAllergies = patient.allergies.toLowerCase();
    const alerts: string[] = [];

    rxItems.forEach(item => {
      if (!item.name) return;
      const medName = item.name.toLowerCase();
      if (patientAllergies.includes('penicillin') && (medName.includes('amoxicillin') || medName.includes('penicillin') || medName.includes('ampicillin'))) {
        alerts.push(`WARNING: Patient has documented Penicillin allergy! "${item.name}" is a penicillin-class antibiotic.`);
      }
      if (patientAllergies.includes('sulfa') && (medName.includes('sulfamethoxazole') || medName.includes('bactrim') || medName.includes('septra'))) {
        alerts.push(`WARNING: Patient has documented Sulfa allergy! "${item.name}" contains sulfonamides.`);
      }
      if (patientAllergies.includes('aspirin') && (medName.includes('aspirin') || medName.includes('nsaid') || medName.includes('ibuprofen'))) {
        alerts.push(`WARNING: Patient has documented NSAID/Aspirin allergy! "${item.name}" may trigger severe reaction.`);
      }
    });

    return alerts;
  }, [patient?.allergies, rxItems]);

  // Follow-up Interval Preset Picker
  const handleFollowUpPreset = (days: number) => {
    setFollowUpDays(days);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().split('T')[0]);
  };

  // Add / Remove Prescription Item
  const handleAddRxItem = () => {
    setRxItems([
      ...rxItems,
      {
        name: pharmacyStock[0]?.name || '',
        strength: '500 mg',
        dosage: '1 tablet',
        route: 'Oral',
        frequency: 'Twice daily',
        durationDays: 5,
        quantity: 10,
        foodRelation: 'After food',
        instructions: 'After meals'
      }
    ]);
  };

  const handleRemoveRxItem = (index: number) => {
    setRxItems(rxItems.filter((_, i) => i !== index));
  };

  // Add Lab Order
  const handleToggleLabOrder = (test: any) => {
    const exists = orderedLabs.some(l => l.testId === test.id);
    if (exists) {
      setOrderedLabs(orderedLabs.filter(l => l.testId !== test.id));
    } else {
      setOrderedLabs([
        ...orderedLabs,
        {
          testId: test.id,
          testName: test.name,
          category: test.category,
          priority: 'ROUTINE',
          notes: ''
        }
      ]);
    }
  };

  // Finalize & Complete Consultation
  const handleFinalizeConsultation = async () => {
    const diag = selectedDiagnosis || diagnosisQuery;
    if (!diag) {
      setErrorMessage('A primary diagnosis is required before completing consultation.');
      setCurrentStep(4);
      return;
    }
    if (!symptoms) {
      setErrorMessage('Presenting symptoms / chief complaint is required.');
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const validMedicines = rxItems.filter(i => i.name.trim() !== '');

      const payload = {
        appointmentId: appointmentId || undefined,
        patientId,
        doctorId: user?.id,
        symptoms,
        vitalsBp: `${vitalsSys}/${vitalsDia}`,
        vitalsHr,
        vitalsTemp,
        vitalsSpo2,
        vitalsRr,
        vitalsHeight,
        vitalsWeight,
        vitalsBmi: bmiInfo.bmi,
        painScore,
        clinicalNotes,
        hpi,
        physicalExam,
        diagnosis: diag,
        secondaryDiagnosis,
        certainty,
        medicines: validMedicines,
        prescriptionInstructions: rxGeneralInstructions,
        labOrders: orderedLabs,
        followUp: {
          required: followUpRequired,
          date: followUpRequired ? followUpDate : undefined,
          timeSlot: followUpSlot,
          notes: followUpNotes || `Follow-up evaluation for ${diag}`,
          visitType: 'IN_PERSON'
        }
      };

      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete consultation');

      setCompletionSummary({
        consultation: data.consultation,
        prescription: data.prescription,
        labOrders: data.labOrders,
        followUp: data.followUpAppointment,
        appointment: data.appointment,
        patientName: patient.fullName,
        patientCode: patient.patientCode,
        vitalsSummary: `${vitalsSys}/${vitalsDia} mmHg, HR ${vitalsHr} bpm, Temp ${vitalsTemp}°F, SpO2 ${vitalsSpo2}%, BMI ${bmiInfo.bmi}`,
        diagnosis: diag
      });

      fetchPatientTimeline();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving clinical encounter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Retrieving Comprehensive Patient Clinical Record...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="font-bold text-slate-800">Patient medical record not found in tenant database.</p>
        <Link href="/doctor/appointments" className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
          Return to Appointment Center
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Encounter Banner (if linked to appointment) */}
      {appointment && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 border border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-400/30">
              <Clock className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-400/20 text-cyan-200 px-2 py-0.5 rounded border border-cyan-400/30 font-mono">
                  Active Consultation #{appointment.appointmentCode}
                </span>
                <span className="text-xs text-blue-200 font-mono">
                  {appointment.date} @ {appointment.timeSlot} ({appointment.durationMinutes || 30} mins)
                </span>
              </div>
              <p className="text-xs text-blue-100 font-semibold mt-0.5">
                Chief Complaint from Booking: <span className="text-white italic">"{appointment.reason}"</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              appointment.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950 animate-pulse'
            }`}>
              Status: {appointment.status}
            </span>
          </div>
        </div>
      )}

      {/* Central Patient Demographic Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-md">
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-extrabold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {patient.patientCode}
                </span>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Blood Group: {patient.bloodGroup}
                </span>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {patient.gender} • DOB: {patient.dob}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-0.5">{patient.fullName}</h1>
              <p className="text-xs text-slate-500">
                Phone: {patient.phone} | Address: {patient.address} | Emergency: {patient.emergencyContact}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('encounter')}
              className={`px-3.5 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all ${
                activeTab === 'encounter'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Stethoscope className="w-4 h-4" /> Clinical Encounter
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === 'timeline'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" /> Medical History
            </button>
          </div>
        </div>

        {/* Highlighted Known Allergies & Chronic Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
            patient.allergies ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${patient.allergies ? 'text-rose-600' : 'text-slate-400'}`} />
            <div>
              <span className="font-extrabold block uppercase tracking-wider text-[10px]">
                Documented Allergies
              </span>
              <p className="font-bold mt-0.5">
                {patient.allergies ? patient.allergies : 'No known drug or food allergies recorded'}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-2.5">
            <Activity className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-blue-900 block uppercase tracking-wider text-[10px]">
                Chronic Conditions & Medical History
              </span>
              <p className="text-blue-950 font-medium mt-0.5">
                {patient.conditions || patient.previousHistory || 'No chronic medical conditions documented'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('encounter')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'encounter'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" /> 7-Step Guided Consultation Workspace
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Comprehensive Medical Timeline ({patient.medicalRecords?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'prescriptions'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" /> Prescriptions ({patient.prescriptions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'labs'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FlaskConical className="w-4 h-4" /> Lab Orders & Reports ({patient.labOrders?.length || 0})
        </button>
      </div>

      {/* ERROR MESSAGE DISPLAY */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="font-mono text-xs">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: 7-STEP GUIDED CLINICAL ENCOUNTER WORKSPACE                           */}
      {/* ========================================================================= */}
      {activeTab === 'encounter' && !completionSummary && (
        <div className="space-y-6">
          {/* 7-Step Navigation Progress Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
              {[
                { step: 1, label: '1. Review' },
                { step: 2, label: '2. Vitals' },
                { step: 3, label: '3. Clinical Notes' },
                { step: 4, label: '4. Diagnosis' },
                { step: 5, label: '5. Orders & Rx' },
                { step: 6, label: '6. Follow-up' },
                { step: 7, label: '7. Complete' }
              ].map(s => {
                const isActive = currentStep === s.step;
                const isPassed = currentStep > s.step;
                return (
                  <button
                    key={s.step}
                    onClick={() => setCurrentStep(s.step)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : null}
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 1: PATIENT REVIEW */}
          {currentStep === 1 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" /> Step 1: Patient Background & Prior History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify patient demographics, active conditions, previous prescriptions and past lab findings before proceeding.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  Next: Record Vitals <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Patient Core Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px] font-bold">Universal Patient Code</span>
                  <span className="text-slate-900 font-mono font-black text-sm">{patient.patientCode}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px] font-bold">Total Previous Visits</span>
                  <span className="text-slate-900 font-black text-sm">{patient.medicalRecords?.length || 0} visits</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px] font-bold">Past Prescriptions</span>
                  <span className="text-slate-900 font-black text-sm">{patient.prescriptions?.length || 0} issued</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px] font-bold">Past Lab Investigations</span>
                  <span className="text-slate-900 font-black text-sm">{patient.labOrders?.length || 0} tests</span>
                </div>
              </div>

              {/* Recent Consultations Snapshot */}
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Previous Clinical Consultations</h4>
                {patient.consultations && patient.consultations.length > 0 ? (
                  <div className="space-y-2">
                    {patient.consultations.slice(0, 3).map((c: any) => (
                      <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-blue-900">{c.diagnosis}</span>
                          <p className="text-slate-500 mt-0.5 line-clamp-1">Symptoms: {c.symptoms}</p>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No previous consultations recorded for this patient.</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: VITALS RECORDING */}
          {currentStep === 2 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-rose-600" /> Step 2: Record Patient Vital Signs
                  </h3>
                  <p className="text-xs text-slate-500">
                    Input current physiological indicators. Values outside standard reference ranges trigger instant visual warnings.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    Next: Clinical Notes <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live Alerts for Out-of-Range Vitals */}
              {vitalsWarnings.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Physiological Out-of-Range Alerts
                  </div>
                  {vitalsWarnings.map((w, idx) => (
                    <p key={idx} className="text-xs font-semibold text-amber-800 ml-5">• {w}</p>
                  ))}
                </div>
              )}

              {/* Vitals Form Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                {/* Blood Pressure Systolic */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-700 block mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={vitalsSys}
                    onChange={e => setVitalsSys(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-mono font-bold text-slate-900"
                    placeholder="120"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Normal: 90 - 120</span>
                </div>

                {/* Blood Pressure Diastolic */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-700 block mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={vitalsDia}
                    onChange={e => setVitalsDia(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-mono font-bold text-slate-900"
                    placeholder="80"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Normal: 60 - 80</span>
                </div>

                {/* Heart Rate */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-700 block mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={vitalsHr}
                    onChange={e => setVitalsHr(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-mono font-bold text-slate-900"
                    placeholder="72"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Normal: 60 - 100</span>
                </div>

                {/* Temperature */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-700 block mb-1">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsTemp}
                    onChange={e => setVitalsTemp(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-mono font-bold text-slate-900"
                    placeholder="98.6"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Normal: 97.0 - 99.0</span>
                </div>

                {/* SpO2 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-700 block mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="number"
                    value={vitalsSpo2}
                    onChange={e => setVitalsSpo2(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white font-mono font-bold ${
                      parseInt(vitalsSpo2) < 95 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                    placeholder="98"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Normal: 95 - 100%</span>
                </div>

                {/* Respiratory Rate */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-700 block mb-1">Resp. Rate (/min)</label>
                  <input
                    type="number"
                    value={vitalsRr}
                    onChange={e => setVitalsRr(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-mono font-bold text-slate-900"
                    placeholder="16"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Normal: 12 - 20</span>
                </div>
              </div>

              {/* Anthropometrics & Pain Assessment */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                {/* Height & Weight */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-slate-800">Anthropometrics</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-600 block mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={vitalsHeight}
                        onChange={e => setVitalsHeight(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-600 block mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={vitalsWeight}
                        onChange={e => setVitalsWeight(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto Calculated BMI Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h4 className="font-black text-slate-800">Calculated Body Mass Index (BMI)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Calculated automatically from height and weight</p>
                  </div>
                  <div className="my-2 flex items-baseline gap-3">
                    <span className="text-3xl font-black text-slate-900 font-mono">{bmiInfo.bmi}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${bmiInfo.color}`}>
                      {bmiInfo.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Formula: kg/m²</span>
                </div>

                {/* Pain Score Slider */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-800">Pain Assessment Scale</h4>
                    <span className="text-sm font-black font-mono px-2 py-0.5 bg-blue-100 text-blue-900 rounded">
                      {painScore} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painScore}
                    onChange={e => setPainScore(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>0: None</span>
                    <span>3: Mild</span>
                    <span>6: Moderate</span>
                    <span>10: Worst</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CLINICAL NOTES */}
          {currentStep === 3 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" /> Step 3: Clinical Notes & Examination Findings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Document patient-reported presenting complaints, history of illness, and systemic physical examinations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    Next: Diagnosis <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Symptoms / Chief Complaint */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  Chief Complaint & Presenting Symptoms <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  placeholder="e.g. Sharp retrosternal chest pain radiating to left shoulder, worsening on exertion for 3 days"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-blue-500"
                />
              </div>

              {/* History of Presenting Illness (HPI) */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  History of Presenting Illness (HPI)
                </label>
                <textarea
                  rows={3}
                  value={hpi}
                  onChange={e => setHpi(e.target.value)}
                  placeholder="e.g. Onset was sudden during physical work. Associated with mild diaphoresis and shortness of breath. No prior similar episodes."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-blue-500"
                />
              </div>

              {/* Physical Examination Findings */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  Physical Examination Findings
                </label>
                <textarea
                  rows={3}
                  value={physicalExam}
                  onChange={e => setPhysicalExam(e.target.value)}
                  placeholder="e.g. CVS: S1 S2 heard, no murmurs. RS: Bilateral vesicular breath sounds, no rhonchi. Abdomen: Soft, non-tender."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-blue-500"
                />
              </div>

              {/* General Remarks */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  Physician Assessment Remarks & Impressions
                </label>
                <textarea
                  rows={2}
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  placeholder="General physician observations or patient communication remarks..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-blue-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4: DIAGNOSIS */}
          {currentStep === 4 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" /> Step 4: Diagnosis & Certainty
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select or search ICD-10 clinical diagnoses. Mark certainty as Confirmed or Provisional.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    Next: Orders & Rx <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Primary Diagnosis Selector */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  Primary Clinical Diagnosis <span className="text-rose-600">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={diagnosisQuery || selectedDiagnosis}
                    onChange={e => {
                      setDiagnosisQuery(e.target.value);
                      setSelectedDiagnosis(e.target.value);
                    }}
                    placeholder="Search or enter diagnosis name..."
                    className="w-full px-3.5 py-2.5 text-xs font-bold text-blue-900 rounded-xl border border-slate-300 focus:outline-blue-500"
                  />

                  {/* Common Pre-configured Clinical Diagnoses Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {COMMON_DIAGNOSES.map((d, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedDiagnosis(d);
                          setDiagnosisQuery(d);
                        }}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                          selectedDiagnosis === d
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secondary Diagnosis / Comorbidities */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  Secondary Diagnosis / Comorbidities
                </label>
                <input
                  type="text"
                  value={secondaryDiagnosis}
                  onChange={e => setSecondaryDiagnosis(e.target.value)}
                  placeholder="e.g. Dyslipidemia, Hyperuricemia, Chronic Kidney Disease Stage 2"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-blue-500"
                />
              </div>

              {/* Certainty Toggle */}
              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">
                  Diagnostic Certainty Level
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="certainty"
                      checked={certainty === 'CONFIRMED'}
                      onChange={() => setCertainty('CONFIRMED')}
                      className="text-blue-600"
                    />
                    Confirmed Diagnosis
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="certainty"
                      checked={certainty === 'PROVISIONAL'}
                      onChange={() => setCertainty('PROVISIONAL')}
                      className="text-blue-600"
                    />
                    Provisional / Differential Diagnosis
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: ORDERS & PRESCRIPTIONS */}
          {currentStep === 5 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-emerald-600" /> Step 5: Prescriptions & Diagnostic Investigations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Prescribe medications from current hospital inventory and order diagnostic laboratory panels.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(6)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    Next: Follow-up <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Allergy Warning Banners */}
              {allergyAlerts.length > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-rose-900 uppercase">
                    <ShieldAlert className="w-4 h-4 text-rose-600" /> Patient Allergy Conflict Detected!
                  </div>
                  {allergyAlerts.map((al, idx) => (
                    <p key={idx} className="text-xs font-bold text-rose-800 ml-5">• {al}</p>
                  ))}
                </div>
              )}

              {/* Prescription Items Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-emerald-600" /> Prescribed Medications
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddRxItem}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medicine
                  </button>
                </div>

                <div className="space-y-3">
                  {rxItems.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-700">Medicine #{idx + 1}</span>
                        {rxItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRxItem(idx)}
                            className="text-rose-600 hover:text-rose-800 font-bold text-[11px] flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <label className="font-semibold text-slate-600 block mb-1">Medication Name</label>
                          <input
                            type="text"
                            list={`med-suggestions-${idx}`}
                            value={item.name}
                            onChange={e => {
                              const newArr = [...rxItems];
                              newArr[idx].name = e.target.value;
                              setRxItems(newArr);
                            }}
                            placeholder="e.g. Amoxicillin 500mg, Atorvastatin 20mg"
                            className="w-full px-3 py-2 border rounded-lg bg-white font-bold"
                          />
                          <datalist id={`med-suggestions-${idx}`}>
                            {pharmacyStock.map(p => (
                              <option key={p.id} value={p.name}>
                                Stock: {p.totalQty} units ({p.category})
                              </option>
                            ))}
                          </datalist>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">Dosage & Strength</label>
                          <input
                            type="text"
                            value={item.strength}
                            onChange={e => {
                              const newArr = [...rxItems];
                              newArr[idx].strength = e.target.value;
                              setRxItems(newArr);
                            }}
                            placeholder="500 mg / 10 ml"
                            className="w-full px-3 py-2 border rounded-lg bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">Frequency</label>
                          <select
                            value={item.frequency}
                            onChange={e => {
                              const newArr = [...rxItems];
                              newArr[idx].frequency = e.target.value;
                              setRxItems(newArr);
                            }}
                            className="w-full px-3 py-2 border rounded-lg bg-white font-semibold"
                          >
                            <option value="Once daily">Once daily (OD)</option>
                            <option value="Twice daily">Twice daily (BD)</option>
                            <option value="Thrice daily">Thrice daily (TDS)</option>
                            <option value="Four times daily">Four times daily (QID)</option>
                            <option value="Every 8 hours">Every 8 hours</option>
                            <option value="SOS / As needed">SOS / As needed</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">Duration (Days)</label>
                          <input
                            type="number"
                            value={item.durationDays}
                            onChange={e => {
                              const newArr = [...rxItems];
                              newArr[idx].durationDays = parseInt(e.target.value) || 1;
                              newArr[idx].quantity = (parseInt(e.target.value) || 1) * 2;
                              setRxItems(newArr);
                            }}
                            className="w-full px-3 py-2 border rounded-lg bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">Quantity (Units)</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={e => {
                              const newArr = [...rxItems];
                              newArr[idx].quantity = parseInt(e.target.value) || 1;
                              setRxItems(newArr);
                            }}
                            className="w-full px-3 py-2 border rounded-lg bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">Relation to Food</label>
                          <select
                            value={item.foodRelation}
                            onChange={e => {
                              const newArr = [...rxItems];
                              newArr[idx].foodRelation = e.target.value;
                              setRxItems(newArr);
                            }}
                            className="w-full px-3 py-2 border rounded-lg bg-white"
                          >
                            <option value="After food">After food</option>
                            <option value="Before food">Before food</option>
                            <option value="With food">With food</option>
                            <option value="Empty stomach">Empty stomach</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">Administration Route</label>
                          <select
                            value={item.route}
                            onChange={e => {
                              const newArr = [...rxItems];
                              newArr[idx].route = e.target.value;
                              setRxItems(newArr);
                            }}
                            className="w-full px-3 py-2 border rounded-lg bg-white"
                          >
                            <option value="Oral">Oral</option>
                            <option value="Intravenous (IV)">Intravenous (IV)</option>
                            <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                            <option value="Topical">Topical</option>
                            <option value="Inhalation">Inhalation</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-xs">
                    General Prescription Instructions
                  </label>
                  <input
                    type="text"
                    value={rxGeneralInstructions}
                    onChange={e => setRxGeneralInstructions(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                    placeholder="e.g. Drink plenty of warm water. Avoid strenuous physical activity."
                  />
                </div>
              </div>

              {/* Laboratory Orders Selection */}
              <div className="pt-4 border-t space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-purple-600" /> Diagnostic Laboratory Investigations
                </h4>
                <p className="text-xs text-slate-500">
                  Select investigations to dispatch directly to the Hospital Pathology & Laboratory Queue.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {labTestCatalog.map(t => {
                    const isSelected = orderedLabs.some(l => l.testId === t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleToggleLabOrder(t)}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start justify-between ${
                          isSelected
                            ? 'bg-purple-50 border-purple-400 text-purple-950 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div>
                          <span className="font-extrabold block">{t.name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{t.category} • {t.sampleType}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: FOLLOW-UP */}
          {currentStep === 6 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" /> Step 6: Follow-up Scheduling & Instructions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Schedule a follow-up appointment in the system and provide patient recall guidelines.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(7)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                  >
                    Next: Final Review <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Follow-up Required Toggle */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-800 text-xs">Patient Follow-up Consultation Required?</h4>
                  <p className="text-xs text-slate-500">Automatically reserve a future consultation slot in the hospital calendar</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={followUpRequired}
                    onChange={e => setFollowUpRequired(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {followUpRequired && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Recommended Follow-up Interval</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { days: 3, label: '3 Days' },
                        { days: 7, label: '1 Week' },
                        { days: 14, label: '2 Weeks' },
                        { days: 30, label: '1 Month' },
                        { days: 90, label: '3 Months' }
                      ].map(preset => (
                        <button
                          key={preset.days}
                          type="button"
                          onClick={() => handleFollowUpPreset(preset.days)}
                          className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                            followUpDays === preset.days
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Follow-up Target Date</label>
                      <input
                        type="date"
                        value={followUpDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setFollowUpDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Target Time Slot</label>
                      <select
                        value={followUpSlot}
                        onChange={e => setFollowUpSlot(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white font-bold"
                      >
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Follow-up Clinical Notes & Patient Instructions</label>
                    <textarea
                      rows={2}
                      value={followUpNotes}
                      onChange={e => setFollowUpNotes(e.target.value)}
                      placeholder="e.g. Review fasting blood glucose and lipid profile results. Adjust medication dosage if BP remains elevated."
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: COMPLETE CONSULTATION */}
          {currentStep === 7 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Step 7: Finalize & Conclude Consultation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review encounter summary. Concluding will mark the appointment Completed, record the medical timeline, dispatch prescriptions, and schedule follow-up.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep(6)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              </div>

              {/* Summary Review Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Vitals Summary */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-black text-slate-700 uppercase tracking-wider text-[10px]">Vital Signs</span>
                  <p className="font-bold text-slate-900">
                    BP: {vitalsSys}/{vitalsDia} mmHg • HR: {vitalsHr} bpm • Temp: {vitalsTemp}°F
                  </p>
                  <p className="text-slate-500">
                    SpO2: {vitalsSpo2}% • BMI: {bmiInfo.bmi} ({bmiInfo.category}) • Pain: {painScore}/10
                  </p>
                </div>

                {/* Diagnosis Summary */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-black text-slate-700 uppercase tracking-wider text-[10px]">Diagnosis</span>
                  <p className="font-black text-blue-900 text-sm">
                    {selectedDiagnosis || diagnosisQuery || 'Not specified'}
                  </p>
                  {secondaryDiagnosis && <p className="text-slate-500">Secondary: {secondaryDiagnosis}</p>}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                    {certainty}
                  </span>
                </div>

                {/* Prescriptions Summary */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-black text-slate-700 uppercase tracking-wider text-[10px]">Prescription Orders</span>
                  <p className="font-bold text-emerald-800">
                    {rxItems.filter(i => i.name.trim()).length} medications prescribed
                  </p>
                  <div className="space-y-0.5 pt-1">
                    {rxItems.filter(i => i.name.trim()).map((m, idx) => (
                      <p key={idx} className="text-slate-600 line-clamp-1">
                        • {m.name} ({m.strength}) — {m.frequency} for {m.durationDays}d
                      </p>
                    ))}
                  </div>
                </div>

                {/* Lab Orders & Follow-up Summary */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-black text-slate-700 uppercase tracking-wider text-[10px]">Investigations & Follow-up</span>
                  <p className="font-bold text-purple-900">
                    {orderedLabs.length} laboratory investigations ordered
                  </p>
                  <p className="text-slate-600">
                    Follow-up: {followUpRequired ? `${followUpDate} @ ${followUpSlot}` : 'None scheduled'}
                  </p>
                </div>
              </div>

              {/* Final Action Button */}
              <div className="pt-4 border-t flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Ready to commit to central hospital database.
                </span>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalizeConsultation}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Finalizing Consultation...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Finalize Consultation & Commit Record
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPLETION SUMMARY MODAL                                                  */}
      {/* ========================================================================= */}
      {completionSummary && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500 p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  Clinical Encounter Completed & Persisted
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  Consultation Summary — {completionSummary.patientName}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  Patient Code: {completionSummary.patientCode} • Date: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print / Export Record
              </button>
              <Link
                href="/doctor/appointments"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                Back to Appointments Queue <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
              <span className="font-black text-slate-700 uppercase tracking-wider text-[10px]">Diagnosis & Remarks</span>
              <p className="text-base font-black text-blue-900">{completionSummary.diagnosis}</p>
              <p className="text-slate-600"><strong>Symptoms:</strong> {symptoms}</p>
              {clinicalNotes && <p className="text-slate-600"><strong>Notes:</strong> {clinicalNotes}</p>}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
              <span className="font-black text-slate-700 uppercase tracking-wider text-[10px]">Vital Signs Documented</span>
              <p className="text-slate-800 font-semibold">{completionSummary.vitalsSummary}</p>
            </div>
          </div>

          {/* Prescription Issued */}
          {completionSummary.prescription && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-emerald-900 uppercase tracking-wider text-[10px]">
                  Digital Prescription Issued #{completionSummary.prescription.prescriptionCode}
                </span>
                <span className="px-2 py-0.5 rounded font-bold bg-emerald-200 text-emerald-900 text-[10px]">
                  DISPATCHED TO PHARMACY
                </span>
              </div>
              <div className="space-y-1 pt-1">
                {completionSummary.prescription.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between bg-white p-2 rounded border border-emerald-100">
                    <span className="font-bold text-slate-800">
                      💊 {item.medicineName} ({item.strength}) — {item.dosage}
                    </span>
                    <span className="text-slate-500">
                      {item.frequency} for {item.durationDays} days ({item.foodRelation})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lab Orders */}
          {completionSummary.labOrders && completionSummary.labOrders.length > 0 && (
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2 text-xs">
              <span className="font-black text-purple-900 uppercase tracking-wider text-[10px]">
                Laboratory Investigations Dispatched
              </span>
              <div className="space-y-1">
                {completionSummary.labOrders.map((lo: any) => (
                  <div key={lo.id} className="flex justify-between bg-white p-2 rounded border border-purple-100">
                    <span className="font-bold text-slate-800">🔬 {lo.testName}</span>
                    <span className="text-purple-700 font-mono text-[11px] font-bold">Order: {lo.orderCode}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up */}
          {completionSummary.followUp && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-xs">
              <span className="font-black text-blue-900 uppercase tracking-wider text-[10px]">
                Next Scheduled Appointment #{completionSummary.followUp.appointmentCode}
              </span>
              <p className="font-bold text-slate-800">
                Date: {completionSummary.followUp.date} @ {completionSummary.followUp.timeSlot}
              </p>
              <p className="text-slate-600">{completionSummary.followUp.reason}</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: COMPREHENSIVE MEDICAL TIMELINE                                       */}
      {/* ========================================================================= */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-black text-slate-900 text-base border-b pb-3">
            Central Longitudinal Medical Timeline for {patient.fullName}
          </h3>

          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pl-6">
            {patient.medicalRecords?.map((rec: any) => (
              <div key={rec.id} className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {rec.recordType}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(rec.visitDate).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 text-sm mt-1">{rec.title}</h4>
                  <p className="text-xs text-slate-700 font-medium mt-1">{rec.summary}</p>
                  {rec.details && (
                    <p className="text-xs text-slate-500 mt-2 bg-white p-2.5 rounded border whitespace-pre-wrap font-mono">
                      {rec.details}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {(!patient.medicalRecords || patient.medicalRecords.length === 0) && (
              <p className="text-xs text-slate-400 italic">No historical clinical entries documented yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: PRESCRIPTIONS                                                        */}
      {/* ========================================================================= */}
      {activeTab === 'prescriptions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-black text-slate-900 text-base">Digital Prescriptions History</h3>
            <Link
              href={`/doctor/prescriptions?patientId=${patient.id}`}
              className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg"
            >
              + Launch Full Prescription Engine
            </Link>
          </div>

          <div className="space-y-4">
            {patient.prescriptions?.map((rx: any) => (
              <div key={rx.id} className="p-4 border rounded-xl bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-blue-900 font-mono">{rx.prescriptionCode}</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    rx.status === 'DISPENSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
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

      {/* ========================================================================= */}
      {/* TAB: LAB ORDERS                                                           */}
      {activeTab === 'labs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-black text-slate-900 text-base border-b pb-3">Laboratory Investigation Orders</h3>
          <div className="space-y-3">
            {patient.labOrders?.map((lo: any) => (
              <div key={lo.id} className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-slate-900">{lo.testName}</span>
                  <p className="text-slate-400 font-mono text-[11px]">Order: {lo.orderCode}</p>
                </div>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  lo.status === 'REPORT_READY' || lo.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {lo.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompletePatientTimelinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
          <p className="text-sm font-medium">Loading Clinical Encounter Chamber...</p>
        </div>
      }
    >
      <CompletePatientTimelineContent />
    </Suspense>
  );
}
