'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, QrCode, Share2, Printer, CheckCircle2, AlertTriangle, Phone, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { PatientEmergencyData } from '@/lib/emergencyQr';

interface PatientEmergencyQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientData?: PatientEmergencyData;
}

export function PatientEmergencyQrModal({
  isOpen,
  onClose,
  patientData: initialPatientData
}: PatientEmergencyQrModalProps) {
  const [shareMsg, setShareMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchQrProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/patient/emergency-qr', { cache: 'no-store' });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setError('Please sign in with a patient account to access your Emergency Health QR Passport.');
          } else {
            const data = await res.json().catch(() => ({}));
            setError(data.error || 'Failed to load Emergency QR Passport.');
          }
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setProfile(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to connect to emergency QR service.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchQrProfile();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentQrImage = profile?.qrDataUrl || profile?.qrImageUrl || '';
  const currentPublicUrl = profile?.emergencyUrl || profile?.publicUrl || '';
  const patient = profile?.patient;
  const domainConfig = profile?.domainConfig;

  const fullName = patient?.fullName || patient?.name || initialPatientData?.fullName || 'Registered Patient';
  const patientId = patient?.patientCode || initialPatientData?.patientId || '';
  const bloodGroup = patient?.bloodGroup || initialPatientData?.bloodGroup || 'Not Specified';
  const allergies = patient?.allergies || initialPatientData?.allergies || 'No Known Drug Allergies (NKDA)';
  const emergencyContactName = patient?.emergencyContactName || initialPatientData?.emergencyContactName || 'None Listed';
  const emergencyContactPhone = patient?.emergencyContactPhone || initialPatientData?.emergencyContactPhone || '';

  const handleShare = async () => {
    const shareText = `🚨 NEXO MEDICO EMERGENCY HEALTH QR - ${fullName}
Universal ID: ${patientId}
Blood Group: ${bloodGroup}
Emergency Contact: ${emergencyContactName} ${emergencyContactPhone ? `(${emergencyContactPhone})` : ''}
Allergies: ${allergies}
Emergency URL: ${currentPublicUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Emergency Health QR - ${fullName}`,
          text: shareText,
          url: currentPublicUrl || window.location.origin
        });
        setShareMsg('Shared successfully!');
        setTimeout(() => setShareMsg(''), 3000);
      } catch (err) {
        copyToClipboard(shareText);
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShareMsg('Emergency QR details copied to clipboard!');
    setTimeout(() => {
      setShareMsg('');
    }, 3000);
  };

  const handlePrintOnlyQr = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* PRINT-ONLY CSS ISOLATION BLOCK */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-card, #printable-qr-card * {
            visibility: visible !important;
          }
          #printable-qr-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 20px !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative text-white space-y-4 select-none max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="no-print absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="no-print flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-3 bg-gradient-to-tr from-rose-500 to-red-600 rounded-2xl shadow-lg shadow-rose-500/20">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Emergency Health QR Passport</span>
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full font-mono uppercase">Camera Scannable</span>
            </h3>
            <p className="text-xs text-slate-400">
              Verified emergency health passport powered by Nexo Medico AI.
            </p>
          </div>
        </div>

        {loading && (
          <div className="p-8 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-bold">Loading your Emergency QR Record from PostgreSQL...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-950/70 border border-rose-800 rounded-2xl text-rose-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertTriangle className="w-4 h-4" />
              <span>Emergency Passport Notice</span>
            </div>
            <p>{error}</p>
            <div className="pt-2 flex gap-2">
              <Link
                href="/login"
                onClick={onClose}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5"
              >
                Sign In as Patient
              </Link>
            </div>
          </div>
        )}

        {shareMsg && (
          <div className="no-print p-3 bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{shareMsg}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {domainConfig?.isLocalhost && (
              <div className="no-print p-2.5 bg-amber-950/80 border border-amber-800 rounded-xl text-amber-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Localhost QR: Scan works within your local machine. Deploy or set NEXT_PUBLIC_APP_URL for internet smartphone cameras.</span>
              </div>
            )}

            {/* PRINTABLE QR CARD BOX */}
            <div id="printable-qr-card" className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block">🚨 NEXO MEDICO EMERGENCY PASSPORT</span>
                  <h4 className="text-lg font-black text-white">{fullName}</h4>
                  {patientId && (
                    <span className="text-xs text-slate-400 font-mono">UID: {patientId}</span>
                  )}
                </div>
                <span className="text-lg font-black font-mono bg-rose-950 border border-rose-800 text-rose-200 px-3 py-1 rounded-xl shadow-sm">
                  🩸 {bloodGroup}
                </span>
              </div>

              {/* QR Code Matrix Graphic */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-900 space-y-2 text-center">
                {currentQrImage ? (
                  <img
                    src={currentQrImage}
                    alt="Emergency Patient Health QR Code"
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 flex items-center justify-center rounded-lg text-slate-400 text-xs">
                    Generating QR...
                  </div>
                )}
                {patientId && (
                  <span className="text-[11px] font-black text-slate-800 font-mono uppercase tracking-wider block">
                    UNIVERSAL ID: {patientId}
                  </span>
                )}
                {currentPublicUrl && (
                  <span className="text-[10px] text-slate-500 font-mono break-all max-w-xs">
                    {currentPublicUrl}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-amber-950/80 border border-amber-800/80 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-extrabold text-amber-300 uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> Documented Allergies
                  </span>
                  <p className="font-mono font-bold text-amber-200">{allergies}</p>
                </div>

                <div className="p-2.5 bg-cyan-950/80 border border-cyan-800/80 rounded-xl space-y-0.5">
                  <span className="text-[10px] font-extrabold text-cyan-300 uppercase block">Emergency Contact</span>
                  <p className="font-bold text-white text-xs">{emergencyContactName}</p>
                  {emergencyContactPhone && (
                    <p className="font-mono text-cyan-300 font-bold text-xs">{emergencyContactPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: SHARE & PRINT ONLY QR */}
            <div className="no-print grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleShare}
                className="py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4 text-white" /> Share Emergency QR
              </button>

              <button
                type="button"
                onClick={handlePrintOnlyQr}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs rounded-xl border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4 text-slate-300" /> Print ONLY QR Card
              </button>
            </div>

            <div className="no-print pt-1 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <Link
                href="/patient/emergency-qr"
                onClick={onClose}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Full Emergency QR Dashboard & Privacy Settings</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
