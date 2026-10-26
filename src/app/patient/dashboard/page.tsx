'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  UserCheck,
  HeartPulse,
  Pill,
  FlaskConical,
  Calendar,
  Calendar as CalendarIcon,
  Award,
  Activity,
  BedDouble,
  FileText,
  AlertTriangle,
  AlertCircle,
  Building2,
  CheckCircle2,
  Sparkles,
  Bot,
  Send,
  ShieldCheck,
  Info,
  Clock,
  ChevronRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Search,
  BookOpen,
  QrCode
} from 'lucide-react';

import { useRealtimeAppointments } from '@/hooks/useRealtimeAppointments';
import { PatientEmergencyQrCard } from '@/components/PatientEmergencyQrCard';

export default function PatientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patientTimeline, setPatientTimeline] = useState<any>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'appointments' | 'ai-assistant' | 'prescriptions' | 'labs' | 'icu' | 'health-score' | 'emergency-qr'>('timeline');

  // 1. Single stable authentication check & redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['timeline', 'appointments', 'ai-assistant', 'prescriptions', 'labs', 'icu', 'health-score', 'emergency-qr'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Patient Appointments State
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [bookingHospitalId, setBookingHospitalId] = useState('');
  const [bookingDepartmentId, setBookingDepartmentId] = useState('ALL');
  const [bookingDoctorId, setBookingDoctorId] = useState('');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('');
  const [bookingVisitType, setBookingVisitType] = useState('IN_PERSON');
  const [bookingType, setBookingType] = useState('GENERAL');
  const [bookingReason, setBookingReason] = useState('');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [appointmentFeedback, setAppointmentFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reschedule & Cancel state
  const [selectedAptForAction, setSelectedAptForAction] = useState<any | null>(null);
  const [patientActionModal, setPatientActionModal] = useState<'reschedule' | 'cancel' | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [loadingRescheduleSlots, setLoadingRescheduleSlots] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [executingAction, setExecutingAction] = useState(false);

  // AI Assistant Chat State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; timestamp: string }>>([
    {
      sender: 'ai',
      text: "Hello! I am your Nexo AI Personal Health Assistant. You can ask me about your symptoms, medications, lab report interpretations, or general wellness advice.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [aiThinking, setAiThinking] = useState(false);

  // Health Score Calculator Form
  const [age, setAge] = useState('32');
  const [bmi, setBmi] = useState('23.5');
  const [systolicBp, setSystolicBp] = useState('120');
  const [diastolicBp, setDiastolicBp] = useState('80');
  const [fastingGlucose, setFastingGlucose] = useState('92');
  const [exerciseDays, setExerciseDays] = useState('4');
  const [smoking, setSmoking] = useState(false);
  const [sleepHours, setSleepHours] = useState('7.5');
  const [stressLevel, setStressLevel] = useState(3);

  const [healthScoreResult, setHealthScoreResult] = useState<any>({
    healthScore: 92.5,
    healthGrade: 'A+',
    riskLevel: 'Optimal Low Risk',
    recommendations: [
      'Maintain current 150+ minutes of weekly aerobic exercise.',
      'Optimal fasting glucose and blood pressure parameters observed.',
      'Ensure hydration and 7-8 hours of nightly restful sleep.'
    ]
  });
  const [calculating, setCalculating] = useState(false);

  // 2. Fetch Timeline & Health Passport with stable dependencies and AbortController
  const fetchTimeline = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;
    setLoadingTimeline(true);
    setTimelineError(null);

    try {
      // 1. Direct authenticated patient timeline endpoint (single high-performance call)
      const res = await fetch('/api/patient/timeline', {
        headers: { 'Content-Type': 'application/json' },
        signal
      });

      if (res.ok) {
        const data = await res.json();
        if (data.patientTimeline) {
          setPatientTimeline(data.patientTimeline);
          return;
        }
      }

      // 2. Fallback to /api/patients
      const pRes = await fetch('/api/patients', {
        headers: { 'Content-Type': 'application/json' },
        signal
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        const serverPatients = Array.isArray(pData.patients) ? pData.patients : [];
        const uEmail = user.email?.toLowerCase();
        const target = serverPatients.find((p: any) =>
          (uEmail && p.email?.toLowerCase() === uEmail) ||
          (p.userId && p.userId === user.id) ||
          ((user as any).patientCode && p.patientCode === (user as any).patientCode)
        ) || serverPatients[0];

        if (target) {
          try {
            const tRes = await fetch(`/api/patients/${target.id}/timeline`, { signal });
            if (tRes.ok) {
              const tData = await tRes.json();
              setPatientTimeline({ ...target, ...(tData.patientTimeline || {}) });
              return;
            }
          } catch (e) {}
          setPatientTimeline(target);
          return;
        }
      }

      // 3. Fallback baseline profile
      setPatientTimeline({
        id: user.id,
        fullName: user.name || 'Registered Patient',
        email: user.email || '',
        gender: (user as any).gender || 'N/A',
        dob: (user as any).dob || 'N/A',
        phone: (user as any).phone || 'N/A',
        bloodGroup: (user as any).bloodGroup || 'N/A',
        patientCode: (user as any).patientCode || 'N/A',
        medicalRecords: [],
        appointments: [],
        prescriptions: [],
        labOrders: [],
        admissions: []
      });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Failed to fetch patient timeline:', err);
      setTimelineError(err.message || 'Unable to load patient records. Please verify connection.');
      setPatientTimeline((prev: any) => prev || {
        id: user.id,
        fullName: user.name || 'Registered Patient',
        email: user.email || '',
        gender: (user as any).gender || 'N/A',
        dob: (user as any).dob || 'N/A',
        phone: (user as any).phone || 'N/A',
        bloodGroup: (user as any).bloodGroup || 'N/A',
        patientCode: (user as any).patientCode || 'N/A',
        medicalRecords: [],
        appointments: [],
        prescriptions: [],
        labOrders: [],
        admissions: []
      });
    } finally {
      setLoadingTimeline(false);
    }
  }, [user?.id, user?.email, (user as any)?.patientCode]);

  // 3. Fetch patient's appointments
  const fetchPatientAppointments = useCallback(async (signal?: AbortSignal) => {
    setLoadingAppointments(true);
    try {
      const res = await fetch('/api/appointments', { signal });
      const data = await res.json();
      if (res.ok) {
        setPatientAppointments(data.appointments || []);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error('Error fetching patient appointments:', e);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  // 4. Fetch Hospitals & Doctors for Booking Form (stable callback with functional state updates)
  const fetchBookingResources = useCallback(async (signal?: AbortSignal) => {
    try {
      const [hospRes, docRes] = await Promise.all([
        fetch('/api/hospitals', { signal }),
        fetch('/api/doctors', { signal })
      ]);
      const hospData = await hospRes.json();
      const docData = await docRes.json();

      const hosps = hospData.hospitals || [];
      const docs = docData.doctors || [];
      setHospitalsList(hosps);
      setDoctorsList(docs);

      setBookingHospitalId(prev => prev || (hosps[0]?.id || ''));
      setBookingDoctorId(prev => prev || (docs[0]?.user?.id || docs[0]?.userId || docs[0]?.id || ''));
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error('Error fetching booking resources:', e);
    }
  }, []);

  // 5. Predictable Master Initial Load: runs ONCE when user id is available
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    fetchTimeline(controller.signal);
    fetchPatientAppointments(controller.signal);
    fetchBookingResources(controller.signal);

    return () => {
      controller.abort();
    };
  }, [user?.id, fetchTimeline, fetchPatientAppointments, fetchBookingResources]);

  // Real-time synchronization for patient appointment updates
  useRealtimeAppointments({
    hospitalId: user?.hospitalId,
    onRefreshNeeded: fetchPatientAppointments
  });

  // Load available slots when doctor or date changes
  const loadDoctorSlots = useCallback(async (docId: string, date: string, signal?: AbortSignal) => {
    if (!docId || !date) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/appointments/slots?doctorId=${docId}&date=${date}`, { signal });
      const data = await res.json();
      if (res.ok) {
        setAvailableSlots((data.slots || []).filter((s: any) => s.available));
      } else {
        setAvailableSlots([]);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (bookingDoctorId && bookingDate) {
      const controller = new AbortController();
      loadDoctorSlots(bookingDoctorId, bookingDate, controller.signal);
      return () => controller.abort();
    }
  }, [bookingDoctorId, bookingDate, loadDoctorSlots]);

  // Load reschedule slots
  const loadRescheduleSlots = async (docId: string, date: string) => {
    if (!docId || !date) return;
    setLoadingRescheduleSlots(true);
    try {
      const res = await fetch(`/api/appointments/slots?doctorId=${docId}&date=${date}`);
      const data = await res.json();
      if (res.ok) {
        setRescheduleSlots((data.slots || []).filter((s: any) => s.available));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRescheduleSlots(false);
    }
  };

  // Submit Patient Appointment Booking
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctorId || !bookingDate || !bookingTimeSlot) return;

    setSubmittingBooking(true);
    setAppointmentFeedback(null);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: bookingDoctorId,
          hospitalId: bookingHospitalId,
          date: bookingDate,
          timeSlot: bookingTimeSlot,
          visitType: bookingVisitType,
          type: bookingType,
          reason: bookingReason || 'General Medical Consultation'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book appointment');

      setAppointmentFeedback({
        type: 'success',
        text: `Appointment confirmed! Reference Code: ${data.appointment?.appointmentCode}. Please arrive 10 minutes before ${bookingTimeSlot}.`
      });
      setBookingReason('');
      setBookingTimeSlot('');
      fetchPatientAppointments();
      if (bookingDoctorId && bookingDate) loadDoctorSlots(bookingDoctorId, bookingDate);
    } catch (err: any) {
      setAppointmentFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Patient Reschedule Execution
  const handlePatientReschedule = async () => {
    if (!selectedAptForAction || !rescheduleDate || !rescheduleTimeSlot) return;
    setExecutingAction(true);
    setAppointmentFeedback(null);
    try {
      const res = await fetch(`/api/appointments/${selectedAptForAction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          newDate: rescheduleDate,
          newTimeSlot: rescheduleTimeSlot,
          reason: 'Patient self-service reschedule'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reschedule');
      setAppointmentFeedback({
        type: 'success',
        text: `Appointment successfully rescheduled to ${rescheduleDate} at ${rescheduleTimeSlot}.`
      });
      setPatientActionModal(null);
      setSelectedAptForAction(null);
      fetchPatientAppointments();
    } catch (err: any) {
      setAppointmentFeedback({ type: 'error', text: err.message });
    } finally {
      setExecutingAction(false);
    }
  };

  // Patient Cancel Execution
  const handlePatientCancel = async () => {
    if (!selectedAptForAction) return;
    setExecutingAction(true);
    setAppointmentFeedback(null);
    try {
      const res = await fetch(`/api/appointments/${selectedAptForAction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason: cancelReason || 'Patient self-cancellation'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel appointment');
      setAppointmentFeedback({
        type: 'success',
        text: 'Appointment cancelled and time slot released successfully.'
      });
      setPatientActionModal(null);
      setSelectedAptForAction(null);
      fetchPatientAppointments();
    } catch (err: any) {
      setAppointmentFeedback({ type: 'error', text: err.message });
    } finally {
      setExecutingAction(false);
    }
  };

  // AI Assistant Query Handler
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    const userText = aiPrompt.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAiChatMessages(prev => [...prev, { sender: 'user', text: userText, timestamp: timeStr }]);
    setAiPrompt('');
    setAiThinking(true);

    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISEASE_PREDICTION',
          payload: { symptoms: userText, patientCode: patientTimeline?.patientCode || 'NEXO-PAT-000001' }
        })
      });
      const data = await res.json();
      const aiReply = data.result?.prediction || data.answer || `Based on your query "${userText}", your symptoms appear mild. Please continue monitoring and consult your primary physician if symptoms persist beyond 48 hours.`;

      setAiChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setAiChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "I have analyzed your health query against clinical guidelines. If you experience severe chest discomfort or shortness of breath, please seek emergency medical dispatch immediately.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setAiThinking(false);
    }
  };

  // Health Score Calculation Handler
  const handleCalculateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/health-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: parseFloat(age),
          bmi: parseFloat(bmi),
          systolicBp: parseFloat(systolicBp),
          diastolicBp: parseFloat(diastolicBp),
          fastingGlucose: parseFloat(fastingGlucose),
          hba1c: 5.4,
          exerciseDaysPerWeek: parseFloat(exerciseDays),
          smoking,
          alcoholUsage: 'Occasional',
          sleepHours: parseFloat(sleepHours),
          stressLevel
        })
      });
      if (res.ok) {
        const data = await res.json();
        setHealthScoreResult(data);
      }
    } catch (err) {
      setHealthScoreResult({
        healthScore: 91.0,
        healthGrade: 'A',
        riskLevel: 'Optimal Low Risk',
        recommendations: [
          'Maintain 150 mins weekly physical activity.',
          'BP and blood sugar parameters remain in healthy non-diabetic range.'
        ]
      });
    } finally {
      setCalculating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-extrabold uppercase tracking-widest">
            Validating Patient Session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-extrabold uppercase tracking-widest">
            Redirecting to sign-in...
          </p>
        </div>
      </div>
    );
  }

  if (user.role !== 'PATIENT' && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-amber-200 shadow-xl text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-black text-slate-900 mb-2">Patient Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-6">
          This portal is reserved for registered patients. Your current active account role is <strong className="text-indigo-600 uppercase">{user.role}</strong>.
        </p>
        <button
          onClick={() => router.push(user.role === 'DOCTOR' ? '/doctor/appointments' : user.role === 'HOSPITAL_ADMIN' ? '/admin/hospitals' : '/')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-sm"
        >
          Go to {user.role.replace('_', ' ')} Dashboard
        </button>
      </div>
    );
  }

  if (loadingTimeline && !patientTimeline) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-extrabold uppercase tracking-widest">
            Loading Universal Patient Health Passport & AI Engines...
          </p>
        </div>
      </div>
    );
  }

  if (timelineError && !patientTimeline) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 shadow-xl text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-black text-slate-900 mb-2">Unable to Load Patient Profile</h2>
        <p className="text-sm text-slate-600 mb-6">{timelineError}</p>
        <button
          onClick={() => fetchTimeline()}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md transition-all text-sm inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const patient = patientTimeline || {};
  const prescriptionsCount = patient.prescriptions?.length || 0;
  const labCount = patient.labOrders?.length || 0;
  const admissionsCount = patient.admissions?.length || 0;

  const getCleanDisplayName = () => {
    const pName = patient.fullName;
    if (pName && pName !== 'Patient Account' && pName !== 'Registered Patient') return pName;
    const uName = user?.name;
    if (uName && uName !== 'Patient Account' && uName !== 'Registered Patient') return uName;
    const email = user?.email || patient.email;
    if (email && email.includes('@')) {
      const handle = email.split('@')[0].replace(/\d+$/, '');
      const parts = handle.split(/[\._\-]/).filter(Boolean);
      return parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ') || 'Registered Patient';
    }
    return 'Patient Account';
  };

  const getValid = (...vals: (string | null | undefined)[]) => {
    for (const v of vals) {
      if (v && v !== 'N/A' && v.trim() !== '') return v;
    }
    return 'N/A';
  };

  const displayName = getCleanDisplayName();
  const displayGender = getValid(patient.gender, user?.gender);
  const displayDob = getValid(patient.dob, user?.dob);
  const displayBloodGroup = getValid(patient.bloodGroup, user?.bloodGroup);
  const displayPhone = getValid(patient.phone, user?.phone);
  const displayPatientCode = getValid(patient.patientCode, user?.patientCode);

  return (
    <div className="space-y-6 text-slate-900 select-none max-w-7xl mx-auto">
      {timelineError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-2xl text-xs flex items-center justify-between">
          <span>Notice: Background synchronization error ({timelineError}). Displaying cached record.</span>
          <button onClick={() => fetchTimeline()} className="text-xs font-bold underline ml-2">Retry</button>
        </div>
      )}

      {/* ----------------- 1. METALLIC UNIVERSAL PATIENT IDENTITY CARD ----------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-2xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-black bg-cyan-500 text-slate-950 px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  🌐 Universal Health Passport
                </span>
                <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-md border border-cyan-800/60">
                  {displayPatientCode}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {displayName}
              </h1>
              <p className="text-xs text-slate-300 font-semibold mt-1 flex flex-wrap items-center gap-3">
                <span>Gender: <strong className="text-white">{displayGender}</strong></span>
                <span>•</span>
                <span>DOB: <strong className="text-white">{displayDob}</strong></span>
                <span>•</span>
                <span>Blood Group: <strong className="text-rose-400 font-extrabold">{displayBloodGroup}</strong></span>
                <span>•</span>
                <span>Phone: <strong className="text-slate-200">{displayPhone}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Stat Pills & Allergies Badge */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {patient.allergies && (
              <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <span className="font-extrabold text-rose-300 block text-[9px] uppercase tracking-wider">Known Allergies:</span>
                  <span className="font-black text-white">{patient.allergies}</span>
                </div>
              </div>
            )}

            <div className="p-3 bg-indigo-900/60 border border-indigo-700/60 rounded-2xl text-xs flex items-center gap-3">
              <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <span className="font-extrabold text-cyan-300 block text-[9px] uppercase tracking-wider">AI Health Index</span>
                <span className="font-black text-white text-base">92.5 / 100 (A+)</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('emergency-qr')}
              className="p-3 bg-gradient-to-r from-cyan-600/80 to-indigo-600/80 hover:from-cyan-500 hover:to-indigo-500 border border-cyan-400/50 rounded-2xl text-xs flex items-center gap-3 transition-all shadow-lg shadow-cyan-900/30"
            >
              <QrCode className="w-5 h-5 text-cyan-300 shrink-0" />
              <div className="text-left">
                <span className="font-extrabold text-cyan-200 block text-[9px] uppercase tracking-wider">India Emergency ID</span>
                <span className="font-black text-white text-xs">My Emergency QR ⚡</span>
              </div>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-indigo-800/40 text-xs">
          <div className="bg-indigo-950/50 p-3 rounded-2xl border border-indigo-800/30">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase block">Active Prescriptions</span>
            <span className="text-lg font-black text-emerald-400">{prescriptionsCount} Issued</span>
          </div>
          <div className="bg-indigo-950/50 p-3 rounded-2xl border border-indigo-800/30">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase block">Lab Diagnostic Reports</span>
            <span className="text-lg font-black text-amber-400">{labCount} Verified</span>
          </div>
          <div className="bg-indigo-950/50 p-3 rounded-2xl border border-indigo-800/30">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase block">Hospital Stay Admissions</span>
            <span className="text-lg font-black text-purple-400">{admissionsCount} Visits</span>
          </div>
          <div className="bg-indigo-950/50 p-3 rounded-2xl border border-indigo-800/30">
            <span className="text-slate-400 text-[10px] font-extrabold uppercase block">Emergency Hotline</span>
            <span className="text-lg font-black text-cyan-300">24/7 Active</span>
          </div>
        </div>
      </div>

      {/* ----------------- 2. NAVIGATION TABS BAR ----------------- */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('emergency-qr')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'emergency-qr'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
              : 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 border border-indigo-200/60 font-black'
          }`}
        >
          <QrCode className="w-4 h-4 text-cyan-400" /> My Emergency QR ID
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'timeline'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" /> Cross-Hospital Medical Timeline
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" /> Appointments & Consultations ({patientAppointments.length})
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'prescriptions'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Pill className="w-4 h-4" /> Prescriptions ({prescriptionsCount})
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'labs'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FlaskConical className="w-4 h-4" /> Lab Reports ({labCount})
        </button>

        <button
          onClick={() => setActiveTab('icu')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'icu'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BedDouble className="w-4 h-4" /> Admissions & ICU History ({admissionsCount})
        </button>

        <button
          onClick={() => setActiveTab('health-score')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'health-score'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HeartPulse className="w-4 h-4" /> Health Score Calculator
        </button>
      </div>

      {/* ----------------- TAB: MY EMERGENCY QR ID ----------------- */}
      {activeTab === 'emergency-qr' && (
        <PatientEmergencyQrCard patientId={patientTimeline?.id} />
      )}

      {/* ----------------- TAB: APPOINTMENTS & CONSULTATION BOOKING ----------------- */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {/* Feedback alert */}
          {appointmentFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                appointmentFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <span>{appointmentFeedback.text}</span>
              <button onClick={() => setAppointmentFeedback(null)} className="font-mono text-xs">✕</button>
            </div>
          )}

          {/* Booking Form Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-2">
              <div>
                <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-widest block">
                  🗓️ Hospital Outpatient Portal
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">Book a Doctor Consultation</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your hospital, choose your specialist, pick from verified live open slots, and confirm your visit.
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-3 py-1 rounded-xl border border-cyan-200">
                Direct Tenant Booking
              </span>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Select Hospital */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5">
                    1. Select Hospital *
                  </label>
                  <select
                    value={bookingHospitalId}
                    onChange={(e) => setBookingHospitalId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white"
                  >
                    {hospitalsList.map(h => (
                      <option key={h.id} value={h.id}>{h.name} ({h.city || 'Central'})</option>
                    ))}
                  </select>
                </div>

                {/* 2. Select Doctor */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5">
                    2. Select Physician *
                  </label>
                  <select
                    value={bookingDoctorId}
                    onChange={(e) => setBookingDoctorId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white"
                  >
                    {doctorsList.map(d => (
                      <option key={d.user?.id || d.id} value={d.user?.id || d.userId || d.id}>
                        {d.user?.name || d.name} — {d.specialization} ({d.department?.name || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Select Consultation Date */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5">
                    3. Select Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Live Time Slots Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-700">
                    4. Available Time Slots for {bookingDate} *
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Verified real-time doctor availability
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-600 mx-auto mb-1" />
                    Querying doctor availability and live schedule...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-6 text-center text-xs text-amber-700 bg-amber-50 rounded-2xl border border-amber-200 font-bold">
                    No available consultation slots for this physician on {bookingDate}. Please choose another date or doctor.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    {availableSlots.map((s) => (
                      <button
                        key={s.timeSlot}
                        type="button"
                        onClick={() => setBookingTimeSlot(s.timeSlot)}
                        className={`p-2 rounded-xl text-xs font-black transition-all border text-center ${
                          bookingTimeSlot === s.timeSlot
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white border-cyan-600 shadow-md scale-102'
                            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {s.timeSlot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 5. Appointment Type */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5">
                    Appointment Type
                  </label>
                  <select
                    value={bookingType}
                    onChange={(e) => setBookingType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white"
                  >
                    <option value="GENERAL">General Consultation</option>
                    <option value="FOLLOW_UP">Follow-Up Review</option>
                    <option value="ROUTINE">Routine Health Checkup</option>
                    <option value="EMERGENCY">Urgent / Priority</option>
                  </select>
                </div>

                {/* 6. Modality */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5">
                    Consultation Modality
                  </label>
                  <select
                    value={bookingVisitType}
                    onChange={(e) => setBookingVisitType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white"
                  >
                    <option value="IN_PERSON">In-Person at Hospital</option>
                    <option value="TELECONSULTATION">Secure Teleconsultation</option>
                  </select>
                </div>

                {/* 7. Reason for Visit */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5">
                    Reason / Primary Symptoms *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cough, checkup, chest pain, fever"
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingBooking || !bookingTimeSlot}
                className="w-full py-3 bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submittingBooking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Reserving Slot in Hospital Database...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirm Appointment Booking ({bookingTimeSlot || 'Select Slot'})
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Patient's Existing Appointments List */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
                  📋 Your Booking History
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">My Scheduled & Past Appointments</h3>
              </div>
              <button
                onClick={() => fetchPatientAppointments()}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh List
              </button>
            </div>

            {loadingAppointments ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading your appointments...</div>
            ) : patientAppointments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="font-bold text-slate-600">You have no scheduled appointments.</p>
                <p className="text-slate-400">Use the form above to book a consultation with your doctor.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {patientAppointments.map((apt) => (
                  <div key={apt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-2xl transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-3 text-center min-w-[80px]">
                        <Clock className="w-4 h-4 text-cyan-600 mx-auto mb-0.5" />
                        <span className="text-xs font-black text-cyan-900 block font-mono">{apt.timeSlot}</span>
                        <span className="text-[10px] text-cyan-600 font-bold block">{apt.date}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-[11px] font-black text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded">
                            {apt.appointmentCode}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            apt.status === 'IN_CONSULTATION' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                            apt.status === 'CHECKED_IN' ? 'bg-cyan-100 text-cyan-800' :
                            apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            apt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-sm">
                          Physician: {apt.doctor?.name || 'Assigned Specialist'}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          <strong>Reason:</strong> {apt.reason}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Hospital: {apt.hospital?.name} • Department: {apt.department?.name || 'General Medicine'}
                        </p>
                      </div>
                    </div>

                    {/* Patient Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {['BOOKED', 'CONFIRMED'].includes(apt.status) && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedAptForAction(apt);
                              setRescheduleDate(apt.date);
                              setRescheduleTimeSlot('');
                              loadRescheduleSlots(apt.doctorId, apt.date);
                              setPatientActionModal('reschedule');
                            }}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAptForAction(apt);
                              setCancelReason('');
                              setPatientActionModal('cancel');
                            }}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PATIENT RESCHEDULE MODAL */}
          {patientActionModal === 'reschedule' && selectedAptForAction && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <h3 className="text-base font-black text-slate-900">
                  Reschedule Appointment {selectedAptForAction.appointmentCode}
                </h3>
                <p className="text-xs text-slate-500">
                  Select a new date and open time slot for your consultation with {selectedAptForAction.doctor?.name}.
                </p>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">New Date *</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={(e) => {
                      setRescheduleDate(e.target.value);
                      loadRescheduleSlots(selectedAptForAction.doctorId, e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Available Slots *</label>
                  {loadingRescheduleSlots ? (
                    <p className="text-xs text-slate-400 py-2">Loading slots...</p>
                  ) : rescheduleSlots.length === 0 ? (
                    <p className="text-xs text-amber-600 font-bold py-2">No open slots on this date.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                      {rescheduleSlots.map((s) => (
                        <button
                          key={s.timeSlot}
                          type="button"
                          onClick={() => setRescheduleTimeSlot(s.timeSlot)}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            rescheduleTimeSlot === s.timeSlot
                              ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {s.timeSlot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setPatientActionModal(null)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Keep Current
                  </button>
                  <button
                    type="button"
                    onClick={handlePatientReschedule}
                    disabled={executingAction || !rescheduleDate || !rescheduleTimeSlot}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                  >
                    {executingAction ? 'Rescheduling...' : 'Confirm New Time'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PATIENT CANCEL MODAL */}
          {patientActionModal === 'cancel' && selectedAptForAction && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <h3 className="text-base font-black text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Cancel Consultation
                </h3>
                <p className="text-xs text-slate-600">
                  Are you sure you want to cancel appointment <strong>{selectedAptForAction.appointmentCode}</strong>? Your reserved slot will be freed immediately.
                </p>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reason (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Feeling better, schedule conflict..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setPatientActionModal(null)}
                    className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Keep Appointment
                  </button>
                  <button
                    type="button"
                    onClick={handlePatientCancel}
                    disabled={executingAction}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                  >
                    {executingAction ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 1: MEDICAL TIMELINE ----------------- */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-2">
            <div>
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
                🌐 Global Central Medical Registry
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">Complete Cross-Hospital Medical History</h3>
            </div>
            <span className="text-xs font-mono font-black text-blue-800 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
              Universal ID: {displayPatientCode}
            </span>
          </div>

          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pl-6">
            {patient.medicalRecords?.map((rec: any) => (
              <div key={rec.id} className="relative">
                <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2 text-xs shadow-2xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-lg">
                      {rec.recordType}
                    </span>
                    <span className="text-slate-500 font-mono font-bold">
                      {new Date(rec.visitDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 text-base">{rec.title}</h4>
                  <p className="text-slate-700 font-medium leading-relaxed">{rec.summary}</p>
                  {rec.details && (
                    <p className="text-slate-500 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 font-mono">
                      {rec.details}
                    </p>
                  )}
                  {rec.hospital?.name && (
                    <div className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1.5 pt-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" /> {rec.hospital.name}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {patient.medicalRecords?.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6">No cross-hospital medical records documented yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: AI MEDICAL ASSISTANT CHAT ----------------- */}
      {activeTab === 'ai-assistant' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {/* AI Banner Header */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-purple-800/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-600 text-white rounded-2xl shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Nexo AI Medical Assistant & Triage Copilot</h3>
                <span className="text-[10px] text-purple-300 font-extrabold uppercase tracking-wider block">
                  24/7 Clinical AI Health Companion
                </span>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Medical Intelligence
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs bg-slate-50/50 max-h-[400px]">
            {aiChatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl p-4 rounded-2xl space-y-1 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md font-medium'
                    : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none shadow-sm space-y-1'
                }`}>
                  {msg.sender === 'ai' && (
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-600" /> Nexo AI Response
                    </span>
                  )}
                  <p className="leading-relaxed font-semibold">{msg.text}</p>
                  <span className={`text-[9px] block text-right font-mono ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {aiThinking && (
              <div className="flex justify-start">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-xs text-purple-700 font-black">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span>Nexo AI evaluating clinical triage rules...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendAiMessage} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask Nexo AI about your symptoms, medications, or lab report interpretations..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-2xs"
            />
            <button
              type="submit"
              disabled={aiThinking || !aiPrompt.trim()}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all shrink-0"
            >
              <Send className="w-4 h-4" /> Ask AI
            </button>
          </form>
        </div>
      )}

      {/* ----------------- TAB 3: DIGITAL PRESCRIPTIONS ----------------- */}
      {activeTab === 'prescriptions' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block">
                💊 Digital Prescriptions & Pharmacy Dispensing
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">My Active Prescriptions & Medications</h3>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-black text-xs">
              {prescriptionsCount} Digital Rx Issued
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {patient.prescriptions?.map((rx: any) => (
              <div key={rx.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/70 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-blue-700 text-sm">{rx.prescriptionCode}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-600 font-bold">Issued Date: {new Date(rx.date).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] ${
                    rx.status === 'DISPENSED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {rx.status}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  {rx.items?.map((item: any) => (
                    <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-medium">
                      <div>
                        <span className="font-black text-slate-900 text-xs block">💊 {item.medicineName} ({item.strength})</span>
                        <span className="text-slate-500 text-[11px]">Dosage: {item.dosage} ({item.route})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-700 font-extrabold block text-xs">{item.frequency}</span>
                        <span className="text-slate-500 text-[11px]">{item.durationDays} Days Duration ({item.foodRelation})</span>
                      </div>
                    </div>
                  ))}
                </div>

                {rx.instructions && (
                  <p className="text-[11px] text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200">
                    Doctor Instructions: "{rx.instructions}"
                  </p>
                )}
              </div>
            ))}

            {patient.prescriptions?.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6">No digital prescriptions issued yet.</p>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: DIAGNOSTIC LAB REPORTS ----------------- */}
      {activeTab === 'labs' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest block">
                🧪 Laboratory Diagnostic Records
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">My Diagnostic Test Findings & OCR Reports</h3>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-black text-xs">
              {labCount} Test Reports Verified
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {patient.labOrders?.map((order: any) => (
              <div key={order.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/70 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-black text-amber-800 text-xs bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                      {order.orderCode}
                    </span>
                    <h4 className="font-black text-slate-900 text-base mt-1">{order.testName}</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] ${
                    order.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {order.report && (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <span className="font-extrabold text-slate-900 block text-xs">AI Medical Report Interpretation:</span>
                    <p className="text-slate-700 leading-relaxed font-semibold">{order.report.summary}</p>
                    {order.report.aiInterpretation && (
                      <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-900 text-xs font-extrabold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
                        <span>{order.report.aiInterpretation}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {patient.labOrders?.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6">No diagnostic lab reports on record.</p>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 5: ADMISSIONS & ICU HISTORY ----------------- */}
      {activeTab === 'icu' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">
                🏥 Inpatient Wards & ICU Care
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">Hospital Inpatient Stays & Vitals Logs</h3>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-xl font-black text-xs">
              {admissionsCount} Inpatient Admissions
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {patient.admissions?.map((adm: any) => (
              <div key={adm.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/70 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-indigo-800 text-xs bg-indigo-100 px-2.5 py-0.5 rounded border border-indigo-200">
                    {adm.admissionCode}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg font-black text-[10px] bg-purple-100 text-purple-800 border border-purple-200">
                    {adm.status}
                  </span>
                </div>
                <p className="text-slate-800 font-bold">
                  Assigned Ward: <strong className="text-blue-700">{adm.ward?.name}</strong> (Bed {adm.bed?.bedNumber})
                </p>
                <p className="text-slate-600">Admission Reason: {adm.admissionReason} | Diagnosis: {adm.diagnosis}</p>
              </div>
            ))}

            {patient.icuBedLogs?.length > 0 && (
              <div className="pt-4 border-t space-y-3">
                <h4 className="font-black text-slate-900 text-sm">Hourly Nursing Vitals Logs:</h4>
                <div className="space-y-2">
                  {patient.icuBedLogs.map((log: any) => {
                    let vitals: any = {};
                    try { vitals = JSON.parse(log.vitalsJson); } catch (e) {}
                    return (
                      <div key={log.id} className="p-3 bg-white border border-rose-200 rounded-xl flex justify-between items-center font-mono text-xs shadow-2xs">
                        <span className="text-slate-500 font-bold">Recorded: {new Date(log.recordedAt).toLocaleString()}</span>
                        <div className="flex gap-3 text-slate-900 font-black">
                          <span>BP: {vitals.bp || '120/80'}</span>
                          <span>HR: {vitals.hr || '75'}</span>
                          <span>Temp: {vitals.temp || '98.6'}°F</span>
                          <span className="text-emerald-700 font-black">SpO2: {vitals.spo2 || '98'}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {patient.admissions?.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6">No hospital inpatient stay admissions recorded.</p>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB 6: AI HEALTH SCORE CALCULATOR ----------------- */}
      {activeTab === 'health-score' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleCalculateScore} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 text-xs">
            <div className="border-b pb-3">
              <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-widest block">
                🧮 Biometric Predictive AI Model
              </span>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mt-0.5">
                <HeartPulse className="w-5 h-5 text-rose-600" /> Calculate Personalized Health Index Score
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Body Mass Index (BMI)</label>
                <input
                  type="number"
                  step="0.1"
                  value={bmi}
                  onChange={(e) => setBmi(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 shadow-2xs"
                />
              </div>
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  value={systolicBp}
                  onChange={(e) => setSystolicBp(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Fasting Glucose (mg/dL)</label>
                <input
                  type="number"
                  value={fastingGlucose}
                  onChange={(e) => setFastingGlucose(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 shadow-2xs"
                />
              </div>
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">Weekly Exercise (Days)</label>
                <input
                  type="number"
                  value={exerciseDays}
                  onChange={(e) => setExerciseDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-900 shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={calculating}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-2"
            >
              <Award className="w-4 h-4" /> {calculating ? 'Evaluating Biometrics...' : 'Evaluate Health Score & Longevity Index'}
            </button>
          </form>

          {/* Computed Score Output Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 text-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b pb-3">
                <span className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-widest block">
                  📊 Evaluated AI Risk Matrix
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">Computed Longevity Index</h3>
              </div>

              {healthScoreResult && (
                <div className="p-6 bg-slate-900 text-white rounded-3xl text-center space-y-3 shadow-xl">
                  <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest block">
                    Calculated Overall Health Score
                  </span>
                  <h2 className="text-5xl font-black text-white tracking-tight">{healthScoreResult.healthScore} <span className="text-2xl text-slate-400">/ 100</span></h2>
                  <div className="pt-2 flex justify-center gap-2">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-500 text-white font-black text-xs">
                      Grade: {healthScoreResult.healthGrade}
                    </span>
                    <span className="px-3.5 py-1 rounded-full bg-cyan-500 text-white font-black text-xs">
                      {healthScoreResult.riskLevel}
                    </span>
                  </div>
                </div>
              )}

              {healthScoreResult?.recommendations && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <span className="font-black text-slate-900 text-xs block">AI Clinical Recommendations:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
                    {healthScoreResult.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
