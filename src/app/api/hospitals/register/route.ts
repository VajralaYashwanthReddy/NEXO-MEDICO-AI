import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signJwtToken } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { addGlobalHospital } from '@/lib/hospitalStore';
import { ALL_INDIAN_STATES_AND_UTS } from '@/lib/indiaLocations';
import { generateNextHospitalRegistrationNo } from '@/lib/registrationNumber';

export async function GET(req: NextRequest) {
  try {
    const registrationNo = await generateNextHospitalRegistrationNo();
    return NextResponse.json({ registrationNo }, { status: 200 });
  } catch (err: any) {
    const year = new Date().getFullYear();
    return NextResponse.json({ registrationNo: `NMX-HOSP-${year}-000001` }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

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
    pinCode,
    website,
    emergencyContact,
    numberDepartments,
    numberBeds,
    adminName,
    adminEmail,
    adminPassword
  } = body;

  // 1. Strict required field validation
  if (!hospitalName?.trim()) {
    return NextResponse.json({ error: 'Hospital legal name is required', field: 'hospitalName' }, { status: 400 });
  }
  if (!email?.trim() || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid hospital official email is required', field: 'email' }, { status: 400 });
  }
  if (!phone?.trim()) {
    return NextResponse.json({ error: 'Hospital contact phone number is required', field: 'phone' }, { status: 400 });
  }
  if (!address?.trim()) {
    return NextResponse.json({ error: 'Hospital street address is required', field: 'address' }, { status: 400 });
  }
  if (!city?.trim()) {
    return NextResponse.json({ error: 'Hospital city is required', field: 'city' }, { status: 400 });
  }
  if (!emergencyContact?.trim()) {
    return NextResponse.json({ error: '24/7 Emergency dispatch line is required', field: 'emergencyContact' }, { status: 400 });
  }
  if (!adminName?.trim()) {
    return NextResponse.json({ error: 'Administrator full name is required', field: 'adminName' }, { status: 400 });
  }
  if (!adminEmail?.trim() || !adminEmail.includes('@')) {
    return NextResponse.json({ error: 'Valid administrator login email is required', field: 'adminEmail' }, { status: 400 });
  }
  if (!adminPassword || adminPassword.length < 6) {
    return NextResponse.json({ error: 'Administrator password must be at least 6 characters', field: 'adminPassword' }, { status: 400 });
  }

  // 2. Normalization
  let finalRegNo = (registrationNo || '').trim().toUpperCase();
  if (!finalRegNo) {
    finalRegNo = await generateNextHospitalRegistrationNo();
  }
  const finalHospitalEmail = email.toLowerCase().trim();
  const finalAdminEmail = adminEmail.toLowerCase().trim();
  const finalPhone = phone.trim();
  const phoneDigits = finalPhone.replace(/\D/g, '');

  const finalCountry = (country?.trim() === 'IN' || country?.trim() === 'India (IND)' || !country?.trim()) ? 'IN' : country.trim();
  const finalState = state?.trim() || '';

  // 3. Location State / UT & PIN Code validation
  const cleanPin = String(pinCode || '').trim().replace(/\s+/g, '');
  if (!cleanPin) {
    return NextResponse.json({ error: 'PIN Code is required', field: 'pinCode' }, { status: 400 });
  }
  if (finalCountry === 'IN') {
    if (!/^\d{6}$/.test(cleanPin)) {
      return NextResponse.json({
        error: 'Please enter a valid 6-digit Indian PIN code (digits only)',
        field: 'pinCode'
      }, { status: 400 });
    }
    if (!finalState || !ALL_INDIAN_STATES_AND_UTS.includes(finalState)) {
      return NextResponse.json({
        error: 'Please select a valid Indian State or Union Territory from the dropdown list.',
        field: 'state'
      }, { status: 400 });
    }
  } else {
    if (cleanPin.length < 3 || cleanPin.length > 10) {
      return NextResponse.json({
        error: 'Please enter a valid postal code',
        field: 'pinCode'
      }, { status: 400 });
    }
    if (!finalState) {
      return NextResponse.json({
        error: 'State / Province is required.',
        field: 'state'
      }, { status: 400 });
    }
  }

  // 4. Phone number format validation
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return NextResponse.json({
      error: 'Please enter a valid phone number (between 7 and 15 digits).',
      field: 'phone'
    }, { status: 400 });
  }

  try {
    // 5. Check for duplicate official hospital email
    const existingHospEmail = await prisma.hospital.findUnique({
      where: { email: finalHospitalEmail }
    });
    if (existingHospEmail) {
      return NextResponse.json({
        error: 'Email is already used. Please use a different email address.',
        field: 'email'
      }, { status: 409 });
    }

    // 6. Check for duplicate administrator email
    const existingAdminUser = await prisma.user.findUnique({
      where: { email: finalAdminEmail }
    });
    if (existingAdminUser) {
      return NextResponse.json({
        error: 'Email is already used. Please use a different email address.',
        field: 'adminEmail'
      }, { status: 409 });
    }

    // 7. Check for duplicate hospital phone number
    const existingHospPhone = await prisma.hospital.findFirst({
      where: {
        OR: [
          { phone: finalPhone },
          ...(phoneDigits.length >= 10 ? [{ phone: { endsWith: phoneDigits.slice(-10) } }] : [])
        ]
      }
    });
    if (existingHospPhone) {
      return NextResponse.json({
        error: 'Phone number is already used. Please use a different phone number.',
        field: 'phone'
      }, { status: 409 });
    }

    // 8. Check for duplicate hospital registration number
    const existingHospReg = await prisma.hospital.findUnique({
      where: { registrationNo: finalRegNo }
    });
    if (existingHospReg) {
      if (finalRegNo.startsWith('NMX-HOSP-')) {
        finalRegNo = await generateNextHospitalRegistrationNo();
      } else {
        return NextResponse.json({
          error: 'Registration number is already in use. Please check the registration number.',
          field: 'registrationNo'
        }, { status: 409 });
      }
    }

    // 9. Hash administrator password
    const passwordHash = await hashPassword(adminPassword);

    // 10. Execute all database writes inside an atomic Prisma transaction
    const { hospital, adminUser } = await prisma.$transaction(async (tx) => {
      // 10a. Create Hospital Tenant
      const createdHospital = await tx.hospital.create({
        data: {
          name: hospitalName.trim(),
          type: hospitalType?.trim() || 'General Hospital',
          registrationNo: finalRegNo,
          email: finalHospitalEmail,
          phone: finalPhone,
          address: address.trim(),
          city: city.trim(),
          state: finalState,
          country: finalCountry,
          pinCode: cleanPin,
          website: website?.trim() || null,
          emergencyContact: emergencyContact.trim(),
          deptCount: parseInt(numberDepartments || '5', 10) || 5,
          bedCount: parseInt(numberBeds || '50', 10) || 50,
          status: 'ACTIVE'
        }
      });

      // 10b. Create Hospital Administrator User
      const createdAdminUser = await tx.user.create({
        data: {
          email: finalAdminEmail,
          passwordHash,
          name: adminName.trim(),
          role: 'HOSPITAL_ADMIN',
          hospitalId: createdHospital.id,
          status: 'ACTIVE'
        }
      });

      // 10c. Create Core Default Departments in batch
      const defaultDepts = [
        { code: 'GENMED', name: 'General Medicine', description: 'Internal medicine & outpatient care' },
        { code: 'EMERG', name: 'Emergency', description: '24/7 Triage & Acute Trauma' },
        { code: 'CARD', name: 'Cardiology', description: 'Cardiovascular diagnostics & care' },
        { code: 'NEUR', name: 'Neurology', description: 'Neurological & spinal health' },
        { code: 'ICU_DEPT', name: 'Intensive Care', description: 'Critical care & life support unit' }
      ];

      await tx.department.createMany({
        data: defaultDepts.map(d => ({
          hospitalId: createdHospital.id,
          code: d.code,
          name: d.name,
          description: d.description,
          status: 'ACTIVE'
        }))
      });

      // 10d. Create Default Wards & Beds in batch
      const genWard = await tx.ward.create({
        data: {
          hospitalId: createdHospital.id,
          code: 'WARD-GEN',
          name: 'General Ward',
          type: 'General',
          totalBeds: 10
        }
      });

      const icuWard = await tx.ward.create({
        data: {
          hospitalId: createdHospital.id,
          code: 'WARD-ICU',
          name: 'ICU Ward',
          type: 'ICU',
          totalBeds: 5
        }
      });

      const bedsData = [
        ...Array.from({ length: 10 }, (_, i) => ({
          wardId: genWard.id,
          hospitalId: createdHospital.id,
          bedNumber: `G-${i < 9 ? '0' + (i + 1) : i + 1}`,
          status: 'AVAILABLE'
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          wardId: icuWard.id,
          hospitalId: createdHospital.id,
          bedNumber: `ICU-${i < 9 ? '0' + (i + 1) : i + 1}`,
          status: 'AVAILABLE'
        }))
      ];

      await tx.bed.createMany({
        data: bedsData
      });

      return { hospital: createdHospital, adminUser: createdAdminUser };
    }, { maxWait: 15000, timeout: 30000 });

    // 11. Broadcast and sync with global store for instant real-time platform availability
    addGlobalHospital(hospital);

    // 12. Create audit log
    try {
      await createAuditLog({
        hospitalId: hospital.id,
        userId: adminUser.id,
        action: 'HOSPITAL_REGISTERED',
        resource: `Hospital:${hospital.id}`,
        details: { name: hospital.name, registrationNo: hospital.registrationNo, adminEmail: adminUser.email }
      });
    } catch (auditErr) {
      console.warn('Audit log skipped during registration:', auditErr);
    }

    // 13. Sign JWT Token
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
        role: adminUser.role,
        hospitalId: hospital.id,
        hospitalName: hospital.name
      },
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        hospitalId: hospital.id,
        hospitalName: hospital.name
      },
      token
    }, { status: 201 });

    response.cookies.set('nexo_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });

    return response;

  } catch (err: any) {
    console.error('Database transaction error during hospital registration:', err);

    // Handle Prisma unique constraint violations (P2002)
    if (err.code === 'P2002') {
      const metaTarget = Array.isArray(err.meta?.target) ? err.meta.target.join(' ') : String(err.meta?.target || '');

      if (metaTarget.includes('email')) {
        return NextResponse.json({
          error: 'Email is already used. Please use a different email address.',
          field: metaTarget.includes('User') || metaTarget.includes('admin') ? 'adminEmail' : 'email'
        }, { status: 409 });
      }

      if (metaTarget.includes('phone')) {
        return NextResponse.json({
          error: 'Phone number is already used. Please use a different phone number.',
          field: 'phone'
        }, { status: 409 });
      }

      if (metaTarget.includes('registrationNo')) {
        return NextResponse.json({
          error: 'Registration number is already in use. Please check the registration number.',
          field: 'registrationNo'
        }, { status: 409 });
      }

      return NextResponse.json({
        error: 'Email is already used. Please use a different email address.',
        field: 'email'
      }, { status: 409 });
    }

    return NextResponse.json({
      error: err.message || 'Hospital registration failed. Please verify your details and try again.'
    }, { status: 500 });
  }
}
