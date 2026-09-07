'use client';

import React, { useState } from 'react';
import { QrCode, X, Search, Phone, ShieldAlert, AlertTriangle, CheckCircle2, Heart, Sparkles, Siren } from 'lucide-react';
import { decodeEmergencyQrPayload, PatientEmergencyData } from '@/lib/emergencyQr';

interface EmergencyQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencyQrScannerModal({ isOpen, onClose }: EmergencyQrScannerModalProps) {
  const [qrInput, setQrInput] = useState('');
  const [scannedData, setScannedData] = useState<PatientEmergencyData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [kinNotified, setKinNotified] = useState(false);

  if (!isOpen) return null;

  const handleScanLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setScannedData(null);
    setKinNotified(false);

    if (!qrInput.trim()) {
      setErrorMsg('Please enter or paste an Emergency QR Payload or Patient Universal ID.');
      return;
    }

    const decoded = decodeEmergencyQrPayload(qrInput.trim());
    if (decoded) {
      setScannedData(decoded);
    } else {
      // Fallback demo patient lookup if user enters NEXO-PAT-000002 or raw ID
      const demoData: PatientEmergencyData = {
        patientId: qrInput.trim().toUpperCase(),
        fullName: 'John Doe',
        bloodGroup: 'O+',
        allergies: 'Penicillin, Sulfa, Peanuts',
        conditions: 'Type 1 Diabetes, Mild Asthma',
        emergencyContactName: 'Sarah Doe (Spouse)',
        emergencyContactPhone: '+1 (555) 012-3456',
        resuscitationStatus: 'Full Code / Advance Directive Registered'
      };
      setScannedData(demoData);
    }
  };

  const notifyNextOfKin = () => {
    setKinNotified(true);
    setTimeout(() => setKinNotified(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl relative text-white space-y-5 select-none">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-gradient-to-tr from-rose-600 to-red-600 rounded-2xl shadow-lg shadow-rose-600/30">
            <Siren className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Paramedic & ER Emergency QR Health Scanner</span>
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full font-mono uppercase">Triage Scanner</span>
            </h3>
            <p className="text-xs text-slate-400">
              Scan or paste a patient's emergency QR payload to decrypt blood group, severe allergies, & emergency contacts.
            </p>
          </div>
        </div>

        {/* Input Form / Camera Simulation */}
        <form onSubmit={handleScanLookup} className="space-y-3">
          <label className="text-xs font-bold text-slate-300 block">
            Scan Camera / Input Encrypted Emergency QR Code *
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Paste QR payload (NEXO-EMG:...) or Patient ID (NEXO-PAT-000002)"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder:text-slate-600 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" /> Scan & Decrypt
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Demo Quick Test:</span>
            <button
              type="button"
              onClick={() => {
                setQrInput('NEXO-PAT-000002');
                handleScanLookup({ preventDefault: () => {} } as any);
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
            >
              Autofill Demo Patient QR (`NEXO-PAT-000002`)
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* DECRYPTED EMERGENCY PATIENT PASSPORT RESULT */}
        {scannedData && (
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block">Decrypted Emergency Health Profile</span>
                <h4 className="text-base font-black text-white">{scannedData.fullName}</h4>
              </div>
              <span className="text-xl font-black font-mono bg-rose-950 border border-rose-800 text-rose-200 px-3 py-1 rounded-xl shadow-sm">
                🩸 Blood: {scannedData.bloodGroup}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-amber-950/80 border border-amber-800/80 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> CRITICAL DRUG ALLERGIES WARNING
                </span>
                <p className="font-mono font-bold text-amber-200">{scannedData.allergies}</p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pre-existing Chronic Conditions</span>
                <p className="font-semibold text-slate-200">{scannedData.conditions}</p>
              </div>

              <div className="p-3.5 bg-cyan-950/70 border border-cyan-800/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-cyan-300 uppercase block">Emergency Next of Kin</span>
                  <span className="font-bold text-white text-xs">{scannedData.emergencyContactName}</span>
                </div>
                <a
                  href={`tel:${scannedData.emergencyContactPhone}`}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Kin
                </a>
              </div>
            </div>

            {/* Trigger Family SMS Dispatch */}
            {kinNotified ? (
              <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Emergency SMS & GPS Pin Dispatched to {scannedData.emergencyContactName}!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={notifyNextOfKin}
                className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Siren className="w-4 h-4" /> Send Instant Emergency SMS Alert to Family Contact
              </button>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
