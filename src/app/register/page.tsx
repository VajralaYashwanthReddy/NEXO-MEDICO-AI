'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Search,
  ChevronDown,
  X,
  AlertCircle
} from 'lucide-react';
import { VisualCaptcha, MockOtpModal } from '@/components/SecurityVerification';
import { INDIAN_STATES, INDIAN_UNION_TERRITORIES, ALL_INDIAN_STATES_AND_UTS } from '@/lib/indiaLocations';

export default function HospitalRegisterWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    hospitalName: '',
    hospitalType: 'Multi-Specialty Research Hospital',
    registrationNo: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pinCode: '',
    state: '',
    country: 'IN',
    website: '',
    emergencyContact: '',
    numberDepartments: '5',
    numberBeds: '50',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  // Searchable State Dropdown States
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const stateDropdownRef = useRef<HTMLDivElement | null>(null);

  // Security CAPTCHA & OTP states
  const [captchaInput, setCaptchaInput] = useState('');
  const [expectedCaptcha, setExpectedCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);

  const { login } = useAuth();

  // Auto-fetch next available registration number on initial mount
  useEffect(() => {
    fetch('/api/hospitals/register')
      .then(res => res.json())
      .then(data => {
        if (data?.registrationNo) {
          setFormData(prev => ({ ...prev, registrationNo: data.registrationNo }));
        }
      })
      .catch(err => {
        console.warn('Could not auto-fetch registration number:', err);
        const year = new Date().getFullYear();
        setFormData(prev => ({ ...prev, registrationNo: `NMX-HOSP-${year}-000001` }));
      });
  }, []);

  // Close State Dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setStateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear specific field error on change
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    if (error) setError('');
  };

  const validateCurrentStep = (targetStep: number): boolean => {
    setError('');
    setCaptchaError('');
    const newFieldErrors: Record<string, string> = {};

    if (targetStep === 1) {
      if (!formData.hospitalName.trim()) {
        newFieldErrors.hospitalName = 'Please enter the hospital legal name.';
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        newFieldErrors.email = 'Please enter a valid official hospital email address.';
      }
      if (!formData.phone.trim()) {
        newFieldErrors.phone = 'Please enter the primary hospital contact phone number.';
      }

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...newFieldErrors }));
        setError('Please fill in all required organization fields.');
        return false;
      }
      return true;
    }

    if (targetStep === 2) {
      if (!formData.address.trim()) {
        newFieldErrors.address = 'Please enter the hospital street address.';
      }
      if (!formData.city.trim()) {
        newFieldErrors.city = 'Please enter the city location.';
      }

      const cleanPin = formData.pinCode.trim();
      if (!cleanPin) {
        newFieldErrors.pinCode = 'PIN Code is required.';
      } else if (formData.country === 'IN' && !/^\d{6}$/.test(cleanPin)) {
        newFieldErrors.pinCode = 'Please enter a valid 6-digit Indian PIN code (digits only).';
      } else if (cleanPin.length < 3 || cleanPin.length > 10) {
        newFieldErrors.pinCode = 'Please enter a valid postal code.';
      }

      if (formData.country === 'IN' && !formData.state.trim()) {
        newFieldErrors.state = 'Please select a State or Union Territory from the dropdown.';
      } else if (!formData.state.trim()) {
        newFieldErrors.state = 'Please select or enter the state/province.';
      }
      if (!formData.emergencyContact.trim()) {
        newFieldErrors.emergencyContact = 'Please enter the 24/7 emergency dispatch hotline.';
      }

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...newFieldErrors }));
        setError('Please fill in required location details, PIN Code, and 24/7 emergency dispatch line.');
        return false;
      }
      return true;
    }

    if (targetStep === 3) {
      return true;
    }

    if (targetStep === 4) {
      if (!formData.adminName.trim()) {
        newFieldErrors.adminName = 'Please enter administrator full name.';
      }
      if (!formData.adminEmail.trim() || !formData.adminEmail.includes('@')) {
        newFieldErrors.adminEmail = 'Please enter a valid administrator login email.';
      }
      if (!formData.adminPassword || formData.adminPassword.length < 6) {
        newFieldErrors.adminPassword = 'Administrator password must be at least 6 characters.';
      }
      if (!captchaInput || captchaInput.trim().toUpperCase() !== expectedCaptcha.trim().toUpperCase()) {
        setCaptchaError('Invalid CAPTCHA code. Please check characters and try again.');
        return false;
      }

      if (Object.keys(newFieldErrors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...newFieldErrors }));
        setError('Please fill in required administrator account credentials.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateCurrentStep(step)) return;
    setStep(prev => prev + 1);
  };

  const initiateRegistrationSequence = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (step < 4) {
      handleNextStep();
      return;
    }

    if (!validateCurrentStep(4)) return;

    setShowOtpModal(true);
  };

  const handleOtpSuccess = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setShowOtpModal(false);
    setLoading(true);
    setError('');
    setFieldErrors({});

    const finalPayload = {
      hospitalName: formData.hospitalName.trim(),
      hospitalType: formData.hospitalType.trim() || 'Multi-Specialty Research Hospital',
      registrationNo: formData.registrationNo.trim().toUpperCase(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      pinCode: formData.pinCode.trim(),
      state: formData.state.trim(),
      country: formData.country.trim() || 'IN',
      website: formData.website.trim() || null,
      emergencyContact: formData.emergencyContact.trim(),
      numberDepartments: formData.numberDepartments || '5',
      numberBeds: formData.numberBeds || '50',
      adminName: formData.adminName.trim(),
      adminEmail: formData.adminEmail.trim().toLowerCase(),
      adminPassword: formData.adminPassword
    };

    try {
      const res = await fetch('/api/hospitals/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(finalPayload)
      });
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Hospital registration failed';
        const errorField = data.field;

        if (errorField) {
          setFieldErrors({ [errorField]: errorMsg });
        }
        // Never reset step to 1 or clear entered fields on error
        throw new Error(errorMsg);
      }

      const adminUser = data.adminUser || data.user;
      const hospital = data.hospital;

      setSuccessMessage('Registration successfully saved! Launching Hospital Dashboard...');

      login(data.token, {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        permissions: ['*']
      });

      // Hard redirect to Hospital Admin Dashboard to guarantee clean HTTP-only cookie session and tenant data load
      window.location.href = `/admin/dashboard?hospitalId=${hospital.id}`;
    } catch (err: any) {
      setError(err.message || 'Hospital registration failed. Please review your details and try again.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Filtered Indian States & UTs for searchable dropdown
  const filteredStates = INDIAN_STATES.filter(s =>
    s.toLowerCase().includes(stateSearchQuery.toLowerCase().trim())
  );
  const filteredUTs = INDIAN_UNION_TERRITORIES.filter(u =>
    u.toLowerCase().includes(stateSearchQuery.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-8 px-4 sm:px-6 lg:px-8 w-full select-none overflow-x-hidden">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-600 text-white mb-3 shadow-lg shadow-cyan-600/30">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Hospital Onboarding Wizard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Register your hospital organization and initialize tenant infrastructure
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              onClick={() => {
                if (s < step) setStep(s);
              }}
              className={`flex items-center gap-2 ${s < step ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs transition-all ${
                  step === s
                    ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/20'
                    : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${step === s ? 'text-cyan-400' : 'text-slate-500'}`}>
                {s === 1 ? 'Hospital Info' : s === 2 ? 'Location' : s === 3 ? 'Capacity' : 'Admin Account'}
              </span>
            </div>
          ))}
        </div>

        {/* Main Wizard Form Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && !successMessage && (
            <div className="mb-6 p-4 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-start gap-2.5 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={initiateRegistrationSequence}>
            {/* STEP 1: Basic Hospital Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">Step 1: Organization Details</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Hospital Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.hospitalName}
                    onChange={(e) => updateField('hospitalName', e.target.value)}
                    placeholder="e.g. Apollo Super Specialty Hospital"
                    className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                      fieldErrors.hospitalName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-800'
                    }`}
                  />
                  {fieldErrors.hospitalName && (
                    <p className="mt-1 text-xs text-rose-400 font-semibold flex items-center gap-1">
                      <span>⚠️</span> {fieldErrors.hospitalName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">
                      Auto-Generated Hospital Registration Number
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        readOnly
                        value={formData.registrationNo || 'Generating official registration number...'}
                        className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-cyan-300 font-mono font-bold tracking-wider cursor-not-allowed select-none focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-2.5 text-[10px] bg-cyan-950/90 text-cyan-400 border border-cyan-800/80 px-2 py-0.5 rounded-md font-semibold select-none">
                        🔒 Auto-Generated
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Permanent sequential registration number assigned automatically by the Nexo Medico platform.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Hospital Type</label>
                    <select
                      value={formData.hospitalType}
                      onChange={(e) => updateField('hospitalType', e.target.value)}
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="Multi-Specialty Research Hospital">Multi-Specialty Research Hospital</option>
                      <option value="General Hospital">General Hospital</option>
                      <option value="Academic Medical Center">Academic Medical Center</option>
                      <option value="Community Clinic">Community Clinic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Official Hospital Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="e.g. contact@apollohospital.org"
                      className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                        fieldErrors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-800'
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-rose-400 font-semibold flex items-center gap-1">
                        <span>⚠️</span> {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Hospital Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="e.g. +91 44 2829 0200"
                      className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                        fieldErrors.phone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-800'
                      }`}
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs text-rose-400 font-semibold flex items-center gap-1">
                        <span>⚠️</span> {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Location & Emergency Contact */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">Step 2: Location & Emergency Contact</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="e.g. 21 Greams Lane, Thousand Lights"
                    className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                      fieldErrors.address ? 'border-rose-500' : 'border-slate-800'
                    }`}
                  />
                  {fieldErrors.address && (
                    <p className="mt-1 text-xs text-rose-400 font-semibold">⚠️ {fieldErrors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">City *</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="e.g. Hyderabad"
                      className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                        fieldErrors.city ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-800'
                      }`}
                    />
                    {fieldErrors.city && (
                      <p className="mt-1 text-xs text-rose-400 font-semibold flex items-center gap-1">
                        <span>⚠️</span> {fieldErrors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300">PIN Code / Postal Code *</label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={6}
                      value={formData.pinCode}
                      onChange={(e) => updateField('pinCode', e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 500034"
                      className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-white font-mono font-bold tracking-wider focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                        fieldErrors.pinCode ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-800'
                      }`}
                    />
                    {fieldErrors.pinCode ? (
                      <p className="mt-1 text-xs text-rose-400 font-semibold flex items-center gap-1">
                        <span>⚠️</span> {fieldErrors.pinCode}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">
                        6-digit postal PIN code without spaces or letters
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Searchable State / Union Territory Dropdown */}
                  <div className="relative" ref={stateDropdownRef}>
                    <label className="block text-xs font-semibold text-slate-300">State / Union Territory *</label>
                    
                    <button
                      type="button"
                      onClick={() => setStateDropdownOpen(prev => !prev)}
                      className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm flex items-center justify-between text-left focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors ${
                        fieldErrors.state ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-800'
                      } ${formData.state ? 'text-white font-semibold' : 'text-slate-500'}`}
                    >
                      <span className="truncate">{formData.state || 'Select State / UT'}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                    </button>

                    {/* Searchable Popup Menu */}
                    {stateDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-full sm:w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-72 flex flex-col overflow-hidden text-xs">
                        {/* Search Input Filter */}
                        <div className="p-2 border-b border-slate-800 bg-slate-950 flex items-center gap-1.5 shrink-0">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <input
                            type="text"
                            autoFocus
                            value={stateSearchQuery}
                            onChange={(e) => setStateSearchQuery(e.target.value)}
                            placeholder="Type to filter 36 States & UTs..."
                            className="w-full bg-transparent text-white text-xs placeholder:text-slate-500 focus:outline-none font-medium"
                          />
                          {stateSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setStateSearchQuery('')}
                              className="text-slate-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* List Options */}
                        <div className="overflow-y-auto flex-1 divide-y divide-slate-800/40 custom-scrollbar">
                          {filteredStates.length > 0 && (
                            <div>
                              <div className="px-3 py-1.5 bg-slate-800/60 text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider">
                                Indian States ({filteredStates.length})
                              </div>
                              {filteredStates.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => {
                                    updateField('state', s);
                                    setStateDropdownOpen(false);
                                    setStateSearchQuery('');
                                  }}
                                  className={`w-full px-3.5 py-2 text-left hover:bg-cyan-950 hover:text-cyan-300 transition-colors flex items-center justify-between ${
                                    formData.state === s ? 'bg-cyan-900/40 text-cyan-300 font-bold' : 'text-slate-200'
                                  }`}
                                >
                                  <span>{s}</span>
                                  {formData.state === s && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          )}

                          {filteredUTs.length > 0 && (
                            <div>
                              <div className="px-3 py-1.5 bg-slate-800/60 text-[10px] font-extrabold text-purple-400 uppercase tracking-wider">
                                Union Territories ({filteredUTs.length})
                              </div>
                              {filteredUTs.map((u) => (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={() => {
                                    updateField('state', u);
                                    setStateDropdownOpen(false);
                                    setStateSearchQuery('');
                                  }}
                                  className={`w-full px-3.5 py-2 text-left hover:bg-purple-950 hover:text-purple-300 transition-colors flex items-center justify-between ${
                                    formData.state === u ? 'bg-purple-900/40 text-purple-300 font-bold' : 'text-slate-200'
                                  }`}
                                >
                                  <span>{u}</span>
                                  {formData.state === u && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          )}

                          {filteredStates.length === 0 && filteredUTs.length === 0 && (
                            <div className="p-4 text-center text-slate-500 text-xs">
                              No state or UT matching &ldquo;{stateSearchQuery}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {fieldErrors.state && (
                      <p className="mt-1 text-xs text-rose-400 font-semibold flex items-center gap-1">
                        <span>⚠️</span> {fieldErrors.state}
                      </p>
                    )}
                  </div>

                  {/* Country Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Country *</label>
                    <select
                      value={formData.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="IN">India (IND)</option>
                      <option value="US">United States (USA)</option>
                      <option value="GB">United Kingdom (UK)</option>
                      <option value="AE">United Arab Emirates (UAE)</option>
                      <option value="OTHER">Other Country</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">24/7 Emergency Dispatch Line *</label>
                    <input
                      type="text"
                      required
                      value={formData.emergencyContact}
                      onChange={(e) => updateField('emergencyContact', e.target.value)}
                      placeholder="e.g. +91 44 2829 0100"
                      className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                        fieldErrors.emergencyContact ? 'border-rose-500' : 'border-slate-800'
                      }`}
                    />
                    {fieldErrors.emergencyContact && (
                      <p className="mt-1 text-xs text-rose-400 font-semibold">⚠️ {fieldErrors.emergencyContact}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Official Website URL</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      placeholder="e.g. https://apollohospitals.com"
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Scale & Configuration */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">Step 3: Initial Capacity Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Number of Departments</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={formData.numberDepartments}
                      onChange={(e) => updateField('numberDepartments', e.target.value)}
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300">Total Bed Capacity</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={formData.numberBeds}
                      onChange={(e) => updateField('numberBeds', e.target.value)}
                      className="mt-1 w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                  <p className="font-semibold text-slate-300">Auto-created Modules upon completion:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Core Departments (General Medicine, Emergency, Cardiology, Neurology, ICU)</li>
                    <li>General Wards & Inpatient Beds Grid</li>
                    <li>ICU Monitoring Unit & Emergency Triage Dashboard</li>
                    <li>Pharmacy & Laboratory Catalog</li>
                  </ul>
                </div>
              </div>
            )}

            {/* STEP 4: Admin Account Credentials */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">Step 4: Hospital Administrator Account</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300">Admin Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.adminName}
                    onChange={(e) => updateField('adminName', e.target.value)}
                    placeholder="e.g. Dr. Preetha Reddy (Administrator)"
                    className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                      fieldErrors.adminName ? 'border-rose-500' : 'border-slate-800'
                    }`}
                  />
                  {fieldErrors.adminName && (
                    <p className="mt-1 text-xs text-rose-400 font-semibold">⚠️ {fieldErrors.adminName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Admin Login Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => updateField('adminEmail', e.target.value)}
                    placeholder="e.g. preetha.admin@apollohospital.org"
                    className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                      fieldErrors.adminEmail ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-800'
                    }`}
                  />
                  {fieldErrors.adminEmail && (
                    <p className="mt-1 text-xs text-rose-400 font-semibold flex items-center gap-1">
                      <span>⚠️</span> {fieldErrors.adminEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300">Password (min 6 characters) *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.adminPassword}
                    onChange={(e) => updateField('adminPassword', e.target.value)}
                    placeholder="••••••••"
                    className={`mt-1 w-full px-3.5 py-2.5 bg-slate-950 border rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                      fieldErrors.adminPassword ? 'border-rose-500' : 'border-slate-800'
                    }`}
                  />
                  {fieldErrors.adminPassword && (
                    <p className="mt-1 text-xs text-rose-400 font-semibold">⚠️ {fieldErrors.adminPassword}</p>
                  )}
                </div>

                <div className="pt-2">
                  <VisualCaptcha
                    userInput={captchaInput}
                    setUserInput={setCaptchaInput}
                    onCodeChange={(code) => setExpectedCaptcha(code)}
                    error={captchaError}
                    theme="dark"
                  />
                </div>
              </div>
            )}

            {/* 2FA Mock OTP Verification Modal */}
            <MockOtpModal
              isOpen={showOtpModal}
              onClose={() => setShowOtpModal(false)}
              onSuccess={handleOtpSuccess}
              destinationText={formData.adminEmail || formData.hospitalName}
              title="Hospital Organization 2FA Verification"
              loading={loading}
            />

            {/* Wizard Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setError('');
                    setStep(step - 1);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-white">
                  Cancel & Back to Login
                </Link>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleNextStep}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all shadow-md shadow-cyan-600/30 disabled:opacity-50"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving & Initializing Tenant...
                    </>
                  ) : (
                    'Complete Registration & Launch Dashboard'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
