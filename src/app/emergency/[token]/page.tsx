import React from 'react';
import { Metadata } from 'next';
import { resolvePublicEmergencyProfile } from '@/lib/emergencyQrService';
import { PrintEmergencyProfileButton } from '@/components/PrintEmergencyProfileButton';
import {
  ShieldAlert,
  PhoneCall,
  HeartPulse,
  AlertTriangle,
  User,
  MapPin,
  Clock,
  ShieldCheck,
  Lock,
  Info,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Calendar,
  FileText
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  return {
    title: 'Emergency Medical Profile — Nexo Medico AI',
    description: 'Patient emergency contact and vital identification profile for first responders and ER personnel.',
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function PublicEmergencyProfilePage({
  params
}: {
  params: { token: string };
}) {
  const profile = await resolvePublicEmergencyProfile(params.token);

  if (!profile || profile.status === 'NOT_FOUND') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Emergency Profile Unavailable</h1>
          <p className="text-sm text-slate-400 mb-6">
            The scanned emergency QR ID does not exist, has been removed, or the link format is invalid.
          </p>

          {/* Emergency 112 Quick Call Banner */}
          <div className="bg-rose-950/80 border border-rose-800/80 rounded-2xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 font-bold text-sm">
                112
              </div>
              <div className="flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300 block">
                  India National Emergency Helpline
                </span>
                <span className="text-xs text-white">Call immediately for police, ambulance, or rescue.</span>
              </div>
            </div>
            <a
              href="tel:112"
              className="mt-3 w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-900/40"
            >
              <PhoneCall className="w-4 h-4" /> Call 112 Emergency Dispatch
            </a>
          </div>

          <div className="text-xs text-slate-500">
            Powered by <strong className="text-slate-400">Nexo Medico AI</strong> Healthcare Network
          </div>
        </div>
      </div>
    );
  }

  if (profile.status === 'REVOKED') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-md w-full bg-slate-900 border border-amber-900/60 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="inline-block bg-amber-950/80 text-amber-400 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-amber-800/60 mb-3">
            ID: {profile.shortId}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-2">Emergency QR Code Revoked</h1>
          <p className="text-sm text-slate-400 mb-6">
            This Emergency QR sticker has been revoked by the patient. The profile previously associated with this physical token is no longer available.
          </p>

          {/* Emergency 112 Quick Call Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-6 text-left">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">Need immediate medical assistance?</span>
            <a
              href="tel:112"
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-900/40"
            >
              <PhoneCall className="w-4 h-4" /> Call 112 Emergency Services
            </a>
          </div>

          <div className="text-xs text-slate-500">
            Powered by <strong className="text-slate-400">Nexo Medico AI</strong> Healthcare Network
          </div>
        </div>
      </div>
    );
  }

  const {
    shortId,
    patientCode,
    patientName,
    patientPhone,
    dob,
    age,
    gender,
    bloodGroup,
    allergies,
    conditions,
    emergencyContactName,
    emergencyContactRelation,
    emergencyContactPhone,
    homeAddress,
    mapsUrl,
    emergencyNote,
    lastUpdated,
    disclaimer,
    domainConfig
  } = profile;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-4">
        {/* Local Development Warning Banner (Shown only when in dev/localhost mode) */}
        {domainConfig?.isLocalhost && (
          <div className="bg-amber-950/90 border border-amber-600/80 rounded-2xl p-3.5 text-xs text-amber-200 space-y-1 shadow-lg">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>DEVELOPMENT SIMULATION PREVIEW (Localhost)</span>
            </div>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              This emergency page is currently running on a local development host ({domainConfig.baseUrl}).
              In production, this page is reachable by any smartphone on the internet via your public HTTPS domain.
            </p>
          </div>
        )}

        {/* 1. Header Branding & Emergency Identifier */}
        <div className="flex items-center justify-between bg-slate-900/95 border border-slate-800 px-4 py-3.5 rounded-2xl backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black tracking-tight text-white block">NEXO MEDICO AI</span>
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                Emergency Patient Profile
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              VERIFIED ACTIVE
            </span>
          </div>
        </div>

        {/* 2. India 112 Emergency Dispatch Banner */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 border border-rose-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-md">
                  INDIA HELPLINE
                </span>
                <span className="text-xs text-rose-200 font-semibold">Police • Ambulance • Fire</span>
              </div>
              <h2 className="text-xl font-black text-white">Call 112 for Immediate Dispatch</h2>
              <p className="text-[11px] text-rose-200/90 mt-0.5">
                If the patient is unconscious, critically injured, or requires urgent transport, contact 112 immediately.
              </p>
            </div>
            <a
              href="tel:112"
              className="py-3 px-5 bg-white text-rose-700 hover:bg-rose-50 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shrink-0 transition-transform active:scale-95"
            >
              <PhoneCall className="w-4 h-4 text-rose-600" /> Dial 112
            </a>
          </div>
        </div>

        {/* 3. Main Profile Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
          {/* SECTION A: Patient Identity */}
          <div className="border-b border-slate-800 pb-5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 px-2.5 py-1 rounded-md border border-slate-700">
                  QR ID: {shortId}
                </span>
                {patientCode && (
                  <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-800/60">
                    UID: {patientCode}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3 text-slate-400" /> Updated {new Date(lastUpdated).toLocaleDateString()}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Registered Patient Name
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {patientName || 'Name Confidential (Privacy Enabled)'}
              </h1>
            </div>

            {(dob || age !== undefined || gender) && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
                {age !== undefined && (
                  <span className="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 font-semibold">
                    Age: <strong>{age} Years</strong>
                  </span>
                )}
                {dob && (
                  <span className="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> DOB: {dob}
                  </span>
                )}
                {gender && (
                  <span className="bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 font-semibold">
                    Gender: <strong>{gender}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* SECTION B: Critical Medical Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-500" /> Critical Medical Vitals
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Blood Group */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center font-black text-2xl shrink-0">
                  🩸
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Blood Group
                  </span>
                  <span className="text-2xl font-black text-rose-400">
                    {bloodGroup || 'Not Shared / Unknown'}
                  </span>
                </div>
              </div>

              {/* Direct Patient Mobile (if consented) */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Patient Mobile
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    {patientPhone || 'Confidential'}
                  </span>
                </div>
                {patientPhone ? (
                  <a
                    href={`tel:${patientPhone.replace(/\s+/g, '')}`}
                    className="w-10 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95"
                    title="Call Patient Directly"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-slate-600 flex items-center justify-center shrink-0" title="Phone hidden by patient">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>

            {/* Known Allergies */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Known Drug & Food Allergies
                </span>
              </div>
              {allergies ? (
                <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs font-bold text-amber-200">
                  ⚠️ {allergies}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No documented allergies or field not permitted for public display.
                </p>
              )}
            </div>

            {/* Chronic Conditions */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                  Pre-Existing Chronic Conditions
                </span>
              </div>
              {conditions ? (
                <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-xs font-semibold text-cyan-100 leading-relaxed">
                  {conditions}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No documented chronic conditions or field not permitted for public display.
                </p>
              )}
            </div>

            {/* Custom Emergency Note */}
            {emergencyNote && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" /> Patient Emergency Note
                </span>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800 font-medium italic">
                  "{emergencyNote}"
                </p>
              </div>
            )}
          </div>

          {/* SECTION C: Emergency Contacts */}
          <div className="bg-gradient-to-br from-indigo-950/70 to-slate-950 border border-indigo-800/60 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                  Primary Emergency Contact
                </h3>
              </div>
              {emergencyContactRelation && (
                <span className="text-[10px] bg-indigo-900/80 text-indigo-200 px-2.5 py-0.5 rounded-md font-semibold border border-indigo-700/50">
                  Relationship: {emergencyContactRelation}
                </span>
              )}
            </div>

            {emergencyContactPhone ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-indigo-900/50">
                <div>
                  <span className="text-sm font-black text-white block">
                    {emergencyContactName || 'Family Emergency Guardian'}
                  </span>
                  <span className="text-xs font-mono text-cyan-300 font-bold block mt-0.5">
                    {emergencyContactPhone}
                  </span>
                </div>
                <a
                  href={`tel:${emergencyContactPhone.replace(/\s+/g, '')}`}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all shrink-0 active:scale-95"
                >
                  <PhoneCall className="w-4 h-4" /> Call Emergency Contact
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Emergency contact details have not been authorized for public emergency view.
              </p>
            )}
          </div>

          {/* SECTION D: Residential Address */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Residential Address (India)
                </h3>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline"
                >
                  <ExternalLink className="w-3 h-3" /> Open in Maps App
                </a>
              )}
            </div>

            {homeAddress ? (
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-200 font-medium leading-relaxed">
                {homeAddress}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Home address kept confidential per patient privacy preference.
              </p>
            )}
          </div>

          {/* SECTION E: Accessible Action Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href="tel:112"
              className="py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40 transition-all active:scale-95 w-full sm:flex-1"
            >
              <PhoneCall className="w-4 h-4" /> Call 112 Helpline
            </a>
            <PrintEmergencyProfileButton />
          </div>

          {/* SECTION F: Legal & Medical Disclaimer */}
          <div className="pt-3 text-[10px] text-slate-500 leading-relaxed border-t border-slate-800/80 space-y-1.5">
            <p className="flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{disclaimer}</span>
            </p>
            <p className="text-slate-500">
              Protected by Nexo Medico AI Emergency Protocol • Valid for life-saving assistance & triage only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
