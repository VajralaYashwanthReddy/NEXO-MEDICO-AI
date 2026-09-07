export interface EmergencyAlert {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  roomNo: string;
  department: string;
  vitalSpike: string;
  vitalValue: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  timestamp: string;
  aiProtocols: string[];
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

// Default initial active emergency alerts for immediate real-time usage
export const initialEmergencyAlerts: EmergencyAlert[] = [
  {
    id: 'EMG-2026-881',
    patientId: 'PAT-88102',
    patientName: 'Marcus Vance',
    age: 64,
    gender: 'Male',
    roomNo: 'ICU Bed 04 (3rd Floor West)',
    department: 'Intensive Care Unit (ICU)',
    vitalSpike: 'Severe Oxygen Desaturation & Tachycardia',
    vitalValue: 'SpO2 78% | HR 148 BPM | BP 82/50 mmHg',
    severity: 'CRITICAL',
    timestamp: new Date().toISOString(),
    aiProtocols: [
      'ACLS Protocol: Prepare High-Flow Nasal Cannula / Endotracheal Intubation',
      'Administer IV Fluid Bolus (500mL Normal Saline)',
      'Stat Arterial Blood Gas (ABG) & Portable Chest X-Ray Request',
      'Notify Attending Cardiologist & On-Call ICU Intensivist'
    ]
  }
];

export async function fetchActiveAlerts(): Promise<EmergencyAlert[]> {
  try {
    const res = await fetch('/api/emergency/dispatch');
    if (!res.ok) return initialEmergencyAlerts;
    const data = await res.json();
    return data.alerts || initialEmergencyAlerts;
  } catch (err) {
    return initialEmergencyAlerts;
  }
}

export async function triggerNewAlert(alertData: Partial<EmergencyAlert>): Promise<EmergencyAlert> {
  const newAlert: EmergencyAlert = {
    id: `EMG-${Date.now().toString().slice(-4)}`,
    patientId: alertData.patientId || 'PAT-DEMO-01',
    patientName: alertData.patientName || 'Emergency Patient',
    age: alertData.age || 52,
    gender: alertData.gender || 'Female',
    roomNo: alertData.roomNo || 'ER Bay 02',
    department: alertData.department || 'Emergency Department',
    vitalSpike: alertData.vitalSpike || 'Acute Cardiac Arrythmia',
    vitalValue: alertData.vitalValue || 'HR 162 BPM | BP 175/110 mmHg',
    severity: alertData.severity || 'CRITICAL',
    timestamp: new Date().toISOString(),
    aiProtocols: alertData.aiProtocols || [
      'Stat 12-Lead ECG & Cardiac Biomarker Panel (Troponin T/I)',
      'Administer Oxygen Therapy & Establish Dual IV Line',
      'Prepare Crash Cart & Defibrillator for Immediate Response'
    ]
  };

  try {
    await fetch('/api/emergency/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAlert)
    });
  } catch (err) {
    console.warn('Fallback local emergency trigger');
  }

  return newAlert;
}
