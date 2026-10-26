'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Download,
  Printer,
  ExternalLink,
  RefreshCw,
  Ban,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Eye,
  CheckCircle2,
  Copy,
  Phone,
  HeartPulse,
  MapPin,
  FileText,
  UserCheck,
  Info,
  Home,
  Calendar,
  Globe
} from 'lucide-react';

interface PatientEmergencyQrCardProps {
  patientId?: string;
}

export const PatientEmergencyQrCard: React.FC<PatientEmergencyQrCardProps> = ({ patientId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Privacy Settings Form State
  const [settings, setSettings] = useState({
    shareName: true,
    sharePatientCode: true,
    shareDob: true,
    sharePhone: false,
    shareEmergencyContact: true,
    shareBloodGroup: true,
    shareAllergies: true,
    shareConditions: true,
    shareAddress: false,
    shareEmergencyNote: true,
    emergencyNote: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: ''
  });

  // Residential Address Update Form State
  const [showAddressEditor, setShowAddressEditor] = useState(false);
  const [addressForm, setAddressForm] = useState({
    houseFlat: '',
    streetArea: '',
    villageWard: '',
    mandalTaluk: '',
    landmark: '',
    city: '',
    district: '',
    state: '',
    pinCode: ''
  });

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [confirmRevokeModal, setConfirmRevokeModal] = useState(false);

  const fetchEmergencyProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const url = patientId ? `/api/patient/emergency-qr?patientId=${patientId}` : '/api/patient/emergency-qr';
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch emergency QR profile');

      setData(json);
      if (json.profile) {
        setSettings({
          shareName: json.profile.shareName,
          sharePatientCode: json.profile.sharePatientCode !== false,
          shareDob: json.profile.shareDob !== false,
          sharePhone: json.profile.sharePhone,
          shareEmergencyContact: json.profile.shareEmergencyContact,
          shareBloodGroup: json.profile.shareBloodGroup,
          shareAllergies: json.profile.shareAllergies,
          shareConditions: json.profile.shareConditions,
          shareAddress: json.profile.shareAddress,
          shareEmergencyNote: json.profile.shareEmergencyNote,
          emergencyNote: json.profile.emergencyNote || '',
          emergencyContactName: json.patient?.emergencyContactName || '',
          emergencyContactRelation: json.patient?.emergencyContactRelation || '',
          emergencyContactPhone: json.patient?.emergencyContactPhone || ''
        });
      }

      if (json.patient) {
        setAddressForm({
          houseFlat: json.patient.houseFlat || '',
          streetArea: json.patient.streetArea || '',
          villageWard: json.patient.villageWard || '',
          mandalTaluk: json.patient.mandalTaluk || '',
          landmark: json.patient.landmark || '',
          city: json.patient.city || '',
          district: json.patient.district || '',
          state: json.patient.state || '',
          pinCode: json.patient.pinCode || ''
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error loading Emergency QR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyProfile();
  }, [patientId]);

  const handleCopyUrl = () => {
    if (data?.emergencyUrl) {
      navigator.clipboard.writeText(data.emergencyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadPng = () => {
    if (!data?.qrDataUrl) return;
    const link = document.createElement('a');
    link.href = data.qrDataUrl;
    link.download = `NexoMedico_EmergencyQR_${data.profile?.shortId || 'Patient'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSavePrivacySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setSuccessMessage('');
    setError('');
    try {
      const res = await fetch('/api/patient/emergency-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_privacy',
          settings,
          patientId
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update privacy controls');

      setData((prev: any) => ({
        ...prev,
        profile: json.profile,
        domainConfig: json.domainConfig,
        emergencyUrl: json.emergencyUrl,
        qrDataUrl: json.qrDataUrl,
        patient: json.patient || prev.patient
      }));
      setSuccessMessage('Emergency privacy controls and emergency contacts successfully updated in PostgreSQL database.');
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setSuccessMessage('');
    setError('');
    try {
      const res = await fetch('/api/patient/emergency-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_address',
          settings: {
            ...settings,
            ...addressForm
          },
          patientId
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update address');

      setData((prev: any) => ({
        ...prev,
        profile: json.profile,
        emergencyUrl: json.emergencyUrl,
        qrDataUrl: json.qrDataUrl,
        patient: json.patient || prev.patient
      }));
      setShowAddressEditor(false);
      setSuccessMessage('Residential address successfully updated and stored in database.');
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!confirm('Regenerate QR ID? This will immediately revoke your old physical QR stickers or cards. Anyone scanning the old QR will receive an invalid token message.')) {
      return;
    }
    setActionLoading(true);
    setSuccessMessage('');
    setError('');
    try {
      const res = await fetch('/api/patient/emergency-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate_token',
          patientId,
          reason: 'Patient self-service token regeneration'
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to regenerate QR token');

      setData((prev: any) => ({
        ...prev,
        profile: json.profile,
        domainConfig: json.domainConfig,
        emergencyUrl: json.emergencyUrl,
        qrDataUrl: json.qrDataUrl,
        qrSvg: json.qrSvg
      }));
      setSuccessMessage('Brand new Emergency QR ID generated! Your previous physical QR sticker has been revoked.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate token');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeToken = async () => {
    setActionLoading(true);
    setSuccessMessage('');
    setError('');
    try {
      const res = await fetch('/api/patient/emergency-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_token',
          patientId,
          reason: 'Patient self-service QR revocation'
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to revoke QR code');

      setData((prev: any) => ({
        ...prev,
        profile: json.profile,
        domainConfig: json.domainConfig
      }));
      setConfirmRevokeModal(false);
      setSuccessMessage('Emergency QR ID is now revoked. Scanners will receive a revoked alert.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to revoke token');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshDomain = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/patient/emergency-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_domain', patientId })
      });
      const json = await res.json();
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          emergencyUrl: json.emergencyUrl,
          qrDataUrl: json.qrDataUrl,
          qrSvg: json.qrSvg,
          domainConfig: json.domainConfig
        }));
        setSuccessMessage('QR code destination updated with currently configured application URL.');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (e) {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[350px]">
        <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-600">Loading your Emergency QR ID profile...</p>
      </div>
    );
  }

  const isRevoked = data?.profile?.status === 'REVOKED';
  const isLocalhost = Boolean(data?.domainConfig?.isLocalhost);
  const isProduction = Boolean(data?.domainConfig?.isProductionDomain);

  return (
    <div className="space-y-6">
      {/* Feedback Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ---------------- DOMAIN CONFIGURATION STATUS BANNER ---------------- */}
      {isLocalhost ? (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 text-amber-950 space-y-2 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-200/80 rounded-xl text-amber-900">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 block">
                ENVIRONMENT CONFIGURATION WARNING
              </span>
              <h4 className="text-sm font-black text-amber-950">
                Development-Only QR Code (Localhost Destination)
              </h4>
            </div>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            This QR code currently points to <strong>{data?.emergencyUrl}</strong>. It functions properly when testing in this browser, but <strong>CANNOT be scanned from external smartphone cameras</strong> because local computer network addresses are unreachable over the internet.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold text-slate-700 bg-white/90 px-3 py-1.5 rounded-xl border border-amber-300 font-mono">
              Production Setup: Set NEXT_PUBLIC_APP_URL=https://your-domain.com in .env.local
            </span>
            <button
              type="button"
              onClick={handleRefreshDomain}
              disabled={actionLoading}
              className="text-xs font-extrabold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-check App Base URL
            </button>
          </div>
        </div>
      ) : isProduction ? (
        <div className="bg-emerald-50 border border-emerald-300 rounded-3xl p-4 text-emerald-950 flex items-center gap-3 shadow-xs">
          <div className="p-2 bg-emerald-200/80 rounded-xl text-emerald-900 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
              PRODUCTION EMERGENCY QR VERIFIED
            </span>
            <p className="text-xs text-emerald-950 font-bold">
              Connected to live public HTTPS domain: <span className="font-mono underline">{data?.domainConfig?.baseUrl}</span>. Scannable by any smartphone worldwide.
            </p>
          </div>
        </div>
      ) : null}

      {/* ---------------- 1. EMERGENCY QR HERO OVERVIEW ---------------- */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/60 relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* QR Code Presentation Box */}
          <div className="md:col-span-4 flex flex-col items-center justify-center bg-white p-6 rounded-3xl shadow-2xl text-slate-900">
            <div className="text-center mb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                NEXO MEDICO AI • EMERGENCY ID
              </span>
              <span className="text-xs font-black text-indigo-950 font-mono">
                {data?.profile?.shortId || 'EMG-XXXX-XXXX'}
              </span>
            </div>

            {isRevoked ? (
              <div className="w-52 h-52 bg-rose-50 border-2 border-dashed border-rose-300 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                <Ban className="w-10 h-10 text-rose-500 mb-2" />
                <span className="text-xs font-black text-rose-700">QR ID REVOKED</span>
                <span className="text-[10px] text-rose-600 mt-1">This sticker is currently disabled</span>
              </div>
            ) : (
              <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-inner relative">
                {data?.qrDataUrl ? (
                  <img
                    src={data.qrDataUrl}
                    alt="Emergency Medical QR Code"
                    className="w-52 h-52 object-contain"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-slate-400">
                    <QrCode className="w-12 h-12" />
                  </div>
                )}
                {isLocalhost && (
                  <div className="absolute bottom-3 left-3 right-3 bg-amber-500 text-slate-950 text-[9px] font-black uppercase py-0.5 px-1.5 rounded text-center shadow-md">
                    DEV SIMULATION (LOCALHOST)
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 text-center">
              <span className="text-[10px] font-bold text-slate-700 block">
                {isLocalhost ? 'Local simulation mode' : 'Scan with any smartphone camera'}
              </span>
              <span className="text-[9px] text-slate-500">
                Opens public mobile profile with 112 emergency helpline
              </span>
            </div>
          </div>

          {/* Identity & Status Details */}
          <div className="md:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {isRevoked ? (
                <span className="text-xs font-black bg-rose-600 text-white px-3 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-sm">
                  <Ban className="w-3.5 h-3.5" /> REVOKED / INACTIVE
                </span>
              ) : (
                <span className="text-xs font-black bg-emerald-500 text-slate-950 px-3 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse"></span>
                  ACTIVE EMERGENCY ID
                </span>
              )}
              <span className="text-xs font-mono font-bold bg-slate-800/80 text-cyan-300 px-3 py-1 rounded-full border border-slate-700">
                Short ID: {data?.profile?.shortId}
              </span>
              <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-300 px-3 py-1 rounded-full border border-indigo-800">
                UID: {data?.patient?.patientCode}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Scanned {data?.profile?.viewCount || 0} times
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {data?.patient?.fullName}
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed max-w-xl">
                Print this Emergency QR code and affix it to your motorcycle helmet, car dashboard, wallet card, or mobile back cover. In road accidents or medical emergencies, bystanders scan it to instantly view your life-saving vitals, notify your emergency guardian, and call <strong>112</strong>.
              </p>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isRevoked}
                className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" /> Download PNG Sticker
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                disabled={isRevoked}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Emergency ID Card
              </button>

              <a
                href={data?.emergencyUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-700 shadow-md transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Public Scanner Profile
              </a>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied Link!' : 'Copy Link'}
              </button>
            </div>

            {/* Token Security Action Links */}
            <div className="pt-3 border-t border-indigo-900/40 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <button
                type="button"
                onClick={handleRegenerateToken}
                disabled={actionLoading}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Regenerate QR Token (Replaces Old Sticker)
              </button>

              {!isRevoked ? (
                <button
                  type="button"
                  onClick={() => setConfirmRevokeModal(true)}
                  disabled={actionLoading}
                  className="text-rose-400 hover:text-rose-300 font-bold underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-3 h-3" /> Revoke Emergency Token
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRegenerateToken}
                  disabled={actionLoading}
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3" /> Reactivate with New QR Token
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- 2. RESIDENTIAL ADDRESS MANAGEMENT CARD ---------------- */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Residential Address in Registration Record
              </h3>
              <p className="text-xs text-slate-500">
                India standardized address components saved in PostgreSQL database.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddressEditor(!showAddressEditor)}
            className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            {showAddressEditor ? 'Cancel Editing' : 'Update Address Details'}
          </button>
        </div>

        {/* Current Formatted Address Display */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
            Stored Formatted Address
          </span>
          <p className="text-slate-900 font-semibold leading-relaxed">
            {data?.patient?.address || 'No complete address recorded.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-slate-600 border-t border-slate-200">
            <div>House/Flat: <strong className="text-slate-900">{data?.patient?.houseFlat || '—'}</strong></div>
            <div>Street: <strong className="text-slate-900">{data?.patient?.streetArea || '—'}</strong></div>
            <div>Village/Ward: <strong className="text-slate-900">{data?.patient?.villageWard || '—'}</strong></div>
            <div>Mandal/Taluk: <strong className="text-slate-900">{data?.patient?.mandalTaluk || '—'}</strong></div>
            <div>City: <strong className="text-slate-900">{data?.patient?.city || '—'}</strong></div>
            <div>District: <strong className="text-slate-900">{data?.patient?.district || '—'}</strong></div>
            <div>State: <strong className="text-slate-900">{data?.patient?.state || '—'}</strong></div>
            <div>PIN Code: <strong className="text-slate-900">{data?.patient?.pinCode || '—'}</strong></div>
          </div>
        </div>

        {/* Inline Address Editor Form */}
        {showAddressEditor && (
          <form onSubmit={handleSaveAddress} className="p-5 bg-slate-50 border border-cyan-200 rounded-2xl space-y-4 text-xs">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider text-cyan-800">
              Edit Address Components (Stored to PostgreSQL)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700">House / Flat / Door Number</label>
                <input
                  type="text"
                  value={addressForm.houseFlat}
                  onChange={(e) => setAddressForm(f => ({ ...f, houseFlat: e.target.value }))}
                  className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">Building / Street / Area</label>
                <input
                  type="text"
                  value={addressForm.streetArea}
                  onChange={(e) => setAddressForm(f => ({ ...f, streetArea: e.target.value }))}
                  className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">Village / Ward / Locality</label>
                <input
                  type="text"
                  value={addressForm.villageWard}
                  onChange={(e) => setAddressForm(f => ({ ...f, villageWard: e.target.value }))}
                  placeholder="e.g. Rampur Village"
                  className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">Mandal / Taluk / Tehsil</label>
                <input
                  type="text"
                  value={addressForm.mandalTaluk}
                  onChange={(e) => setAddressForm(f => ({ ...f, mandalTaluk: e.target.value }))}
                  placeholder="e.g. Geesugonda Mandal"
                  className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">Landmark</label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm(f => ({ ...f, landmark: e.target.value }))}
                  placeholder="e.g. Near Metro Pillar 14"
                  className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">City / Town / Village</label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm(f => ({ ...f, city: e.target.value }))}
                  className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">District</label>
                <input
                  type="text"
                  value={addressForm.district}
                  onChange={(e) => setAddressForm(f => ({ ...f, district: e.target.value }))}
                  className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">State / Union Territory</label>
                <input
                  type="text"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm(f => ({ ...f, state: e.target.value }))}
                  className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700">PIN Code (6 Digits)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={addressForm.pinCode}
                  onChange={(e) => setAddressForm(f => ({ ...f, pinCode: e.target.value.replace(/\D/g, '') }))}
                  className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddressEditor(false)}
                className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="py-2.5 px-5 bg-cyan-700 hover:bg-cyan-800 text-white font-extrabold rounded-xl shadow-md flex items-center gap-2"
              >
                {actionLoading ? 'Saving...' : 'Save Address to Database'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ---------------- 3. PATIENT-CONTROLLED PRIVACY SETTINGS ---------------- */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-black text-slate-900">
              Emergency Privacy & Public Information Controls
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
            You have full sovereignty over what a bystander or first responder sees when scanning your physical QR code. Sensitive identifiers like your complete home address and registered personal phone remain strictly hidden by default unless you explicitly opt to share them.
          </p>
        </div>

        <form onSubmit={handleSavePrivacySettings} className="space-y-6 text-xs">
          {/* Privacy Toggles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Share Name */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.shareName}
                onChange={(e) => setSettings(s => ({ ...s, shareName: e.target.checked }))}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Display Registered Name</span>
                <span className="text-[11px] text-slate-500">
                  Shows your registered name ({data?.patient?.fullName}) to emergency responders.
                </span>
              </div>
            </label>

            {/* Share Patient Code (Universal ID) */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.sharePatientCode}
                onChange={(e) => setSettings(s => ({ ...s, sharePatientCode: e.target.checked }))}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Display Universal Patient ID</span>
                <span className="text-[11px] text-slate-500">
                  Displays your hospital registry code ({data?.patient?.patientCode}) for quick hospital lookup.
                </span>
              </div>
            </label>

            {/* Share Age / DOB */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.shareDob}
                onChange={(e) => setSettings(s => ({ ...s, shareDob: e.target.checked }))}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Display Age & Date of Birth</span>
                <span className="text-[11px] text-slate-500">
                  Allows paramedics to assess pediatric/geriatric medication dosages.
                </span>
              </div>
            </label>

            {/* Share Primary Phone */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.sharePhone}
                onChange={(e) => setSettings(s => ({ ...s, sharePhone: e.target.checked }))}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Share Patient Mobile Phone</span>
                <span className="text-[11px] text-slate-500">
                  Allows direct click-to-call to your primary phone ({data?.patient?.phone}). Disabled by default.
                </span>
              </div>
            </label>

            {/* Share Emergency Contact */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.shareEmergencyContact}
                onChange={(e) => setSettings(s => ({ ...s, shareEmergencyContact: e.target.checked }))}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Share Primary Emergency Contact</span>
                <span className="text-[11px] text-slate-500">
                  Displays family guardian name & phone with 1-tap call button (Recommended).
                </span>
              </div>
            </label>

            {/* Share Blood Group */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.shareBloodGroup}
                onChange={(e) => setSettings(s => ({ ...s, shareBloodGroup: e.target.checked }))}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Share Blood Group</span>
                <span className="text-[11px] text-slate-500">
                  Crucial for immediate transfusion during trauma ({data?.patient?.bloodGroup || 'O+'}).
                </span>
              </div>
            </label>

            {/* Share Allergies */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.shareAllergies}
                onChange={(e) => setSettings(s => ({ ...s, shareAllergies: e.target.checked }))}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Share Known Allergies</span>
                <span className="text-[11px] text-slate-500">
                  Alerts on-scene paramedics against fatal drug interactions (e.g. Penicillin).
                </span>
              </div>
            </label>

            {/* Share Chronic Conditions */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={settings.shareConditions}
                onChange={(e) => setSettings(s => ({ ...s, shareConditions: e.target.checked }))}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">Share Pre-Existing Conditions</span>
                <span className="text-[11px] text-slate-500">
                  e.g. Epilepsy, Diabetes, Heart Disease, Asthma.
                </span>
              </div>
            </label>

            {/* Share Home Address */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 cursor-pointer transition-colors sm:col-span-2">
              <input
                type="checkbox"
                checked={settings.shareAddress}
                onChange={(e) => setSettings(s => ({ ...s, shareAddress: e.target.checked }))}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
              />
              <div>
                <span className="font-bold text-rose-950 block flex items-center gap-2">
                  Share Complete Residential Address <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded font-black">OPT-IN ONLY</span>
                </span>
                <span className="text-[11px] text-rose-800">
                  Anyone who scans your public QR sticker will be able to see your complete residential address and open it in Google Maps. Kept disabled by default for privacy.
                </span>
              </div>
            </label>
          </div>

          {/* Emergency Note Field */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Custom Emergency Instructions / Note
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.shareEmergencyNote}
                  onChange={(e) => setSettings(s => ({ ...s, shareEmergencyNote: e.target.checked }))}
                  className="rounded text-indigo-600"
                />
                <span className="text-[11px] font-semibold text-slate-600">Enable in Public Profile</span>
              </label>
            </div>
            <textarea
              rows={2}
              maxLength={300}
              value={settings.emergencyNote}
              onChange={(e) => setSettings(s => ({ ...s, emergencyNote: e.target.value }))}
              placeholder="e.g. Asthmatic inhaler in right backpack pocket. Please notify Dr. Gupta immediately."
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 block text-right">
              {settings.emergencyNote.length}/300 characters
            </span>
          </div>

          {/* Editable Emergency Contact Information */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600" /> Update Emergency Contact Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700">Contact Person Name</label>
                <input
                  type="text"
                  value={settings.emergencyContactName}
                  onChange={(e) => setSettings(s => ({ ...s, emergencyContactName: e.target.value }))}
                  placeholder="e.g. Sunita Sharma"
                  className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Relationship</label>
                <input
                  type="text"
                  value={settings.emergencyContactRelation}
                  onChange={(e) => setSettings(s => ({ ...s, emergencyContactRelation: e.target.value }))}
                  placeholder="e.g. Spouse / Parent"
                  className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Contact Phone Number</label>
                <input
                  type="tel"
                  value={settings.emergencyContactPhone}
                  onChange={(e) => setSettings(s => ({ ...s, emergencyContactPhone: e.target.value }))}
                  placeholder="e.g. +91 98111 22334"
                  className="mt-1 w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {actionLoading ? 'Saving Settings...' : 'Save Privacy Controls'}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* ---------------- 4. PRINT EMERGENCY ID CARD MODAL ---------------- */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-slate-900">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Print Emergency ID Card & Sticker</h3>
                <p className="text-xs text-slate-500">Standard wallet card & helmet sticker template</p>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printable Card Preview Box */}
            <div
              id="printable-card"
              className="border-2 border-slate-900 rounded-2xl p-5 bg-white shadow-md space-y-3 relative overflow-hidden"
            >
              {isLocalhost && (
                <div className="bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold p-1 rounded text-center mb-1">
                  ⚠️ LOCAL DEVELOPMENT SIMULATION — NOT REACHABLE EXTERNALLY
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-rose-600" />
                  <span className="font-black text-xs tracking-tight text-slate-900">
                    NEXO MEDICO AI • EMERGENCY ID
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                  {data?.profile?.shortId}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-2 border border-slate-300 rounded-xl shrink-0">
                  {data?.qrDataUrl && (
                    <img src={data.qrDataUrl} alt="QR Code" className="w-28 h-28 object-contain" />
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-black text-sm text-slate-900">
                    {settings.shareName ? data?.patient?.fullName : 'Confidential Profile'}
                  </div>
                  {settings.shareBloodGroup && (
                    <div className="font-extrabold text-rose-600 text-xs">
                      Blood Group: {data?.patient?.bloodGroup || 'O+'}
                    </div>
                  )}
                  {settings.shareEmergencyContact && (
                    <div className="text-[11px] text-slate-700">
                      Emergency: <span className="font-bold">{settings.emergencyContactPhone || data?.patient?.phone}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 pt-1">
                    Scan with any phone camera to access full emergency profile & call 112.
                  </div>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl text-center text-[10px] font-bold text-rose-700">
                🚨 In medical emergency: Dial 112 (India National Helpline)
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 5. CONFIRM REVOCATION MODAL ---------------- */}
      {confirmRevokeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Revoke Emergency QR Code?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to revoke this QR ID ({data?.profile?.shortId})?
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs text-rose-800 leading-relaxed">
              Anyone who scans your physical sticker will receive a <strong>Revoked Token</strong> alert. You can re-activate or generate a new QR token at any time from this dashboard.
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setConfirmRevokeModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeToken}
                disabled={actionLoading}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                {actionLoading ? 'Revoking...' : 'Yes, Revoke QR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
