import { prisma } from '@/lib/prisma';

export interface BreakPeriod {
  start: string; // "13:00"
  end: string;   // "14:00"
  label?: string; // "Lunch Break"
}

export interface DaySchedule {
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slotDurationMinutes: number; // 15, 20, 30, 45, 60
  breaks: BreakPeriod[];
}

export interface DoctorScheduleConfig {
  timezone: string; // default "Asia/Kolkata"
  workingDays: Record<string, DaySchedule>; // "monday", "tuesday", etc.
  allowInPerson: boolean;
  allowTeleconsultation: boolean;
  consultationLocation?: string; // "OPD Room 204, Block B"
  holidays: string[]; // ["2026-12-25", "2026-01-01"]
  leavePeriods: Array<{ startDate: string; endDate: string; reason?: string }>;
}

export const DEFAULT_DOCTOR_SCHEDULE: DoctorScheduleConfig = {
  timezone: 'Asia/Kolkata',
  workingDays: {
    monday: { enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }] },
    tuesday: { enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }] },
    wednesday: { enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }] },
    thursday: { enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }] },
    friday: { enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30, breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }] },
    saturday: { enabled: true, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30, breaks: [] },
    sunday: { enabled: false, startTime: '09:00', endTime: '13:00', slotDurationMinutes: 30, breaks: [] }
  },
  allowInPerson: true,
  allowTeleconsultation: true,
  consultationLocation: 'OPD Consultation Wing, Suite 102',
  holidays: [],
  leavePeriods: []
};

export function parseScheduleConfig(jsonString?: string | null): DoctorScheduleConfig {
  if (!jsonString) return DEFAULT_DOCTOR_SCHEDULE;
  try {
    const parsed = JSON.parse(jsonString);
    return {
      timezone: parsed.timezone || DEFAULT_DOCTOR_SCHEDULE.timezone,
      workingDays: { ...DEFAULT_DOCTOR_SCHEDULE.workingDays, ...(parsed.workingDays || {}) },
      allowInPerson: parsed.allowInPerson !== undefined ? parsed.allowInPerson : true,
      allowTeleconsultation: parsed.allowTeleconsultation !== undefined ? parsed.allowTeleconsultation : true,
      consultationLocation: parsed.consultationLocation || DEFAULT_DOCTOR_SCHEDULE.consultationLocation,
      holidays: Array.isArray(parsed.holidays) ? parsed.holidays : [],
      leavePeriods: Array.isArray(parsed.leavePeriods) ? parsed.leavePeriods : []
    };
  } catch (e) {
    return DEFAULT_DOCTOR_SCHEDULE;
  }
}

export function timeToMinutes(timeStr: string): number {
  // Support "09:00", "9:00", "09:00 AM", "10:30 PM"
  const clean = timeStr.trim().toUpperCase();
  const is12Hour = clean.includes('AM') || clean.includes('PM');

  if (is12Hour) {
    const parts = clean.replace(/\s*(AM|PM)/, '').split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1] || '0', 10);
    if (clean.includes('PM') && hours !== 12) hours += 12;
    if (clean.includes('AM') && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  const [hours, minutes] = clean.split(':').map(n => parseInt(n, 10));
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTimeSlot(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

export function getDayOfWeekName(dateStr: string): string {
  // dateStr is YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(n => parseInt(n, 10));
  const d = new Date(year, month - 1, day);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[d.getDay()];
}

export interface GeneratedSlot {
  timeSlot: string;
  durationMinutes: number;
  available: boolean;
  conflictReason?: string;
}

export async function generateDoctorAvailableSlots({
  doctorId,
  date,
  scheduleConfig
}: {
  doctorId: string;
  date: string; // YYYY-MM-DD
  scheduleConfig?: DoctorScheduleConfig;
}): Promise<{
  date: string;
  dayName: string;
  isWorkingDay: boolean;
  slots: GeneratedSlot[];
  message?: string;
}> {
  const config = scheduleConfig || DEFAULT_DOCTOR_SCHEDULE;
  const dayName = getDayOfWeekName(date);
  const daySchedule = config.workingDays[dayName];

  // 1. Check if day is enabled
  if (!daySchedule || !daySchedule.enabled) {
    return {
      date,
      dayName,
      isWorkingDay: false,
      slots: [],
      message: `Doctor does not consult on ${dayName.toUpperCase()}s.`
    };
  }

  // 2. Check if date is in holiday list
  if (config.holidays.includes(date)) {
    return {
      date,
      dayName,
      isWorkingDay: false,
      slots: [],
      message: `Hospital or Doctor Holiday scheduled on ${date}.`
    };
  }

  // 3. Check if date falls in leave periods
  for (const leave of config.leavePeriods) {
    if (date >= leave.startDate && date <= leave.endDate) {
      return {
        date,
        dayName,
        isWorkingDay: false,
        slots: [],
        message: `Doctor is on leave on this date: ${leave.reason || 'Personal Leave'}.`
      };
    }
  }

  // 4. Fetch existing booked appointments from database for this doctor & date
  // Cancelled slots are released and free to be booked
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      date,
      status: {
        notIn: ['CANCELLED', 'NO_SHOW']
      }
    },
    select: {
      timeSlot: true,
      status: true
    }
  });

  const bookedSlotsSet = new Set(existingAppointments.map(a => a.timeSlot.toUpperCase().trim()));

  // 5. Generate all slots based on start/end time and duration
  const startMin = timeToMinutes(daySchedule.startTime);
  const endMin = timeToMinutes(daySchedule.endTime);
  const duration = daySchedule.slotDurationMinutes || 30;

  const breakRanges = (daySchedule.breaks || []).map(b => ({
    start: timeToMinutes(b.start),
    end: timeToMinutes(b.end),
    label: b.label || 'Break'
  }));

  const slots: GeneratedSlot[] = [];

  for (let current = startMin; current + duration <= endMin; current += duration) {
    const slotStr = minutesToTimeSlot(current);
    const slotEndMin = current + duration;

    // Check if slot overlaps with any break
    let inBreak = false;
    let breakLabel = '';
    for (const b of breakRanges) {
      // Overlap condition: start < b.end && slotEnd > b.start
      if (current < b.end && slotEndMin > b.start) {
        inBreak = true;
        breakLabel = b.label;
        break;
      }
    }

    if (inBreak) {
      slots.push({
        timeSlot: slotStr,
        durationMinutes: duration,
        available: false,
        conflictReason: breakLabel || 'Scheduled Break Period'
      });
      continue;
    }

    // Check if slot is already booked in database
    if (bookedSlotsSet.has(slotStr.toUpperCase())) {
      slots.push({
        timeSlot: slotStr,
        durationMinutes: duration,
        available: false,
        conflictReason: 'Reserved / Booked'
      });
      continue;
    }

    // Free available slot
    slots.push({
      timeSlot: slotStr,
      durationMinutes: duration,
      available: true
    });
  }

  return {
    date,
    dayName,
    isWorkingDay: true,
    slots
  };
}
