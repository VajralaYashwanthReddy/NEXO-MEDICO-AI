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
  const hr = vitals.heartRate ?? 72;
  const sys = vitals.sysBP ?? 120;
  const spo2 = vitals.spO2 ?? 98;
  const temp = vitals.temperature ?? 36.8;
  const rr = vitals.respRate ?? 16;
  const wbc = vitals.wbcCount ?? 7.5;
  const lactate = vitals.lactate ?? 1.1;

  // Base calculation for Sepsis, Cardiac & Respiratory Risk Scores
  let sepsisRisk = 4;
  let cardiacRisk = 4;
  let respiratoryRisk = 4;

  // Sepsis risk factors (SIRS / qSOFA)
  if (temp > 38.3 || temp < 36.0) sepsisRisk += 30;
  else if (temp > 37.8) sepsisRisk += 15;

  if (hr > 110) sepsisRisk += 25;
  else if (hr > 90) sepsisRisk += 15;

  if (rr > 22) sepsisRisk += 20;
  if (wbc > 12 || wbc < 4) sepsisRisk += 15;
  if (lactate > 2.0) sepsisRisk += 25;

  // Cardiac risk factors
  if (hr > 120 || hr < 50) cardiacRisk += 35;
  else if (hr > 100) cardiacRisk += 15;

  if (sys > 160 || sys < 90) cardiacRisk += 35;
  else if (sys > 140 || sys < 100) cardiacRisk += 15;

  // Respiratory risk factors
  if (spo2 < 90) respiratoryRisk += 60;
  else if (spo2 < 94) respiratoryRisk += 35;
  else if (spo2 < 96) respiratoryRisk += 15;

  if (rr > 24 || rr < 10) respiratoryRisk += 25;

  // Clamp risk scores
  sepsisRisk = Math.min(95, Math.max(4, sepsisRisk));
  cardiacRisk = Math.min(95, Math.max(4, cardiacRisk));
  respiratoryRisk = Math.min(95, Math.max(4, respiratoryRisk));

  const maxRisk = Math.max(sepsisRisk, cardiacRisk, respiratoryRisk);
  const overallScore = Math.max(5, Math.round(100 - maxRisk));

  let status: 'STABLE' | 'GUARDED' | 'HIGH_RISK' | 'CRITICAL_DETERIORATION' = 'STABLE';
  if (overallScore < 35) status = 'CRITICAL_DETERIORATION';
  else if (overallScore < 55) status = 'HIGH_RISK';
  else if (overallScore < 75) status = 'GUARDED';

  // Generate 24-hour predictive trajectory points (+0h to +24h)
  const isHealthy = maxRisk <= 15;
  
  const forecastTrend: PredictivePoint[] = [
    { hour: 'Current', healthScore: overallScore, sepsisRisk, cardiacRisk, respiratoryRisk },
    { hour: '+4h', healthScore: isHealthy ? Math.min(99, overallScore + 1) : Math.max(5, overallScore - Math.round(maxRisk * 0.08)), sepsisRisk, cardiacRisk, respiratoryRisk },
    { hour: '+8h', healthScore: isHealthy ? Math.min(99, overallScore + 2) : Math.max(5, overallScore - Math.round(maxRisk * 0.15)), sepsisRisk, cardiacRisk, respiratoryRisk },
    { hour: '+12h', healthScore: isHealthy ? Math.min(99, overallScore + 2) : Math.max(5, overallScore - Math.round(maxRisk * 0.22)), sepsisRisk, cardiacRisk, respiratoryRisk },
    { hour: '+16h', healthScore: isHealthy ? Math.min(99, overallScore + 3) : Math.max(5, overallScore - Math.round(maxRisk * 0.18)), sepsisRisk, cardiacRisk, respiratoryRisk },
    { hour: '+20h', healthScore: isHealthy ? Math.min(99, overallScore + 3) : Math.max(5, overallScore - Math.round(maxRisk * 0.10)), sepsisRisk, cardiacRisk, respiratoryRisk },
    { hour: '+24h', healthScore: isHealthy ? Math.min(99, overallScore + 4) : Math.max(5, overallScore + 5), sepsisRisk, cardiacRisk, respiratoryRisk }
  ];

  const keyRiskDrivers: string[] = [];
  if (spo2 < 95) keyRiskDrivers.push(`Sub-optimal Oxygen Saturation (SpO2 ${spo2}%)`);
  if (temp > 37.8) keyRiskDrivers.push(`Pyrexia / Elevated Temperature (${temp}°C)`);
  if (hr > 90) keyRiskDrivers.push(`Tachycardia (Heart Rate ${hr} BPM)`);
  if (sys < 90) keyRiskDrivers.push(`Hypotension (Systolic BP ${sys} mmHg)`);
  if (sys > 140) keyRiskDrivers.push(`Hypertension (Systolic BP ${sys} mmHg)`);
  if (keyRiskDrivers.length === 0) keyRiskDrivers.push('All vitals parameters are within optimal target baseline.');

  const preventativeRecommendations: string[] = [];
  if (sepsisRisk > 35) preventativeRecommendations.push('Order Blood Cultures x 2 & Serum Lactate Serial Draw');
  if (respiratoryRisk > 25) preventativeRecommendations.push('Initiate Titrated Supplemental Oxygen Therapy (2L/min Nasal Cannula)');
  if (cardiacRisk > 25) preventativeRecommendations.push('Stat 12-Lead ECG & Continuous Cardiac Telemetry');
  if (preventativeRecommendations.length === 0) preventativeRecommendations.push('Maintain Routine Nursing Vitals Checks every 4 hours');

  return {
    overallScore,
    status,
    forecastTrend,
    keyRiskDrivers,
    preventativeRecommendations
  };
}
