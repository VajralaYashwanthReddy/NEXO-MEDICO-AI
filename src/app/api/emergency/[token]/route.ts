import { NextRequest, NextResponse } from 'next/server';
import { resolvePublicEmergencyProfile } from '@/lib/emergencyQrService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Unknown';

  const profileData = await resolvePublicEmergencyProfile(token, { ip, userAgent });

  if (!profileData) {
    return NextResponse.json(
      { error: 'Emergency profile not found or link has expired.' },
      {
        status: 404,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    );
  }

  return NextResponse.json(
    { profile: profileData },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Surrogate-Control': 'no-store'
      }
    }
  );
}
