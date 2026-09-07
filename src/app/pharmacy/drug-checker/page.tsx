'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Pill, Activity, FlaskConical, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { evaluateDrugSafety, PatientLabContext, DrugSafetyResult } from '@/lib/drugSafetyMatrix';

export default function DrugInteractionCheckerPage() {
  const [candidateDrug, setCandidateDrug] = useState('Metformin');
  const [eGFR, setEGFR] = useState('28');
  const [alt, setAlt] = useState('32');
  const [potassium, setPotassium] = useState('4.2');
  const [allergies, setAllergies] = useState('Penicillin, Sulfa');
  const [currentMeds, setCurrentMeds] = useState('Aspirin, Lisinopril');
  
  const [evaluationResult, setEvaluationResult] = useState<DrugSafetyResult | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();

    const labContext: PatientLabContext = {
      eGFR: parseFloat(eGFR) || 60,
      alt: parseFloat(alt) || 30,
      potassium: parseFloat(potassium) || 4.2,
      allergies: allergies.split(',').map(s => s.trim()),
      currentMedications: currentMeds.split(',').map(s => s.trim())
    };

    const res = evaluateDrugSafety(candidateDrug, labContext);
    setEvaluationResult(res);
  };

  return (
    <div className="space-y-6 max-w-4xl select-none">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-cyan-600" /> Genomic & Renal/Hepatic Drug Safety Conflict Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cross-evaluation of prescribed medications against live patient lab biomarkers, allergies, and drug interactions.
          </p>
        </div>
      </div>

      <form onSubmit={handleCheck} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-5 text-xs">
        <div className="border-b pb-3 flex items-center justify-between">
          <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 uppercase tracking-wider">
            <Pill className="w-4 h-4 text-cyan-600" /> Candidate Drug Prescribed
          </span>
          <span className="text-[11px] text-cyan-600 font-semibold">AI Automated Verification</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Prescribed Drug Name *</label>
            <input
              type="text"
              required
              value={candidateDrug}
              onChange={(e) => setCandidateDrug(e.target.value)}
              placeholder="e.g. Metformin, Lisinopril, Atorvastatin"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Patient Known Allergies</label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Penicillin, Sulfa, Aspirin"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-blue-600" /> Live Patient Lab Biomarkers (Real-Time Inputs)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border rounded-2xl">
              <label className="text-[11px] font-bold text-slate-600 block">Kidney eGFR (mL/min)</label>
              <input
                type="number"
                value={eGFR}
                onChange={(e) => setEGFR(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-black text-slate-900"
              />
              <span className="text-[10px] text-slate-400 font-medium">Normal: &gt; 60 mL/min</span>
            </div>

            <div className="p-3 bg-slate-50 border rounded-2xl">
              <label className="text-[11px] font-bold text-slate-600 block">Liver ALT (U/L)</label>
              <input
                type="number"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-black text-slate-900"
              />
              <span className="text-[10px] text-slate-400 font-medium">Normal: 7-56 U/L</span>
            </div>

            <div className="p-3 bg-slate-50 border rounded-2xl">
              <label className="text-[11px] font-bold text-slate-600 block">Serum K+ (mEq/L)</label>
              <input
                type="number"
                step="0.1"
                value={potassium}
                onChange={(e) => setPotassium(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-black text-slate-900"
              />
              <span className="text-[10px] text-slate-400 font-medium">Normal: 3.5-5.2 mEq/L</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-cyan-300" /> Run AI Drug Safety Conflict Evaluation
        </button>
      </form>

      {/* EVALUATION RESULTS CARD */}
      {evaluationResult && (
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 animate-fadeIn ${
          evaluationResult.safetyStatus === 'CONTRAINDICATED'
            ? 'bg-rose-950 border-rose-800 text-white'
            : evaluationResult.safetyStatus === 'CAUTION'
            ? 'bg-amber-950/90 border-amber-800 text-white'
            : 'bg-emerald-950 border-emerald-800 text-white'
        }`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              {evaluationResult.safetyStatus === 'CONTRAINDICATED' ? (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              ) : evaluationResult.safetyStatus === 'CAUTION' ? (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              )}
              <div>
                <h3 className="font-black text-base tracking-tight">{evaluationResult.drugName} Safety Analysis</h3>
                <span className="text-xs opacity-80 font-mono">Risk Score: {evaluationResult.riskScore}/100</span>
              </div>
            </div>

            <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border shadow-sm ${
              evaluationResult.safetyStatus === 'CONTRAINDICATED'
                ? 'bg-rose-600 border-rose-400 text-white'
                : evaluationResult.safetyStatus === 'CAUTION'
                ? 'bg-amber-600 border-amber-400 text-white'
                : 'bg-emerald-600 border-emerald-400 text-white'
            }`}>
              {evaluationResult.safetyStatus}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-semibold text-slate-200">
              <strong className="text-white">Clinical Rationale:</strong> {evaluationResult.clinicalRationale}
            </p>

            {evaluationResult.dosageAdjustment && (
              <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-200 font-bold">
                💡 Recommended Dosage Adjustment: {evaluationResult.dosageAdjustment}
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-300">Detailed Safety Findings:</span>
              {evaluationResult.warnings.map((warn, idx) => (
                <div key={idx} className="p-2.5 bg-black/30 border border-white/10 rounded-xl font-mono text-[11px]">
                  {warn}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
