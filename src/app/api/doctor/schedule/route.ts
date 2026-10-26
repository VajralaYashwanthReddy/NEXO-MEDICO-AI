import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import {
  parseScheduleConfig,
  generateDoctorAvailableSlots,
  DEFAULT_DOCTOR_SCHEDULE
} from '@/lib/appointmentSlots';

// GET /api/doctor/schedule?doctorId=...
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const requestedDoctorId = searchParams.get('doctorId');

    let targetDoctorUserId = requestedDoctorId;

    if (!targetDoctorUserId) {
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (user.role === 'DOCTOR') {
        targetDoctorUserId = user.id;
      } else {
        return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });
      }
    }

    // Locate doctor profile
    const doctorProfile = await prisma.doctorProfile.findFirst({
      where: {
        OR: [
          { userId: targetDoctorUserId },
          { id: targetDoctorUserId }
        ]
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        hospital: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, code: true } }
      }
    });

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    const schedule = parseScheduleConfig(doctorProfile.slotConfigJson);

    return NextResponse.json({
      doctor: {
        id: doctorProfile.user.id,
        profileId: doctorProfile.id,
        name: doctorProfile.user.name,
        specialization: doctorProfile.specialization,
        department: doctorProfile.department,
        consultationFee: doctorProfile.consultationFee,
        hospitalId: doctorProfile.hospitalId
      },
      schedule
    });
  } catch (err: any) {
    console.error('Doctor schedule GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/doctor/schedule
// Doctor updating own schedule, or Hospital Admin updating doctor in their hospital
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { doctorId, schedule } = body;

    let targetDoctorUserId = doctorId || user.id;

    // Authorization check
    if (user.role === 'DOCTOR' && targetDoctorUserId !== user.id) {
      return NextResponse.json({ error: 'Doctors can only modify their own consultation schedule' }, { status: 403 });
    }

    // Hospital Admin can update doctors in their own hospital
    if (user.role === 'HOSPITAL_ADMIN') {
      if (!user.hospitalId) {
        return NextResponse.json({ error: 'Hospital context required' }, { status: 403 });
      }
      const doc = await prisma.doctorProfile.findFirst({
        where: {
          OR: [{ userId: targetDoctorUserId }, { id: targetDoctorUserId }],
          hospitalId: user.hospitalId
        }
      });
      if (!doc) {
        return NextResponse.json({ error: 'Doctor not found in your hospital' }, { status: 404 });
      }
      targetDoctorUserId = doc.userId;
    }

    const doctorProfile = await prisma.doctorProfile.findFirst({
      where: {
        OR: [{ userId: targetDoctorUserId }, { id: targetDoctorUserId }]
      }
    });

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    // Save schedule configuration
    const updatedProfile = await prisma.doctorProfile.update({
      where: { id: doctorProfile.id },
      data: {
        slotConfigJson: JSON.stringify(schedule)
      }
    });

    await createAuditLog({
      hospitalId: doctorProfile.hospitalId,
      userId: user.id,
      action: 'DOCTOR_SCHEDULE_UPDATED',
      resource: `DoctorProfile:${doctorProfile.id}`,
      details: { doctorId: doctorProfile.userId, schedule }
    });

    return NextResponse.json({
      success: true,
      message: 'Consultation schedule saved successfully',
      schedule: parseScheduleConfig(updatedProfile.slotConfigJson)
    });
  } catch (err: any) {
    console.error('Doctor schedule PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
