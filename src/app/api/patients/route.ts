import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, hashPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const hospitalIdFilter = searchParams.get('hospitalId');
    const isGlobal = searchParams.get('global') === 'true' || user.role === 'SUPER_ADMIN' || search.toUpperCase().startsWith('NEXO-PAT-');

    const patients = await prisma.patient.findMany({
      where: {
        ...(hospitalIdFilter ? { hospitalId: hospitalIdFilter } : (isGlobal ? {} : { hospitalId: user.hospitalId || undefined })),
        ...(search ? {
          OR: [
            { patientCode: { contains: search } },
            { fullName: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } }
          ]
        } : {})
      },
      include: {
        hospital: { select: { id: true, name: true, city: true } },
        user: { select: { id: true, email: true, status: true } },
        _count: {
          select: {
            appointments: true,
            consultations: true,
            prescriptions: true,
            labOrders: true,
            admissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ patients, isGlobalSearch: isGlobal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const {
      fullName,
      dob,
      gender,
      phone,
      email,
      password,
      address,
      emergencyContact,
      bloodGroup,
      allergies,
      conditions,
      previousHistory,
      hospitalId
    } = await req.json();

    if (!fullName || !dob || !phone || !gender) {
      return NextResponse.json({ error: 'Full name, date of birth, phone, and gender are required' }, { status: 400 });
    }

    // Determine target hospital ID
    let targetHospitalId = hospitalId || user.hospitalId;
    if (!targetHospitalId) {
      const firstHospital = await prisma.hospital.findFirst({ select: { id: true } });
      targetHospitalId = firstHospital?.id || null;
    }

    // Generate Universal Patient ID Code NEXO-PAT-xxxxxx
    const globalCount = await prisma.patient.count();
    const patientCode = `NEXO-PAT-${String(globalCount + 1).padStart(6, '0')}`;

    // Generate Patient Account User for Portal Login
    const patientEmail = email ? email.toLowerCase().trim() : `${patientCode.toLowerCase()}@patient.nexomedico.ai`;
    const patientPassword = password || 'password123';
    const passwordHash = await hashPassword(patientPassword);

    let linkedUser = await prisma.user.findUnique({ where: { email: patientEmail } });
    if (!linkedUser) {
      linkedUser = await prisma.user.create({
        data: {
          email: patientEmail,
          passwordHash,
          name: fullName,
          role: 'PATIENT',
          hospitalId: targetHospitalId,
          status: 'ACTIVE'
        }
      });
    }

    const patient = await prisma.patient.create({
      data: {
        patientCode,
        hospitalId: targetHospitalId,
        userId: linkedUser.id,
        fullName,
        dob,
        gender,
        phone,
        email: patientEmail,
        address: address || 'N/A',
        emergencyContact: emergencyContact || phone,
        bloodGroup: bloodGroup || 'O+',
        allergies: allergies || null,
        conditions: conditions || null,
        previousHistory: previousHistory || null
      }
    });

    await createAuditLog({
      hospitalId: targetHospitalId,
      userId: user.id,
      action: 'PATIENT_REGISTER_GLOBAL',
      resource: `Patient:${patient.patientCode}`,
      details: { fullName: patient.fullName, patientCode: patient.patientCode, email: patientEmail }
    });

    return NextResponse.json({
      message: 'Patient registered with Universal Identity Code and portal access created',
      patient,
      credentials: {
        patientCode,
        loginIdentifier: patientEmail,
        defaultPassword: patientPassword,
        loginUrl: '/login'
      }
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Platform Master Super Admin is authorized to suspend or activate patient accounts' }, { status: 403 });
    }

    const { patientId, status } = await req.json();

    if (!patientId || !status) {
      return NextResponse.json({ error: 'Patient ID and new status are required' }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient record not found' }, { status: 404 });
    }

    // If patient has a linked user account, update user status as well
    if (patient.userId) {
      await prisma.user.update({
        where: { id: patient.userId },
        data: { status: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED' }
      });
    }

    await createAuditLog({
      hospitalId: patient.hospitalId,
      userId: user.id,
      action: status === 'ACTIVE' ? 'PATIENT_ACTIVATED' : 'PATIENT_SUSPENDED',
      resource: `Patient:${patient.patientCode}`,
      details: { patientId: patient.id, newStatus: status }
    });

    return NextResponse.json({ message: `Patient account ${status.toLowerCase()} successfully` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
