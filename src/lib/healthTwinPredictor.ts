export interface VitalsInput {
  heartRate: number;
  sysBP: number;
  diaBP: number;
  spO2: number;
  temperature: number;
  respRate: number;
  wbcCount?: number;
  lactate?: number;
}

export interface PredictivePoint {
  hour: string; // "+0h", "+4h", "+8h", "+12h", "+16h", "+20h", "+24h"
  healthScore: number; // 0 to 100
  sepsisRisk: number; // 0 to 100
  cardiacRisk: number; // 0 to 100
  respiratoryRisk: number; // 0 to 100
}

export interface HealthTwinPredictionResult {
  overallScore: number; // 0 to 100
  status: 'STABLE' | 'GUARDED' | 'HIGH_RISK' | 'CRITICAL_DETERIORATION';
  forecastTrend: PredictivePoint[];
  keyRiskDrivers: string[];
  preventativeRecommendations: string[];
}

export function generateHealthTwinPrediction(vitals: VitalsInput): HealthTwinPredictionResult {
  const hr = vitals.heartRate || 72;
  const sys = vitals.sysBP || 120;
  const spo2 = vitals.spO2 || 98;
  const temp = vitals.temperature || 36.8;
  const rr = vitals.respRate || 16;
  const wbc = vitals.wbcCount || 7.5;
  const lactate = vitals.lactate || 1.1;

  // Base calculation for Sepsis, Cardiac & Respiratory Risk Scores
  let sepsisRisk = 12;
  let cardiacRisk = 10;
  let respiratoryRisk = 8;

  // Sepsis risk factors (SIRS / qSOFA)
  if (temp > 38.3 || temp < 36.0) sepsisRisk += 25;
  if (hr > 90) sepsisRisk += 20;
  if (rr > 22) sepsisRisk += 20;
  if (wbc > 12 || wbc < 4) sepsisRisk += 20;
  if (lactate > 2.0) sepsisRisk += 25;

  // Cardiac risk factors
  if (hr > 120 || hr < 50) cardiacRisk += 30;
  if (sys > 160 || sys < 90) cardiacRisk += 30;

  // Respiratory risk factors
  if (spo2 < 92) respiratoryRisk += 45;
  else if (spo2 < 95) respiratoryRisk += 20;
  if (rr > 24 || rr < 10) respiratoryRisk += 30;

  // Clamp risk scores
  sepsisRisk = Math.min(98, Math.max(5, sepsisRisk));
  cardiacRisk = Math.min(98, Math.max(5, cardiacRisk));
  respiratoryRisk = Math.min(98, Math.max(5, respiratoryRisk));

  const maxRisk = Math.max(sepsisRisk, cardiacRisk, respiratoryRisk);
  const overallScore = Math.max(10, Math.round(100 - maxRisk));

  let status: 'STABLE' | 'GUARDED' | 'HIGH_RISK' | 'CRITICAL_DETERIORATION' = 'STABLE';
  if (overallScore < 40) status = 'CRITICAL_DETERIORATION';
  else if (overallScore < 60) status = 'HIGH_RISK';
  else if (overallScore < 78) status = 'GUARDED';

  // Generate 24-hour predictive trajectory points (+0h to +24h)
  const forecastTrend: PredictivePoint[] = [
    { hour: 'Current (+0h)', healthScore: overallScore, sepsisRisk, cardiacRisk, respiratoryRisk },
    { hour: '+4h Forecast', healthScore: Math.max(5, overallScore - Math.round(maxRisk * 0.05)), sepsisRisk: Math.min(99, sepsisRisk + 2), cardiacRisk: Math.min(99, cardiacRisk + 1), respiratoryRisk: Math.min(99, respiratoryRisk + 2) },
    { hour: '+8h Forecast', healthScore: Math.max(5, overallScore - Math.round(maxRisk * 0.12)), sepsisRisk: Math.min(99, sepsisRisk + 4), cardiacRisk: Math.min(99, cardiacRisk + 3), respiratoryRisk: Math.min(99, respiratoryRisk + 3) },
    { hour: '+12h Forecast', healthScore: Math.max(5, overallScore - Math.round(maxRisk * 0.18)), sepsisRisk: Math.min(99, sepsisRisk + 6), cardiacRisk: Math.min(99, cardiacRisk + 5), respiratoryRisk: Math.min(99, respiratoryRisk + 5) },
    { hour: '+16h Forecast', healthScore: Math.max(5, overallScore - Math.round(maxRisk * 0.15)), sepsisRisk: Math.min(99, sepsisRisk + 4), cardiacRisk: Math.min(99, cardiacRisk + 4), respiratoryRisk: Math.min(99, respiratoryRisk + 4) },
    { hour: '+20h Forecast', healthScore: Math.max(5, overallScore - Math.round(maxRisk * 0.08)), sepsisRisk: Math.min(99, sepsisRisk + 2), cardiacRisk: Math.min(99, cardiacRisk + 2), respiratoryRisk: Math.min(99, respiratoryRisk + 2) },
    { hour: '+24h Forecast', healthScore: Math.max(5, overallScore + 3), sepsisRisk: Math.max(5, sepsisRisk - 3), cardiacRisk: Math.max(5, cardiacRisk - 2), respiratoryRisk: Math.max(5, respiratoryRisk - 3) }
  ];

  const keyRiskDrivers: string[] = [];
  if (spo2 < 94) keyRiskDrivers.push(`Sub-optimal Oxygen Saturation (SpO2 ${spo2}%)`);
  if (temp > 38.0) keyRiskDrivers.push(`Pyrexia / Fever Spike (${temp}°C)`);
  if (hr > 100) keyRiskDrivers.push(`Tachycardia (Heart Rate ${hr} BPM)`);
  if (sys < 90) keyRiskDrivers.push(`Hypotension (Systolic BP ${sys} mmHg)`);
  if (keyRiskDrivers.length === 0) keyRiskDrivers.push('Vitals baseline within physiological target bounds.');

  const preventativeRecommendations: string[] = [];
  if (sepsisRisk > 40) preventativeRecommendations.push('Order Blood Cultures x 2 & Serum Lactate Serial Draw');
  if (respiratoryRisk > 30) preventativeRecommendations.push('Initiate Titrated Supplemental Oxygen Therapy (2L/min Nasal Cannula)');
  if (cardiacRisk > 30) preventativeRecommendations.push('Stat 12-Lead ECG & Continuous Cardiac Telemetry');
  if (preventativeRecommendations.length === 0) preventativeRecommendations.push('Maintain Routine Nursing Vitals Checks every 4 hours');

  return {
    overallScore,
    status,
    forecastTrend,
    keyRiskDrivers,
    preventativeRecommendations
  };
}
