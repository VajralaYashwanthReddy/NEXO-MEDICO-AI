'use client';

import React, { useState } from 'react';
import { BrainCircuit, Activity, BarChart2, MessageSquare, Send, BookOpen, CheckCircle2 } from 'lucide-react';

export default function AIAssistantPage() {
  const [tab, setTab] = useState<'prediction' | 'rag'>('prediction');

  // Disease prediction state
  const [conditionType, setConditionType] = useState('Diabetes');
  const [algorithm, setAlgorithm] = useState('RandomForest');
  const [age, setAge] = useState('48');
  const [gender, setGender] = useState('Male');
  const [bmi, setBmi] = useState('28.4');
  const [bpSystolic, setBpSystolic] = useState('138');
  const [bpDiastolic, setBpDiastolic] = useState('88');
  const [glucose, setGlucose] = useState('165');
  const [cholesterol, setCholesterol] = useState('225');
  const [smoking, setSmoking] = useState(false);
  const [familyHistory, setFamilyHistory] = useState(true);

  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  // RAG assistant state
  const [ragQuery, setRagQuery] = useState('');
  const [ragLoading, setRagLoading] = useState(false);
  const [ragResult, setRagResult] = useState<any>(null);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setPredicting(true);
    try {
      const res = await fetch('/api/ai/disease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conditionType,
          algorithm,
          patientAge: parseFloat(age),
          gender,
          bmi: parseFloat(bmi),
          bloodPressureSystolic: parseFloat(bpSystolic),
          bloodPressureDiastolic: parseFloat(bpDiastolic),
          glucose: parseFloat(glucose),
          cholesterol: parseFloat(cholesterol),
          smoking,
          familyHistory
        })
      });
      const data = await res.json();
      setPredictionResult(data.prediction);
    } catch (err) {
      console.error(err);
    } finally {
      setPredicting(false);
    }
  };

  const handleRagQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;

    setRagLoading(true);
    try {
      const res = await fetch('/api/ai/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ragQuery })
      });
      const data = await res.json();
      setRagResult(data.rag);
    } catch (err) {
      console.error(err);
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-cyan-600" /> AI Clinical Decision Support & RAG Assistant
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-model risk prediction (RF, XGBoost, LightGBM, NN), SHAP explainability & RAG document retrieval
          </p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          onClick={() => setTab('prediction')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 ${
            tab === 'prediction' ? 'border-cyan-600 text-cyan-600 bg-white rounded-t-xl' : 'text-slate-500'
          }`}
        >
          <Activity className="w-4 h-4" /> Multi-Model Disease Prediction & SHAP
        </button>

        <button
          onClick={() => setTab('rag')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 ${
            tab === 'rag' ? 'border-cyan-600 text-cyan-600 bg-white rounded-t-xl' : 'text-slate-500'
          }`}
        >
          <MessageSquare className="w-4 h-4" /> RAG Clinical Assistant with Citations
        </button>
      </div>

      {/* TAB 1: Multi-Model Disease Prediction */}
      {tab === 'prediction' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <form onSubmit={handlePredict} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Clinical Vitals & Model Inputs</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700">Disease Target</label>
                <select value={conditionType} onChange={(e) => setConditionType(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg font-bold text-slate-800">
                  <option value="Diabetes">Type 2 Diabetes</option>
                  <option value="Heart Disease">Heart Disease (Cardiovascular)</option>
                  <option value="Stroke Risk">Ischemic Stroke Risk</option>
                  <option value="Hypertension">Hypertension Stage</option>
                  <option value="Kidney Disease">Renal Function / Kidney</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">ML Model Algorithm</label>
                <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg font-bold text-cyan-800">
                  <option value="RandomForest">Random Forest</option>
                  <option value="XGBoost">XGBoost Classifier</option>
                  <option value="LightGBM">LightGBM Classifier</option>
                  <option value="NeuralNetwork">Neural Network (MLP)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700">Age (Yrs)</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">BMI</label>
                <input type="number" step="0.1" value={bmi} onChange={(e) => setBmi(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700">Systolic BP (mmHg)</label>
                <input type="number" value={bpSystolic} onChange={(e) => setBpSystolic(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Fasting Glucose (mg/dL)</label>
                <input type="number" value={glucose} onChange={(e) => setGlucose(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg font-bold text-rose-600" />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input type="checkbox" checked={smoking} onChange={(e) => setSmoking(e.target.checked)} className="rounded text-cyan-600" />
                Tobacco Smoker
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input type="checkbox" checked={familyHistory} onChange={(e) => setFamilyHistory(e.target.checked)} className="rounded text-cyan-600" />
                Family Predisposition
              </label>
            </div>

            <button type="submit" disabled={predicting} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow flex items-center justify-center gap-2">
              <BrainCircuit className="w-4 h-4" /> {predicting ? 'Evaluating ML Model Ensemble...' : 'Run Disease Risk Prediction'}
            </button>
          </form>

          {/* Results Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Prediction Results & SHAP Feature Importances</h3>

            {!predictionResult ? (
              <p className="py-12 text-center text-slate-400 italic">Click "Run Disease Risk Prediction" to generate clinical decision analytics.</p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase">{predictionResult.conditionType} Risk</span>
                    <h4 className="text-2xl font-extrabold text-white">{predictionResult.riskScorePercent}%</h4>
                    <span className="text-xs text-amber-400 font-bold">{predictionResult.predictedCondition}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Model Confidence</span>
                    <span className="text-sm font-bold text-emerald-400">{predictionResult.confidence}%</span>
                  </div>
                </div>

                {/* SHAP Feature Importances */}
                <div>
                  <span className="font-bold text-slate-800 block mb-2">SHAP Feature Importance Attribution:</span>
                  <div className="space-y-2">
                    {predictionResult.featureImportances?.map((feat: any, i: number) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span>{feat.feature} ({feat.value})</span>
                          <span className="text-cyan-700">{Math.round(feat.importance * 100)}% weight</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-cyan-600 h-2 rounded-full" style={{ width: `${feat.importance * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Comparison Table */}
                <div>
                  <span className="font-bold text-slate-800 block mb-2">Algorithm Benchmark Comparison:</span>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-500 font-bold">
                        <th className="p-2 text-left">Model</th>
                        <th className="p-2 text-center">Accuracy</th>
                        <th className="p-2 text-center">AUC-ROC</th>
                        <th className="p-2 text-right">Risk %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {predictionResult.modelComparison?.map((mc: any, idx: number) => (
                        <tr key={idx} className={mc.model.toLowerCase().includes(algorithm.toLowerCase()) ? 'bg-cyan-50 font-bold text-cyan-900' : ''}>
                          <td className="p-2">{mc.model}</td>
                          <td className="p-2 text-center">{mc.accuracy}%</td>
                          <td className="p-2 text-center">{mc.auc_roc}</td>
                          <td className="p-2 text-right">{mc.predictedRisk}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RAG Assistant */}
      {tab === 'rag' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-600" /> RAG Knowledge Assistant with Direct Citations
          </h3>

          <form onSubmit={handleRagQuery} className="flex gap-2">
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="Ask clinical question (e.g., 'What are ADA guidelines for fasting glucose > 140 mg/dL?')"
              className="flex-1 px-4 py-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-cyan-500"
            />
            <button type="submit" disabled={ragLoading} className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl flex items-center gap-1.5 shadow">
              <Send className="w-4 h-4" /> {ragLoading ? 'Searching Knowledge Base...' : 'Ask Assistant'}
            </button>
          </form>

          {ragResult && (
            <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
              <p className="text-slate-900 font-semibold text-sm leading-relaxed">{ragResult.answer}</p>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Verifiable Knowledge Sources:</span>
                <div className="space-y-1">
                  {ragResult.citations?.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="font-bold text-cyan-700">{c.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Relevance: {Math.round(c.relevance * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
