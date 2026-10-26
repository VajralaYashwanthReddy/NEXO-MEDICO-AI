import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signJwtToken } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { eventBroadcaster } from '@/lib/events';
import { addGlobalPatient } from '@/lib/patientStore';
import { verifyOtpChallenge } from '@/lib/otpService';
import {
  validateIndianAddress,
  validateEmergencyContact,
  validateIndianPhoneNumber,
  formatIndianAddress
} from '@/lib/indiaGeoData';
import { getOrCreatePatientEmergencyProfile } from '@/lib/emergencyQrService';

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

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
    conditions,
    // India-only address fields
    houseFlat,
    streetArea,
    landmark,
    villageWard,
    mandalTaluk,
    city,
    district,
    state,
    pinCode,
    // Detailed emergency contact
    emergencyContactName,
    emergencyContactRelation,
    emergencyContactPhone,
    challengeToken,
    otpCode
  } = body;

  if (!fullName || !email || !password || !dob || !phone || !gender) {
    return NextResponse.json({
      error: 'Full name, email, password, date of birth, phone, and gender are required.',
      field: !fullName ? 'fullName' : !email ? 'email' : !password ? 'password' : !dob ? 'dob' : !phone ? 'phone' : 'gender'
    }, { status: 400 });
  }

  // Validate Indian Phone Number
  const phoneValidation = validateIndianPhoneNumber(phone, true);
  if (!phoneValidation.valid) {
    return NextResponse.json({
      error: phoneValidation.error || 'Please enter a valid 10-digit Indian phone number.',
      field: 'phone'
    }, { status: 400 });
  }

  // Validate Indian Address
  const addressValidation = validateIndianAddress({
    houseFlat: houseFlat || (address ? address.split(',')[0] : ''),
    streetArea: streetArea || (address ? address.split(',')[1] || address : ''),
    landmark,
    villageWard,
    mandalTaluk,
    city: city || 'City',
    district: district || city || 'District',
    state: state || 'Maharashtra',
    pinCode: pinCode || '400001',
    country: 'IN'
  });

  if (!addressValidation.valid) {
    const firstKey = Object.keys(addressValidation.errors)[0];
    return NextResponse.json({
      error: addressValidation.errors[firstKey],
      field: firstKey,
      errors: addressValidation.errors
    }, { status: 400 });
  }

  // Validate Emergency Contact if provided
  let contactValidationResult: any = null;
  if (emergencyContactName || emergencyContactPhone) {
    const contactValidation = validateEmergencyContact({
      emergencyContactName: emergencyContactName || (emergencyContact ? emergencyContact.split('-')[0]?.trim() : ''),
      emergencyContactRelation,
      emergencyContactPhone: emergencyContactPhone || (emergencyContact ? emergencyContact.split('-')[1]?.trim() : '')
    });

    if (!contactValidation.valid) {
      const firstKey = Object.keys(contactValidation.errors)[0];
      return NextResponse.json({
        error: contactValidation.errors[firstKey],
        field: firstKey,
        errors: contactValidation.errors
      }, { status: 400 });
    }
    contactValidationResult = contactValidation.normalized;
  }

  const emailClean = email.toLowerCase().trim();
  const phoneClean = phone.trim();
  const phoneDigits = phoneClean.replace(/\D/g, '');

  // 0. Strictly Require and Verify Registration OTP Challenge
  if (!challengeToken || !otpCode) {
    return NextResponse.json({
      error: 'Identity verification code is required. Please verify your email with the 6-digit OTP.',
      field: 'otpCode'
    }, { status: 400 });
  }

  const verification = await verifyOtpChallenge({
    challengeToken,
    otpCode,
    purpose: 'REGISTRATION'
  });

  if (!verification.valid) {
    return NextResponse.json({
      error: verification.error || 'Invalid or expired OTP verification code.',
      field: 'otpCode'
    }, { status: 400 });
  }

  if (verification.email?.toLowerCase().trim() !== emailClean) {
    return NextResponse.json({
      error: 'The verification code was not issued for this email address. Please request a new code.',
      field: 'email'
    }, { status: 400 });
  }

  try {
    // 1. Strict Duplicate Email Validation (Normalized email check against User and Patient models)
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: emailClean }
    });
    const existingPatientByEmail = await prisma.patient.findFirst({
      where: { email: emailClean }
    });
    if (existingUserByEmail || existingPatientByEmail) {
      return NextResponse.json({
        error: 'Email already exists. Please use a different email address.',
        field: 'email'
      }, { status: 409 });
    }

    // 2. Strict Duplicate Phone Validation (Normalized digit comparison against Patient model)
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

    // 3. Generate unique Universal Patient ID (NEXO-PAT-xxxxxx) collision-free
    const existingPatientsWithCode = await prisma.patient.findMany({
      select: { patientCode: true },
      where: { patientCode: { startsWith: 'NEXO-PAT-' } }
    });
    let maxNum = 0;
    for (const p of existingPatientsWithCode) {
      const numPart = parseInt(p.patientCode.replace('NEXO-PAT-', ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
    let nextNum = Math.max(maxNum + 1, (await prisma.patient.count()) + 1);
    let patientCode = `NEXO-PAT-${String(nextNum).padStart(6, '0')}`;
    while (await prisma.patient.findUnique({ where: { patientCode } })) {
      nextNum++;
      patientCode = `NEXO-PAT-${String(nextNum).padStart(6, '0')}`;
    }

    // 4. Ensure a default hospital tenant exists for initial registry binding
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

    const normAddr = addressValidation.normalized!;
    const formattedAddress = formatIndianAddress(normAddr);
    const formattedContact = contactValidationResult
      ? `${contactValidationResult.emergencyContactName} (${contactValidationResult.emergencyContactRelation || 'Emergency'}) - ${contactValidationResult.emergencyContactPhone}`
      : (emergencyContact || phoneClean);

    // 5. Atomic Transaction: Create User Account and Patient Profile atomically
    const { user, patient } = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: emailClean,
          passwordHash,
          name: fullName,
          role: 'PATIENT',
          hospitalId: defaultHospital.id,
          status: 'ACTIVE'
        }
      });

      const createdPatient = await tx.patient.create({
        data: {
          patientCode,
          hospitalId: defaultHospital.id,
          userId: createdUser.id,
          fullName,
          dob,
          gender,
          phone: phoneValidation.normalized || phoneClean,
          email: emailClean,
          address: formattedAddress,
          emergencyContact: formattedContact,
          bloodGroup: bloodGroup || 'O+',
          allergies: allergies || null,
          conditions: conditions || null,
          // India-only address persistence
          houseFlat: normAddr.houseFlat,
          streetArea: normAddr.streetArea,
          villageWard: normAddr.villageWard || null,
          mandalTaluk: normAddr.mandalTaluk || null,
          landmark: normAddr.landmark || null,
          city: normAddr.city,
          district: normAddr.district,
          state: normAddr.state,
          pinCode: normAddr.pinCode,
          country: 'IN',
          // Dedicated emergency contact details
          emergencyContactName: contactValidationResult?.emergencyContactName || null,
          emergencyContactRelation: contactValidationResult?.emergencyContactRelation || null,
          emergencyContactPhone: contactValidationResult?.emergencyContactPhone || null
        }
      });

      return { user: createdUser, patient: createdPatient };
    });

    // 6. Automatically provision unique, cryptographically secure Emergency QR ID
    let emergencyQrData: any = null;
    try {
      emergencyQrData = await getOrCreatePatientEmergencyProfile(patient.id);
    } catch (qrErr) {
      console.error('Non-critical: failed to provision QR token during registration:', qrErr);
    }

    // Add to in-memory fallback store cache
    try {
      addGlobalPatient(patient as any);
    } catch (e) {}

    try {
      eventBroadcaster.broadcast('PATIENT_REGISTERED', {
        patient,
        patientCode: patient.patientCode,
        fullName: patient.fullName,
        hospitalId: defaultHospital.id
      });
    } catch (bcErr) {}

    try {
      await createAuditLog({
        hospitalId: defaultHospital.id,
        userId: user.id,
        action: 'PATIENT_SELF_REGISTER',
        resource: `Patient:${patient.patientCode}`,
        details: { fullName: patient.fullName, patientCode: patient.patientCode }
      });
    } catch (auditErr) {}

    const token = signJwtToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId,
      hospitalName: defaultHospital.name,
      patientCode: patient.patientCode,
      gender: patient.gender,
      dob: patient.dob,
      phone: patient.phone,
      bloodGroup: patient.bloodGroup
    });

    const isHttps = req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';

    const response = NextResponse.json({
      message: 'Patient registered successfully! Universal Patient ID generated.',
      patientCode: patient.patientCode,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        patientCode: patient.patientCode,
        gender: patient.gender,
        dob: patient.dob,
        phone: patient.phone,
        bloodGroup: patient.bloodGroup,
        hospitalId: user.hospitalId,
        hospitalName: defaultHospital.name
      },
      patient,
      emergencyQr: emergencyQrData ? {
        shortId: emergencyQrData.profile.shortId,
        emergencyUrl: emergencyQrData.emergencyUrl,
        qrDataUrl: emergencyQrData.qrDataUrl,
        status: emergencyQrData.profile.status
      } : null,
      token
    }, { status: 201 });

    response.cookies.set('nexo_token', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });

    return response;

  } catch (err: any) {
    console.error('Patient registration error:', err);

    // Handle database unique constraint errors (P2002)
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

    return NextResponse.json({
      error: err.message || 'Patient registration failed. Please verify your details and try again.'
    }, { status: 500 });
  }
}
