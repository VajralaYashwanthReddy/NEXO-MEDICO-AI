import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const patientId = params.id;

    // First find target patient profile
    const basePatient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { hospital: { select: { name: true, city: true } } }
    });

    if (!basePatient) {
      return NextResponse.json({ error: 'Patient medical record not found' }, { status: 404 });
    }

    // Find all records matching this patient's unique patientCode across ALL hospitals in network
    const allPatientProfiles = await prisma.patient.findMany({
      where: {
        OR: [
          { id: patientId },
          { patientCode: basePatient.patientCode },
          ...(basePatient.phone ? [{ phone: basePatient.phone }] : [])
        ]
      },
      select: { id: true }
    });

    const matchingIds = allPatientProfiles.map(p => p.id);

    // Aggregate cross-hospital timeline
    const [
      medicalRecords,
      appointments,
      consultations,
      prescriptions,
      labOrders,
      medicalImages,
      admissions,
      icuBedLogs,
      aiPredictionLogs,
      drugInteractionAlerts
    ] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: { patientId: { in: matchingIds } },
        include: { hospital: { select: { name: true } } },
        orderBy: { visitDate: 'desc' }
      }),
      prisma.appointment.findMany({
        where: { patientId: { in: matchingIds } },
        include: { hospital: { select: { name: true } }, department: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.consultation.findMany({
        where: { patientId: { in: matchingIds } },
        include: {
          hospital: { select: { name: true } },
          prescriptions: { include: { items: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.prescription.findMany({
        where: { patientId: { in: matchingIds } },
        include: {
          hospital: { select: { name: true } },
          items: true,
          dispensingLogs: { include: { dispensedByUser: true } }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.labOrder.findMany({
        where: { patientId: { in: matchingIds } },
        include: {
          hospital: { select: { name: true } },
          test: true,
          report: true
        },
        orderBy: { orderedAt: 'desc' }
      }),
      prisma.medicalImage.findMany({
        where: { patientId: { in: matchingIds } },
        include: { hospital: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.admission.findMany({
        where: { patientId: { in: matchingIds } },
        include: {
          hospital: { select: { name: true } },
          ward: true,
          bed: true,
          discharge: true
        },
        orderBy: { admissionDate: 'desc' }
      }),
      prisma.iCUBedLog.findMany({
        where: { patientId: { in: matchingIds } },
        include: { hospital: { select: { name: true } }, bed: true },
        orderBy: { recordedAt: 'desc' }
      }),
      prisma.aIPredictionLog.findMany({
        where: { patientId: { in: matchingIds } },
        include: { hospital: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.drugInteractionAlert.findMany({
        where: { patientId: { in: matchingIds } },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const unifiedPatientTimeline = {
      ...basePatient,
      medicalRecords,
      appointments,
      consultations,
      prescriptions,
      labOrders,
      medicalImages,
      admissions,
      icuBedLogs,
      aiPredictionLogs,
      drugInteractionAlerts,
      isCrossHospitalTimeline: true,
      hospitalsVisitedCount: new Set([
        ...medicalRecords.map(r => r.hospital?.name),
        ...prescriptions.map(r => r.hospital?.name),
        basePatient.hospital?.name
      ].filter(Boolean)).size
    };

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'GLOBAL_PATIENT_TIMELINE_ACCESS',
      resource: `Patient:${basePatient.patientCode}`,
      details: { patientCode: basePatient.patientCode, globalMatchingProfiles: matchingIds.length }
    });

    return NextResponse.json({ patientTimeline: unifiedPatientTimeline });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
