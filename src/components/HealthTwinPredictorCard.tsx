'use client';

import React, { useState } from 'react';
import { Cpu, Activity, TrendingUp, AlertTriangle, ShieldCheck, Sparkles, HeartPulse, RefreshCw } from 'lucide-react';
import { generateHealthTwinPrediction, VitalsInput, HealthTwinPredictionResult } from '@/lib/healthTwinPredictor';

interface HealthTwinPredictorCardProps {
  initialVitals?: VitalsInput;
  patientName?: string;
}

export function HealthTwinPredictorCard({
  initialVitals = { heartRate: 112, sysBP: 95, diaBP: 62, spO2: 93, temperature: 38.4, respRate: 24, wbcCount: 13.8, lactate: 2.3 },
  patientName = 'Marcus Vance'
}: HealthTwinPredictorCardProps) {
  const [vitals, setVitals] = useState<VitalsInput>(initialVitals);
  const [prediction, setPrediction] = useState<HealthTwinPredictionResult>(() => generateHealthTwinPrediction(initialVitals));

  const handleRecalculate = () => {
    setPrediction(generateHealthTwinPrediction(vitals));
  };

  const isCritical = prediction.status === 'CRITICAL_DETERIORATION' || prediction.status === 'HIGH_RISK';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-6 select-none">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>Patient AI Health Twin & 24h Deterioration Forecast</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full font-mono uppercase">Live Predictive Model</span>
            </h3>
            <p className="text-xs text-slate-400">
              AI Trajectory Modeling for <span className="text-cyan-300 font-bold">{patientName}</span> predicting Sepsis, Cardiac, & Respiratory deterioration risks over 24 hours.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
            prediction.status === 'CRITICAL_DETERIORATION'
              ? 'bg-rose-950 border-rose-800 text-rose-300'
              : prediction.status === 'HIGH_RISK'
              ? 'bg-amber-950 border-amber-800 text-amber-300'
              : 'bg-emerald-950 border-emerald-800 text-emerald-300'
          }`}>
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Score: {prediction.overallScore}/100 • {prediction.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Vitals Input Adjustment Panel */}
      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1 text-cyan-400">
            <HeartPulse className="w-4 h-4" /> Live Vitals Parameters (Adjust to Sim Predictor)
          </span>
          <button
            type="button"
            onClick={handleRecalculate}
            className="text-[11px] text-cyan-400 hover:text-cyan-200 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Re-run AI Forecast
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block">Heart Rate (BPM)</label>
            <input
              type="number"
              value={vitals.heartRate}
              onChange={(e) => setVitals({ ...vitals, heartRate: parseFloat(e.target.value) || 70 })}
              className="w-full mt-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block">Systolic BP (mmHg)</label>
            <input
              type="number"
              value={vitals.sysBP}
              onChange={(e) => setVitals({ ...vitals, sysBP: parseFloat(e.target.value) || 120 })}
              className="w-full mt-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block">SpO2 Saturation (%)</label>
            <input
              type="number"
              value={vitals.spO2}
              onChange={(e) => setVitals({ ...vitals, spO2: parseFloat(e.target.value) || 98 })}
              className="w-full mt-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block">Body Temp (°C)</label>
            <input
              type="number"
              step="0.1"
              value={vitals.temperature}
              onChange={(e) => setVitals({ ...vitals, temperature: parseFloat(e.target.value) || 36.8 })}
              className="w-full mt-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
            />
          </div>
        </div>
      </div>

      {/* 24-Hour Forecast Visual Trajectory Bar Grid */}
      <div className="space-y-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-cyan-400" /> 24-Hour Predictive Trajectory Curve (+0h to +24h)
        </span>

        <div className="grid grid-cols-7 gap-2 text-center">
          {prediction.forecastTrend.map((pt, idx) => (
            <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-between space-y-2">
              <span className="text-[10px] font-bold text-slate-400">{pt.hour}</span>
              
              {/* Visual Health Meter */}
              <div className="w-full bg-slate-800 h-20 rounded-xl relative overflow-hidden flex flex-col justify-end">
                <div
                  style={{ height: `${pt.healthScore}%` }}
                  className={`w-full transition-all duration-500 rounded-t-xl ${
                    pt.healthScore < 40
                      ? 'bg-rose-500 shadow-lg shadow-rose-500/50'
                      : pt.healthScore < 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>

              <span className="text-xs font-black font-mono text-cyan-300">{pt.healthScore}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Drivers & AI Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <span className="font-bold text-rose-400 flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> Primary Early Deterioration Risk Drivers
          </span>
          <ul className="list-disc pl-4 text-slate-300 space-y-1 font-medium">
            {prediction.keyRiskDrivers.map((driver, idx) => (
              <li key={idx}>{driver}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5 text-xs">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Proactive AI Preventative Interventions
          </span>
          <ul className="list-disc pl-4 text-slate-300 space-y-1 font-medium">
            {prediction.preventativeRecommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
