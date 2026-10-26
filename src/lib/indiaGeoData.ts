/**
 * India Geographic Dataset and Address / Contact Validation Library
 * Canonical 28 States and 8 Union Territories of the Republic of India.
 * Strict Indian PIN Code (6 digits, starting 1-9) and +91 Phone Validation.
 */

export interface IndianRegion {
  code: string;
  name: string;
  type: 'STATE' | 'UT';
}

export const INDIAN_STATES_AND_UTS: IndianRegion[] = [
  // 28 States
  { code: 'AP', name: 'Andhra Pradesh', type: 'STATE' },
  { code: 'AR', name: 'Arunachal Pradesh', type: 'STATE' },
  { code: 'AS', name: 'Assam', type: 'STATE' },
  { code: 'BR', name: 'Bihar', type: 'STATE' },
  { code: 'CG', name: 'Chhattisgarh', type: 'STATE' },
  { code: 'GA', name: 'Goa', type: 'STATE' },
  { code: 'GJ', name: 'Gujarat', type: 'STATE' },
  { code: 'HR', name: 'Haryana', type: 'STATE' },
  { code: 'HP', name: 'Himachal Pradesh', type: 'STATE' },
  { code: 'JH', name: 'Jharkhand', type: 'STATE' },
  { code: 'KA', name: 'Karnataka', type: 'STATE' },
  { code: 'KL', name: 'Kerala', type: 'STATE' },
  { code: 'MP', name: 'Madhya Pradesh', type: 'STATE' },
  { code: 'MH', name: 'Maharashtra', type: 'STATE' },
  { code: 'MN', name: 'Manipur', type: 'STATE' },
  { code: 'ML', name: 'Meghalaya', type: 'STATE' },
  { code: 'MZ', name: 'Mizoram', type: 'STATE' },
  { code: 'NL', name: 'Nagaland', type: 'STATE' },
  { code: 'OD', name: 'Odisha', type: 'STATE' },
  { code: 'PB', name: 'Punjab', type: 'STATE' },
  { code: 'RJ', name: 'Rajasthan', type: 'STATE' },
  { code: 'SK', name: 'Sikkim', type: 'STATE' },
  { code: 'TN', name: 'Tamil Nadu', type: 'STATE' },
  { code: 'TG', name: 'Telangana', type: 'STATE' },
  { code: 'TR', name: 'Tripura', type: 'STATE' },
  { code: 'UP', name: 'Uttar Pradesh', type: 'STATE' },
  { code: 'UK', name: 'Uttarakhand', type: 'STATE' },
  { code: 'WB', name: 'West Bengal', type: 'STATE' },

  // 8 Union Territories
  { code: 'AN', name: 'Andaman and Nicobar Islands', type: 'UT' },
  { code: 'CH', name: 'Chandigarh', type: 'UT' },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UT' },
  { code: 'DL', name: 'Delhi', type: 'UT' },
  { code: 'JK', name: 'Jammu and Kashmir', type: 'UT' },
  { code: 'LA', name: 'Ladakh', type: 'UT' },
  { code: 'LD', name: 'Lakshadweep', type: 'UT' },
  { code: 'PY', name: 'Puducherry', type: 'UT' }
];

export const CANONICAL_STATE_NAMES = INDIAN_STATES_AND_UTS.map(r => r.name);

/**
 * Validate that the state/UT matches a canonical Indian name
 */
export function isValidIndianState(stateName: string): boolean {
  if (!stateName) return false;
  const normalized = stateName.trim().toLowerCase();
  return INDIAN_STATES_AND_UTS.some(
    r => r.name.toLowerCase() === normalized || r.code.toLowerCase() === normalized
  );
}

/**
 * Get canonical state name
 */
export function getCanonicalStateName(stateName: string): string | null {
  if (!stateName) return null;
  const normalized = stateName.trim().toLowerCase();
  const found = INDIAN_STATES_AND_UTS.find(
    r => r.name.toLowerCase() === normalized || r.code.toLowerCase() === normalized
  );
  return found ? found.name : null;
}

/**
 * Validate Indian Postal Index Number (PIN Code)
 * Rules: Exactly 6 digits, first digit 1-9 (0 is not valid in Indian Postal System).
 */
export function validateIndianPinCode(pin: string): { valid: boolean; normalized: string; error?: string } {
  if (!pin) {
    return { valid: false, normalized: '', error: 'PIN Code is required.' };
  }

  const cleaned = pin.toString().trim().replace(/\s+/g, '');
  
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, normalized: cleaned, error: 'PIN Code must contain digits only.' };
  }

  if (cleaned.length !== 6) {
    return { valid: false, normalized: cleaned, error: 'Indian PIN Code must be exactly 6 digits.' };
  }

  if (cleaned.startsWith('0')) {
    return { valid: false, normalized: cleaned, error: 'Indian PIN Code cannot start with 0 (must be 1-9).' };
  }

  return { valid: true, normalized: cleaned };
}

/**
 * Validate and normalize Indian mobile/phone number
 * Accepts formats like:
 * - 9876543210
 * - +91 9876543210
 * - +919876543210
 * - 09876543210
 * Validates that the core 10 digits begin with 6, 7, 8, or 9 according to DoT allocation.
 */
export function validateIndianPhoneNumber(phone: string, isRequired: boolean = true): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  if (!phone || !phone.trim()) {
    if (!isRequired) {
      return { valid: true, normalized: '' };
    }
    return { valid: false, normalized: '', error: 'Phone number is required.' };
  }

  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');
  
  // Extract 10 digits
  let digits = '';
  if (cleaned.startsWith('+91')) {
    digits = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    digits = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    digits = cleaned.slice(1);
  } else {
    digits = cleaned;
  }

  if (!/^\d{10}$/.test(digits)) {
    return {
      valid: false,
      normalized: phone,
      error: 'Please enter a valid 10-digit Indian phone number.'
    };
  }

  // Validate DoT allocation (first digit must be 6, 7, 8, or 9 for Indian cellular)
  const firstDigit = digits.charAt(0);
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return {
      valid: false,
      normalized: phone,
      error: 'Indian mobile numbers must start with 6, 7, 8, or 9.'
    };
  }

  return {
    valid: true,
    normalized: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  };
}

export interface PatientAddressInput {
  houseFlat: string;
  streetArea: string;
  landmark?: string;
  villageWard?: string;
  mandalTaluk?: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  country?: string;
}

export interface PatientEmergencyContactInput {
  emergencyContactName: string;
  emergencyContactRelation?: string;
  emergencyContactPhone: string;
}

/**
 * Validate complete address object for Indian patient registration
 */
export function validateIndianAddress(input: Partial<PatientAddressInput>): {
  valid: boolean;
  errors: Record<string, string>;
  normalized?: PatientAddressInput;
} {
  const errors: Record<string, string> = {};

  const houseFlat = (input.houseFlat || '').trim();
  const streetArea = (input.streetArea || '').trim();
  const landmark = (input.landmark || '').trim();
  const villageWard = (input.villageWard || '').trim();
  const mandalTaluk = (input.mandalTaluk || '').trim();
  const city = (input.city || '').trim();
  const district = (input.district || '').trim();
  const stateRaw = (input.state || '').trim();
  const pinCodeRaw = (input.pinCode || '').trim();

  if (!houseFlat) {
    errors.houseFlat = 'House / Flat Number is required.';
  } else if (houseFlat.length < 1 || houseFlat.length > 50) {
    errors.houseFlat = 'House / Flat Number should be between 1 and 50 characters.';
  }

  if (!streetArea) {
    errors.streetArea = 'Building / Street / Area is required.';
  } else if (streetArea.length < 2 || streetArea.length > 150) {
    errors.streetArea = 'Building / Street / Area should be between 2 and 150 characters.';
  }

  if (landmark && landmark.length > 100) {
    errors.landmark = 'Landmark must not exceed 100 characters.';
  }

  if (villageWard && villageWard.length > 100) {
    errors.villageWard = 'Village / Ward must not exceed 100 characters.';
  }

  if (mandalTaluk && mandalTaluk.length > 100) {
    errors.mandalTaluk = 'Mandal / Taluk must not exceed 100 characters.';
  }

  if (!city) {
    errors.city = 'City / Town / Village is required.';
  } else if (city.length < 2 || city.length > 80) {
    errors.city = 'City / Town / Village must be between 2 and 80 characters.';
  }

  if (!district) {
    errors.district = 'District is required.';
  } else if (district.length < 2 || district.length > 80) {
    errors.district = 'District must be between 2 and 80 characters.';
  }

  const canonicalState = getCanonicalStateName(stateRaw);
  if (!canonicalState) {
    errors.state = 'Please select a valid Indian State or Union Territory from the list.';
  }

  const pinResult = validateIndianPinCode(pinCodeRaw);
  if (!pinResult.valid) {
    errors.pinCode = pinResult.error || 'Invalid 6-digit Indian PIN Code.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    normalized: {
      houseFlat,
      streetArea,
      landmark: landmark || undefined,
      villageWard: villageWard || undefined,
      mandalTaluk: mandalTaluk || undefined,
      city,
      district,
      state: canonicalState!,
      pinCode: pinResult.normalized,
      country: 'IN'
    }
  };
}

/**
 * Validate emergency contact inputs
 */
export function validateEmergencyContact(input: Partial<PatientEmergencyContactInput>): {
  valid: boolean;
  errors: Record<string, string>;
  normalized?: PatientEmergencyContactInput;
} {
  const errors: Record<string, string> = {};

  const name = (input.emergencyContactName || '').trim();
  const relation = (input.emergencyContactRelation || '').trim();
  const phone = (input.emergencyContactPhone || '').trim();

  if (!name) {
    errors.emergencyContactName = 'Emergency contact person name is required.';
  } else if (name.length < 2 || name.length > 100) {
    errors.emergencyContactName = 'Contact name must be between 2 and 100 characters.';
  }

  if (relation && relation.length > 50) {
    errors.emergencyContactRelation = 'Relationship must not exceed 50 characters.';
  }

  const phoneRes = validateIndianPhoneNumber(phone, true);
  if (!phoneRes.valid) {
    errors.emergencyContactPhone = phoneRes.error || 'Valid Indian contact number required.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    normalized: {
      emergencyContactName: name,
      emergencyContactRelation: relation || undefined,
      emergencyContactPhone: phoneRes.normalized
    }
  };
}

/**
 * Format complete Indian address string for display and legacy field compatibility
 */
export function formatIndianAddress(addr: {
  houseFlat?: string | null;
  streetArea?: string | null;
  villageWard?: string | null;
  landmark?: string | null;
  mandalTaluk?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pinCode?: string | null;
  country?: string | null;
}): string {
  const parts: string[] = [];
  if (addr.houseFlat && addr.houseFlat.trim()) parts.push(addr.houseFlat.trim());
  if (addr.streetArea && addr.streetArea.trim()) parts.push(addr.streetArea.trim());
  if (addr.villageWard && addr.villageWard.trim()) parts.push(addr.villageWard.trim());
  if (addr.landmark && addr.landmark.trim()) parts.push(`Near ${addr.landmark.trim()}`);
  if (addr.mandalTaluk && addr.mandalTaluk.trim()) parts.push(`Mandal ${addr.mandalTaluk.trim()}`);
  if (addr.city && addr.city.trim()) parts.push(addr.city.trim());
  if (addr.district && addr.district.trim() && addr.district.toLowerCase() !== addr.city?.toLowerCase()) {
    parts.push(`Dist. ${addr.district.trim()}`);
  }

  // Format State and PIN code together, e.g. "Telangana - 506001"
  const cleanState = addr.state ? addr.state.trim() : '';
  const cleanPin = addr.pinCode ? addr.pinCode.trim() : '';
  if (cleanState && cleanPin) {
    parts.push(`${cleanState} - ${cleanPin}`);
  } else if (cleanState) {
    parts.push(cleanState);
  } else if (cleanPin) {
    parts.push(`PIN: ${cleanPin}`);
  }

  const cleanCountry = addr.country && addr.country.trim() !== 'IN' ? addr.country.trim() : 'India';
  parts.push(cleanCountry);

  return parts.join(', ');
}
