'use client';

import React, { useState } from 'react';
import { X, QrCode, Share2, Printer, CheckCircle2, AlertTriangle, Phone, Sparkles, Copy } from 'lucide-react';
import { encodeEmergencyQrPayload, PatientEmergencyData } from '@/lib/emergencyQr';

interface PatientEmergencyQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientData?: PatientEmergencyData;
}

export function PatientEmergencyQrModal({
  isOpen,
  onClose,
  patientData = {
    patientId: 'NEXO-PAT-000002',
    fullName: 'John Doe',
    bloodGroup: 'O+',
    phone: '+1 (555) 012-3456',
    allergies: 'Penicillin, Sulfa, Peanuts',
    conditions: 'Type 1 Diabetes, Mild Asthma',
    emergencyContactName: 'Sarah Doe (Spouse)',
    emergencyContactPhone: '+1 (555) 012-3456',
    resuscitationStatus: 'Full Code / Advance Directive Registered'
  }
}: PatientEmergencyQrModalProps) {
  const [shareMsg, setShareMsg] = useState('');
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!isOpen) return null;

  const qrPayload = encodeEmergencyQrPayload(patientData);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Emergency Health QR - ${patientData.fullName}`,
          text: qrPayload,
          url: 'https://nexo-medico-ai.vercel.app/login'
        });
        setShareMsg('Shared successfully!');
        setTimeout(() => setShareMsg(''), 3000);
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrPayload);
    setShareMsg('Emergency QR details copied to clipboard!');
    setCopiedPayload(true);
    setTimeout(() => {
      setShareMsg('');
      setCopiedPayload(false);
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

      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative text-white space-y-5 select-none">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="no-print absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="no-print flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-gradient-to-tr from-rose-500 to-red-600 rounded-2xl shadow-lg shadow-rose-500/20">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Emergency Health QR Passport</span>
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full font-mono uppercase">Camera Scannable</span>
            </h3>
            <p className="text-xs text-slate-400">
              Human-readable details for smartphone cameras & paramedic scanners.
            </p>
          </div>
        </div>

        {shareMsg && (
          <div className="no-print p-3 bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{shareMsg}</span>
          </div>
        )}

        {/* PRINTABLE QR CARD BOX */}
        <div id="printable-qr-card" className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-white">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider block">🚨 NEXO MEDICO EMERGENCY PASSPORT</span>
              <h4 className="text-lg font-black text-white">{patientData.fullName}</h4>
              <span className="text-xs text-slate-400 font-mono">ID: {patientData.patientId}</span>
            </div>
            <span className="text-xl font-black font-mono bg-rose-950 border border-rose-800 text-rose-200 px-3 py-1 rounded-xl shadow-sm">
              🩸 {patientData.bloodGroup}
            </span>
          </div>

          {/* QR Code Matrix Graphic */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl border border-slate-200 text-slate-900 space-y-2 text-center">
            <img
              src={qrCodeUrl}
              alt="Emergency Patient Health QR Code"
              className="w-52 h-52 object-contain rounded-lg"
            />
            <span className="text-[11px] font-black text-slate-800 font-mono uppercase tracking-wider block">
              UNIVERSAL ID: {patientData.patientId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-amber-950/80 border border-amber-800/80 rounded-xl space-y-0.5">
              <span className="text-[10px] font-extrabold text-amber-300 uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" /> Documented Allergies
              </span>
              <p className="font-mono font-bold text-amber-200">{patientData.allergies}</p>
            </div>

            <div className="p-2.5 bg-cyan-950/80 border border-cyan-800/80 rounded-xl space-y-0.5">
              <span className="text-[10px] font-extrabold text-cyan-300 uppercase block">Emergency Contact</span>
              <p className="font-bold text-white text-xs">{patientData.emergencyContactName}</p>
              <p className="font-mono text-cyan-300 font-bold text-xs">{patientData.emergencyContactPhone}</p>
            </div>
          </div>

        </div>

        {/* Action Buttons: SHARE & PRINT ONLY QR */}
        <div className="no-print grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleShare}
            className="py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Share2 className="w-4 h-4 text-white" /> Share Emergency QR
          </button>

          <button
            type="button"
            onClick={handlePrintOnlyQr}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs rounded-xl border border-slate-700 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-300" /> Print ONLY QR Card
          </button>
        </div>

      </div>
    </div>
  );
}
