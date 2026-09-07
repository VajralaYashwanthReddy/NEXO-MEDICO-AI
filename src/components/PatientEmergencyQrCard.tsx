'use client';

import React, { useState } from 'react';
import { QrCode, ShieldAlert, Phone, Heart, Download, Printer, CheckCircle2, AlertTriangle, Sparkles, Copy } from 'lucide-react';
import { encodeEmergencyQrPayload, PatientEmergencyData } from '@/lib/emergencyQr';

interface PatientEmergencyQrCardProps {
  patientData?: PatientEmergencyData;
}

export function PatientEmergencyQrCard({
  patientData = {
    patientId: 'NEXO-PAT-000002',
    fullName: 'John Doe',
    bloodGroup: 'O+',
    allergies: 'Penicillin, Sulfa, Peanuts',
    conditions: 'Type 1 Diabetes, Mild Asthma',
    emergencyContactName: 'Sarah Doe (Spouse)',
    emergencyContactPhone: '+1 (555) 012-3456',
    resuscitationStatus: 'Full Code / Advance Directive Registered'
  }
}: PatientEmergencyQrCardProps) {
  const [copied, setCopied] = useState(false);
  const qrPayload = encodeEmergencyQrPayload(patientData);

  // Generate SVG QR matrix visually
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}`;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-6 select-none relative overflow-hidden">
      
      {/* Background Accent */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Universal Encrypted Emergency Health QR Passport</span>
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded-full font-mono uppercase">24/7 First Responder Access</span>
            </h3>
            <p className="text-xs text-slate-400">
              Scannable by paramedics & ER staff in accidents to view blood type, critical allergies, & emergency contacts instantly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintCard}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Wallet Emergency Card
          </button>
        </div>
      </div>

      {/* Main Grid: QR Image & Patient Emergency Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Scannable QR Graphic */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl border border-slate-200 space-y-2 text-center text-slate-900">
          <div className="relative group">
            <img
              src={qrCodeUrl}
              alt="Emergency Patient Health QR Code"
              className="w-48 h-48 object-contain rounded-lg"
            />
          </div>
          <div className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" /> Universal ID: <span className="font-mono text-cyan-700">{patientData.patientId}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyPayload}
            className="text-[10px] text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1"
          >
            <Copy className="w-3 h-3" /> {copied ? 'QR Payload Copied!' : 'Copy Raw Emergency QR Code'}
          </button>
        </div>

        {/* Emergency Triage Info Badges */}
        <div className="md:col-span-2 space-y-4 text-xs">
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            
            {/* Blood Group */}
            <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-2xl text-center space-y-0.5 shadow-sm">
              <span className="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider block">Blood Group</span>
              <span className="text-2xl font-black font-mono text-rose-200 block">{patientData.bloodGroup}</span>
              <span className="text-[9px] text-rose-300 font-medium">Emergency Transfusion</span>
            </div>

            {/* Emergency Contact */}
            <div className="p-3 bg-cyan-950/70 border border-cyan-800/80 rounded-2xl space-y-1 col-span-2 sm:col-span-2">
              <span className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider block">Primary Emergency Contact</span>
              <span className="text-xs font-black text-white block">{patientData.emergencyContactName}</span>
              <a
                href={`tel:${patientData.emergencyContactPhone}`}
                className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-200 font-mono font-bold text-xs underline mt-0.5"
              >
                <Phone className="w-3.5 h-3.5" /> {patientData.emergencyContactPhone} (1-Click Dial)
              </a>
            </div>

          </div>

          {/* Critical Allergies Warning */}
          <div className="p-3.5 bg-amber-950/70 border border-amber-800/80 rounded-2xl space-y-1">
            <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Documented Severe Drug Allergies
            </span>
            <p className="text-xs font-bold text-amber-200 font-mono">{patientData.allergies || 'No Known Drug Allergies (NKDA)'}</p>
          </div>

          {/* Chronic Pre-existing Conditions */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Chronic Pre-existing Conditions</span>
            <p className="text-xs font-semibold text-slate-200">{patientData.conditions || 'None Documented'}</p>
          </div>

          {/* Resuscitation Status */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-slate-300">
            <span className="text-[11px] font-bold text-slate-400">Resuscitation Status:</span>
            <span className="text-xs font-black text-cyan-300 font-mono">{patientData.resuscitationStatus}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
