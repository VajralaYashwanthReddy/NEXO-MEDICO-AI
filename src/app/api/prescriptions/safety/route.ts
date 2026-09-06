import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const { patientId, medicines } = await req.json();

    if (!patientId || !medicines || !Array.isArray(medicines)) {
      return NextResponse.json({ error: 'Patient ID and medicines list are required' }, { status: 400 });
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, hospitalId: user.hospitalId },
      include: { prescriptions: { include: { items: true } } }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const alerts: Array<{ severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; message: string; drug: string }> = [];

    const patientAllergies = (patient.allergies || '').toLowerCase();

    for (const med of medicines) {
      const medNameLower = med.name.toLowerCase();
      const genericLower = (med.genericName || med.name).toLowerCase();

      // Allergy conflict check
      if (patientAllergies.includes('penicillin') && (medNameLower.includes('amoxicillin') || genericLower.includes('penicillin') || genericLower.includes('amoxicillin'))) {
        alerts.push({
          severity: 'CRITICAL',
          drug: med.name,
          message: `CRITICAL ALLERGY CONFLICT: Patient has documented Penicillin allergy. Prescribing '${med.name}' poses severe anaphylaxis risk.`
        });
      }
      if (patientAllergies.includes('sulfa') && (medNameLower.includes('sulfa') || genericLower.includes('bactrim') || genericLower.includes('sulfamethoxazole'))) {
        alerts.push({
          severity: 'CRITICAL',
          drug: med.name,
          message: `CRITICAL ALLERGY CONFLICT: Patient has documented Sulfa allergy. Prescribing '${med.name}' poses severe allergy risk.`
        });
      }

      // Check existing prescriptions for duplicate therapy
      for (const pastRx of patient.prescriptions) {
        if (pastRx.status === 'ISSUED' || pastRx.status === 'DISPENSED') {
          for (const item of pastRx.items) {
            if (item.medicineName.toLowerCase() === medNameLower) {
              alerts.push({
                severity: 'MEDIUM',
                drug: med.name,
                message: `DUPLICATE THERAPY WARNING: Patient has an active dispensing/prescription for '${item.medicineName}' issued recently.`
              });
            }
          }
        }
      }
    }

    // Drug-Drug Interaction cross-checks
    const drugNames = medicines.map(m => (m.genericName || m.name).toLowerCase());
    if (drugNames.some(d => d.includes('lisinopril')) && drugNames.some(d => d.includes('spironolactone') || d.includes('potassium'))) {
      alerts.push({
        severity: 'HIGH',
        drug: 'Lisinopril',
        message: `DRUG INTERACTION ALERT: Co-administration of ACE Inhibitor (Lisinopril) and Potassium-sparing agent may cause severe Hyperkalemia.`
      });
    }

    return NextResponse.json({
      hasAlerts: alerts.length > 0,
      alertsCount: alerts.length,
      alerts
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
