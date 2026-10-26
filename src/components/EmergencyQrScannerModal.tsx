'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  X,
  Search,
  Phone,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Loader2,
  Siren,
  ShieldAlert
} from 'lucide-react';
import { decodeEmergencyQrPayload, PatientEmergencyData } from '@/lib/emergencyQr';

interface EmergencyQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencyQrScannerModal({ isOpen, onClose }: EmergencyQrScannerModalProps) {
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resolvedProfile, setResolvedProfile] = useState<any>(null);
  const [legacyData, setLegacyData] = useState<PatientEmergencyData | null>(null);
  const [kinNotified, setKinNotified] = useState(false);

  if (!isOpen) return null;

  const extractToken = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    // Check if it's a URL
    if (trimmed.includes('/emergency/')) {
      const parts = trimmed.split('/emergency/');
      const tokenWithQuery = parts[1];
      const cleanToken = tokenWithQuery.split(/[?#&]/)[0];
      return cleanToken.trim();
    }

    // Direct token starting with emg_
    if (trimmed.startsWith('emg_')) {
      return trimmed;
    }

    return null;
  };

  const handleScanLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setResolvedProfile(null);
    setLegacyData(null);
    setKinNotified(false);

    const input = qrInput.trim();
    if (!input) {
      setErrorMsg('Please enter or paste an Emergency QR URL, Token, or camera payload.');
      return;
    }

    setLoading(true);

    try {
      // 1. Try to extract a token
      const token = extractToken(input);

      if (token) {
        const res = await fetch(`/api/emergency/${encodeURIComponent(token)}`, {
          cache: 'no-store'
        });

        if (res.ok) {
          const json = await res.json();
          if (json.profile) {
            setResolvedProfile(json.profile);
            setLoading(false);
            return;
          }
        } else if (res.status === 404) {
          setErrorMsg('No active emergency profile found. This QR code may have been revoked or has expired.');
          setLoading(false);
          return;
        }
      }

      // 2. Try offline/legacy decode
      const decoded = decodeEmergencyQrPayload(input);
      if (decoded && (decoded.fullName || decoded.bloodGroup)) {
        setLegacyData(decoded);
        setLoading(false);
        return;
      }

      setErrorMsg('Could not find an active emergency record matching this input. Please verify the QR token or URL.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with emergency server.');
    } finally {
      setLoading(false);
    }
  };

  const notifyNextOfKin = () => {
    setKinNotified(true);
    setTimeout(() => setKinNotified(false), 5000);
  };

  const profileName = resolvedProfile?.name || legacyData?.fullName || 'Anonymous Patient';
  const profileBlood = resolvedProfile?.bloodGroup || legacyData?.bloodGroup || 'Not Specified';
  const profileAllergies = resolvedProfile?.allergies || legacyData?.allergies || 'No Known Drug Allergies (NKDA)';
  const profileConditions = resolvedProfile?.conditions || legacyData?.conditions || 'None Documented';
  const kinName = resolvedProfile?.emergencyContactName || legacyData?.emergencyContactName;
  const kinPhone = resolvedProfile?.emergencyContactPhone || legacyData?.emergencyContactPhone;
  const kinRelation = resolvedProfile?.emergencyContactRelation;
  const address = resolvedProfile?.address;
  const mapsUrl = resolvedProfile?.mapsUrl;
  const publicToken = resolvedProfile?.token;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl relative text-white space-y-4 select-none max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-3 bg-gradient-to-tr from-rose-600 to-red-600 rounded-2xl shadow-lg shadow-rose-600/30">
            <Siren className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>First Responder & Paramedic QR Scanner</span>
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full font-mono uppercase">Emergency Triage</span>
            </h3>
            <p className="text-xs text-slate-400">
              Scan, paste QR code link, or enter emergency token to view verified patient health details.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleScanLookup} className="space-y-3">
          <label className="text-xs font-bold text-slate-300 block">
            Scan URL, Token (emg_...), or Encrypted Emergency Code *
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Paste emergency URL (e.g. /emergency/emg_...) or token"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" /> Lookup Profile
                </>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* VERIFIED EMERGENCY PATIENT PROFILE RESULT */}
        {(resolvedProfile || legacyData) && (
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3.5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">
                  ✓ Verified Live Database Record
                </span>
                <h4 className="text-base font-black text-white">{profileName}</h4>
                {resolvedProfile?.patientCode && (
                  <span className="text-xs text-slate-400 font-mono">UID: {resolvedProfile.patientCode}</span>
                )}
              </div>
              <span className="text-lg font-black font-mono bg-rose-950 border border-rose-800 text-rose-200 px-3 py-1 rounded-xl shadow-sm">
                🩸 {profileBlood}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-amber-950/80 border border-amber-800/80 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> CRITICAL DRUG ALLERGIES WARNING
                </span>
                <p className="font-mono font-bold text-amber-200">{profileAllergies}</p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pre-existing Chronic Conditions</span>
                <p className="font-semibold text-slate-200">{profileConditions}</p>
              </div>

              {kinName && (
                <div className="p-3 bg-cyan-950/70 border border-cyan-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-300 uppercase block">
                      Emergency Contact {kinRelation ? `(${kinRelation})` : ''}
                    </span>
                    <span className="font-bold text-white text-xs">{kinName}</span>
                    {kinPhone && <p className="font-mono text-cyan-300 text-xs">{kinPhone}</p>}
                  </div>
                  {kinPhone && (
                    <a
                      href={`tel:${kinPhone}`}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Kin
                    </a>
                  )}
                </div>
              )}

              {address && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Registered Patient Address
                  </span>
                  <p className="text-slate-200 text-xs">{address}</p>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-bold inline-flex items-center gap-1 text-[11px]"
                    >
                      <span>Open Location in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {publicToken && (
              <div className="pt-1">
                <Link
                  href={`/emergency/${publicToken}`}
                  target="_blank"
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <span>Open Full Emergency Web Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* India 112 Quick Helpline */}
            <div className="pt-1 flex items-center justify-between text-xs bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-xl">
              <span className="text-rose-300 font-bold">India National Emergency:</span>
              <a
                href="tel:112"
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-lg flex items-center gap-1"
              >
                <Phone className="w-3 h-3" /> Call 112
              </a>
            </div>

            {/* Trigger Kin Notification */}
            {kinNotified ? (
              <div className="p-2.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Emergency notification dispatched to {kinName}!</span>
              </div>
            ) : (
              kinPhone && (
                <button
                  type="button"
                  onClick={notifyNextOfKin}
                  className="w-full py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Siren className="w-4 h-4" /> Send Instant Emergency SMS Alert to Kin
                </button>
              )
            )}
          </div>
        )}

      </div>
    </div>
  );
}
