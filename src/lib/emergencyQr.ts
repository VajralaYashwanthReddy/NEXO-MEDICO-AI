export interface PatientEmergencyData {
  patientId: string;
  fullName: string;
  bloodGroup: string;
  allergies: string;
  conditions: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  resuscitationStatus: string;
}

// Generate base64 encrypted payload for emergency QR
export function encodeEmergencyQrPayload(data: PatientEmergencyData): string {
  const jsonStr = JSON.stringify(data);
  if (typeof window !== 'undefined' && window.btoa) {
    return `NEXO-EMG:${window.btoa(encodeURIComponent(jsonStr))}`;
  }
  return `NEXO-EMG:${Buffer.from(encodeURIComponent(jsonStr)).toString('base64')}`;
}

// Decrypt emergency QR payload
export function decodeEmergencyQrPayload(qrString: string): PatientEmergencyData | null {
  try {
    if (!qrString.startsWith('NEXO-EMG:')) {
      // If direct patient ID like NEXO-PAT-000002
      return null;
    }

    const base64Str = qrString.replace('NEXO-EMG:', '');
    let jsonStr = '';
    if (typeof window !== 'undefined' && window.atob) {
      jsonStr = decodeURIComponent(window.atob(base64Str));
    } else {
      jsonStr = decodeURIComponent(Buffer.from(base64Str, 'base64').toString('utf8'));
    }

    return JSON.parse(jsonStr) as PatientEmergencyData;
  } catch (err) {
    console.error('Failed to decode emergency QR payload:', err);
    return null;
  }
}
