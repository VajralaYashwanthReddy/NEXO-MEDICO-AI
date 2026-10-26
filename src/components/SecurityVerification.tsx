'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ShieldCheck, Lock, CheckCircle2, Copy, Sparkles, X, Volume2 } from 'lucide-react';

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

  const speakCaptcha = () => {
    if (!captchaCode) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `Security code is: ${captchaCode.split('').join(' ')}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  useEffect(() => {
    if (!captchaCode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // High-contrast background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (theme === 'dark') {
      bgGradient.addColorStop(0, '#090d16');
      bgGradient.addColorStop(1, '#1e293b');
    } else {
      bgGradient.addColorStop(0, '#f8fafc');
      bgGradient.addColorStop(1, '#e2e8f0');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle background grid/noise lines (does not obscure letters)
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = theme === 'dark' ? `rgba(56, 189, 248, 0.12)` : `rgba(2, 132, 199, 0.15)`;
      ctx.lineWidth = 1.2;
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

    // Subtle ambient dots
    for (let i = 0; i < 15; i++) {
      ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.15)';
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ultra-vibrant crisp high-contrast character rendering
    ctx.font = 'bold 24px "Courier New", monospace, sans-serif';
    ctx.textBaseline = 'middle';

    const colors = theme === 'dark' 
      ? ['#38bdf8', '#f43f5e', '#34d399', '#facc15', '#c084fc']
      : ['#0284c7', '#e11d48', '#059669', '#d97706', '#7e22ce'];

    for (let i = 0; i < captchaCode.length; i++) {
      ctx.save();
      const x = 20 + i * 29;
      const y = 23 + (Math.random() * 2 - 1);
      const angle = (Math.random() - 0.5) * 0.2;

      ctx.translate(x, y);
      ctx.rotate(angle);

      // Text drop shadow for maximum legibility
      ctx.shadowColor = theme === 'dark' ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(captchaCode[i], 0, 0);
      ctx.restore();
    }
  }, [captchaCode, theme]);

  const isDark = theme === 'dark';

  return (
    <div className="space-y-2 select-none">
      <div className="flex items-center justify-between text-xs font-semibold">
        <label className={isDark ? 'text-slate-300' : 'text-slate-700'}>
          Security CAPTCHA Verification <span className="text-rose-500">*</span>
        </label>
        <span className="text-[10px] text-cyan-400 font-mono font-bold">Case-sensitive</span>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        {/* Canvas Display */}
        <div className={`relative rounded-xl overflow-hidden border ${isDark ? 'border-slate-700 bg-slate-900 shadow-md' : 'border-slate-300 bg-white shadow-xs'} shrink-0 flex items-center`}>
          <canvas
            ref={canvasRef}
            width={165}
            height={44}
            className="block cursor-pointer hover:opacity-90 transition-opacity"
            onClick={refreshCaptcha}
            title="Click CAPTCHA image to reload new code"
          />
        </div>

        {/* Action Controls: Reload & Audio Readout */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={refreshCaptcha}
            className={`p-2.5 rounded-xl transition-all border cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-cyan-400 hover:text-cyan-300 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-cyan-700 hover:text-cyan-800'
            }`}
            title="Generate New Security Code (Reload)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={speakCaptcha}
            className={`p-2.5 rounded-xl transition-all border cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-purple-400 hover:text-purple-300 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-purple-700 hover:text-purple-800'
            }`}
            title="Listen to CAPTCHA Code (Audio Readout)"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Input Field */}
        <div className="flex-1 min-w-[110px]">
          <input
            type="text"
            required
            maxLength={5}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono font-black tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all ${
              isDark
                ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-500 shadow-inner'
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
// Secure 2FA / Registration OTP Modal Component
// ----------------------------------------------------
export interface MockOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (code?: string) => void | Promise<void>;
  onVerify?: (code: string) => void | Promise<void>;
  onResend?: () => void | Promise<void>;
  destinationText: string;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
  isDemo?: boolean;
  demoOtpCode?: string;
}

export function MockOtpModal({
  isOpen,
  onClose,
  onSuccess,
  onVerify,
  onResend,
  destinationText,
  title = 'Two-Factor Authentication',
  subtitle,
  loading = false,
  error: externalError,
  isDemo = false,
  demoOtpCode
}: MockOtpModalProps) {
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [otpError, setOtpError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOtpInput(['', '', '', '', '', '']);
      setOtpError('');
      setResendNotice('');
      setTimer(60);
      setCopied(false);
      // Autofocus first input box
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (externalError) {
      setOtpError(externalError);
    }
  }, [externalError]);

  useEffect(() => {
    if (!isOpen || timer <= 0) return;
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean && value !== '') return;

    const newOtp = [...otpInput];
    newOtp[index] = clean.slice(-1);
    setOtpInput(newOtp);
    setOtpError('');

    // Auto-advance to next box
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpInput[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otpInput];
        newOtp[index] = '';
        setOtpInput(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = ['', '', '', '', '', ''];
    digits.forEach((d, idx) => {
      if (idx < 6) newOtp[idx] = d;
    });
    setOtpInput(newOtp);
    setOtpError('');

    const focusIndex = Math.min(digits.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const entered = otpInput.join('');
    if (entered.length < 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      return;
    }

    setOtpError('');

    if (onVerify) {
      await onVerify(entered);
    } else if (onSuccess) {
      if (isDemo && demoOtpCode && entered !== demoOtpCode) {
        setOtpError('Invalid verification code. Please check code and try again.');
        return;
      }
      await onSuccess(entered);
    }
  };

  const handleResendClick = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setOtpError('');
    try {
      if (onResend) {
        await onResend();
      }
      setTimer(60);
      setOtpInput(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setResendNotice(`A new 6-digit code was sent to ${destinationText}.`);
      setTimeout(() => setResendNotice(''), 4500);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleAutoFillDemo = () => {
    if (!demoOtpCode) return;
    const digits = demoOtpCode.split('').slice(0, 6);
    setOtpInput(digits);
    setOtpError('');
    inputRefs.current[5]?.focus();
  };

  const handleCopyDemo = () => {
    if (!demoOtpCode) return;
    navigator.clipboard.writeText(demoOtpCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl relative text-white space-y-5 select-none">
        
        <button
          onClick={onClose}
          type="button"
          disabled={loading}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 mb-1">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-black tracking-tight text-white">{title}</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {subtitle || (
              <>
                For institutional security, a 6-digit code was dispatched to{' '}
                <span className="text-cyan-300 font-semibold">{destinationText}</span>.
                <span className="block mt-1 text-[11px] text-slate-400">
                  Please check your email inbox and Spam/Junk folder.
                </span>
              </>
            )}
          </p>
        </div>

        {/* Optional Demo Card (Only rendered when explicitly flagged as demo) */}
        {isDemo && demoOtpCode && (
          <div className="p-3.5 bg-cyan-950/50 border border-cyan-800/80 rounded-2xl space-y-2 text-center">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Demo Account Access
              </span>
              <button
                type="button"
                onClick={handleCopyDemo}
                className="text-[11px] text-cyan-400 hover:text-cyan-200 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="text-2xl font-mono font-black tracking-widest text-cyan-200 bg-slate-950/80 py-2 rounded-xl border border-cyan-900/60 shadow-inner">
              {demoOtpCode}
            </div>
            <button
              type="button"
              onClick={handleAutoFillDemo}
              className="w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold rounded-lg transition-all border border-cyan-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Auto-Fill Demo Code
            </button>
          </div>
        )}

        {/* 6-Box OTP Input Container */}
        <div className="space-y-4">
          <div className="flex justify-between gap-2 sm:gap-2.5">
            {otpInput.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onPaste={handlePaste}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => {
                  handleKeyDown(idx, e);
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleVerify(e);
                  }
                }}
                className={`w-11 sm:w-12 h-13 text-center text-xl font-bold font-mono rounded-xl text-white transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  digit
                    ? 'bg-cyan-950/60 border-2 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950 border border-slate-800'
                }`}
                disabled={loading}
              />
            ))}
          </div>

          {resendNotice && (
            <p className="text-xs text-cyan-300 text-center font-medium bg-cyan-950/60 border border-cyan-800 p-2 rounded-xl">
              ✓ {resendNotice}
            </p>
          )}

          {otpError && (
            <p className="text-xs text-rose-400 text-center font-medium bg-rose-950/60 border border-rose-800 p-2.5 rounded-xl">
              ⚠️ {otpError}
            </p>
          )}

          {/* Resend Cooldown Counter */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
            <span>Didn't receive code?</span>
            {timer > 0 ? (
              <span className="text-slate-500 font-mono flex items-center gap-1">
                ⏱️ Resend in <span className="text-cyan-400 font-bold">{timer}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendClick}
                disabled={resending || loading}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Code via Email'}
              </button>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleVerify(e);
            }}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-black text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1"></span>
                Verifying Code...
              </>
            ) : (
              'Verify Code & Authorize'
            )}
          </button>

          <p className="text-[11px] text-slate-500 text-center font-medium">
            🔒 Code expires in 5 minutes • Strictly 1-time use
          </p>
        </div>
      </div>
    </div>
  );
}

// Alias export for modern nomenclature
export const SecureOtpModal = MockOtpModal;

