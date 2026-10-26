import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import {
  getOrCreatePatientEmergencyProfile,
  regeneratePatientEmergencyToken,
  revokePatientEmergencyToken,
  updatePatientEmergencyPrivacySettings,
  getEmergencyDomainConfig
} from '@/lib/emergencyQrService';

export const dynamic = 'force-dynamic';

async function resolvePatientForUser(user: any, searchPatientId?: string | null) {
  // If user is a patient, resolve their own profile
  if (user.role === 'PATIENT') {
    let patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { userId: user.id },
          { email: user.email?.toLowerCase().trim() },
          { patientCode: user.patientCode || '___none___' }
        ]
      }
    });
    return patient;
  }

  // If staff/admin or explicit patientId passed
  if (searchPatientId) {
    return await prisma.patient.findUnique({
      where: { id: searchPatientId }
    });
  }

  return null;
}

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientIdParam = searchParams.get('patientId');

  const patient = await resolvePatientForUser(user, patientIdParam);
  if (!patient) {
    return NextResponse.json({ error: 'Patient record not found.' }, { status: 404 });
  }

  try {
    const data = await getOrCreatePatientEmergencyProfile(patient.id);
    return NextResponse.json({
      success: true,
      profile: data.profile,
      domainConfig: data.domainConfig,
      emergencyUrl: data.emergencyUrl,
      qrDataUrl: data.qrDataUrl,
      qrSvg: data.qrSvg,
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        patientCode: patient.patientCode,
        phone: patient.phone,
        dob: patient.dob,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        conditions: patient.conditions,
        emergencyContact: patient.emergencyContact,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactRelation: patient.emergencyContactRelation,
        emergencyContactPhone: patient.emergencyContactPhone,
        houseFlat: patient.houseFlat,
        streetArea: patient.streetArea,
        villageWard: patient.villageWard,
        mandalTaluk: patient.mandalTaluk,
        landmark: patient.landmark,
        city: patient.city,
        district: patient.district,
        state: patient.state,
        pinCode: patient.pinCode,
        country: patient.country,
        address: patient.address
      }
    });
  } catch (err: any) {
    console.error('Error fetching emergency profile:', err);
    return NextResponse.json({ error: 'Failed to retrieve emergency profile' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const { action, settings, patientId: targetPatientId } = body;

  const patient = await resolvePatientForUser(user, targetPatientId);
  if (!patient) {
    return NextResponse.json({ error: 'Patient record not found.' }, { status: 404 });
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const userAgent = req.headers.get('user-agent') || 'Browser';

  try {
    if (action === 'update_privacy' || action === 'update_address') {
      const mergedSettings = {
        ...(body.settings || {}),
        ...body
      };
      delete mergedSettings.action;
      delete mergedSettings.patientId;
      delete mergedSettings.settings;

      const result = await updatePatientEmergencyPrivacySettings(
        patient.id,
        mergedSettings,
        { ip, userAgent }
      );

      // Re-fetch patient to reflect any address or contact updates
      const updatedPatient = await prisma.patient.findUnique({ where: { id: patient.id } });

      return NextResponse.json({
        success: true,
        message: 'Emergency privacy settings and details successfully saved.',
        profile: result.profile,
        domainConfig: result.domainConfig,
        emergencyUrl: result.emergencyUrl,
        qrDataUrl: result.qrDataUrl,
        qrSvg: result.qrSvg,
        patient: updatedPatient ? {
          id: updatedPatient.id,
          fullName: updatedPatient.fullName,
          patientCode: updatedPatient.patientCode,
          phone: updatedPatient.phone,
          dob: updatedPatient.dob,
          gender: updatedPatient.gender,
          bloodGroup: updatedPatient.bloodGroup,
          allergies: updatedPatient.allergies,
          conditions: updatedPatient.conditions,
          emergencyContact: updatedPatient.emergencyContact,
          emergencyContactName: updatedPatient.emergencyContactName,
          emergencyContactRelation: updatedPatient.emergencyContactRelation,
          emergencyContactPhone: updatedPatient.emergencyContactPhone,
          houseFlat: updatedPatient.houseFlat,
          streetArea: updatedPatient.streetArea,
          villageWard: updatedPatient.villageWard,
          mandalTaluk: updatedPatient.mandalTaluk,
          landmark: updatedPatient.landmark,
          city: updatedPatient.city,
          district: updatedPatient.district,
          state: updatedPatient.state,
          pinCode: updatedPatient.pinCode,
          country: updatedPatient.country,
          address: updatedPatient.address
        } : undefined
      });
    }

    if (action === 'regenerate_token') {
      const result = await regeneratePatientEmergencyToken(
        patient.id,
        { ip, userAgent, reason: body.reason || 'User regenerated QR code' }
      );
      return NextResponse.json({
        success: true,
        message: 'New Emergency QR Token generated. Previous QR code is now revoked.',
        profile: result.profile,
        domainConfig: result.domainConfig,
        emergencyUrl: result.emergencyUrl,
        qrDataUrl: result.qrDataUrl,
        qrSvg: result.qrSvg
      });
    }

    if (action === 'revoke_token') {
      const result = await revokePatientEmergencyToken(
        patient.id,
        { ip, userAgent, reason: body.reason || 'User revoked QR code' }
      );
      return NextResponse.json({
        success: true,
        message: 'Emergency QR code revoked. Public profile is now disabled.',
        profile: result.profile,
        domainConfig: getEmergencyDomainConfig()
      });
    }

    if (action === 'refresh_domain') {
      const result = await getOrCreatePatientEmergencyProfile(patient.id);
      return NextResponse.json({
        success: true,
        message: 'QR destination re-linked to configured domain.',
        profile: result.profile,
        domainConfig: result.domainConfig,
        emergencyUrl: result.emergencyUrl,
        qrDataUrl: result.qrDataUrl,
        qrSvg: result.qrSvg
      });
    }

    return NextResponse.json({ error: 'Unknown action specified.' }, { status: 400 });
  } catch (err: any) {
    console.error('Emergency profile action error:', err);
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
