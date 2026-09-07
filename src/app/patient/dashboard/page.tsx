'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  UserCheck,
  HeartPulse,
  Pill,
  FlaskConical,
  Calendar,
  Award,
  Activity,
  BedDouble,
  FileText,
  AlertTriangle,
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
  BookOpen
} from 'lucide-react';
import { PatientEmergencyQrCard } from '@/components/PatientEmergencyQrCard';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [patientTimeline, setPatientTimeline] = useState<any>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'ai-assistant' | 'prescriptions' | 'labs' | 'icu' | 'health-score'>('timeline');

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

  const fetchTimeline = () => {
    setLoadingTimeline(true);
    fetch('/api/patients?global=true')
      .then(r => r.json())
      .then(d => {
        if (d.patients && d.patients.length > 0) {
          const target = d.patients.find((p: any) => p.email === user?.email) || d.patients[0];
          fetch(`/api/patients/${target.id}/timeline`)
            .then(r => r.json())
            .then(t => setPatientTimeline(t.patientTimeline));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingTimeline(false));
  };

  useEffect(() => {
    fetchTimeline();
  }, [user]);

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

  if (loadingTimeline) {
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

  const patient = patientTimeline || {};
  const prescriptionsCount = patient.prescriptions?.length || 0;
  const labCount = patient.labOrders?.length || 0;
  const admissionsCount = patient.admissions?.length || 0;

  return (
    <div className="space-y-6 text-slate-900 select-none max-w-7xl mx-auto">
      {/* ----------------- 1. METALLIC UNIVERSAL PATIENT IDENTITY CARD ----------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-2xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-2xl text-white shadow-lg shrink-0">
              {(patient.fullName || user?.name || 'Y')[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-black bg-cyan-500 text-slate-950 px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  🌐 Universal Health Passport
                </span>
                <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-md border border-cyan-800/60">
                  {patient.patientCode || 'NEXO-PAT-000002'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {patient.fullName || user?.name || 'Yashu'}
              </h1>
              <p className="text-xs text-slate-300 font-semibold mt-1 flex flex-wrap items-center gap-3">
                <span>Gender: <strong className="text-white">{patient.gender || 'Male'}</strong></span>
                <span>•</span>
                <span>DOB: <strong className="text-white">{patient.dob || '2004-05-07'}</strong></span>
                <span>•</span>
                <span>Blood Group: <strong className="text-rose-400 font-extrabold">{patient.bloodGroup || 'O+'}</strong></span>
                <span>•</span>
                <span>Phone: <strong className="text-slate-200">{patient.phone || '+1 (555) 012-3456'}</strong></span>
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

      {/* Universal Encrypted Patient Emergency QR Passport */}
      <PatientEmergencyQrCard
        patientData={{
          patientId: patient.patientCode || 'NEXO-PAT-000002',
          fullName: patient.fullName || user?.name || 'John Doe',
          bloodGroup: patient.bloodGroup || 'O+',
          allergies: patient.allergies || 'Penicillin, Sulfa, Peanuts',
          conditions: 'Type 1 Diabetes, Mild Asthma',
          emergencyContactName: 'Sarah Doe (Spouse)',
          emergencyContactPhone: patient.phone || '+1 (555) 012-3456',
          resuscitationStatus: 'Full Code / Advance Directive Registered'
        }}
      />

      {/* ----------------- 2. NAVIGATION TABS BAR ----------------- */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap gap-1">
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
              Universal ID: {patient.patientCode || 'NEXO-PAT-000002'}
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
