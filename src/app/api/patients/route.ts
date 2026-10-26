import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, hashPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { eventBroadcaster } from '@/lib/events';
import { getGlobalPatients, addGlobalPatient, togglePatientStatusInMemory, deleteGlobalPatientInMemory } from '@/lib/patientStore';

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

    const clientPatientsHeader = req.headers.get('x-client-patients');
    if (clientPatientsHeader) {
      try {
        const parsed = JSON.parse(decodeURIComponent(clientPatientsHeader));
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach(p => {
            if (p && (p.patientCode || p.id)) {
              addGlobalPatient(p);
            }
          });
        }
      } catch (e) {}
    }

    let dbPatients: any[] = [];
    try {
      if (user.role === 'PATIENT') {
        dbPatients = await prisma.patient.findMany({
          where: {
            OR: [
              { userId: user.id },
              ...(user.email ? [{ email: user.email.toLowerCase().trim() }] : []),
              ...((user as any).patientCode ? [{ patientCode: (user as any).patientCode }] : [])
            ]
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
          }
        });
      } else {
        dbPatients = await prisma.patient.findMany({
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
      }
    } catch (dbErr: any) {
      console.warn('Database query fallback to in-memory patient store:', dbErr.message);
    }

    // Combine Prisma patients with fallback in-memory patient store
    const fallbackPatients = getGlobalPatients().filter(p => {
      if (user.role === 'PATIENT') {
        const uEmail = user.email?.toLowerCase().trim();
        const uCode = (user as any).patientCode;
        return (p.userId === user.id) || (uEmail && p.email?.toLowerCase().trim() === uEmail) || (uCode && p.patientCode === uCode);
      }
      if (hospitalIdFilter && p.hospitalId !== hospitalIdFilter) return false;
      if (!isGlobal && user.hospitalId && p.hospitalId !== user.hospitalId) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.patientCode?.toLowerCase().includes(q) ||
          p.fullName?.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const combinedMap = new Map();
    dbPatients.forEach(p => {
      combinedMap.set(p.id, p);
      if (p.patientCode) combinedMap.set(p.patientCode, p);
    });

    fallbackPatients.forEach(p => {
      const existing = combinedMap.get(p.id) || combinedMap.get(p.patientCode);
      if (!existing) {
        combinedMap.set(p.id, p);
        if (p.patientCode) combinedMap.set(p.patientCode, p);
      } else {
        if (p.user?.status && existing.user) {
          existing.user.status = p.user.status;
        }
      }
    });

    const combinedPatients = Array.from(new Set(combinedMap.values()));

    return NextResponse.json({ patients: combinedPatients, isGlobalSearch: isGlobal });
  } catch (err: any) {
    console.warn('API /patients error fallback:', err.message);
    return NextResponse.json({ patients: getGlobalPatients(), isGlobalSearch: true });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    // Check if caller's hospital is suspended
    if (user.role !== 'SUPER_ADMIN' && user.hospitalId) {
      const hosp = await prisma.hospital.findUnique({
        where: { id: user.hospitalId },
        select: { status: true }
      });
      if (hosp?.status === 'SUSPENDED') {
        return NextResponse.json({
          error: 'Your hospital account has been suspended. Please contact the platform administrator for assistance.',
          code: 'HOSPITAL_SUSPENDED'
        }, { status: 403 });
      }
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

    const emailClean = email ? email.toLowerCase().trim() : '';
    const phoneClean = phone.trim();
    const phoneDigits = phoneClean.replace(/\D/g, '');

    // 1. Strict Duplicate Email Validation (normalized)
    if (emailClean) {
      const existingUserByEmail = await prisma.user.findUnique({ where: { email: emailClean } });
      const existingPatientByEmail = await prisma.patient.findFirst({ where: { email: emailClean } });
      if (existingUserByEmail || existingPatientByEmail) {
        return NextResponse.json({
          error: 'Email already exists. Please use a different email address.',
          field: 'email'
        }, { status: 409 });
      }
    }

    // 2. Strict Duplicate Phone Validation (normalized)
    const allPatients = await prisma.patient.findMany({ select: { id: true, phone: true } });
    const duplicatePhonePatient = allPatients.find(p => {
      if (!p.phone) return false;
      const pDigits = p.phone.replace(/\D/g, '');
      if (p.phone.trim() === phoneClean) return true;
      if (phoneDigits.length >= 7 && pDigits.length >= 7) {
        if (phoneDigits === pDigits) return true;
        if (phoneDigits.length >= 10 && pDigits.length >= 10 && phoneDigits.slice(-10) === pDigits.slice(-10)) return true;
      }
      return false;
    });

    if (duplicatePhonePatient) {
      return NextResponse.json({
        error: 'Phone number already exists. Please use a different phone number.',
        field: 'phone'
      }, { status: 409 });
    }

    // Target Hospital ID
    let targetHospitalId = hospitalId || user.hospitalId;
    if (!targetHospitalId) {
      const defHosp = await prisma.hospital.findFirst({ where: { status: 'ACTIVE' } });
      targetHospitalId = defHosp?.id || 'hosp-metro-01';
    }

    const globalCount = await prisma.patient.count();
    const patientCode = `NEXO-PAT-${String(globalCount + 1).padStart(6, '0')}`;
    const patientEmail = emailClean || `${patientCode.toLowerCase()}@patient.nexomedico.ai`;
    const patientPassword = password || 'password123';
    const passwordHash = await hashPassword(patientPassword);

    // 3. Atomic Transaction: Create linked User and Patient profile
    const { linkedUser, patientRecord } = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: patientEmail,
          passwordHash,
          name: fullName,
          role: 'PATIENT',
          hospitalId: targetHospitalId,
          status: 'ACTIVE'
        }
      });

      const createdPatient = await tx.patient.create({
        data: {
          patientCode,
          hospitalId: targetHospitalId,
          userId: createdUser.id,
          fullName,
          dob,
          gender,
          phone: phoneClean,
          email: patientEmail,
          address: address || 'N/A',
          emergencyContact: emergencyContact || phoneClean,
          bloodGroup: bloodGroup || 'O+',
          allergies: allergies || null,
          conditions: conditions || null,
          previousHistory: previousHistory || null
        }
      });

      return { linkedUser: createdUser, patientRecord: createdPatient };
    });

    try {
      addGlobalPatient(patientRecord as any);
    } catch (e) {}

    try {
      await createAuditLog({
        hospitalId: targetHospitalId,
        userId: user.id,
        action: 'PATIENT_REGISTER_GLOBAL',
        resource: `Patient:${patientRecord.patientCode}`,
        details: { fullName: patientRecord.fullName, patientCode: patientRecord.patientCode, email: patientEmail }
      });
    } catch (auditErr) {}

    try {
      eventBroadcaster.broadcast('PATIENT_REGISTERED', {
        patient: patientRecord,
        patientCode,
        fullName: patientRecord.fullName,
        hospitalId: targetHospitalId
      });
    } catch (bcErr) {}

    return NextResponse.json({
      message: 'Patient registered with Universal Identity Code and portal access created',
      patient: patientRecord,
      credentials: {
        patientCode,
        loginIdentifier: patientEmail,
        defaultPassword: patientPassword,
        loginUrl: '/login'
      }
    }, { status: 201 });
  } catch (err: any) {
    console.error('Registration route error:', err);

    if (err.code === 'P2002') {
      const metaTarget = Array.isArray(err.meta?.target) ? err.meta.target.join(' ') : String(err.meta?.target || '');
      if (metaTarget.includes('email')) {
        return NextResponse.json({
          error: 'Email already exists. Please use a different email address.',
          field: 'email'
        }, { status: 409 });
      }
      if (metaTarget.includes('phone')) {
        return NextResponse.json({
          error: 'Phone number already exists. Please use a different phone number.',
          field: 'phone'
        }, { status: 409 });
      }
      return NextResponse.json({
        error: 'Email already exists. Please use a different email address.',
        field: 'email'
      }, { status: 409 });
    }

    return NextResponse.json({ error: err.message || 'Failed to register patient' }, { status: 500 });
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

    togglePatientStatusInMemory(patientId, status);

    try {
      const patient = await prisma.patient.findFirst({
        where: {
          OR: [
            { id: patientId },
            { patientCode: patientId }
          ]
        },
        include: { user: true }
      });

      if (patient && patient.userId) {
        await prisma.user.update({
          where: { id: patient.userId },
          data: { status: status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED' }
        });
      }

      await createAuditLog({
        hospitalId: patient?.hospitalId || 'hosp-metro-01',
        userId: user.id,
        action: status === 'ACTIVE' ? 'PATIENT_ACTIVATED' : 'PATIENT_SUSPENDED',
        resource: `Patient:${patient?.patientCode || patientId}`,
        details: { patientId, newStatus: status }
      });
    } catch (dbErr: any) {
      console.warn('Prisma DB status update fallback:', dbErr.message);
    }

    try {
      eventBroadcaster.broadcast('PATIENT_REGISTERED', { patientId, status });
    } catch (e) {}

    return NextResponse.json({ message: `Patient account ${status.toLowerCase()} successfully` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update status' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'HOSPITAL_ADMIN')) {
      return NextResponse.json({ error: 'Only Administrators can permanently delete patient records' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('id') || searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required for permanent deletion' }, { status: 400 });
    }

    deleteGlobalPatientInMemory(patientId);

    try {
      const patient = await prisma.patient.findFirst({
        where: {
          OR: [
            { id: patientId },
            { patientCode: patientId }
          ]
        }
      });

      if (patient) {
        await prisma.patient.delete({ where: { id: patient.id } });
        if (patient.userId) {
          await prisma.user.delete({ where: { id: patient.userId } });
        }
      }
    } catch (dbErr: any) {
      console.warn('Prisma DB permanent delete fallback:', dbErr.message);
    }

    return NextResponse.json({ message: 'Patient record permanently deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete patient record' }, { status: 500 });
  }
}
