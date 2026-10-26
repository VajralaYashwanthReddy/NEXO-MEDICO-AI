'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  Stethoscope,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Pill,
  FlaskConical,
  HeartPulse,
  Sparkles,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Activity,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { VisualCaptcha, MockOtpModal } from '@/components/SecurityVerification';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Security CAPTCHA & 2FA OTP states
  const [captchaInput, setCaptchaInput] = useState('');
  const [expectedCaptcha, setExpectedCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [challengeToken, setChallengeToken] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpModalError, setOtpModalError] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const executeLoginStep1 = async (userEmail: string, userPass: string) => {
    setLoading(true);
    setError('');
    setOtpModalError('');
    setShowOtpModal(false);
    setChallengeToken('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail.trim(),
          password: userPass,
          captchaInput,
          expectedCaptcha
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setShowOtpModal(false);
        setChallengeToken('');
        throw new Error(data.error || 'No account is found with this email address.');
      }

      if (data.requiresOtp && data.challengeToken) {
        setChallengeToken(data.challengeToken);
        setDestinationText(data.maskedEmail || userEmail);
        setShowOtpModal(true);
      } else if (data.token && data.user) {
        // Direct session minted (fallback)
        login(data.token, data.user);
        routeToDashboard(data.user.role);
      }
    } catch (err: any) {
      setShowOtpModal(false);
      setChallengeToken('');
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const initiateLoginSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');

    if (!captchaInput || captchaInput.trim().toUpperCase() !== expectedCaptcha.trim().toUpperCase()) {
      setCaptchaError('Invalid CAPTCHA code. Please check characters & try again.');
      return;
    }

    await executeLoginStep1(email, password);
  };

  const quickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setCaptchaInput(expectedCaptcha);
    setError('');
    setCaptchaError('');
    await executeLoginStep1(demoEmail, 'password123');
  };

  const routeToDashboard = (role: string) => {
    if (
      role === 'HOSPITAL_ADMIN' ||
      role === 'SUPER_ADMIN' ||
      role === 'HR_ADMIN' ||
      role === 'RECEPTIONIST' ||
      role === 'STAFF'
    ) {
      router.push('/admin/dashboard');
    } else if (role === 'DOCTOR') {
      router.push('/doctor/dashboard');
    } else if (role === 'PHARMACIST') {
      router.push('/pharmacy/dashboard');
    } else if (role === 'LAB_TECH') {
      router.push('/laboratory/dashboard');
    } else if (role === 'NURSE') {
      router.push('/nurse/dashboard');
    } else {
      router.push('/patient/dashboard');
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
    setOtpLoading(true);
    setOtpModalError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_login_otp',
          challengeToken,
          otpCode
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed. Please check the OTP code.');
      }

      setShowOtpModal(false);
      login(data.token, data.user);
      routeToDashboard(data.user.role);
    } catch (err: any) {
      setOtpModalError(err.message || 'Verification error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const res = await fetch('/api/auth/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'resend_otp',
        challengeToken
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend code');
    }
    if (data.challengeToken) {
      setChallengeToken(data.challengeToken);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-center transition-colors duration-200 select-none overflow-x-hidden ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Navbar Bar with Brand and Theme Toggle */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 via-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight block leading-none">
              NEXO <span className="text-cyan-600">MEDICO</span> AI
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mt-0.5">
              Enterprise Health Cloud
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 font-bold cursor-pointer ${
              isDarkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
            }`}
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-600" />}
            <span className="hidden sm:inline">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </header>

      {/* Main Two-Column Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Platform Branding & Healthcare Highlights (Hidden on smaller mobile) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-6 pr-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-cyan-500/10 text-cyan-700 border border-cyan-500/20 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600" /> Next-Gen Clinical Intelligence & Operations
            </div>

            <div className="space-y-3">
              <h1
                className={`text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight leading-[1.15] ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Intelligent Hospital Ecosystem & Healthcare Portal
              </h1>
              <p className={`text-sm leading-relaxed max-w-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Empowering healthcare institutions, clinicians, nursing units, and patients with real-time AI
                diagnostics, automated EHR workflows, and institutional security.
              </p>
            </div>

            {/* Highlights List */}
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 w-fit mb-2">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="font-black text-xs">Clinical Decision AI</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Multi-modal OCR report analysis & medical RAG knowledge.
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 w-fit mb-2">
                  <Building2 className="w-4 h-4" />
                </div>
                <h4 className="font-black text-xs">Hospital Operations</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Bed allocations, ICU monitoring, and multi-department telemetry.
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 w-fit mb-2">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="font-black text-xs">HIPAA & ISO-27001</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Role-based tenant isolation and end-to-end encrypted logs.
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 w-fit mb-2">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h4 className="font-black text-xs">Universal Patient ID</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Permanent digital timeline across visits, labs, and pharmacies.
                </p>
              </div>
            </div>

            {/* Platform Security Badge */}
            <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500 font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Multi-Factor 2FA Verification
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Multi-Tenant Network Isolation
              </span>
            </div>
          </div>

          {/* Right Column: Authentication Card (lg:col-span-6) */}
          <div className="w-full lg:col-span-6 max-w-md mx-auto">
            {/* Quick Registration Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs font-bold">
              <Link
                href="/register"
                className={`p-2.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 border shadow-2xs ${
                  isDarkMode
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-300'
                    : 'bg-white hover:bg-cyan-50/70 border-slate-200 text-cyan-800 hover:border-cyan-300'
                }`}
              >
                <Building2 className="w-4 h-4 text-cyan-600 shrink-0" /> Onboard Hospital
              </Link>
              <Link
                href="/patient/register"
                className={`p-2.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 border shadow-2xs ${
                  isDarkMode
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-blue-300'
                    : 'bg-white hover:bg-blue-50/70 border-slate-200 text-blue-800 hover:border-blue-300'
                }`}
              >
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" /> Patient Sign Up
              </Link>
            </div>

            {/* Login Card */}
            <div
              className={`rounded-3xl border p-6 sm:p-8 shadow-xl transition-all ${
                isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/40' : 'bg-white border-slate-200/90 shadow-slate-200/50'
              }`}
            >
              <div className="mb-5">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">Sign In to Nexo Medico</h2>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Enter your verified credentials to access your clinical or personal health portal.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={initiateLoginSequence}>
                {/* Email / Patient ID */}
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Email Address or Universal Patient ID
                  </label>
                  <div className="relative rounded-xl">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. dr.smith@metrohospital.org or NEXO-PAT-..."
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                        isDarkMode
                          ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-500'
                          : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Password & Forgot Password Link */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`block text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Account Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-extrabold text-cyan-600 hover:text-cyan-700 hover:underline flex items-center gap-1"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Forgot Password?
                    </Link>
                  </div>
                  <div className="relative rounded-xl">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                        isDarkMode
                          ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-500'
                          : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Visual Security Captcha */}
                <div className="pt-1">
                  <VisualCaptcha
                    userInput={captchaInput}
                    setUserInput={setCaptchaInput}
                    onCodeChange={(code) => setExpectedCaptcha(code)}
                    error={captchaError}
                    theme={isDarkMode ? 'dark' : 'light'}
                  />
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In with 2FA Security'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* 2FA OTP Verification Modal */}
              <MockOtpModal
                isOpen={showOtpModal}
                onClose={() => setShowOtpModal(false)}
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                destinationText={destinationText || email || 'Registered Email'}
                title="Two-Factor Login Verification"
                loading={otpLoading}
                error={otpModalError}
              />

              {/* Quick Demo Accounts Selection */}
              <div className={`mt-6 border-t pt-5 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    ⚡ Quick Demo Roles (Development)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('nexomedicoai@gmail.com')}
                    className={`p-2 rounded-xl text-left transition-all border flex flex-col justify-center ${
                      isDarkMode
                        ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-slate-50 hover:bg-cyan-50/80 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="font-black text-cyan-600 flex items-center gap-1 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> Super Admin
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">nexomedicoai@gmail.com</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickDemoLogin('yashwanthvajrala7995@gmail.com')}
                    className={`p-2 rounded-xl text-left transition-all border flex flex-col justify-center ${
                      isDarkMode
                        ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-slate-50 hover:bg-blue-50/80 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="font-black text-blue-600 flex items-center gap-1 text-xs">
                      <Building2 className="w-3.5 h-3.5 shrink-0" /> Hospital Admin
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">yashwanthvajrala...</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickDemoLogin('dr.smith@metrohospital.org')}
                    className={`p-2 rounded-xl text-left transition-all border flex flex-col justify-center ${
                      isDarkMode
                        ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-slate-50 hover:bg-purple-50/80 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="font-black text-purple-600 flex items-center gap-1 text-xs">
                      <Stethoscope className="w-3.5 h-3.5 shrink-0" /> Doctor
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">Dr. Sarah Smith</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickDemoLogin('pharma.alex@metrohospital.org')}
                    className={`p-2 rounded-xl text-left transition-all border flex flex-col justify-center ${
                      isDarkMode
                        ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-slate-50 hover:bg-emerald-50/80 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="font-black text-emerald-600 flex items-center gap-1 text-xs">
                      <Pill className="w-3.5 h-3.5 shrink-0" /> Pharmacist
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">Alex Rivera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickDemoLogin('lab.tech@metrohospital.org')}
                    className={`p-2 rounded-xl text-left transition-all border flex flex-col justify-center ${
                      isDarkMode
                        ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-slate-50 hover:bg-amber-50/80 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="font-black text-amber-600 flex items-center gap-1 text-xs">
                      <FlaskConical className="w-3.5 h-3.5 shrink-0" /> Lab Tech
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">Elena Rostova</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickDemoLogin('nurse.sarah@metrohospital.org')}
                    className={`p-2 rounded-xl text-left transition-all border flex flex-col justify-center ${
                      isDarkMode
                        ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-slate-50 hover:bg-rose-50/80 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="font-black text-rose-600 flex items-center gap-1 text-xs">
                      <HeartPulse className="w-3.5 h-3.5 shrink-0" /> Nurse
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">Sarah Connor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => quickDemoLogin('john.doe@gmail.com')}
                    className={`p-2 rounded-xl text-left transition-all border flex flex-col justify-center ${
                      isDarkMode
                        ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="font-black text-slate-700 flex items-center gap-1 text-xs">
                      <UserCheck className="w-3.5 h-3.5 shrink-0" /> Patient
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">John Doe</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-400">
        © 2026 Nexo Medico AI Platform • Encrypted Healthcare Cloud • All Rights Reserved
      </footer>
    </div>
  );
}
