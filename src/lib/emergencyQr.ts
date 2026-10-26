export interface PatientEmergencyData {
  patientId: string;
  fullName: string;
  bloodGroup: string;
  allergies: string;
  conditions: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  resuscitationStatus: string;
  phone?: string;
}

// Generate clean, human-readable text payload for smartphone cameras & Google Lens
export function encodeEmergencyQrPayload(data: PatientEmergencyData): string {
  const patientPhone = data.phone || 'Not Shared';
  return `🚨 NEXO MEDICO AI - EMERGENCY HEALTH PASSPORT
----------------------------------------
Patient ID: ${data.patientId}
Full Name: ${data.fullName}
Blood Group: ${data.bloodGroup || 'Not Specified'} (Emergency Transfusion)
Patient Phone: ${patientPhone}
Emergency Contact: ${data.emergencyContactName || 'N/A'} - ${data.emergencyContactPhone || 'N/A'}
Documented Allergies: ${data.allergies || 'No Known Drug Allergies (NKDA)'}
Chronic Conditions: ${data.conditions || 'None Documented'}
Resuscitation Preference: ${data.resuscitationStatus || 'Full Code'}
Portal Link: https://nexo-medico-ai.vercel.app/login`;
}

// Decrypt / Parse emergency QR payload from camera or text
export function decodeEmergencyQrPayload(qrString: string): PatientEmergencyData | null {
  try {
    if (!qrString) return null;

    // Check if it's our clean text format
    if (qrString.includes('Patient ID:') || qrString.includes('NEXO MEDICO AI')) {
      const getVal = (label: string) => {
        const regex = new RegExp(`${label}:\\s*(.+)`, 'i');
        const match = qrString.match(regex);
        return match ? match[1].trim() : '';
      };

      const patientId = getVal('Patient ID');
      const fullName = getVal('Full Name');
      const bloodGroupStr = getVal('Blood Group');
      const bloodGroup = bloodGroupStr ? bloodGroupStr.split(' ')[0] : '';
      const phone = getVal('Patient Phone');
      const emergencyContactStr = getVal('Emergency Contact');
      
      let emergencyContactName = '';
      let emergencyContactPhone = '';
      if (emergencyContactStr && emergencyContactStr.includes(' - ')) {
        const parts = emergencyContactStr.split(' - ');
        emergencyContactName = parts[0].trim();
        emergencyContactPhone = parts[1].trim();
      } else if (emergencyContactStr) {
        emergencyContactName = emergencyContactStr;
      }

      const allergies = getVal('Documented Allergies');
      const conditions = getVal('Chronic Conditions');
      const resuscitationStatus = getVal('Resuscitation Preference') || 'Full Code';

      if (!fullName && !patientId) return null;

      return {
        patientId,
        fullName,
        bloodGroup,
        phone,
        emergencyContactName,
        emergencyContactPhone,
        allergies,
        conditions,
        resuscitationStatus
      };
    }

    // Check base64 format fallback
    if (qrString.startsWith('NEXO-EMG:')) {
      const base64Str = qrString.replace('NEXO-EMG:', '');
      let jsonStr = '';
      if (typeof window !== 'undefined' && window.atob) {
        jsonStr = decodeURIComponent(window.atob(base64Str));
      } else {
        jsonStr = decodeURIComponent(Buffer.from(base64Str, 'base64').toString('utf8'));
      }
      return JSON.parse(jsonStr) as PatientEmergencyData;
    }

    return null;
  } catch (err) {
    console.error('Failed to decode emergency QR payload:', err);
    return null;
  }
}
