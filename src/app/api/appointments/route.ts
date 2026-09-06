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
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');
    const date = searchParams.get('date');

    const appointments = await prisma.appointment.findMany({
      where: {
        hospitalId: user.hospitalId,
        ...(doctorId ? { doctorId } : {}),
        ...(patientId ? { patientId } : {}),
        ...(date ? { date } : {})
      },
      include: {
        patient: true,
        department: true,
        consultations: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ appointments });
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

    const { patientId, doctorId, departmentId, date, timeSlot, type, reason } = await req.json();

    if (!patientId || !doctorId || !date || !timeSlot) {
      return NextResponse.json({ error: 'Patient, doctor, date, and time slot are required' }, { status: 400 });
    }

    const count = await prisma.appointment.count({ where: { hospitalId: user.hospitalId } });
    const appointmentCode = `APT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const appointment = await prisma.appointment.create({
      data: {
        appointmentCode,
        hospitalId: user.hospitalId,
        patientId,
        doctorId,
        departmentId: departmentId || null,
        date,
        timeSlot,
        type: type || 'GENERAL',
        reason: reason || 'General Consultation',
        status: 'SCHEDULED'
      },
      include: {
        patient: true,
        department: true
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'APPOINTMENT_CREATE',
      resource: `Appointment:${appointment.appointmentCode}`,
      details: { patientId, doctorId, date, timeSlot }
    });

    eventBroadcaster.broadcast('APPOINTMENT_BOOKED', appointment, user.hospitalId);

    return NextResponse.json({ message: 'Appointment booked successfully', appointment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
