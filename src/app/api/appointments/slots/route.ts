import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  parseScheduleConfig,
  generateDoctorAvailableSlots
} from '@/lib/appointmentSlots';

// GET /api/appointments/slots?doctorId=...&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: 'doctorId and date (YYYY-MM-DD) are required query parameters' },
        { status: 400 }
      );
    }

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Locate doctor profile
    const doctorProfile = await prisma.doctorProfile.findFirst({
      where: {
        OR: [
          { userId: doctorId },
          { id: doctorId }
        ]
      },
      include: {
        user: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } }
      }
    });

    if (!doctorProfile) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const schedule = parseScheduleConfig(doctorProfile.slotConfigJson);
    const targetUserId = doctorProfile.user.id;

    const slotResult = await generateDoctorAvailableSlots({
      doctorId: targetUserId,
      date,
      scheduleConfig: schedule
    });

    return NextResponse.json({
      success: true,
      doctorId: targetUserId,
      doctorName: doctorProfile.user.name,
      department: doctorProfile.department?.name,
      consultationFee: doctorProfile.consultationFee,
      allowInPerson: schedule.allowInPerson,
      allowTeleconsultation: schedule.allowTeleconsultation,
      consultationLocation: schedule.consultationLocation,
      ...slotResult
    });
  } catch (err: any) {
    console.error('Available slots API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
