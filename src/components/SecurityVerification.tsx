'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ShieldCheck, Lock, CheckCircle2, Copy, Sparkles, X } from 'lucide-react';

// Helper to generate random CAPTCHA string
export function generateCaptchaCode(length: number = 5): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to generate 6-digit OTP
export function generateMockOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface VisualCaptchaProps {
  onCodeChange?: (code: string) => void;
  userInput: string;
  setUserInput: (val: string) => void;
  error?: string;
  theme?: 'dark' | 'light';
}

export function VisualCaptcha({
  onCodeChange,
  userInput,
  setUserInput,
  error,
  theme = 'dark'
}: VisualCaptchaProps) {
  const [captchaCode, setCaptchaCode] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const refreshCaptcha = () => {
    const newCode = generateCaptchaCode(5);
    setCaptchaCode(newCode);
    if (onCodeChange) onCodeChange(newCode);
    setUserInput('');
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  useEffect(() => {
    if (!captchaCode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw stylized captcha
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (theme === 'dark') {
      bgGradient.addColorStop(0, '#0f172a');
      bgGradient.addColorStop(1, '#1e293b');
    } else {
      bgGradient.addColorStop(0, '#f1f5f9');
      bgGradient.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noise lines
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = theme === 'dark' ? `rgba(6, 182, 212, ${0.15 + i * 0.05})` : `rgba(14, 165, 233, ${0.2 + i * 0.05})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.bezierCurveTo(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * canvas.width,
        Math.random() * canvas.height
      );
      ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(15, 23, 42, 0.2)';
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Text rendering with character distortion
    ctx.font = 'bold 22px monospace';
    const colors = theme === 'dark' 
      ? ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24']
      : ['#0284c7', '#4f46e5', '#059669', '#db2777', '#d97706'];

    for (let i = 0; i < captchaCode.length; i++) {
      ctx.save();
      const x = 18 + i * 22;
      const y = 28 + (Math.random() * 4 - 2);
      const angle = (Math.random() - 0.5) * 0.4;
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(captchaCode[i], 0, 0);
      ctx.restore();
    }
  }, [captchaCode, theme]);

  const isDark = theme === 'dark';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold">
        <label className={isDark ? 'text-slate-300' : 'text-slate-700'}>
          Security CAPTCHA Verification <span className="text-rose-500">*</span>
        </label>
        <span className="text-[10px] text-cyan-500 font-mono">Case-sensitive</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Canvas Display */}
        <div className={`relative rounded-xl overflow-hidden border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'} shrink-0 shadow-inner`}>
          <canvas ref={canvasRef} width={135} height={42} className="block cursor-pointer" onClick={refreshCaptcha} title="Click to reload CAPTCHA" />
          <button
            type="button"
            onClick={refreshCaptcha}
            className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
              isDark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="Reload CAPTCHA"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Input Field */}
        <div className="flex-1 relative">
          <input
            type="text"
            required
            maxLength={5}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.toUpperCase())}
            placeholder="Enter CAPTCHA"
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
              isDark
                ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-500'
                : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-xs'
            }`}
          />
        </div>
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
          <span>⚠️ {error}</span>
        </p>
      )}
    </div>
  );
}

// ----------------------------------------------------
// Mock 2FA OTP Modal Component
// ----------------------------------------------------
interface MockOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  destinationText: string;
  title?: string;
  loading?: boolean;
}

export function MockOtpModal({
  isOpen,
  onClose,
  onSuccess,
  destinationText,
  title = '2FA Security Code Verification',
  loading = false
}: MockOtpModalProps) {
  const [mockOtpCode, setMockOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [copied, setCopied] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otpError, setOtpError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      const generated = generateMockOtp();
      setMockOtpCode(generated);
      setOtpInput(['', '', '', '', '', '']);
      setOtpError('');
      setTimer(60);
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || timer <= 0) return;
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpInput];
    newOtp[index] = value.slice(-1);
    setOtpInput(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleAutoFill = () => {
    if (!mockOtpCode) return;
    const digits = mockOtpCode.split('');
    setOtpInput(digits);
    setOtpError('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mockOtpCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpInput.join('');
    if (entered.length < 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (entered !== mockOtpCode) {
      setOtpError('Invalid OTP code. Please check the code provided above.');
      return;
    }

    setOtpError('');
    onSuccess();
  };

  const resendCode = () => {
    const newCode = generateMockOtp();
    setMockOtpCode(newCode);
    setOtpInput(['', '', '', '', '', '']);
    setTimer(60);
    setOtpError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-white space-y-5 select-none">
        
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1.5">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 mb-1">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-black tracking-tight text-white">{title}</h3>
          <p className="text-xs text-slate-400">
            For security, a 6-digit authentication code was issued for <span className="text-cyan-300 font-medium">{destinationText}</span>.
          </p>
        </div>

        {/* Mock OTP Display Card */}
        <div className="p-3.5 bg-cyan-950/50 border border-cyan-800/80 rounded-2xl space-y-2 text-center">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Mock 2FA Code (Demo & Live)
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-[11px] text-cyan-400 hover:text-cyan-200 font-semibold flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <div className="text-2xl font-mono font-black tracking-widest text-cyan-200 bg-slate-950/80 py-2 rounded-xl border border-cyan-900/60 shadow-inner">
            {mockOtpCode}
          </div>
          <button
            type="button"
            onClick={handleAutoFill}
            className="w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold rounded-lg transition-all border border-cyan-500/30 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Auto-Fill 6-Digit Code
          </button>
        </div>

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="flex justify-between gap-2">
            {otpInput.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-13 text-center text-xl font-bold font-mono bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner"
              />
            ))}
          </div>

          {otpError && (
            <p className="text-xs text-rose-400 text-center font-medium bg-rose-950/60 border border-rose-800 p-2 rounded-xl">
              ⚠️ {otpError}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
            <span>Didn't receive code?</span>
            {timer > 0 ? (
              <span className="text-slate-500 font-mono">Resend in {timer}s</span>
            ) : (
              <button
                type="button"
                onClick={resendCode}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
              >
                Resend Code
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {loading ? 'Verifying & Completing...' : 'Verify OTP & Authorize'}
          </button>
        </form>
      </div>
    </div>
  );
}
