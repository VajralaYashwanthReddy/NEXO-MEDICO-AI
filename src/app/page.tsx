'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Building2,
  Users,
  Stethoscope,
  BarChart3,
  Globe,
  ArrowRight,
  Play,
  Calendar,
  Pill,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  UserPlus,
  Cpu,
  Activity,
  Layers,
  Settings,
  Cloud,
  FileText,
  FlaskConical,
  UserCheck,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Plus,
  Mail,
  Phone,
  MapPin,
  Send,
  Shield,
  Check,
  Headphones,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ContactUsModal } from '@/components/ContactUsModal';
import { MockOtpModal } from '@/components/SecurityVerification';

export default function LandingPage() {
  const { user, login } = useAuth();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showGetStartedModal, setShowGetStartedModal] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Quick Demo Login OTP states
  const [pendingDemoLogin, setPendingDemoLogin] = useState<{ email: string; redirect: string } | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [stats, setStats] = useState<any>({
    hospitals: '126+',
    patients: '284K+',
    doctors: '8.4K+',
    appointments: '18K+',
    prescriptions: '32K+',
    labReports: '14K+'
  });

  useEffect(() => {
    fetch('/api/admin/system/metrics')
      .then(res => res.json())
      .then(data => {
        if (data?.summaryCards) {
          setStats({
            hospitals: data.summaryCards.totalHospitals > 5 ? `${data.summaryCards.totalHospitals}` : '126+',
            patients: data.summaryCards.totalPatients > 5 ? `${data.summaryCards.totalPatients}` : '284K+',
            doctors: data.summaryCards.totalDoctors > 5 ? `${data.summaryCards.totalDoctors}` : '8.4K+',
            appointments: data.summaryCards.totalAppointments > 5 ? `${data.summaryCards.totalAppointments}` : '18K+',
            prescriptions: data.summaryCards.totalPrescriptions > 5 ? `${data.summaryCards.totalPrescriptions}` : '32K+',
            labReports: data.summaryCards.totalLabReports > 5 ? `${data.summaryCards.totalLabReports}` : '14K+'
          });
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleQuickRoleLogin = (demoEmail: string, roleRedirect: string) => {
    setPendingDemoLogin({ email: demoEmail, redirect: roleRedirect });
    setShowOtpModal(true);
  };

  const handleOtpSuccess = async () => {
    if (!pendingDemoLogin) return;
    setOtpLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingDemoLogin.email, password: 'password123' })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        window.location.href = pendingDemoLogin.redirect;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOtpLoading(false);
      setShowOtpModal(false);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans w-full select-none selection:bg-blue-500 selection:text-white">
      {/* 1. TOP HEADER BAR (Full Width SaaS Header) */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 md:px-12 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Heart className="w-6 h-6 fill-white text-blue-600" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-slate-900 leading-tight block">
              NEXO MEDICO AI
            </span>
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
              Healthcare Intelligence Platform
            </span>
          </div>
        </div>

        {/* Center Header Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-slate-600">
          <Link href="/" className="text-blue-600 font-extrabold">Overview</Link>
          <Link href="/hospitals" className="hover:text-blue-600 font-bold transition-colors">Hospitals</Link>
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <Link href="/doctors" className="hover:text-blue-600 transition-colors">Doctors</Link>
          <a href="#workflow" className="hover:text-blue-600 transition-colors">Workflow</a>
          <a href="#ecosystem" className="hover:text-blue-600 transition-colors">Ecosystem</a>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3 text-xs font-bold">
          <button
            onClick={() => setShowContactModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Headphones className="w-3.5 h-3.5 text-blue-600" />
            <span>Contact Support</span>
          </button>

          <Link
            href="/login"
            className="px-4 py-2 text-slate-700 hover:text-blue-600 font-bold rounded-xl transition-all"
          >
            Login
          </Link>

          <button
            onClick={() => setShowGetStartedModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-12">
        {/* 2. HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Welcome to <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Nexo Medico AI
                </span>
                <span className="text-blue-500 ml-2">✨</span>
              </div>
              <h2 className="text-base md:text-lg font-bold text-slate-700">
                Healthcare Intelligence & Operations Platform
              </h2>
            </div>

            <p className="text-xs md:text-sm text-slate-500 leading-relaxed max-w-lg">
              One unified platform connecting hospitals, doctors, patients, laboratories, pharmacies and digital clinical tools to deliver smarter, faster and better healthcare.
            </p>

            {/* Hero Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => setShowGetStartedModal(true)}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                Get Started Now <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowDemoModal(true)}
                className="px-6 py-3.5 bg-white border border-slate-200/80 text-slate-700 font-extrabold text-xs rounded-xl shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 text-blue-600 fill-blue-600" /> Watch Demo / Role Logins
              </button>
            </div>

            {/* Feature Pill Badges Row */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500 pt-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs">
                🛡️ Secure & Compliant
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs">
                ⚡ Clinical Insights
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs">
                📡 Real-time Updates
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-2xs">
                👨‍⚕️ Trusted by Professionals
              </span>
            </div>
          </div>

          {/* Right Column: Floating Cards Illustration Graphics */}
          <div className="lg:col-span-6 relative">
            <div className="bg-gradient-to-tr from-blue-50/80 via-white to-cyan-50/80 p-8 rounded-3xl border border-blue-100/80 shadow-2xl relative min-h-[380px] flex items-center justify-center overflow-hidden">
              {/* Center Hospital Graphic Badge */}
              <div className="text-center space-y-3 relative z-10">
                <div className="w-24 h-24 bg-blue-600 text-white rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/40">
                  <Building2 className="w-12 h-12" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
                    Smart Hospital
                  </span>
                  <h3 className="text-xl font-black text-slate-900">Connected Healthcare Hub</h3>
                </div>
              </div>

              {/* Floating Card 1 (Top Left): Clinical Care */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">
                  100%
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Clinical Care</span>
                  <span className="text-xs font-bold text-slate-800">High Quality Care</span>
                </div>
              </div>

              {/* Floating Card 2 (Top Right): Patient Care */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Patient Care</span>
                  <span className="text-xs font-bold text-slate-800">Better Outcomes</span>
                </div>
              </div>

              {/* Floating Card 3 (Bottom Left): Smart Hospital */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Smart Hospital</span>
                  <span className="text-xs font-bold text-slate-800">Connected Systems</span>
                </div>
              </div>

              {/* Floating Card 4 (Bottom Right): Real-time Data */}
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Real-time Data</span>
                  <span className="text-xs font-bold text-slate-800">Live Dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. 6 KPI SPARKLINE CARDS ROW */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: Total Hospitals (Points to Public /hospitals page) */}
          <Link href="/hospitals" className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900">{stats.hospitals}</h4>
              <span className="text-[10px] font-bold text-slate-400 block uppercase mt-0.5">Hospitals</span>
              <span className="text-[10px] text-emerald-600 font-extrabold">↑ 12% this month</span>
            </div>
            <svg className="w-full h-5 text-purple-500 stroke-current fill-none stroke-[2]" viewBox="0 0 100 20">
              <path d="M0 15 Q25 5 50 12 T100 8" />
            </svg>
          </Link>

          {/* Card 2: Total Patients */}
          <Link href="/patient/register" className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900">{stats.patients}</h4>
              <span className="text-[10px] font-bold text-slate-400 block uppercase mt-0.5">Patients</span>
              <span className="text-[10px] text-emerald-600 font-extrabold">↑ 8.4% this month</span>
            </div>
            <svg className="w-full h-5 text-blue-500 stroke-current fill-none stroke-[2]" viewBox="0 0 100 20">
              <path d="M0 12 Q25 18 50 8 T100 5" />
            </svg>
          </Link>

          {/* Card 3: Total Doctors */}
          <Link href="/doctors" className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Stethoscope className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900">{stats.doctors}</h4>
              <span className="text-[10px] font-bold text-slate-400 block uppercase mt-0.5">Doctors</span>
              <span className="text-[10px] text-emerald-600 font-extrabold">↑ 6.7% this month</span>
            </div>
            <svg className="w-full h-5 text-emerald-500 stroke-current fill-none stroke-[2]" viewBox="0 0 100 20">
              <path d="M0 16 Q25 8 50 14 T100 4" />
            </svg>
          </Link>

          {/* Card 4: Appointments */}
          <Link href="/login" className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900">{stats.appointments}</h4>
              <span className="text-[10px] font-bold text-slate-400 block uppercase mt-0.5">Appointments</span>
              <span className="text-[10px] text-amber-600 font-extrabold">↑ 11.3% this month</span>
            </div>
            <svg className="w-full h-5 text-amber-500 stroke-current fill-none stroke-[2]" viewBox="0 0 100 20">
              <path d="M0 10 Q25 15 50 6 T100 12" />
            </svg>
          </Link>

          {/* Card 5: Prescriptions */}
          <Link href="/login" className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <Pill className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900">{stats.prescriptions}</h4>
              <span className="text-[10px] font-bold text-slate-400 block uppercase mt-0.5">Prescriptions</span>
              <span className="text-[10px] text-rose-600 font-extrabold">↑ 9.8% this month</span>
            </div>
            <svg className="w-full h-5 text-rose-500 stroke-current fill-none stroke-[2]" viewBox="0 0 100 20">
              <path d="M0 14 Q25 6 50 16 T100 8" />
            </svg>
          </Link>

          {/* Card 6: Lab Reports */}
          <Link href="/login" className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                <FlaskConical className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900">{stats.labReports}</h4>
              <span className="text-[10px] font-bold text-slate-400 block uppercase mt-0.5">Lab Reports</span>
              <span className="text-[10px] text-cyan-600 font-extrabold">↑ 14.2% this month</span>
            </div>
            <svg className="w-full h-5 text-cyan-500 stroke-current fill-none stroke-[2]" viewBox="0 0 100 20">
              <path d="M0 16 Q25 10 50 15" />
            </svg>
          </Link>
        </section>

        {/* 4. 4 CORE FEATURE MODULES GRID */}
        <section id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Hospital Management */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-max">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Hospital Management</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Manage hospitals, departments, staff, beds, ICU, wards and all operations seamlessly.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Link
                href="/hospitals"
                className="text-xs font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Explore Hospitals <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                🏥
              </div>
            </div>
          </div>

          {/* Card 2: Patient Care */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-max">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Patient Care</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Complete patient management with appointments, records, prescriptions, reports and follow-ups.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Link
                href="/patient/register"
                className="text-xs font-extrabold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
              >
                Register Patient <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                👨‍⚕️
              </div>
            </div>
          </div>

          {/* Card 3: Physician Operations */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-max">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Physician Operations</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Empower attending physicians with prescription engines, consultation workflows, and lab management.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Link
                href="/login"
                className="text-xs font-extrabold text-purple-600 hover:text-purple-800 flex items-center gap-1"
              >
                Doctor Login <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                🩺
              </div>
            </div>
          </div>

          {/* Card 4: Analytics & Reports */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
            <div className="space-y-3">
              <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl w-max">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Analytics & Reports</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Advanced analytics and real-time reports to monitor performance and improve outcomes.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Link
                href="/login"
                className="text-xs font-extrabold text-cyan-600 hover:text-cyan-800 flex items-center gap-1"
              >
                Sign In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                📊
              </div>
            </div>
          </div>
        </section>

        {/* 5. TWO BOTTOM SECTION CARDS ROW */}
        <section id="workflow" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Card: One Connected Healthcare Ecosystem */}
          <div id="ecosystem" className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">One Connected Healthcare Ecosystem</h3>
              <p className="text-xs text-slate-500">Unified network linking all healthcare domain roles</p>
            </div>

            {/* Circular Node Diagram */}
            <div className="py-6 flex flex-col items-center justify-center relative">
              <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex flex-col items-center justify-center shadow-xl shadow-blue-500/40 z-10 text-center">
                <Heart className="w-6 h-6 fill-white text-blue-600 mb-0.5" />
                <span className="text-[9px] font-black tracking-tighter uppercase leading-tight">NEXO<br/>MEDICO AI</span>
              </div>

              {/* Orbiting nodes */}
              <div className="grid grid-cols-2 gap-8 w-full text-center mt-4">
                <Link href="/hospitals" className="p-3 bg-slate-50 hover:bg-blue-50 border rounded-2xl text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-colors">
                  🏥 Hospitals
                </Link>
                <div className="p-3 bg-slate-50 border rounded-2xl text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  🩺 Doctors
                </div>
                <div className="p-3 bg-slate-50 border rounded-2xl text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  🧪 Laboratories
                </div>
                <div className="p-3 bg-slate-50 border rounded-2xl text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  💊 Pharmacies
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: How Nexo Medico AI Works */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">How Nexo Medico AI Works</h3>
              <p className="text-xs text-slate-500">A simple workflow for complete healthcare management</p>
            </div>

            {/* 6 Step Workflow Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl w-max font-bold text-xs">1</div>
                <h4 className="font-extrabold text-xs text-slate-900">Register Hospital</h4>
                <p className="text-[10px] text-slate-500">Create hospital profile and configure departments.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl w-max font-bold text-xs">2</div>
                <h4 className="font-extrabold text-xs text-slate-900">Add Doctors & Staff</h4>
                <p className="text-[10px] text-slate-500">Add doctors, nurses and staff with assigned roles.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl w-max font-bold text-xs">3</div>
                <h4 className="font-extrabold text-xs text-slate-900">Register Patients</h4>
                <p className="text-[10px] text-slate-500">Add patients and manage their records and medical history.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl w-max font-bold text-xs">4</div>
                <h4 className="font-extrabold text-xs text-slate-900">Manage Operations</h4>
                <p className="text-[10px] text-slate-500">Handle appointments, prescriptions, labs, pharmacy.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl w-max font-bold text-xs">5</div>
                <h4 className="font-extrabold text-xs text-slate-900">Clinical Operations</h4>
                <p className="text-[10px] text-slate-500">Empower clinical teams with smart decision tools.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="p-2 bg-cyan-100 text-cyan-700 rounded-xl w-max font-bold text-xs">6</div>
                <h4 className="font-extrabold text-xs text-slate-900">Analyze & Improve</h4>
                <p className="text-[10px] text-slate-500">Track performance analytics and improve outcomes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. TRUSTED PARTNER BRANDS & FOOTER BANNER */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
              Trusted by Healthcare Professionals Across the Country
            </span>
            <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-400">
              <span>Apollo Hospitals</span>
              <span>MAX Healthcare</span>
              <span>Fortis</span>
              <span>Medanta</span>
              <span>Narayana Health</span>
              <span>CARE Hospitals</span>
              <span>Manipal Hospitals</span>
            </div>
          </div>

          <div className="shrink-0 space-y-2 text-right">
            <h4 className="font-extrabold text-slate-900 text-sm">Ready to Transform Healthcare?</h4>
            <button
              onClick={() => setShowGetStartedModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xl shadow-blue-600/30 inline-flex items-center gap-2 transition-all"
            >
              Get Started Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* 7. ENTERPRISE FOOTER SECTION */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand & Certification */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Heart className="w-6 h-6 fill-white text-blue-600" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-white block">
                  NEXO MEDICO AI
                </span>
                <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest block">
                  Healthcare Intelligence
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Empowering hospitals, physicians, patients, and laboratories with connected digital healthcare workflows and operational intelligence.
            </p>

            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-300 pt-1">
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-1">
                🔒 HIPAA Compliant
              </span>
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-1">
                🛡️ SOC-2 Type II
              </span>
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-1">
                ⚡ ISO 27001
              </span>
            </div>
          </div>

          {/* Column 2: Platform Modules */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-sm uppercase tracking-wider">Platform Modules</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><Link href="/hospitals" className="hover:text-blue-400 transition-colors">Hospitals & Organizations</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Physician Workspace</Link></li>
              <li><Link href="/patient/register" className="hover:text-blue-400 transition-colors">Universal Patient Directory</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Pharmacy & Medicine Inventory</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Laboratory Diagnostics</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Inpatient Wards & Bed Grid</Link></li>
            </ul>
          </div>

          {/* Column 3: Security & Governance */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-sm uppercase tracking-wider">Security & Governance</h4>
            <ul className="space-y-2 text-slate-400 font-medium">
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Platform Security Center</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Roles & Permissions Matrix</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Global Audit Logs</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Real-Time System Health</Link></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Compliance & Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Enterprise Service</a></li>
            </ul>
          </div>

          {/* Column 4: Contact & Support */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-sm uppercase tracking-wider">24/7 Enterprise Support</h4>
            <div className="space-y-2 text-slate-400 font-medium">
              <p className="flex items-center gap-2 text-white font-bold">
                <Phone className="w-4 h-4 text-rose-500" /> +1 (800) 555-NEXO-MED
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" /> support@nexomedico.ai
              </p>
              <p className="flex items-start gap-2 text-[11px]">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" /> 100 Healthcare Innovation Way, Metropolis, NY 10001
              </p>
            </div>

            {/* Newsletter Subscription */}
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">Subscribe to Platform Updates</span>
              {newsletterSubscribed ? (
                <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Subscribed successfully!
                </p>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter official email..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-slate-900 bg-slate-950 px-6 md:px-12 py-4 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-2">
          <p>© 2026 Nexo Medico AI Systems Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-400">All Microservices Operational</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: GET STARTED REGISTRATION CHOICE MODAL */}
      {showGetStartedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border text-xs space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
                  Registration Portal
                </span>
                <h3 className="font-black text-slate-900 text-lg">Get Started with Nexo Medico AI</h3>
              </div>
              <button onClick={() => setShowGetStartedModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-slate-500 text-xs">
              Select your registration type below to initialize your account or onboard your organization:
            </p>

            <div className="grid grid-cols-1 gap-4">
              {/* Choice 1: Hospital Onboarding Registration */}
              <Link
                href="/register"
                onClick={() => setShowGetStartedModal(false)}
                className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-slate-700 group flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-500 text-white rounded-xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold text-sm text-white">Hospital & Organization Onboarding</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed max-w-xs pt-1">
                    Register a new hospital or medical center. Set up departments, bed grid, staff, and hospital admin credentials.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>

              {/* Choice 2: Patient Universal Account Registration */}
              <Link
                href="/patient/register"
                onClick={() => setShowGetStartedModal(false)}
                className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all border border-blue-200 group flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600 text-white rounded-xl">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <span className="font-extrabold text-sm text-slate-900">Patient Universal Account Registration</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed max-w-xs pt-1">
                    Register a patient account with Universal Patient ID (`NEXO-PAT-xxxxxx`) to access prescriptions & reports across hospitals.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ROLE DEMO LAUNCHER MODAL */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-600" /> Instant Role Launcher (Click to Test Live)
              </h3>
              <button onClick={() => setShowDemoModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => handleQuickRoleLogin('admin@metrohospital.org', '/admin/dashboard')}
                className="p-3 bg-blue-50/70 hover:bg-blue-100 border border-blue-200 rounded-2xl text-left space-y-1 transition-all"
              >
                <span className="font-black text-blue-900 block flex items-center gap-1">
                  🏥 Hospital Admin
                </span>
                <span className="text-[10px] font-semibold text-blue-800">Metropolitan Hospital Administrator</span>
              </button>

              <button
                onClick={() => handleQuickRoleLogin('dr.smith@metrohospital.org', '/doctor/dashboard')}
                className="p-3 bg-purple-50/70 hover:bg-purple-100 border border-purple-200 rounded-2xl text-left space-y-1 transition-all"
              >
                <span className="font-extrabold text-purple-900 block">🩺 Doctor</span>
                <span className="text-[10px] text-purple-800">Dr. Sarah Smith (Cardiology)</span>
              </button>

              <button
                onClick={() => handleQuickRoleLogin('pharma.alex@metrohospital.org', '/pharmacy/dashboard')}
                className="p-3 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-left space-y-1 transition-all"
              >
                <span className="font-extrabold text-emerald-900 block">💊 Pharmacist</span>
                <span className="text-[10px] text-emerald-800">Alex Rivera</span>
              </button>

              <button
                onClick={() => handleQuickRoleLogin('lab.tech@metrohospital.org', '/laboratory/dashboard')}
                className="p-3 bg-amber-50/70 hover:bg-amber-100 border border-amber-200 rounded-2xl text-left space-y-1 transition-all"
              >
                <span className="font-extrabold text-amber-900 block">🧪 Lab Tech</span>
                <span className="text-[10px] text-amber-800">Elena Rostova</span>
              </button>

              <button
                onClick={() => handleQuickRoleLogin('john.doe@gmail.com', '/patient/dashboard')}
                className="p-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-2xl text-left space-y-1 transition-all"
              >
                <span className="font-extrabold text-slate-900 block">👤 Patient</span>
                <span className="text-[10px] text-slate-700">John Doe</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTACT US SUPPORT MODAL ON LANDING PAGE */}
      <ContactUsModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />

      {/* MOCK 2FA OTP MODAL FOR QUICK ROLE LOGINS */}
      <MockOtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onSuccess={handleOtpSuccess}
        destinationText={pendingDemoLogin?.email || 'Quick Role Account'}
        title="2FA Demo Security Verification"
        loading={otpLoading}
      />
    </div>
  );
}
