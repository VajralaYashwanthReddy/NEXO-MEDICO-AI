import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { eventBroadcaster } from '@/lib/events';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const admissions = await prisma.admission.findMany({
      where: { hospitalId: user.hospitalId },
      include: {
        patient: true,
        department: true,
        ward: true,
        bed: true,
        discharge: true
      },
      orderBy: { admissionDate: 'desc' }
    });

    return NextResponse.json({ admissions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const {
      patientId,
      doctorId,
      departmentId,
      wardId,
      bedId,
      admissionReason,
      diagnosis,
      expectedDischarge,
      emergencyStatus
    } = await req.json();

    if (!patientId || !wardId || !bedId || !admissionReason || !diagnosis) {
      return NextResponse.json({ error: 'Patient, ward, bed, admission reason, and diagnosis are required' }, { status: 400 });
    }

    // Verify bed availability
    const bed = await prisma.bed.findFirst({
      where: { id: bedId, hospitalId: user.hospitalId }
    });

    if (!bed) {
      return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
    }

    if (bed.status === 'OCCUPIED') {
      return NextResponse.json({ error: 'Bed is currently occupied by another patient' }, { status: 400 });
    }

    const docId = doctorId || user.id;
    const count = await prisma.admission.count({ where: { hospitalId: user.hospitalId } });
    const admissionCode = `ADM-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const admission = await prisma.admission.create({
      data: {
        admissionCode,
        hospitalId: user.hospitalId,
        patientId,
        doctorId: docId,
        departmentId: departmentId || null,
        wardId,
        bedId,
        admissionReason,
        diagnosis,
        expectedDischarge: expectedDischarge || null,
        emergencyStatus: emergencyStatus || false,
        status: 'ADMITTED'
      },
      include: {
        patient: true,
        ward: true,
        bed: true
      }
    });

    // Update Bed status to OCCUPIED
    await prisma.bed.update({
      where: { id: bedId },
      data: { status: 'OCCUPIED' }
    });

    // Add to central medical history timeline
    await prisma.medicalRecord.create({
      data: {
        patientId,
        hospitalId: user.hospitalId,
        doctorId: docId,
        recordType: 'ADMISSION',
        title: `Inpatient Admission #${admission.admissionCode}`,
        summary: `Admitted to ${admission.ward.name} Bed ${admission.bed.bedNumber}. Diagnosis: ${diagnosis}`,
        details: `Reason: ${admissionReason}. Emergency Triage: ${emergencyStatus ? 'CRITICAL / YES' : 'NO'}`
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'PATIENT_ADMISSION',
      resource: `Admission:${admission.admissionCode}`,
      details: { patientId, bedNumber: admission.bed.bedNumber }
    });

    eventBroadcaster.broadcast('PATIENT_ADMITTED', admission, user.hospitalId);

    return NextResponse.json({ message: 'Patient admitted successfully', admission }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
