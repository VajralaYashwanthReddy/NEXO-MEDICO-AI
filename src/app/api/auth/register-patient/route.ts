import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signJwtToken } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const {
      fullName,
      email,
      password,
      dob,
      gender,
      phone,
      address,
      emergencyContact,
      bloodGroup,
      allergies,
      conditions
    } = await req.json();

    if (!fullName || !email || !password || !dob || !phone || !gender) {
      return NextResponse.json({ error: 'Full name, email, password, date of birth, phone, and gender are required' }, { status: 400 });
    }

    const emailClean = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: emailClean } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email address already exists. Please login instead.' }, { status: 400 });
    }

    // Generate unique Universal Patient ID (NEXO-PAT-xxxxxx)
    const count = await prisma.patient.count();
    const patientCode = `NEXO-PAT-${String(count + 1).padStart(6, '0')}`;

    // Ensure a default hospital tenant exists for initial registry binding
    let defaultHospital = await prisma.hospital.findFirst({ where: { status: 'ACTIVE' } });
    if (!defaultHospital) {
      defaultHospital = await prisma.hospital.findFirst();
    }
    if (!defaultHospital) {
      defaultHospital = await prisma.hospital.create({
        data: {
          name: 'Nexo Medico Central Healthcare Registry',
          type: 'General Hospital',
          registrationNo: 'NEXO-CENTRAL-001',
          email: 'central@nexomedico.org',
          phone: '+1 (555) 000-0000',
          emergencyContact: '+1 (555) 911-0000',
          address: 'Universal Digital Registry',
          city: 'Metropolis',
          state: 'NY',
          country: 'USA'
        }
      });
    }

    const passwordHash = await hashPassword(password);

    // 1. Create Patient User Account
    const user = await prisma.user.create({
      data: {
        email: emailClean,
        passwordHash,
        name: fullName,
        role: 'PATIENT',
        hospitalId: defaultHospital.id,
        status: 'ACTIVE'
      }
    });

    // 2. Create Patient Medical Record Profile
    const patient = await prisma.patient.create({
      data: {
        patientCode,
        hospitalId: defaultHospital.id,
        userId: user.id,
        fullName,
        dob,
        gender,
        phone,
        email: emailClean,
        address: address || 'N/A',
        emergencyContact: emergencyContact || phone,
        bloodGroup: bloodGroup || 'O+',
        allergies: allergies || null,
        conditions: conditions || null
      }
    });

    await createAuditLog({
      hospitalId: defaultHospital.id,
      userId: user.id,
      action: 'PATIENT_SELF_REGISTER',
      resource: `Patient:${patient.patientCode}`,
      details: { fullName: patient.fullName, patientCode: patient.patientCode }
    });

    const token = signJwtToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId
    });

    const response = NextResponse.json({
      message: 'Patient registered successfully! Universal Patient ID generated.',
      patientCode: patient.patientCode,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        patientCode: patient.patientCode,
        hospitalId: user.hospitalId,
        hospitalName: defaultHospital.name
      },
      patient,
      token
    }, { status: 201 });

    response.cookies.set('nexo_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 86400
    });

    return response;
  } catch (err: any) {
    console.error('Patient self registration error:', err);
    return NextResponse.json({ error: 'Patient registration failed: ' + err.message }, { status: 500 });
  }
}
