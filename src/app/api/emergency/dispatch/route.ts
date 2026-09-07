import { NextRequest, NextResponse } from 'next/server';
import { initialEmergencyAlerts, EmergencyAlert } from '@/lib/emergencyDispatch';

// In-memory alert store for fast real-time synchronization
let globalAlertsStore: EmergencyAlert[] = [...initialEmergencyAlerts];

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    alerts: globalAlertsStore
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, alertId, responderName } = body;

    if (action === 'acknowledge') {
      globalAlertsStore = globalAlertsStore.map(alert => {
        if (alert.id === alertId) {
          return {
            ...alert,
            acknowledgedBy: responderName || 'On-Duty Emergency Physician',
            acknowledgedAt: new Date().toISOString()
          };
        }
        return alert;
      });
      return NextResponse.json({ success: true, alerts: globalAlertsStore });
    }

    if (action === 'clear') {
      globalAlertsStore = globalAlertsStore.filter(a => a.id !== alertId);
      return NextResponse.json({ success: true, alerts: globalAlertsStore });
    }

    // Default action: Create new alert
    const newAlert: EmergencyAlert = {
      id: body.id || `EMG-${Date.now().toString().slice(-4)}`,
      patientId: body.patientId || 'PAT-DEMO-01',
      patientName: body.patientName || 'Emergency Patient',
      age: body.age || 50,
      gender: body.gender || 'Male',
      roomNo: body.roomNo || 'ER Bay 01',
      department: body.department || 'Emergency Medicine',
      vitalSpike: body.vitalSpike || 'Critical Vitals Instability',
      vitalValue: body.vitalValue || 'SpO2 80% | HR 140 BPM',
      severity: body.severity || 'CRITICAL',
      timestamp: new Date().toISOString(),
      aiProtocols: body.aiProtocols || [
        'Initiate Immediate Oxygen Therapy',
        'Prepare Resuscitation Team & Notify Attending Physician'
      ]
    };

    globalAlertsStore = [newAlert, ...globalAlertsStore];
    return NextResponse.json({ success: true, alert: newAlert, alerts: globalAlertsStore });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Dispatch API error' }, { status: 500 });
  }
}
