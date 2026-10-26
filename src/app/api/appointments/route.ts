import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { eventBroadcaster } from '@/lib/events';
import {
  parseScheduleConfig,
  generateDoctorAvailableSlots,
  minutesToTimeSlot,
  timeToMinutes
} from '@/lib/appointmentSlots';

// GET /api/appointments
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized context' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doctorIdParam = searchParams.get('doctorId');
    const patientIdParam = searchParams.get('patientId');
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const statusParam = searchParams.get('status');
    const searchParam = (searchParams.get('search') || '').toLowerCase().trim();

    const whereClause: any = {};

    // Role-based scoping & hospital isolation
    if (user.role === 'DOCTOR') {
      // Doctor can only access their own appointments
      whereClause.doctorId = user.id;
      if (user.hospitalId) whereClause.hospitalId = user.hospitalId;
    } else if (user.role === 'PATIENT') {
      // Patient can only access their own appointments
      // Find patient record
      const pat = await prisma.patient.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email }
          ]
        }
      });
      if (pat) {
        whereClause.patientId = pat.id;
      } else {
        whereClause.patientId = 'none'; // No records if patient profile doesn't exist yet
      }
    } else if (user.role === 'HOSPITAL_ADMIN' || user.role === 'NURSE' || user.role === 'RECEPTIONIST') {
      // Hospital Admin & staff see appointments exclusively for their own hospital
      if (!user.hospitalId) {
        return NextResponse.json({ error: 'Hospital tenant context required' }, { status: 403 });
      }
      whereClause.hospitalId = user.hospitalId;
      if (doctorIdParam) whereClause.doctorId = doctorIdParam;
      if (patientIdParam) whereClause.patientId = patientIdParam;
    } else if (user.role === 'SUPER_ADMIN') {
      // Super Admin can filter by hospitalId, doctorId, patientId
      const hospParam = searchParams.get('hospitalId');
      if (hospParam) whereClause.hospitalId = hospParam;
      if (doctorIdParam) whereClause.doctorId = doctorIdParam;
      if (patientIdParam) whereClause.patientId = patientIdParam;
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Date filters
    if (dateParam) {
      whereClause.date = dateParam;
    } else if (startDateParam && endDateParam) {
      whereClause.date = { gte: startDateParam, lte: endDateParam };
    }

    // Status filter
    if (statusParam && statusParam !== 'ALL') {
      whereClause.status = statusParam;
    }

    // Search filter across patient name, patient code, appointment code, reason
    if (searchParam) {
      whereClause.OR = [
        { appointmentCode: { contains: searchParam, mode: 'insensitive' } },
        { reason: { contains: searchParam, mode: 'insensitive' } },
        { patient: { fullName: { contains: searchParam, mode: 'insensitive' } } },
        { patient: { patientCode: { contains: searchParam, mode: 'insensitive' } } }
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            patientCode: true,
            fullName: true,
            phone: true,
            email: true,
            gender: true,
            dob: true,
            bloodGroup: true,
            allergies: true,
            conditions: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        hospital: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true
          }
        },
        consultations: {
          select: {
            id: true,
            diagnosis: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { timeSlot: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (err: any) {
    console.error('GET /api/appointments error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/appointments - Concurrency-safe slot booking
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    let {
      patientId,
      doctorId,
      departmentId,
      hospitalId,
      date,
      timeSlot,
      visitType,
      type,
      reason
    } = body;

    // Normalize date and timeSlot
    date = (date || '').trim();
    timeSlot = (timeSlot || '').trim();
    reason = (reason || '').trim() || 'General Consultation';
    type = type || 'GENERAL';
    visitType = visitType || 'IN_PERSON';

    if (!doctorId || !date || !timeSlot) {
      return NextResponse.json(
        { error: 'Doctor, appointment date (YYYY-MM-DD), and time slot are required.' },
        { status: 400 }
      );
    }

    // 1. Resolve Patient ID
    let resolvedPatientId = patientId;
    if (user.role === 'PATIENT') {
      const patientRecord = await prisma.patient.findFirst({
        where: {
          OR: [
            { userId: user.id },
            { email: user.email }
          ]
        }
      });
      if (!patientRecord) {
        return NextResponse.json(
          { error: 'Patient medical profile not found. Please complete patient registration first.' },
          { status: 400 }
        );
      }
      resolvedPatientId = patientRecord.id;
    } else if (!resolvedPatientId) {
      return NextResponse.json({ error: 'Patient ID is required for staff booking' }, { status: 400 });
    }

    // 2. Resolve Doctor and Hospital Tenant
    const doctorProfile = await prisma.doctorProfile.findFirst({
      where: {
        OR: [
          { userId: doctorId },
          { id: doctorId }
        ]
      },
      include: {
        user: true,
        department: true,
        hospital: true
      }
    });

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Selected doctor profile was not found' }, { status: 404 });
    }

    const doctorUserId = doctorProfile.user.id;
    const targetHospitalId = doctorProfile.hospitalId;

    // Check Hospital isolation: If user is Hospital Admin or Doctor, they must belong to this hospital
    if (user.role === 'HOSPITAL_ADMIN' && user.hospitalId !== targetHospitalId) {
      return NextResponse.json({ error: 'Cannot book appointments for doctors outside your hospital' }, { status: 403 });
    }

    // 3. Validate against past date
    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return NextResponse.json({ error: 'Appointments cannot be booked in the past.' }, { status: 400 });
    }

    // 4. Validate slot availability via schedule config
    const scheduleConfig = parseScheduleConfig(doctorProfile.slotConfigJson);
    const slotCheck = await generateDoctorAvailableSlots({
      doctorId: doctorUserId,
      date,
      scheduleConfig
    });

    if (!slotCheck.isWorkingDay) {
      return NextResponse.json(
        { error: slotCheck.message || 'Doctor is not available on this date' },
        { status: 400 }
      );
    }

    const matchingSlot = slotCheck.slots.find(
      s => s.timeSlot.toUpperCase() === timeSlot.toUpperCase()
    );

    if (!matchingSlot) {
      return NextResponse.json(
        { error: `The time slot ${timeSlot} does not exist in the doctor's active schedule for this day.` },
        { status: 400 }
      );
    }

    if (!matchingSlot.available) {
      return NextResponse.json(
        { error: `Slot ${timeSlot} is unavailable: ${matchingSlot.conflictReason || 'Already reserved'}` },
        { status: 409 }
      );
    }

    // 5. Concurrency-Safe Booking Transaction
    // Prisma transaction with explicit conflict handling prevents race conditions
    let newAppointment: any = null;

    try {
      newAppointment = await prisma.$transaction(async (tx) => {
        // Double check active appointment on this slot within transaction
        const existing = await tx.appointment.findFirst({
          where: {
            doctorId: doctorUserId,
            date,
            timeSlot,
            status: { notIn: ['CANCELLED', 'NO_SHOW'] }
          }
        });

        if (existing) {
          throw new Error('SLOT_ALREADY_RESERVED');
        }

        // Generate readable permanent Appointment Code
        const count = await tx.appointment.count({ where: { hospitalId: targetHospitalId } });
        const appointmentCode = `APT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

        const created = await tx.appointment.create({
          data: {
            appointmentCode,
            hospitalId: targetHospitalId,
            doctorId: doctorUserId,
            patientId: resolvedPatientId,
            departmentId: departmentId || doctorProfile.departmentId,
            date,
            timeSlot,
            durationMinutes: matchingSlot.durationMinutes || 30,
            visitType,
            type,
            reason,
            status: 'BOOKED',
            historyJson: JSON.stringify([
              {
                status: 'BOOKED',
                timestamp: new Date().toISOString(),
                byUserId: user.id,
                byName: user.name || user.email,
                note: 'Appointment booked successfully'
              }
            ])
          },
          include: {
            patient: true,
            doctor: { select: { id: true, name: true, email: true } },
            department: true,
            hospital: true
          }
        });

        return created;
      });
    } catch (txErr: any) {
      if (txErr.message === 'SLOT_ALREADY_RESERVED' || txErr.code === 'P2002') {
        return NextResponse.json(
          {
            error: `This time slot (${timeSlot} on ${date}) has just been reserved by another patient. Please choose another slot.`,
            code: 'SLOT_CONFLICT'
          },
          { status: 409 }
        );
      }
      throw txErr;
    }

    // 6. Audit Log
    await createAuditLog({
      hospitalId: targetHospitalId,
      userId: user.id,
      action: 'APPOINTMENT_BOOKED',
      resource: `Appointment:${newAppointment.appointmentCode}`,
      details: {
        appointmentCode: newAppointment.appointmentCode,
        patientId: resolvedPatientId,
        doctorId: doctorUserId,
        date,
        timeSlot
      }
    });

    // 7. Real-Time Broadcast
    eventBroadcaster.broadcast('APPOINTMENT_BOOKED', newAppointment, targetHospitalId);

    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: newAppointment
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/appointments error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
