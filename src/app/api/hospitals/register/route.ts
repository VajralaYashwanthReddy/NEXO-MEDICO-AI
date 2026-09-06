import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signJwtToken } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      hospitalName,
      hospitalType,
      registrationNo,
      email,
      phone,
      address,
      city,
      state,
      country,
      website,
      emergencyContact,
      numberDepartments,
      numberBeds,
      adminName,
      adminEmail,
      adminPassword
    } = body;

    if (!hospitalName || !registrationNo || !email || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Missing required hospital or admin registration fields' }, { status: 400 });
    }

    // Check existing registration
    const existingHosp = await prisma.hospital.findFirst({
      where: {
        OR: [{ registrationNo }, { email }]
      }
    });

    if (existingHosp) {
      return NextResponse.json({ error: 'A hospital with this registration number or email already exists' }, { status: 400 });
    }

    const existingAdminUser = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase().trim() }
    });

    if (existingAdminUser) {
      return NextResponse.json({ error: 'An account with this administrator email already exists' }, { status: 400 });
    }

    // 1. Create Hospital Tenant
    const hospital = await prisma.hospital.create({
      data: {
        name: hospitalName,
        type: hospitalType || 'General Hospital',
        registrationNo,
        email: email.toLowerCase().trim(),
        phone,
        address,
        city: city || 'City',
        state: state || 'State',
        country: country || 'Country',
        website: website || null,
        emergencyContact: emergencyContact || phone,
        deptCount: parseInt(numberDepartments || '5'),
        bedCount: parseInt(numberBeds || '50'),
        status: 'ACTIVE'
      }
    });

    // 2. Create Hospital Admin User
    const passwordHash = await hashPassword(adminPassword);
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail.toLowerCase().trim(),
        passwordHash,
        name: adminName || `${hospitalName} Admin`,
        role: 'HOSPITAL_ADMIN',
        hospitalId: hospital.id,
        status: 'ACTIVE'
      }
    });

    // 3. Create default core departments for the onboarding hospital
    const defaultDepts = [
      { code: 'GENMED', name: 'General Medicine', description: 'Internal medicine & outpatient care' },
      { code: 'EMERG', name: 'Emergency', description: '24/7 Triage & Acute Trauma' },
      { code: 'CARD', name: 'Cardiology', description: 'Cardiovascular diagnostics & care' },
      { code: 'NEUR', name: 'Neurology', description: 'Neurological & spinal health' },
      { code: 'ICU_DEPT', name: 'Intensive Care', description: 'Critical care & life support unit' }
    ];

    for (const d of defaultDepts) {
      await prisma.department.create({
        data: {
          hospitalId: hospital.id,
          code: d.code,
          name: d.name,
          description: d.description,
          status: 'ACTIVE'
        }
      });
    }

    // 4. Create default Wards & Beds
    const genWard = await prisma.ward.create({
      data: {
        hospitalId: hospital.id,
        code: 'WARD-GEN',
        name: 'General Ward',
        type: 'General',
        totalBeds: 10
      }
    });

    for (let i = 1; i <= 10; i++) {
      await prisma.bed.create({
        data: {
          wardId: genWard.id,
          hospitalId: hospital.id,
          bedNumber: `G-${i < 10 ? '0' + i : i}`,
          status: 'AVAILABLE'
        }
      });
    }

    const icuWard = await prisma.ward.create({
      data: {
        hospitalId: hospital.id,
        code: 'WARD-ICU',
        name: 'ICU Ward',
        type: 'ICU',
        totalBeds: 5
      }
    });

    for (let i = 1; i <= 5; i++) {
      await prisma.bed.create({
        data: {
          wardId: icuWard.id,
          hospitalId: hospital.id,
          bedNumber: `ICU-${i < 10 ? '0' + i : i}`,
          status: 'AVAILABLE'
        }
      });
    }

    await prisma.iCUUnit.create({
      data: {
        hospitalId: hospital.id,
        code: 'ICU-MAIN',
        name: 'Main ICU Unit',
        capacity: 5,
        location: '5th Floor'
      }
    });

    await createAuditLog({
      hospitalId: hospital.id,
      userId: adminUser.id,
      action: 'HOSPITAL_REGISTERED',
      resource: `Hospital:${hospital.id}`,
      details: { name: hospital.name, registrationNo: hospital.registrationNo }
    });

    const token = signJwtToken({
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      hospitalId: hospital.id
    });

    const response = NextResponse.json({
      message: 'Hospital registered successfully',
      hospital,
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      },
      token
    }, { status: 201 });

    response.cookies.set('nexo_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 86400
    });

    return response;
  } catch (err: any) {
    console.error('Hospital registration error:', err);
    return NextResponse.json({ error: 'Hospital registration failed: ' + err.message }, { status: 500 });
  }
}
