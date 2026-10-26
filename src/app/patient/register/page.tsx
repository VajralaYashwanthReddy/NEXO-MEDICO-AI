'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  UserCheck,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  HeartPulse,
  MapPin,
  Building,
  Home,
  QrCode,
  AlertTriangle,
  ChevronDown,
  Search,
  Check
} from 'lucide-react';
import { VisualCaptcha, MockOtpModal } from '@/components/SecurityVerification';
import {
  INDIAN_STATES_AND_UTS,
  validateIndianPinCode,
  validateIndianPhoneNumber
} from '@/lib/indiaGeoData';

export default function PatientSelfRegistrationPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    dob: '1995-05-15',
    gender: 'Male',
    phone: '',
    bloodGroup: 'O+',
    allergies: '',
    conditions: '',
    // India-only address
    country: 'IN',
    houseFlat: '',
    streetArea: '',
    villageWard: '',
    mandalTaluk: '',
    landmark: '',
    city: '',
    district: '',
    state: 'Maharashtra',
    pinCode: '',
    // Emergency contact
    emergencyContactName: '',
    emergencyContactRelation: 'Family',
    emergencyContactPhone: ''
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Searchable state dropdown states
  const [stateSearch, setStateSearch] = useState('');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const stateDropdownRef = useRef<HTMLDivElement>(null);

  // Security CAPTCHA & OTP states
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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setIsStateDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error as user types
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Filtered Indian States & UTs
  const filteredStatesAndUts = useMemo(() => {
    if (!stateSearch.trim()) return INDIAN_STATES_AND_UTS;
    const q = stateSearch.toLowerCase().trim();
    return INDIAN_STATES_AND_UTS.filter(
      item => item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
    );
  }, [stateSearch]);

  const validateClientSide = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required.';
    if (!formData.email.trim()) errors.email = 'Email Address is required.';
    if (!formData.password) errors.password = 'Password is required (min 6 characters).';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters.';

    if (!formData.dob) errors.dob = 'Date of birth is required.';
    if (!formData.gender) errors.gender = 'Gender is required.';

    // Phone validation (Indian 10-digit mobile)
    const phoneRes = validateIndianPhoneNumber(formData.phone, true);
    if (!phoneRes.valid) {
      errors.phone = phoneRes.error || 'Please enter a valid 10-digit Indian phone number.';
    }

    // Address validation
    if (!formData.houseFlat.trim()) errors.houseFlat = 'House / Flat Number is required.';
    if (!formData.streetArea.trim()) errors.streetArea = 'Building / Street / Area is required.';
    if (!formData.city.trim()) errors.city = 'City / Town / Village is required.';
    if (!formData.district.trim()) errors.district = 'District is required.';
    if (!formData.state.trim()) errors.state = 'Please select an Indian State or Union Territory.';

    // PIN code validation
    const pinRes = validateIndianPinCode(formData.pinCode);
    if (!pinRes.valid) {
      errors.pinCode = pinRes.error || 'Indian PIN code must be exactly 6 digits (first digit 1-9).';
    }

    // Emergency Contact validation
    if (!formData.emergencyContactName.trim()) {
      errors.emergencyContactName = 'Emergency contact person name is required.';
    }
    const emgPhoneRes = validateIndianPhoneNumber(formData.emergencyContactPhone, true);
    if (!emgPhoneRes.valid) {
      errors.emergencyContactPhone = emgPhoneRes.error || 'Valid Indian contact number required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const initiateRegistrationSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');

    if (!validateClientSide()) {
      setError('Please resolve the highlighted validation errors before proceeding.');
      return;
    }

    if (!captchaInput || captchaInput.trim().toUpperCase() !== expectedCaptcha.trim().toUpperCase()) {
      setCaptchaError('Invalid CAPTCHA code. Please check characters & try again.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_registration_otp',
          email: formData.email.trim().toLowerCase(),
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          houseFlat: formData.houseFlat.trim(),
          streetArea: formData.streetArea.trim(),
          landmark: formData.landmark.trim(),
          city: formData.city.trim(),
          district: formData.district.trim(),
          state: formData.state.trim(),
          pinCode: formData.pinCode.trim(),
          emergencyContactName: formData.emergencyContactName.trim(),
          emergencyContactRelation: formData.emergencyContactRelation.trim(),
          emergencyContactPhone: formData.emergencyContactPhone.trim()
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setShowOtpModal(false);
        throw new Error(data.error || "We couldn't send the verification code. Please try again shortly.");
      }

      setChallengeToken(data.challengeToken);
      setDestinationText(formData.email.trim().toLowerCase());
      setShowOtpModal(true);
    } catch (err: any) {
      setShowOtpModal(false);
      setError(err.message || "We couldn't send the verification code. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegisterPatient = async (otpCode: string) => {
    setOtpLoading(true);
    setOtpModalError('');
    setError('');

    try {
      const res = await fetch('/api/auth/register-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          challengeToken,
          otpCode
        })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.field) {
          setFieldErrors(prev => ({ ...prev, [data.field]: data.error }));
        }
        throw new Error(data.error || 'Registration failed');
      }

      if (data.patient && typeof window !== 'undefined') {
        try {
          const localSaved = JSON.parse(localStorage.getItem('nexo_custom_registered_patients') || '[]');
          const updated = [data.patient, ...localSaved.filter((p: any) => p.patientCode !== data.patient.patientCode)];
          localStorage.setItem('nexo_custom_registered_patients', JSON.stringify(updated));
        } catch (e) {}
      }

      setShowOtpModal(false);

      login(data.token, {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        patientCode: data.user.patientCode || data.patientCode || data.patient?.patientCode,
        gender: data.user.gender || data.patient?.gender || formData.gender,
        dob: data.user.dob || data.patient?.dob || formData.dob,
        phone: data.user.phone || data.patient?.phone || formData.phone,
        bloodGroup: data.user.bloodGroup || data.patient?.bloodGroup || formData.bloodGroup,
        hospitalId: data.user.hospitalId,
        hospitalName: data.user.hospitalName,
        permissions: ['PATIENT_VIEW', 'MEDICAL_RECORD_VIEW', 'PRESCRIPTION_VIEW', 'LAB_REPORT_VIEW']
      });

      router.push('/patient/dashboard');
    } catch (err: any) {
      setOtpModalError(err.message || 'Failed to complete patient registration');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendPatientOtp = async () => {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 w-full select-none overflow-x-hidden">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/30 mb-3">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <div className="inline-block bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            🇮🇳 India Healthcare Registry • Emergency QR Enabled
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Patient Self-Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
            Create your Universal Patient Profile (`NEXO-PAT-xxxxxx`) and automatically receive your permanent Emergency QR ID.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={initiateRegistrationSequence} className="space-y-5 text-xs">
            {/* ---------------- 1. ACCOUNT CREDENTIALS ---------------- */}
            <div>
              <h3 className="font-bold text-cyan-400 text-xs uppercase tracking-wider border-b border-slate-800 pb-2 mb-3 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> Account Login Details
              </h3>
              
              <div>
                <label className="block font-semibold text-slate-300">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="e.g. Ramesh Kumar Sharma"
                  className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border ${
                    fieldErrors.fullName ? 'border-rose-500' : 'border-slate-800'
                  } rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                />
                {fieldErrors.fullName && (
                  <p className="text-rose-400 text-[11px] mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block font-semibold text-slate-300">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="ramesh.sharma@example.com"
                    className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border ${
                      fieldErrors.email ? 'border-rose-500' : 'border-slate-800'
                    } rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                  />
                  {fieldErrors.email && (
                    <p className="text-rose-400 text-[11px] mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="••••••••"
                    className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border ${
                      fieldErrors.password ? 'border-rose-500' : 'border-slate-800'
                    } rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                  />
                  {fieldErrors.password && (
                    <p className="text-rose-400 text-[11px] mt-1">{fieldErrors.password}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ---------------- 2. DEMOGRAPHICS & PRIMARY CONTACT ---------------- */}
            <div>
              <h3 className="font-bold text-cyan-400 text-xs uppercase tracking-wider border-b border-slate-800 pb-2 mb-3 flex items-center gap-2">
                <HeartPulse className="w-3.5 h-3.5" /> Personal Vitals & Mobile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300">
                    Date of Birth <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => updateField('dob', e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                  {fieldErrors.dob && (
                    <p className="text-rose-400 text-[11px] mt-1">{fieldErrors.dob}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300">
                    Gender <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300">
                    Blood Group <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => updateField('bloodGroup', e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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

              {/* Mobile Phone (+91 Indian Mobile) */}
              <div className="mt-3">
                <label className="block font-semibold text-slate-300">
                  Primary Mobile Number (India) <span className="text-rose-400">*</span>
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="98765 43210"
                    maxLength={14}
                    className={`w-full pl-16 pr-3.5 py-2.5 bg-slate-950 border ${
                      fieldErrors.phone ? 'border-rose-500' : 'border-slate-800'
                    } rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                  />
                </div>
                {fieldErrors.phone ? (
                  <p className="text-rose-400 text-[11px] mt-1">{fieldErrors.phone}</p>
                ) : (
                  <p className="text-[10px] text-slate-500 mt-0.5">10-digit Indian cellular number starting with 6, 7, 8, or 9.</p>
                )}
              </div>
            </div>

            {/* ---------------- 3. RESIDENTIAL ADDRESS (INDIA ONLY) ---------------- */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <h3 className="font-bold text-cyan-400 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Home className="w-3.5 h-3.5" /> Residential Address (India Only)
                </h3>
                <span className="text-[10px] font-bold bg-slate-900 border border-slate-700 text-emerald-400 px-2 py-0.5 rounded-md">
                  Country: India (IN)
                </span>
              </div>

              {/* House/Flat & Street/Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300">
                    House / Flat / Door Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.houseFlat}
                    onChange={(e) => updateField('houseFlat', e.target.value)}
                    placeholder="e.g. Flat 302, Sai Heights"
                    className={`mt-1 w-full px-3 py-2 bg-slate-950 border ${
                      fieldErrors.houseFlat ? 'border-rose-500' : 'border-slate-800'
                    } rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                  />
                  {fieldErrors.houseFlat && (
                    <p className="text-rose-400 text-[10px] mt-1">{fieldErrors.houseFlat}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300">
                    Building / Street / Area <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.streetArea}
                    onChange={(e) => updateField('streetArea', e.target.value)}
                    placeholder="e.g. Shivaji Nagar, Sector 4"
                    className={`mt-1 w-full px-3 py-2 bg-slate-950 border ${
                      fieldErrors.streetArea ? 'border-rose-500' : 'border-slate-800'
                    } rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                  />
                  {fieldErrors.streetArea && (
                    <p className="text-rose-400 text-[10px] mt-1">{fieldErrors.streetArea}</p>
                  )}
                </div>
              </div>

              {/* Village/Ward & Mandal/Taluk (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300">
                    Village / Ward / Locality <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.villageWard}
                    onChange={(e) => updateField('villageWard', e.target.value)}
                    placeholder="e.g. Rampur Village / Ward 12"
                    className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300">
                    Mandal / Taluk / Tehsil <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.mandalTaluk}
                    onChange={(e) => updateField('mandalTaluk', e.target.value)}
                    placeholder="e.g. Haveli Taluk / Geesugonda"
                    className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Landmark (Optional) */}
              <div>
                <label className="block font-semibold text-slate-300">
                  Landmark <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => updateField('landmark', e.target.value)}
                  placeholder="e.g. Near City Civil Hospital / Metro Pillar 42"
                  className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* State / UT Searchable Dropdown */}
              <div className="relative" ref={stateDropdownRef}>
                <label className="block font-semibold text-slate-300">
                  State / Union Territory <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsStateDropdownOpen(!isStateDropdownOpen)}
                  className={`mt-1 w-full px-3 py-2 bg-slate-950 border ${
                    fieldErrors.state ? 'border-rose-500' : 'border-slate-800'
                  } rounded-xl text-xs text-left text-white flex items-center justify-between focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                >
                  <span className="font-semibold">{formData.state || 'Select Indian State / UT'}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {isStateDropdownOpen && (
                  <div className="absolute z-30 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 max-h-60 overflow-y-auto">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={stateSearch}
                        onChange={(e) => setStateSearch(e.target.value)}
                        placeholder="Search 28 States & 8 UTs..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                        autoFocus
                      />
                    </div>

                    <div className="space-y-0.5">
                      {filteredStatesAndUts.map(item => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => {
                            updateField('state', item.name);
                            setIsStateDropdownOpen(false);
                            setStateSearch('');
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            formData.state === item.name
                              ? 'bg-cyan-600 text-white font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>{item.name}</span>
                          <span className="text-[10px] opacity-75 font-mono">
                            {item.type === 'UT' ? 'UT' : 'State'}
                          </span>
                        </button>
                      ))}
                      {filteredStatesAndUts.length === 0 && (
                        <p className="text-center text-xs text-slate-500 py-2">No matching state or UT found.</p>
                      )}
                    </div>
                  </div>
                )}
                {fieldErrors.state && (
                  <p className="text-rose-400 text-[10px] mt-1">{fieldErrors.state}</p>
                )}
              </div>

              {/* District, City, and PIN Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300">
                    District <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => updateField('district', e.target.value)}
                    placeholder="e.g. Pune"
                    className={`mt-1 w-full px-3 py-2 bg-slate-950 border ${
                      fieldErrors.district ? 'border-rose-500' : 'border-slate-800'
                    } rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                  />
                  {fieldErrors.district && (
                    <p className="text-rose-400 text-[10px] mt-1">{fieldErrors.district}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300">
                    City / Town / Village <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="e.g. Pune"
                    className={`mt-1 w-full px-3 py-2 bg-slate-950 border ${
                      fieldErrors.city ? 'border-rose-500' : 'border-slate-800'
                    } rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                  />
                  {fieldErrors.city && (
                    <p className="text-rose-400 text-[10px] mt-1">{fieldErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300">
                    PIN Code (6 digits) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formData.pinCode}
                    onChange={(e) => updateField('pinCode', e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 411005"
                    className={`mt-1 w-full px-3 py-2 bg-slate-950 border ${
                      fieldErrors.pinCode ? 'border-rose-500' : 'border-slate-800'
                    } rounded-xl text-xs text-white font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                  />
                  {fieldErrors.pinCode && (
                    <p className="text-rose-400 text-[10px] mt-1">{fieldErrors.pinCode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ---------------- 4. EMERGENCY CONTACT DETAILS ---------------- */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-cyan-400 text-xs uppercase tracking-wider border-b border-slate-800/80 pb-2 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Emergency Contact (First Responder Notification)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300">
                    Contact Person Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.emergencyContactName}
                    onChange={(e) => updateField('emergencyContactName', e.target.value)}
                    placeholder="e.g. Sunita Sharma"
                    className={`mt-1 w-full px-3 py-2 bg-slate-950 border ${
                      fieldErrors.emergencyContactName ? 'border-rose-500' : 'border-slate-800'
                    } rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                  />
                  {fieldErrors.emergencyContactName && (
                    <p className="text-rose-400 text-[10px] mt-1">{fieldErrors.emergencyContactName}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-300">
                    Relationship <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => updateField('emergencyContactRelation', e.target.value)}
                    placeholder="e.g. Spouse / Parent / Sibling"
                    className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300">
                    Contact Phone (+91) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.emergencyContactPhone}
                    onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                    placeholder="e.g. 98111 22334"
                    maxLength={14}
                    className={`mt-1 w-full px-3 py-2 bg-slate-950 border ${
                      fieldErrors.emergencyContactPhone ? 'border-rose-500' : 'border-slate-800'
                    } rounded-xl text-xs text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none`}
                  />
                  {fieldErrors.emergencyContactPhone && (
                    <p className="text-rose-400 text-[10px] mt-1">{fieldErrors.emergencyContactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ---------------- 5. MEDICAL PROFILE ---------------- */}
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-300">
                  Known Drug & Environmental Allergies <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => updateField('allergies', e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
                  className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-rose-400 font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300">
                  Chronic Pre-existing Conditions <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.conditions}
                  onChange={(e) => updateField('conditions', e.target.value)}
                  placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                  className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Emergency QR Feature Callout */}
            <div className="p-3 bg-cyan-950/50 border border-cyan-800/60 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-[11px] text-slate-300">
                <span className="font-bold text-white block">Automatic Emergency QR ID Provisioning</span>
                Upon successful registration and OTP verification, your unique, privacy-protected Emergency QR ID will be automatically generated with Indian 112 emergency routing.
              </div>
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
              className="mt-6 w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Health Record & Generating Emergency QR...' : 'Register Account & Generate Emergency QR ID'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Registration OTP Verification Modal */}
          <MockOtpModal
            isOpen={showOtpModal}
            onClose={() => setShowOtpModal(false)}
            onVerify={handleVerifyAndRegisterPatient}
            onResend={handleResendPatientOtp}
            destinationText={destinationText || formData.email || 'Registered Email'}
            title="Patient Identity Verification"
            subtitle={`A 6-digit registration code was dispatched via Gmail SMTP to ${destinationText || formData.email}. Please check your email Inbox and Spam / Junk folder.`}
            loading={otpLoading}
            error={otpModalError}
          />

          <div className="mt-6 text-center border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
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
