'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Activity, TrendingUp, AlertTriangle, ShieldCheck, Sparkles, HeartPulse, RefreshCw } from 'lucide-react';
import { generateHealthTwinPrediction, VitalsInput, HealthTwinPredictionResult } from '@/lib/healthTwinPredictor';

interface HealthTwinPredictorCardProps {
  initialVitals?: VitalsInput;
  patientName?: string;
}

const DEFAULT_HEALTHY_VITALS: VitalsInput = {
  heartRate: 74,
  sysBP: 120,
  diaBP: 80,
  spO2: 98,
  temperature: 36.8,
  respRate: 16,
  wbcCount: 7.2,
  lactate: 1.0
};

export function HealthTwinPredictorCard({
  initialVitals = DEFAULT_HEALTHY_VITALS,
  patientName = 'Personal Account'
}: HealthTwinPredictorCardProps) {
  const [vitals, setVitals] = useState<VitalsInput>(initialVitals);
  const [prediction, setPrediction] = useState<HealthTwinPredictionResult>(() => generateHealthTwinPrediction(initialVitals));

  // Real-time automatic recalculation when vitals inputs change
  useEffect(() => {
    setPrediction(generateHealthTwinPrediction(vitals));
  }, [vitals]);

  const handleResetHealthy = () => {
    setVitals(DEFAULT_HEALTHY_VITALS);
  };

  const handleSimulateCrisis = () => {
    setVitals({
      heartRate: 128,
      sysBP: 88,
      diaBP: 55,
      spO2: 91,
      temperature: 38.6,
      respRate: 26,
      wbcCount: 14.5,
      lactate: 2.8
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-6 select-none">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
              <span>Patient AI Health Twin & 24h Deterioration Forecast</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/80 px-2 py-0.5 rounded-full font-mono uppercase font-bold">Real-Time AI Model</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Predictive trajectory modeling for <span className="text-cyan-300 font-bold">{patientName}</span> forecasting 24-hour deterioration risks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md ${
            prediction.status === 'CRITICAL_DETERIORATION'
              ? 'bg-rose-950 border-rose-700 text-rose-300 shadow-rose-900/40'
              : prediction.status === 'HIGH_RISK'
              ? 'bg-amber-950 border-amber-700 text-amber-300 shadow-amber-900/40'
              : 'bg-emerald-950 border-emerald-700 text-emerald-300 shadow-emerald-900/40'
          }`}>
            <Activity className="w-4 h-4 animate-pulse shrink-0" />
            <span>Score: {prediction.overallScore}/100 • {prediction.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Vitals Input Adjustment Panel */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <HeartPulse className="w-4 h-4 text-cyan-400" /> Interactive Vitals Simulator (Updates Real-Time)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetHealthy}
              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Reset Normal Vitals
            </button>
            <button
              type="button"
              onClick={handleSimulateCrisis}
              className="text-[11px] bg-rose-900/60 hover:bg-rose-800 border border-rose-700 text-rose-200 px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Simulate High Risk Crisis
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Heart Rate (BPM)</label>
            <input
              type="number"
              value={vitals.heartRate}
              onChange={(e) => setVitals({ ...vitals, heartRate: parseFloat(e.target.value) || 70 })}
              className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-sm font-black font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Systolic BP (mmHg)</label>
            <input
              type="number"
              value={vitals.sysBP}
              onChange={(e) => setVitals({ ...vitals, sysBP: parseFloat(e.target.value) || 120 })}
              className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-sm font-black font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">SpO2 Saturation (%)</label>
            <input
              type="number"
              value={vitals.spO2}
              onChange={(e) => setVitals({ ...vitals, spO2: parseFloat(e.target.value) || 98 })}
              className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-sm font-black font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
            <label className="text-[10px] font-bold text-slate-400 block mb-1">Body Temp (°C)</label>
            <input
              type="number"
              step="0.1"
              value={vitals.temperature}
              onChange={(e) => setVitals({ ...vitals, temperature: parseFloat(e.target.value) || 36.8 })}
              className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-sm font-black font-mono text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* 24-Hour Forecast Visual Trajectory Bar Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> 24-Hour Predictive Health Curve (+0h to +24h)
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">Live Bar Gauge (% Health Score)</span>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center">
          {prediction.forecastTrend.map((pt, idx) => {
            const barHeightPercent = Math.max(12, pt.healthScore);
            return (
              <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-between space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-tight text-slate-300">{pt.hour}</span>
                
                {/* Visual Health Bar Container */}
                <div className="w-full bg-slate-900 border border-slate-800 h-28 rounded-xl relative overflow-hidden flex flex-col justify-end p-0.5">
                  <div
                    style={{ height: `${barHeightPercent}%` }}
                    className={`w-full transition-all duration-500 rounded-lg flex items-center justify-center ${
                      pt.healthScore < 40
                        ? 'bg-gradient-to-t from-rose-700 to-rose-500 shadow-md shadow-rose-600/50'
                        : pt.healthScore < 60
                        ? 'bg-gradient-to-t from-amber-700 to-amber-500 shadow-md shadow-amber-600/40'
                        : 'bg-gradient-to-t from-emerald-700 to-emerald-400 shadow-md shadow-emerald-600/40'
                    }`}
                  />
                </div>

                <span className={`text-xs font-black font-mono ${
                  pt.healthScore < 40 ? 'text-rose-400' : pt.healthScore < 60 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {pt.healthScore}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Drivers & AI Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <span className="font-extrabold text-rose-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> Primary Early Deterioration Risk Drivers
          </span>
          <ul className="list-disc pl-4 text-slate-300 space-y-1 font-medium">
            {prediction.keyRiskDrivers.map((driver, idx) => (
              <li key={idx}>{driver}</li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <span className="font-extrabold text-cyan-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
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
