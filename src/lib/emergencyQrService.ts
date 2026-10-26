import crypto from 'crypto';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { formatIndianAddress } from '@/lib/indiaGeoData';

/**
 * Service to manage Patient Emergency QR IDs, token generation,
 * QR code rendering, privacy controls, and secure public lookups.
 */

export interface DomainConfig {
  baseUrl: string;
  isProductionDomain: boolean;
  isLocalhost: boolean;
  domainWarning: string | null;
  qrMode: 'PRODUCTION_READY' | 'DEVELOPMENT_SIMULATION';
}

export interface EmergencyPublicProfileData {
  shortId: string;
  token?: string;
  status: 'ACTIVE' | 'REVOKED' | 'NOT_FOUND';
  patientCode?: string;
  patientName?: string;
  name?: string;
  patientPhone?: string;
  phone?: string;
  dob?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
  conditions?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  homeAddress?: string;
  address?: string;
  mapsUrl?: string;
  emergencyNote?: string;
  lastUpdated: string;
  activeSince: string;
  disclaimer: string;
  emergencyDialNumber: string; // '112' for India
  domainConfig: DomainConfig;
  sharedFieldsSummary: {
    patientCodeShared: boolean;
    nameShared: boolean;
    dobShared: boolean;
    phoneShared: boolean;
    emergencyContactShared: boolean;
    bloodGroupShared: boolean;
    allergiesShared: boolean;
    conditionsShared: boolean;
    addressShared: boolean;
    emergencyNoteShared: boolean;
  };
}

/**
 * Resolve public base URL and verify whether a live production HTTPS domain is configured.
 * Strictly avoids presenting localhost as a real-world scannable destination.
 */
export function getEmergencyDomainConfig(): DomainConfig {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

  if (!envUrl || !envUrl.trim()) {
    return {
      baseUrl: 'http://localhost:3000',
      isProductionDomain: false,
      isLocalhost: true,
      domainWarning:
        'Development Notice: NEXT_PUBLIC_APP_URL is not set. Generating development-only QR with http://localhost:3000. This QR code CANNOT be scanned by external phones on the internet. Set NEXT_PUBLIC_APP_URL=https://your-domain.com in .env.local for physical stickers.',
      qrMode: 'DEVELOPMENT_SIMULATION'
    };
  }

  const clean = envUrl.trim().replace(/\/+$/, '');
  const lower = clean.toLowerCase();

  const isLocal =
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('0.0.0.0') ||
    lower.endsWith('.local') ||
    lower.startsWith('http://');

  const isProd = lower.startsWith('https://') && !isLocal;

  return {
    baseUrl: clean,
    isProductionDomain: isProd,
    isLocalhost: isLocal,
    domainWarning: !isProd
      ? `Localhost / Non-HTTPS URL Detected (${clean}). External smartphone cameras outside your local computer network CANNOT reach this link. Configure NEXT_PUBLIC_APP_URL with your public HTTPS domain for real-world emergency use.`
      : null,
    qrMode: isProd ? 'PRODUCTION_READY' : 'DEVELOPMENT_SIMULATION'
  };
}

export function getEmergencyPublicBaseUrl(): string {
  return getEmergencyDomainConfig().baseUrl;
}

/**
 * Generate a cryptographically random, unguessable token (256 bits entropy)
 */
export function generateUnguessableToken(): string {
  return `emg_${crypto.randomBytes(24).toString('base64url')}`;
}

/**
 * Generate a human-readable short identifier (e.g. EMG-7824-9120)
 */
export function generateShortEmergencyId(): string {
  const randomPart1 = crypto.randomInt(1000, 9999);
  const randomPart2 = crypto.randomInt(1000, 9999);
  return `EMG-${randomPart1}-${randomPart2}`;
}

/**
 * Build public emergency URL for a token using configured trusted base URL
 */
export function buildEmergencyUrl(publicToken: string, baseUrl?: string): string {
  const base = baseUrl ? baseUrl.replace(/\/+$/, '') : getEmergencyPublicBaseUrl();
  return `${base}/emergency/${encodeURIComponent(publicToken)}`;
}

/**
 * Generate QR code as high-resolution PNG data URL
 */
export async function generateQrPngDataUrl(textToEncode: string): Promise<string> {
  return await QRCode.toDataURL(textToEncode, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 3,
    scale: 10, // High-res for printing stickers and physical ID cards
    color: {
      dark: '#0f172a', // Deep slate for high contrast
      light: '#ffffff'
    }
  });
}

/**
 * Generate QR code as SVG string for crisp vector printing
 */
export async function generateQrSvgString(textToEncode: string): Promise<string> {
  return await QRCode.toString(textToEncode, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 3,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
}

/**
 * Get or automatically initialize an Emergency Profile for an existing or newly registered patient
 */
export async function getOrCreatePatientEmergencyProfile(patientId: string) {
  let profile = await prisma.patientEmergencyProfile.findUnique({
    where: { patientId },
    include: {
      patient: true
    }
  });

  if (!profile) {
    let uniqueToken = generateUnguessableToken();
    let uniqueShortId = generateShortEmergencyId();

    // Verify token collision avoidance (virtually impossible with 256-bit entropy, but strictly enforced)
    let collision = await prisma.patientEmergencyProfile.findFirst({
      where: { OR: [{ publicToken: uniqueToken }, { shortId: uniqueShortId }] }
    });
    while (collision) {
      uniqueToken = generateUnguessableToken();
      uniqueShortId = generateShortEmergencyId();
      collision = await prisma.patientEmergencyProfile.findFirst({
        where: { OR: [{ publicToken: uniqueToken }, { shortId: uniqueShortId }] }
      });
    }

    profile = await prisma.patientEmergencyProfile.create({
      data: {
        patientId,
        publicToken: uniqueToken,
        shortId: uniqueShortId,
        status: 'ACTIVE',
        // Privacy-preserving defaults:
        shareName: true,
        sharePhone: false, // Hidden by default
        shareEmergencyContact: true,
        shareBloodGroup: true,
        shareAllergies: true,
        shareConditions: true,
        shareAddress: false, // Home address strictly hidden by default
        shareEmergencyNote: true,
        sharePatientCode: true,
        shareDob: true,
        emergencyNote: 'In case of emergency, please contact my emergency contact immediately.',
        consentGiven: true,
        consentGivenAt: new Date(),
        consentVersion: '1.0',
        auditLogs: {
          create: {
            action: 'CREATED',
            details: JSON.stringify({ note: 'Initial emergency profile provisioned with privacy defaults' })
          }
        }
      },
      include: {
        patient: true
      }
    });
  }

  const domainConfig = getEmergencyDomainConfig();
  const emergencyUrl = buildEmergencyUrl(profile.publicToken, domainConfig.baseUrl);
  const qrDataUrl = await generateQrPngDataUrl(emergencyUrl);
  const qrSvg = await generateQrSvgString(emergencyUrl);

  return {
    profile,
    domainConfig,
    emergencyUrl,
    qrDataUrl,
    qrSvg
  };
}

/**
 * Regenerate QR token for a patient (e.g. if physical sticker is lost or compromised)
 */
export async function regeneratePatientEmergencyToken(
  patientId: string,
  auditContext?: { ip?: string; userAgent?: string; reason?: string }
) {
  let uniqueToken = generateUnguessableToken();
  let uniqueShortId = generateShortEmergencyId();

  let collision = await prisma.patientEmergencyProfile.findFirst({
    where: { OR: [{ publicToken: uniqueToken }, { shortId: uniqueShortId }] }
  });
  while (collision) {
    uniqueToken = generateUnguessableToken();
    uniqueShortId = generateShortEmergencyId();
    collision = await prisma.patientEmergencyProfile.findFirst({
      where: { OR: [{ publicToken: uniqueToken }, { shortId: uniqueShortId }] }
    });
  }

  const updatedProfile = await prisma.patientEmergencyProfile.update({
    where: { patientId },
    data: {
      publicToken: uniqueToken,
      shortId: uniqueShortId,
      status: 'ACTIVE',
      revokedAt: null,
      lastRegeneratedAt: new Date(),
      auditLogs: {
        create: {
          action: 'REGENERATED',
          details: JSON.stringify({
            reason: auditContext?.reason || 'Patient requested token regeneration',
            newShortId: uniqueShortId
          }),
          ipAddress: auditContext?.ip,
          userAgent: auditContext?.userAgent
        }
      }
    },
    include: { patient: true }
  });

  const domainConfig = getEmergencyDomainConfig();
  const emergencyUrl = buildEmergencyUrl(updatedProfile.publicToken, domainConfig.baseUrl);
  const qrDataUrl = await generateQrPngDataUrl(emergencyUrl);
  const qrSvg = await generateQrSvgString(emergencyUrl);

  return {
    profile: updatedProfile,
    domainConfig,
    emergencyUrl,
    qrDataUrl,
    qrSvg
  };
}

/**
 * Revoke emergency QR token
 */
export async function revokePatientEmergencyToken(
  patientId: string,
  auditContext?: { ip?: string; userAgent?: string; reason?: string }
) {
  const updatedProfile = await prisma.patientEmergencyProfile.update({
    where: { patientId },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      auditLogs: {
        create: {
          action: 'REVOKED',
          details: JSON.stringify({
            reason: auditContext?.reason || 'Patient revoked public emergency QR ID'
          }),
          ipAddress: auditContext?.ip,
          userAgent: auditContext?.userAgent
        }
      }
    },
    include: { patient: true }
  });

  return {
    profile: updatedProfile,
    revoked: true
  };
}

/**
 * Update patient privacy controls, emergency contact info, and complete address
 */
export async function updatePatientEmergencyPrivacySettings(
  patientId: string,
  settings: {
    shareName?: boolean;
    sharePhone?: boolean;
    shareEmergencyContact?: boolean;
    shareBloodGroup?: boolean;
    shareAllergies?: boolean;
    shareConditions?: boolean;
    shareAddress?: boolean;
    shareEmergencyNote?: boolean;
    sharePatientCode?: boolean;
    shareDob?: boolean;
    emergencyNote?: string;
    emergencyContactName?: string;
    emergencyContactRelation?: string;
    emergencyContactPhone?: string;
    // Optional address updates for existing patients
    houseFlat?: string;
    streetArea?: string;
    villageWard?: string;
    mandalTaluk?: string;
    landmark?: string;
    city?: string;
    district?: string;
    state?: string;
    pinCode?: string;
  },
  auditContext?: { ip?: string; userAgent?: string }
) {
  // 1. Update Patient record fields (Emergency contact and/or address)
  const patientUpdate: Record<string, any> = {};

  if (settings.emergencyContactName !== undefined) patientUpdate.emergencyContactName = settings.emergencyContactName;
  if (settings.emergencyContactPhone !== undefined) patientUpdate.emergencyContactPhone = settings.emergencyContactPhone;
  if (settings.emergencyContactRelation !== undefined) patientUpdate.emergencyContactRelation = settings.emergencyContactRelation;
  if (settings.emergencyContactName && settings.emergencyContactPhone) {
    patientUpdate.emergencyContact = `${settings.emergencyContactName} (${settings.emergencyContactRelation || 'Emergency'}) - ${settings.emergencyContactPhone}`;
  }

  // Address fields update
  if (settings.houseFlat !== undefined) patientUpdate.houseFlat = settings.houseFlat;
  if (settings.streetArea !== undefined) patientUpdate.streetArea = settings.streetArea;
  if (settings.villageWard !== undefined) patientUpdate.villageWard = settings.villageWard;
  if (settings.mandalTaluk !== undefined) patientUpdate.mandalTaluk = settings.mandalTaluk;
  if (settings.landmark !== undefined) patientUpdate.landmark = settings.landmark;
  if (settings.city !== undefined) patientUpdate.city = settings.city;
  if (settings.district !== undefined) patientUpdate.district = settings.district;
  if (settings.state !== undefined) patientUpdate.state = settings.state;
  if (settings.pinCode !== undefined) patientUpdate.pinCode = settings.pinCode;

  if (
    settings.houseFlat ||
    settings.streetArea ||
    settings.villageWard ||
    settings.mandalTaluk ||
    settings.city ||
    settings.district ||
    settings.state ||
    settings.pinCode
  ) {
    // Recompute formatted address string
    const existingPatient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (existingPatient) {
      patientUpdate.address = formatIndianAddress({
        houseFlat: settings.houseFlat ?? existingPatient.houseFlat,
        streetArea: settings.streetArea ?? existingPatient.streetArea,
        villageWard: settings.villageWard ?? existingPatient.villageWard,
        mandalTaluk: settings.mandalTaluk ?? existingPatient.mandalTaluk,
        landmark: settings.landmark ?? existingPatient.landmark,
        city: settings.city ?? existingPatient.city,
        district: settings.district ?? existingPatient.district,
        state: settings.state ?? existingPatient.state,
        pinCode: settings.pinCode ?? existingPatient.pinCode,
        country: 'IN'
      });
    }
  }

  if (Object.keys(patientUpdate).length > 0) {
    await prisma.patient.update({
      where: { id: patientId },
      data: patientUpdate
    });
  }

  // 2. Update Emergency Profile Privacy Toggles
  const profileUpdateData: Record<string, any> = {};
  if (typeof settings.shareName === 'boolean') profileUpdateData.shareName = settings.shareName;
  if (typeof settings.sharePhone === 'boolean') profileUpdateData.sharePhone = settings.sharePhone;
  if (typeof settings.shareEmergencyContact === 'boolean') profileUpdateData.shareEmergencyContact = settings.shareEmergencyContact;
  if (typeof settings.shareBloodGroup === 'boolean') profileUpdateData.shareBloodGroup = settings.shareBloodGroup;
  if (typeof settings.shareAllergies === 'boolean') profileUpdateData.shareAllergies = settings.shareAllergies;
  if (typeof settings.shareConditions === 'boolean') profileUpdateData.shareConditions = settings.shareConditions;
  if (typeof settings.shareAddress === 'boolean') profileUpdateData.shareAddress = settings.shareAddress;
  if (typeof settings.shareEmergencyNote === 'boolean') profileUpdateData.shareEmergencyNote = settings.shareEmergencyNote;
  if (typeof settings.sharePatientCode === 'boolean') profileUpdateData.sharePatientCode = settings.sharePatientCode;
  if (typeof settings.shareDob === 'boolean') profileUpdateData.shareDob = settings.shareDob;
  if (typeof settings.emergencyNote === 'string') profileUpdateData.emergencyNote = settings.emergencyNote.slice(0, 300);

  const updatedProfile = await prisma.patientEmergencyProfile.update({
    where: { patientId },
    data: {
      ...profileUpdateData,
      auditLogs: {
        create: {
          action: 'SETTINGS_UPDATED',
          details: JSON.stringify(settings),
          ipAddress: auditContext?.ip,
          userAgent: auditContext?.userAgent
        }
      }
    },
    include: { patient: true }
  });

  const domainConfig = getEmergencyDomainConfig();
  const emergencyUrl = buildEmergencyUrl(updatedProfile.publicToken, domainConfig.baseUrl);
  const qrDataUrl = await generateQrPngDataUrl(emergencyUrl);
  const qrSvg = await generateQrSvgString(emergencyUrl);

  return {
    profile: updatedProfile,
    domainConfig,
    emergencyUrl,
    qrDataUrl,
    qrSvg
  };
}

/**
 * Public resolver for /emergency/[token]
 * STRICT ALLOWLISTING ONLY. Never exposes passwords, sessions, OTPs, or unconsented fields.
 */
export async function resolvePublicEmergencyProfile(
  token: string,
  requestContext?: { ip?: string; userAgent?: string }
): Promise<EmergencyPublicProfileData | null> {
  if (!token || typeof token !== 'string' || token.length < 8) {
    return null;
  }

  const profile = await prisma.patientEmergencyProfile.findUnique({
    where: { publicToken: token },
    include: {
      patient: true
    }
  });

  if (!profile) {
    return null;
  }

  const domainConfig = getEmergencyDomainConfig();

  // Check if revoked
  if (profile.status === 'REVOKED') {
    return {
      shortId: profile.shortId,
      status: 'REVOKED',
      lastUpdated: profile.updatedAt.toISOString(),
      activeSince: profile.createdAt.toISOString(),
      disclaimer: 'This Emergency QR ID has been revoked by the patient and is no longer valid.',
      emergencyDialNumber: '112',
      domainConfig,
      sharedFieldsSummary: {
        patientCodeShared: false,
        nameShared: false,
        dobShared: false,
        phoneShared: false,
        emergencyContactShared: false,
        bloodGroupShared: false,
        allergiesShared: false,
        conditionsShared: false,
        addressShared: false,
        emergencyNoteShared: false
      }
    };
  }

  // Atomically increment view count & record audit log (non-blocking)
  try {
    await prisma.patientEmergencyProfile.update({
      where: { id: profile.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
        auditLogs: {
          create: {
            action: 'VIEWED',
            details: JSON.stringify({ timestamp: new Date().toISOString() }),
            ipAddress: requestContext?.ip,
            userAgent: requestContext?.userAgent
          }
        }
      }
    });
  } catch (logErr) {
    console.error('Failed to log emergency view audit:', logErr);
  }

  const p = profile.patient;

  // Build formatted address and maps link only if explicitly shared by patient
  let publicAddress: string | undefined = undefined;
  let mapsUrl: string | undefined = undefined;
  if (profile.shareAddress) {
    const formatted = formatIndianAddress({
      houseFlat: p.houseFlat,
      streetArea: p.streetArea,
      villageWard: p.villageWard,
      landmark: p.landmark,
      mandalTaluk: p.mandalTaluk,
      city: p.city,
      district: p.district,
      state: p.state,
      pinCode: p.pinCode,
      country: p.country
    });

    if (formatted && formatted !== 'India') {
      publicAddress = formatted;
    } else if (p.address && p.address !== 'N/A') {
      publicAddress = p.address;
    }

    if (publicAddress) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(publicAddress)}`;
    }
  }

  // Emergency contact resolution
  const contactName =
    p.emergencyContactName ||
    (p.emergencyContact && p.emergencyContact.includes('-')
      ? p.emergencyContact.split('-')[0]?.trim()
      : p.emergencyContact || undefined);

  const contactPhone =
    p.emergencyContactPhone ||
    (p.emergencyContact && p.emergencyContact.includes('-')
      ? p.emergencyContact.split('-')[1]?.trim()
      : undefined);

  const contactRelation = p.emergencyContactRelation || undefined;

  // Compute age from DOB if permitted
  let age: number | undefined = undefined;
  if (profile.shareDob && p.dob) {
    const birth = new Date(p.dob);
    if (!isNaN(birth.getTime())) {
      const diff = Date.now() - birth.getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }
  }

  return {
    shortId: profile.shortId,
    token: profile.publicToken,
    status: 'ACTIVE',
    patientCode: profile.sharePatientCode ? p.patientCode : undefined,
    patientName: profile.shareName ? p.fullName : undefined,
    name: profile.shareName ? p.fullName : undefined,
    patientPhone: profile.sharePhone ? p.phone : undefined,
    phone: profile.sharePhone ? p.phone : undefined,
    dob: profile.shareDob ? p.dob : undefined,
    age,
    gender: profile.shareDob ? p.gender : undefined,
    bloodGroup: profile.shareBloodGroup && p.bloodGroup ? p.bloodGroup : undefined,
    allergies: profile.shareAllergies && p.allergies ? p.allergies : undefined,
    conditions: profile.shareConditions && p.conditions ? p.conditions : undefined,
    emergencyContactName: profile.shareEmergencyContact ? contactName : undefined,
    emergencyContactRelation: profile.shareEmergencyContact ? contactRelation : undefined,
    emergencyContactPhone: profile.shareEmergencyContact ? contactPhone : undefined,
    homeAddress: publicAddress,
    address: publicAddress,
    mapsUrl,
    emergencyNote: profile.shareEmergencyNote && profile.emergencyNote ? profile.emergencyNote : undefined,
    lastUpdated: profile.updatedAt.toISOString(),
    activeSince: profile.createdAt.toISOString(),
    disclaimer:
      'Nexo Medico AI Emergency Identification Profile. Provided solely for immediate emergency medical assistance and contact notification. Not a verified medical diagnosis or substitute for hospital triage.',
    emergencyDialNumber: '112',
    domainConfig,
    sharedFieldsSummary: {
      patientCodeShared: profile.sharePatientCode,
      nameShared: profile.shareName,
      dobShared: profile.shareDob,
      phoneShared: profile.sharePhone,
      emergencyContactShared: profile.shareEmergencyContact,
      bloodGroupShared: profile.shareBloodGroup,
      allergiesShared: profile.shareAllergies,
      conditionsShared: profile.shareConditions,
      addressShared: profile.shareAddress,
      emergencyNoteShared: profile.shareEmergencyNote
    }
  };
}
