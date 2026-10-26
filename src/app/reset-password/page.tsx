'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Stethoscope,
  KeyRound,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = searchParams.get('token');

  const [resetToken, setResetToken] = useState(tokenFromUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim()) {
      setError('A valid reset authorization token is required.');
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
          resetToken: resetToken.trim(),
          newPassword,
          confirmPassword
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setIsSuccess(true);
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
              Secure Password Reset
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
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 mx-auto flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Set New Password</h1>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Enter and confirm your new account password to complete recovery.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess ? (
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
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {!tokenFromUrl && (
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Reset Authorization Token *
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter reset token or start recovery"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
                      isDarkMode
                        ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                  <div className="pt-1 text-right">
                    <Link href="/forgot-password" className="text-[11px] font-bold text-cyan-600 hover:underline">
                      Need a verification code? Start recovery here
                    </Link>
                  </div>
                </div>
              )}

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
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-400">
        © 2026 Nexo Medico AI Platform • Secure Identity & Access Management
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4">Loading reset page...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
