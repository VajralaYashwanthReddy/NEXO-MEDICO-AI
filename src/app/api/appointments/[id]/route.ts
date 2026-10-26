import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { eventBroadcaster } from '@/lib/events';
import {
  parseScheduleConfig,
  generateDoctorAvailableSlots
} from '@/lib/appointmentSlots';

// Valid Lifecycle Transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  BOOKED: ['CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'],
  CHECKED_IN: ['IN_CONSULTATION', 'CANCELLED', 'NO_SHOW'],
  IN_CONSULTATION: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // Terminal
  CANCELLED: [], // Terminal
  NO_SHOW: ['RESCHEDULED'],
  RESCHEDULED: ['BOOKED', 'CONFIRMED', 'CANCELLED']
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, email: true } },
        department: true,
        hospital: true,
        consultations: true
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Hospital Isolation Check
    if (user.role !== 'SUPER_ADMIN') {
      if (user.role === 'DOCTOR' && appointment.doctorId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (user.role === 'PATIENT' && appointment.patient.userId !== user.id && appointment.patient.email !== user.email) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (user.role === 'HOSPITAL_ADMIN' && appointment.hospitalId !== user.hospitalId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ appointment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/appointments/[id] - Lifecycle transition or Reschedule
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { patient: true, doctor: true, hospital: true }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Hospital isolation check
    if (user.role !== 'SUPER_ADMIN') {
      if (user.role === 'HOSPITAL_ADMIN' && appointment.hospitalId !== user.hospitalId) {
        return NextResponse.json({ error: 'Cannot modify appointments for another hospital' }, { status: 403 });
      }
      if (user.role === 'DOCTOR' && appointment.doctorId !== user.id) {
        return NextResponse.json({ error: 'Cannot modify appointments for another doctor' }, { status: 403 });
      }
      if (user.role === 'PATIENT' && appointment.patient.userId !== user.id && appointment.patient.email !== user.email) {
        return NextResponse.json({ error: 'Cannot modify another patient appointment' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { action, status, reason, newDate, newTimeSlot, notes, diagnosisNotes } = body;

    let targetStatus = status;

    // Support semantic action strings: "confirm", "check_in", "start_consultation", "complete", "cancel", "no_show", "reschedule"
    if (action === 'confirm') targetStatus = 'CONFIRMED';
    if (action === 'check_in') targetStatus = 'CHECKED_IN';
    if (action === 'start_consultation') targetStatus = 'IN_CONSULTATION';
    if (action === 'complete') targetStatus = 'COMPLETED';
    if (action === 'cancel') targetStatus = 'CANCELLED';
    if (action === 'no_show') targetStatus = 'NO_SHOW';
    if (action === 'reschedule') targetStatus = 'RESCHEDULED';

    // Parse existing history
    let history: any[] = [];
    try {
      if (appointment.historyJson) history = JSON.parse(appointment.historyJson);
    } catch (e) {}

    const now = new Date();

    // 1. RESCHEDULE ACTION
    if (targetStatus === 'RESCHEDULED' || (newDate && newTimeSlot)) {
      if (!newDate || !newTimeSlot) {
        return NextResponse.json({ error: 'New date and timeSlot are required for rescheduling.' }, { status: 400 });
      }

      // Check slot availability
      const docProfile = await prisma.doctorProfile.findFirst({
        where: { userId: appointment.doctorId }
      });
      const sched = parseScheduleConfig(docProfile?.slotConfigJson);
      const slotCheck = await generateDoctorAvailableSlots({
        doctorId: appointment.doctorId,
        date: newDate,
        scheduleConfig: sched
      });

      const slotMatch = slotCheck.slots.find(s => s.timeSlot.toUpperCase() === newTimeSlot.toUpperCase());
      if (!slotMatch || !slotMatch.available) {
        return NextResponse.json(
          { error: `Requested reschedule slot ${newTimeSlot} on ${newDate} is unavailable.` },
          { status: 409 }
        );
      }

      // Concurrency check inside transaction
      const updated = await prisma.$transaction(async (tx) => {
        const conflict = await tx.appointment.findFirst({
          where: {
            doctorId: appointment.doctorId,
            date: newDate,
            timeSlot: newTimeSlot,
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            id: { not: appointment.id }
          }
        });

        if (conflict) {
          throw new Error('SLOT_ALREADY_RESERVED');
        }

        history.push({
          status: 'RESCHEDULED',
          previousDate: appointment.date,
          previousTimeSlot: appointment.timeSlot,
          newDate,
          newTimeSlot,
          reason: reason || 'Patient requested reschedule',
          timestamp: now.toISOString(),
          byUserId: user.id,
          byName: user.name || user.email
        });

        return tx.appointment.update({
          where: { id: appointment.id },
          data: {
            date: newDate,
            timeSlot: newTimeSlot,
            status: 'CONFIRMED', // Once rescheduled to valid slot, becomes confirmed
            historyJson: JSON.stringify(history)
          },
          include: {
            patient: true,
            doctor: { select: { id: true, name: true, email: true } },
            department: true,
            hospital: true
          }
        });
      });

      await createAuditLog({
        hospitalId: appointment.hospitalId,
        userId: user.id,
        action: 'APPOINTMENT_RESCHEDULED',
        resource: `Appointment:${appointment.appointmentCode}`,
        details: { from: `${appointment.date} ${appointment.timeSlot}`, to: `${newDate} ${newTimeSlot}`, reason }
      });

      eventBroadcaster.broadcast('APPOINTMENT_UPDATED', updated, appointment.hospitalId);

      return NextResponse.json({
        success: true,
        message: 'Appointment rescheduled successfully',
        appointment: updated
      });
    }

    // 2. STATUS LIFECYCLE TRANSITION
    if (targetStatus && targetStatus !== appointment.status) {
      const allowed = VALID_TRANSITIONS[appointment.status] || [];
      if (!allowed.includes(targetStatus) && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          {
            error: `Invalid transition from ${appointment.status} to ${targetStatus}. Allowed: ${allowed.join(', ') || 'None (Terminal state)'}`
          },
          { status: 400 }
        );
      }

      const updateData: any = {
        status: targetStatus
      };

      if (notes) updateData.notes = notes;
      if (diagnosisNotes) updateData.diagnosisNotes = diagnosisNotes;

      if (targetStatus === 'CHECKED_IN') updateData.checkedInAt = now;
      if (targetStatus === 'IN_CONSULTATION') updateData.startedAt = now;
      if (targetStatus === 'COMPLETED') updateData.completedAt = now;
      if (targetStatus === 'CANCELLED') {
        updateData.cancellationReason = reason || 'Cancelled by user';
      }

      history.push({
        status: targetStatus,
        reason: reason || null,
        timestamp: now.toISOString(),
        byUserId: user.id,
        byName: user.name || user.email
      });
      updateData.historyJson = JSON.stringify(history);

      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: updateData,
        include: {
          patient: true,
          doctor: { select: { id: true, name: true, email: true } },
          department: true,
          hospital: true
        }
      });

      await createAuditLog({
        hospitalId: appointment.hospitalId,
        userId: user.id,
        action: `APPOINTMENT_${targetStatus}`,
        resource: `Appointment:${appointment.appointmentCode}`,
        details: { previousStatus: appointment.status, newStatus: targetStatus, reason }
      });

      eventBroadcaster.broadcast('APPOINTMENT_UPDATED', updated, appointment.hospitalId);

      return NextResponse.json({
        success: true,
        message: `Appointment status updated to ${targetStatus}`,
        appointment: updated
      });
    }

    // Notes only update
    if (notes || diagnosisNotes) {
      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          ...(notes ? { notes } : {}),
          ...(diagnosisNotes ? { diagnosisNotes } : {})
        },
        include: { patient: true, doctor: true, department: true }
      });
      return NextResponse.json({ success: true, appointment: updated });
    }

    return NextResponse.json({ appointment });
  } catch (err: any) {
    console.error('PATCH /api/appointments/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
