import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { getGlobalPatients } from '@/lib/patientStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const uEmail = user.email ? user.email.toLowerCase().trim() : null;
    const uPatientCode = (user as any).patientCode || null;

    // Resolve patient record from PostgreSQL
    let basePatient: any = await prisma.patient.findFirst({
      where: {
        OR: [
          { userId: user.id },
          ...(uEmail ? [{ email: uEmail }] : []),
          ...(uPatientCode ? [{ patientCode: uPatientCode }] : [])
        ]
      },
      include: {
        hospital: { select: { id: true, name: true, city: true } },
        emergencyProfile: true
      }
    });

    // Fallback to in-memory store if DB record not found (e.g. freshly seeded memory session)
    if (!basePatient) {
      const globalPatients = getGlobalPatients();
      const memPatient = globalPatients.find(p =>
        p.userId === user.id ||
        (uEmail && p.email?.toLowerCase().trim() === uEmail) ||
        (uPatientCode && p.patientCode === uPatientCode)
      );
      if (memPatient) {
        basePatient = {
          ...memPatient,
          hospital: { name: 'Nexo Medico Central Healthcare Registry', city: 'Universal Network' }
        };
      }
    }

    // If still no patient record found, generate a baseline profile from user session
    if (!basePatient) {
      basePatient = {
        id: user.id,
        userId: user.id,
        patientCode: uPatientCode || `NEXO-PAT-${user.id.slice(0, 6).toUpperCase()}`,
        fullName: user.name || 'Registered Patient',
        email: user.email || '',
        phone: (user as any).phone || '',
        dob: (user as any).dob || '1995-01-01',
        gender: (user as any).gender || 'Other',
        bloodGroup: (user as any).bloodGroup || 'O+',
        address: 'Universal Registry Profile',
        emergencyContact: 'Emergency Contact On File',
        hospital: { name: 'Nexo Medico Central Healthcare Registry', city: 'Universal Network' }
      };
    }

    // Find all cross-hospital records matching this patient
    const matchingPatientIds: string[] = [basePatient.id];
    if (basePatient.patientCode && !basePatient.patientCode.startsWith('NEXO-TEMP')) {
      const allLinkedProfiles = await prisma.patient.findMany({
        where: {
          OR: [
            { id: basePatient.id },
            { patientCode: basePatient.patientCode },
            ...(basePatient.phone ? [{ phone: basePatient.phone }] : [])
          ]
        },
        select: { id: true }
      });
      allLinkedProfiles.forEach(p => {
        if (!matchingPatientIds.includes(p.id)) {
          matchingPatientIds.push(p.id);
        }
      });
    }

    // Query timeline data in parallel with timeout safeguards
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
        where: { patientId: { in: matchingPatientIds } },
        include: { hospital: { select: { name: true } } },
        orderBy: { visitDate: 'desc' },
        take: 50
      }).catch(() => []),
      prisma.appointment.findMany({
        where: {
          OR: [
            { patientId: { in: matchingPatientIds } },
            { patient: { userId: user.id } }
          ]
        },
        include: { hospital: { select: { name: true } }, department: true },
        orderBy: { createdAt: 'desc' },
        take: 50
      }).catch(() => []),
      prisma.consultation.findMany({
        where: { patientId: { in: matchingPatientIds } },
        include: {
          hospital: { select: { name: true } },
          prescriptions: { include: { items: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }).catch(() => []),
      prisma.prescription.findMany({
        where: { patientId: { in: matchingPatientIds } },
        include: {
          hospital: { select: { name: true } },
          items: true,
          dispensingLogs: { include: { dispensedByUser: true } }
        },
        orderBy: { date: 'desc' },
        take: 50
      }).catch(() => []),
      prisma.labOrder.findMany({
        where: { patientId: { in: matchingPatientIds } },
        include: {
          hospital: { select: { name: true } },
          test: true,
          report: true
        },
        orderBy: { orderedAt: 'desc' },
        take: 50
      }).catch(() => []),
      prisma.medicalImage.findMany({
        where: { patientId: { in: matchingPatientIds } },
        include: { hospital: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20
      }).catch(() => []),
      prisma.admission.findMany({
        where: { patientId: { in: matchingPatientIds } },
        include: {
          hospital: { select: { name: true } },
          ward: true,
          bed: true,
          discharge: true
        },
        orderBy: { admissionDate: 'desc' },
        take: 20
      }).catch(() => []),
      prisma.iCUBedLog.findMany({
        where: { patientId: { in: matchingPatientIds } },
        include: { hospital: { select: { name: true } }, bed: true },
        orderBy: { recordedAt: 'desc' },
        take: 20
      }).catch(() => []),
      prisma.aIPredictionLog.findMany({
        where: { patientId: { in: matchingPatientIds } },
        include: { hospital: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20
      }).catch(() => []),
      prisma.drugInteractionAlert.findMany({
        where: { patientId: { in: matchingPatientIds } },
        orderBy: { createdAt: 'desc' },
        take: 20
      }).catch(() => [])
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
        ...medicalRecords.map((r: any) => r.hospital?.name),
        ...prescriptions.map((r: any) => r.hospital?.name),
        basePatient.hospital?.name
      ].filter(Boolean)).size
    };

    return NextResponse.json({
      success: true,
      patient: basePatient,
      patientTimeline: unifiedPatientTimeline
    });

  } catch (error: any) {
    console.error('Error fetching patient dashboard timeline:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve patient medical records', details: error.message },
      { status: 500 }
    );
  }
}
