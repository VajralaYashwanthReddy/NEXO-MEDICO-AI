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

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');

    const prescriptions = await prisma.prescription.findMany({
      where: {
        hospitalId: user.hospitalId,
        ...(patientId ? { patientId } : {}),
        ...(doctorId ? { doctorId } : {}),
        ...(status ? { status } : {})
      },
      include: {
        patient: true,
        items: true,
        dispensingLogs: { include: { dispensedByUser: true } }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json({ prescriptions });
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

    const { consultationId, patientId, doctorId, medicines, instructions, status } = await req.json();

    if (!patientId || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json({ error: 'Patient ID and at least one medicine item are required' }, { status: 400 });
    }

    const docId = doctorId || user.id;
    const rxStatus = status || 'ISSUED';

    const count = await prisma.prescription.count({ where: { hospitalId: user.hospitalId } });
    const prescriptionCode = `RX-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const prescription = await prisma.prescription.create({
      data: {
        prescriptionCode,
        consultationId: consultationId || null,
        patientId,
        doctorId: docId,
        hospitalId: user.hospitalId,
        status: rxStatus,
        instructions: instructions || 'Take medications as directed',
        digitalSignature: `DIGITAL_SIG_${docId.substring(0, 8)}_${Date.now()}`,
        items: {
          create: medicines.map((m: any) => ({
            medicineId: m.medicineId || null,
            medicineName: m.name || m.medicineName,
            strength: m.strength || '500 mg',
            dosage: m.dosage || '1 tablet',
            route: m.route || 'Oral',
            frequency: m.frequency || 'Twice daily',
            durationDays: parseInt(m.durationDays || m.duration || '5'),
            quantity: parseInt(m.quantity || '10'),
            foodRelation: m.foodRelation || 'After food',
            instructions: m.instructions || ''
          }))
        }
      },
      include: {
        patient: true,
        items: true
      }
    });

    // Save to patient's central timeline record
    await prisma.medicalRecord.create({
      data: {
        patientId,
        hospitalId: user.hospitalId,
        doctorId: docId,
        recordType: 'PRESCRIPTION',
        title: `Digital Prescription #${prescription.prescriptionCode}`,
        summary: `Prescribed ${medicines.length} medicine(s): ${medicines.map((m: any) => m.name || m.medicineName).join(', ')}`,
        details: `Prescription ID: ${prescription.prescriptionCode}. Instructions: ${instructions || 'N/A'}`
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'PRESCRIPTION_ISSUE',
      resource: `Prescription:${prescription.prescriptionCode}`,
      details: { patientId, itemCount: medicines.length }
    });

    eventBroadcaster.broadcast('PRESCRIPTION_ISSUED', prescription, user.hospitalId);

    return NextResponse.json({ message: 'Prescription created successfully', prescription }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
