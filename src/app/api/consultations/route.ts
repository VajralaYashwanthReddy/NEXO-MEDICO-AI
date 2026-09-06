import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const {
      appointmentId,
      patientId,
      doctorId,
      symptoms,
      vitalsBp,
      vitalsHr,
      vitalsTemp,
      vitalsSpo2,
      vitalsRr,
      clinicalNotes,
      diagnosis
    } = await req.json();

    if (!patientId || !symptoms || !diagnosis) {
      return NextResponse.json({ error: 'Patient ID, symptoms, and diagnosis are required' }, { status: 400 });
    }

    const docId = doctorId || user.id;

    const consultation = await prisma.consultation.create({
      data: {
        appointmentId: appointmentId || null,
        patientId,
        doctorId: docId,
        hospitalId: user.hospitalId,
        symptoms,
        vitalsBp,
        vitalsHr,
        vitalsTemp,
        vitalsSpo2,
        vitalsRr,
        clinicalNotes: clinicalNotes || '',
        diagnosis,
        status: 'COMPLETED'
      }
    });

    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED', diagnosisNotes: diagnosis }
      });
    }

    // Add to patient central medical record timeline
    await prisma.medicalRecord.create({
      data: {
        patientId,
        hospitalId: user.hospitalId,
        doctorId: docId,
        recordType: 'CONSULTATION',
        title: `Clinical Consultation - ${diagnosis}`,
        summary: `Symptoms: ${symptoms}. Diagnosis: ${diagnosis}`,
        details: `Vitals: BP ${vitalsBp || 'N/A'}, HR ${vitalsHr || 'N/A'}, Temp ${vitalsTemp || 'N/A'}, SpO2 ${vitalsSpo2 || 'N/A'}.\nNotes: ${clinicalNotes}`
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'CONSULTATION_RECORD',
      resource: `Consultation:${consultation.id}`,
      details: { patientId, diagnosis }
    });

    return NextResponse.json({ message: 'Consultation saved successfully', consultation }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
