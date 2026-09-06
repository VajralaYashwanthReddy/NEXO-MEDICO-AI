import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePasswords, signJwtToken } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email or Universal Patient ID and password are required' }, { status: 400 });
    }

    const inputClean = email.trim();
    let user: any = null;

    // Check if input is a Universal Patient ID (NEXO-PAT-xxxxxx)
    if (inputClean.toUpperCase().startsWith('NEXO-PAT-')) {
      const patient = await prisma.patient.findUnique({
        where: { patientCode: inputClean.toUpperCase() },
        include: { user: { include: { hospital: true } } }
      });
      if (patient && patient.user) {
        user = patient.user;
      }
    } else {
      // Find user by Email
      user = await prisma.user.findUnique({
        where: { email: inputClean.toLowerCase() },
        include: { hospital: true }
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid Email / Universal Patient ID or password' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({
        error: 'Your account is inactive/suspended. Please contact system administrator.'
      }, { status: 403 });
    }

    const passwordMatch = await comparePasswords(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid Email / Universal Patient ID or password' }, { status: 401 });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId,
      departmentId: user.departmentId
    };

    const token = signJwtToken(payload);

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'USER_LOGIN',
      resource: `User:${user.email}`,
      details: { role: user.role }
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: user.hospital?.name || null
      },
      token
    });

    response.cookies.set('nexo_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400 // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed: ' + error.message }, { status: 500 });
  }
}
