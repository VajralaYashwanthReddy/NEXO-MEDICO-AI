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
    const bedId = searchParams.get('bedId');
    const patientId = searchParams.get('patientId');

    const logs = await prisma.iCUBedLog.findMany({
      where: {
        hospitalId: user.hospitalId,
        ...(bedId ? { bedId } : {}),
        ...(patientId ? { patientId } : {})
      },
      include: {
        bed: { include: { ward: true } },
        patient: true
      },
      orderBy: { recordedAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ icuLogs: logs });
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

    const { bedId, patientId, vitalsBp, vitalsHr, vitalsTemp, vitalsSpo2, vitalsRr, ventilatorSettings, nurseNotes } = await req.json();

    if (!bedId || !patientId) {
      return NextResponse.json({ error: 'bedId and patientId are required' }, { status: 400 });
    }

    const vitalsObj = {
      bp: vitalsBp || '120/80',
      hr: vitalsHr || '75 bpm',
      temp: vitalsTemp || '98.6 °F',
      spo2: vitalsSpo2 || '98%',
      rr: vitalsRr || '16 /min'
    };

    const icuLog = await prisma.iCUBedLog.create({
      data: {
        hospitalId: user.hospitalId,
        bedId,
        patientId,
        doctorId: user.role === 'DOCTOR' ? user.id : null,
        nurseId: user.role === 'NURSE' ? user.id : null,
        vitalsJson: JSON.stringify(vitalsObj),
        ventilatorSettings: ventilatorSettings || 'BiPAP / AC Mode',
        nurseNotes: nurseNotes || 'Patient stable in ICU.'
      },
      include: {
        patient: true,
        bed: true
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'ICU_LOG_RECORD',
      resource: `ICUBedLog:${icuLog.id}`,
      details: { bedId, patientId }
    });

    eventBroadcaster.broadcast('ICU_LOG_RECORDED', icuLog, user.hospitalId);

    return NextResponse.json({ message: 'ICU log recorded successfully', icuLog }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
