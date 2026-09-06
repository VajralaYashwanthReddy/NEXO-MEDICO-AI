import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { eventBroadcaster } from '@/lib/events';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const {
      admissionId,
      dischargeReason,
      diagnosis,
      hospitalCourse,
      followUpInstructions,
      dischargeSummaryText
    } = await req.json();

    if (!admissionId || !dischargeReason || !diagnosis) {
      return NextResponse.json({ error: 'Admission ID, discharge reason, and diagnosis are required' }, { status: 400 });
    }

    const admission = await prisma.admission.findFirst({
      where: { id: admissionId, hospitalId: user.hospitalId },
      include: { patient: true, bed: true, ward: true }
    });

    if (!admission) {
      return NextResponse.json({ error: 'Admission record not found' }, { status: 404 });
    }

    if (admission.status === 'DISCHARGED') {
      return NextResponse.json({ error: 'Patient has already been discharged' }, { status: 400 });
    }

    const summaryText = dischargeSummaryText || (
      `DISCHARGE SUMMARY\n` +
      `Patient: ${admission.patient.fullName} (${admission.patient.patientCode})\n` +
      `Admission Date: ${new Date(admission.admissionDate).toLocaleDateString()}\n` +
      `Discharge Date: ${new Date().toLocaleDateString()}\n` +
      `Final Diagnosis: ${diagnosis}\n` +
      `Hospital Course: ${hospitalCourse || 'Patient responded well to inpatient medical management.'}\n` +
      `Follow-up Instructions: ${followUpInstructions || 'Review in OPD after 7 days.'}`
    );

    const discharge = await prisma.discharge.create({
      data: {
        admissionId,
        patientId: admission.patientId,
        hospitalId: user.hospitalId,
        doctorId: user.id,
        dischargeDate: new Date(),
        dischargeReason,
        diagnosis,
        hospitalCourse: hospitalCourse || 'Smooth recovery',
        followUpInstructions: followUpInstructions || 'Follow up in 1 week',
        dischargeSummaryText: summaryText
      }
    });

    // Update Admission status
    await prisma.admission.update({
      where: { id: admissionId },
      data: { status: 'DISCHARGED' }
    });

    // Move occupied bed into CLEANING status
    await prisma.bed.update({
      where: { id: admission.bedId },
      data: { status: 'CLEANING' }
    });

    // Permanently record discharge summary in patient medical timeline
    await prisma.medicalRecord.create({
      data: {
        patientId: admission.patientId,
        hospitalId: user.hospitalId,
        doctorId: user.id,
        recordType: 'DISCHARGE_SUMMARY',
        title: `Discharge Summary - ${admission.patient.fullName}`,
        summary: `Discharged from ${admission.ward.name} Bed ${admission.bed.bedNumber}. Diagnosis: ${diagnosis}`,
        details: summaryText
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'PATIENT_DISCHARGE',
      resource: `Discharge:${discharge.id}`,
      details: { patientId: admission.patientId, bedNumber: admission.bed.bedNumber }
    });

    eventBroadcaster.broadcast('PATIENT_DISCHARGED', { admission, discharge }, user.hospitalId);

    return NextResponse.json({ message: 'Patient discharged successfully', discharge }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
