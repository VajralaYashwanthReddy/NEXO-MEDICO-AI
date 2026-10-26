'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Clock,
  Check,
  Phone
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Multi-step: 1 = Contact, 2 = Verify OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [contact, setContact] = useState('');
  const [channel, setChannel] = useState<'email' | 'phone'>('email');
  const [maskedDestination, setMaskedDestination] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // STEP 1: Submit Contact for Reset Code
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contact.trim() })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request password reset code');
      }

      setChannel(data.channel || (contact.includes('@') ? 'email' : 'phone'));
      setMaskedDestination(data.maskedDestination || contact.trim());
      setInfoMessage(data.message || 'Verification code dispatched.');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setResendCooldown(60);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify 6-digit OTP
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleAutoFillDevOtp = () => {
    if (!devOtp) return;
    setOtpDigits(devOtp.split(''));
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: contact.trim(),
          otp: enteredOtp
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setResetToken(data.resetToken);
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contact.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }
      setInfoMessage('A new verification code has been dispatched.');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Complete Password Reset
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: 'Weak', color: 'bg-rose-500' };
    }
  };

  const strength = calculatePasswordStrength(newPassword);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setError('Reset authorization session expired. Please start over.');
      setStep(1);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter both fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToken,
          newPassword,
          confirmPassword
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-center transition-colors duration-200 select-none overflow-x-hidden ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Navbar */}
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
              Secure Account Recovery
            </span>
          </div>
        </Link>

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
          <span className="hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8 flex items-center">
        <div
          className={`w-full rounded-3xl border p-6 sm:p-8 shadow-xl transition-all ${
            isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/40' : 'bg-white border-slate-200/90 shadow-slate-200/50'
          }`}
        >
          {/* Header Icon & Title */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 mx-auto flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Account Password Recovery</h1>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Verify your identity to establish a new secure account password.
            </p>
          </div>

          {/* Progress Stepper Indicator */}
          <div className="flex items-center justify-between mb-6 px-2">
            {[
              { num: 1, label: 'Contact' },
              { num: 2, label: 'Verify' },
              { num: 3, label: 'Password' },
              { num: 4, label: 'Complete' }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                      step >= s.num
                        ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-600/30'
                        : isDarkMode
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">{s.label}</span>
                </div>
                {idx < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 -mt-4 transition-all ${
                      step > s.num ? 'bg-cyan-600' : isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && step !== 4 && (
            <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Development Mock OTP Helper Badge */}
          {devOtp && step === 2 && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 block">
                  🛠️ Local Development OTP Code
                </span>
                <span className="font-mono font-black text-sm tracking-widest">{devOtp}</span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillDevOtp}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-black text-[10px] transition-all"
              >
                Auto Fill
              </button>
            </div>
          )}

          {/* STEP 1: Enter Contact */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Registered Email Address or Phone Number *
                </label>
                <div className="relative rounded-xl">
                  {contact && !contact.includes('@') ? (
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
                  ) : (
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
                  )}
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Enter your registered email or phone number"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                      isDarkMode
                        ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  We will send a 5-minute single-use authorization code to your registered contact.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !contact.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: Enter 6-digit OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Enter 6-Digit Verification Code
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Sent to: {maskedDestination || contact}
                  </span>
                </div>

                {/* 6-box input */}
                <div className="flex items-center justify-between gap-2 py-1">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePasteOtp}
                      className={`w-11 h-12 text-center text-lg font-mono font-black rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                        isDarkMode
                          ? 'bg-slate-950 border-slate-800 text-white'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 font-medium">Didn't receive code?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="font-extrabold text-cyan-600 hover:text-cyan-700 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code & Proceed'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-bold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Email or Phone
                </button>
                <Link href="/login" className="font-bold text-slate-400 hover:text-slate-600">
                  Cancel
                </Link>
              </div>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  New Password *
                </label>
                <div className="relative rounded-xl">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                      isDarkMode
                        ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-400">Password Strength:</span>
                      <span className={strength.score >= 3 ? 'text-emerald-600' : 'text-amber-600'}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Confirm New Password *
                </label>
                <div className="relative rounded-xl">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                      isDarkMode
                        ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] font-bold text-rose-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save & Reset Password'}
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">Password Reset Completed</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Your password has been reset successfully. Please sign in with your new password.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Return to Sign In <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-400">
        © 2026 Nexo Medico AI Platform • Secure Identity & Access Management
      </footer>
    </div>
  );
}
