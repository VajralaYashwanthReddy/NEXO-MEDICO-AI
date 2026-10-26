import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { validateIndianPhoneNumber } from '@/lib/indiaGeoData';

export const dynamic = 'force-dynamic';

function formatDisplayMobile(phone?: string | null): string {
  if (!phone || !phone.trim()) return '';
  const clean = phone.trim();

  // If Indian number, validateIndianPhoneNumber returns formatted "+91 XXXXX XXXXX"
  const check = validateIndianPhoneNumber(clean, false);
  if (check.valid && check.normalized) {
    return check.normalized;
  }
  return clean;
}

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized context' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        patientProfile: true,
        hospital: true,
        doctorProfile: true
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const rawName = dbUser.patientProfile?.fullName || dbUser.name || 'Registered User';
    const rawEmail = dbUser.email;
    // Source of truth for personal mobile: User.phone or Patient.phone (never hospital switchboard)
    const rawMobile = (dbUser.phone && dbUser.phone.trim()) || 
                      (dbUser.patientProfile?.phone && dbUser.patientProfile.phone.trim()) || 
                      null;

    let profileUrl = '/admin/settings';
    if (dbUser.role === 'PATIENT') profileUrl = '/patient/dashboard';
    else if (dbUser.role === 'DOCTOR') profileUrl = '/doctor/dashboard';
    else if (dbUser.role === 'HOSPITAL_ADMIN') profileUrl = '/admin/settings';

    return NextResponse.json({
      name: rawName,
      email: rawEmail,
      phone: rawMobile,
      displayMobile: rawMobile ? formatDisplayMobile(rawMobile) : null,
      hasPhone: Boolean(rawMobile && rawMobile.trim() !== ''),
      role: dbUser.role,
      hospitalName: dbUser.hospital?.name || null,
      profileUrl
    });

  } catch (err: any) {
    console.error('Error fetching user contact details:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
