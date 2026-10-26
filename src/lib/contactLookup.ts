import { prisma } from '@/lib/prisma';

export interface AccountLookupResult {
  user: any;
  channel: 'email' | 'phone';
  matchedContact: string;
  maskedDestination: string;
}

export function isEmailInput(input: string): boolean {
  return input.includes('@');
}

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function phonesMatch(inputPhone: string, dbPhone: string): boolean {
  if (!inputPhone || !dbPhone) return false;
  const cleanInput = inputPhone.trim();
  const cleanDb = dbPhone.trim();
  if (cleanInput.toLowerCase() === cleanDb.toLowerCase()) return true;

  const inputDigits = cleanInput.replace(/\D/g, '');
  const dbDigits = cleanDb.replace(/\D/g, '');

  if (inputDigits.length < 7 || dbDigits.length < 7) return false;
  if (inputDigits === dbDigits) return true;

  // Compare last 10 digits for standard phone numbers (handles country code prefixes like +1, +91, 0, etc.)
  if (inputDigits.length >= 10 && dbDigits.length >= 10) {
    if (inputDigits.slice(-10) === dbDigits.slice(-10)) return true;
  }

  return false;
}

export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length <= 2 ? name[0] + '***' : name[0] + '***' + name[name.length - 1];
  return `${maskedName}@${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '***' + digits;
  const last4 = digits.slice(-4);
  return `(***) ***-${last4}`;
}

/**
 * Searches the database for an eligible account matching the given contact (email or phone).
 * Supports Patient, Hospital Admin, Doctor, Nurse, Pharmacist, Lab Tech, Super Admin, etc.
 * Returns the resolved User and channel info, or throws an error for ambiguous/inactive accounts,
 * or returns null if no account matches.
 */
export async function findAccountByContact(contactInput: string): Promise<AccountLookupResult | null> {
  const rawClean = contactInput.trim();
  if (!rawClean) return null;

  // 1. Email Lookup
  if (isEmailInput(rawClean)) {
    const emailClean = rawClean.toLowerCase().trim();

    // Query User table
    let user: any = await prisma.user.findUnique({
      where: { email: emailClean },
      include: { hospital: true, patientProfile: true }
    });

    // If not found in User, check Patient table by email
    if (!user) {
      const patient = await prisma.patient.findFirst({
        where: { email: { equals: emailClean, mode: 'insensitive' } },
        include: { user: { include: { hospital: true, patientProfile: true } } }
      });
      if (patient && patient.user) {
        user = patient.user;
      }
    }

    if (!user) {
      return null;
    }

    // Check account status & hospital suspension
    if (user.status !== 'ACTIVE') {
      throw new Error('This account is inactive or suspended. Please contact the platform administrator.');
    }
    if (user.role !== 'SUPER_ADMIN' && user.hospital && user.hospital.status === 'SUSPENDED') {
      throw new Error('Your hospital account has been suspended. Password recovery is not available.');
    }

    return {
      user,
      channel: 'email',
      matchedContact: user.email,
      maskedDestination: maskEmail(user.email)
    };
  }

  // 2. Phone Number Lookup
  const phoneClean = rawClean;
  const phoneDigits = normalizePhoneDigits(phoneClean);

  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return null;
  }

  const matchedUsersMap = new Map<string, any>();

  // A. Check User table direct phone
  try {
    const usersWithPhone = await prisma.user.findMany({
      where: { phone: { not: null } },
      include: { hospital: true, patientProfile: true }
    });
    for (const u of usersWithPhone) {
      if (u.phone && phonesMatch(phoneClean, u.phone)) {
        matchedUsersMap.set(u.id, u);
      }
    }
  } catch (e) {
    // Field lookup safe
  }

  // B. Check Patient table phone
  const patients = await prisma.patient.findMany({
    where: { phone: { not: '' } },
    include: { user: { include: { hospital: true, patientProfile: true } } }
  });
  for (const p of patients) {
    if (p.phone && phonesMatch(phoneClean, p.phone) && p.user) {
      matchedUsersMap.set(p.user.id, p.user);
    }
  }

  // C. Check Hospital table phone (links to Hospital Admin users)
  const hospitals = await prisma.hospital.findMany({
    select: { id: true, phone: true }
  });
  for (const h of hospitals) {
    if (h.phone && phonesMatch(phoneClean, h.phone)) {
      const hospAdmins = await prisma.user.findMany({
        where: { hospitalId: h.id, role: 'HOSPITAL_ADMIN' },
        include: { hospital: true, patientProfile: true }
      });
      for (const admin of hospAdmins) {
        matchedUsersMap.set(admin.id, admin);
      }
    }
  }

  const matchedUsers = Array.from(matchedUsersMap.values());

  if (matchedUsers.length === 0) {
    return null;
  }

  // Ambiguity prevention: Do not reset if a phone number matches multiple different accounts
  if (matchedUsers.length > 1) {
    throw new Error('Multiple accounts are associated with this phone number. Please use your registered email address to recover your account.');
  }

  const user = matchedUsers[0];

  // Check account status & hospital suspension
  if (user.status !== 'ACTIVE') {
    throw new Error('This account is inactive or suspended. Please contact the platform administrator.');
  }
  if (user.role !== 'SUPER_ADMIN' && user.hospital && user.hospital.status === 'SUSPENDED') {
    throw new Error('Your hospital account has been suspended. Password recovery is not available.');
  }

  return {
    user,
    channel: 'phone',
    matchedContact: phoneClean,
    maskedDestination: maskPhone(phoneClean)
  };
}
