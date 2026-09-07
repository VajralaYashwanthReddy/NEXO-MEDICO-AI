'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { UserCheck, ShieldCheck, ArrowRight, Stethoscope, CheckCircle2, Lock, Mail, Phone, HeartPulse } from 'lucide-react';
import { VisualCaptcha, MockOtpModal } from '@/components/SecurityVerification';

export default function PatientSelfRegistrationPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    dob: '1990-05-15',
    gender: 'Male',
    phone: '',
    address: '',
    emergencyContact: '',
    bloodGroup: 'O+',
    allergies: '',
    conditions: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Security CAPTCHA & OTP states
  const [captchaInput, setCaptchaInput] = useState('');
  const [expectedCaptcha, setExpectedCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const initiateRegistrationSequence = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');

    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in required fields (Name, Email, Password).');
      return;
    }

    if (!captchaInput || captchaInput.trim().toUpperCase() !== expectedCaptcha.trim().toUpperCase()) {
      setCaptchaError('Invalid CAPTCHA code. Please check characters & try again.');
      return;
    }

    setShowOtpModal(true);
  };

  const handleOtpSuccess = async () => {
    setShowOtpModal(false);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed');

      login(data.token, {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        hospitalId: data.user.hospitalId,
        hospitalName: data.user.hospitalName,
        permissions: ['PATIENT_VIEW', 'MEDICAL_RECORD_VIEW', 'PRESCRIPTION_VIEW', 'LAB_REPORT_VIEW']
      });

      router.push('/patient/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8 w-full select-none overflow-x-hidden">
      <div className="max-w-xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/30 mb-3">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Patient Self-Registration</h1>
          <p className="text-sm text-slate-400 mt-1">
            Register your personal health account & receive your Universal Patient ID (`NEXO-PAT-xxxxxx`)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={initiateRegistrationSequence} className="space-y-4 text-xs">
            <h3 className="font-bold text-cyan-400 text-xs uppercase tracking-wider border-b border-slate-800 pb-2">Account Login Details</h3>
            
            <div>
              <label className="block font-semibold text-slate-300">Full Name *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                placeholder="John Doe"
                className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john.doe@gmail.com"
                  className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <h3 className="font-bold text-cyan-400 text-xs uppercase tracking-wider border-b border-slate-800 pb-2 pt-2">Demographics & Medical Profile</h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => updateField('dob', e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => updateField('bloodGroup', e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+1 (555) 321-7890"
                  className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300">Emergency Contact</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => updateField('emergencyContact', e.target.value)}
                  placeholder="Spouse / Parent - Phone"
                  className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Known Drug & Environmental Allergies</label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => updateField('allergies', e.target.value)}
                placeholder="e.g. Penicillin, Sulfa, Peanuts"
                className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-rose-400 font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300">Chronic Pre-existing Conditions</label>
              <input
                type="text"
                value={formData.conditions}
                onChange={(e) => updateField('conditions', e.target.value)}
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            {/* Visual Security Captcha */}
            <div className="pt-2">
              <VisualCaptcha
                userInput={captchaInput}
                setUserInput={setCaptchaInput}
                onCodeChange={(code) => setExpectedCaptcha(code)}
                error={captchaError}
                theme="dark"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Universal Health Profile...' : 'Register Account & Generate Universal Patient ID'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 2FA Mock OTP Verification Modal */}
          <MockOtpModal
            isOpen={showOtpModal}
            onClose={() => setShowOtpModal(false)}
            onSuccess={handleOtpSuccess}
            destinationText={formData.email || formData.fullName}
            title="Patient Security 2FA Verification"
            loading={loading}
          />

          <div className="mt-6 text-center border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-cyan-400 hover:text-cyan-300 underline">
                Sign in to Patient Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
