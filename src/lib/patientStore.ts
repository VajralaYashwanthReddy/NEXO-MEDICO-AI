import fs from 'fs';
import path from 'path';
import os from 'os';

export interface GlobalPatient {
  id: string;
  patientCode: string;
  hospitalId: string;
  userId?: string | null;
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  bloodGroup: string;
  allergies?: string | null;
  conditions?: string | null;
  previousHistory?: string | null;
  createdAt: string | Date;
  hospital?: { id: string; name: string; city: string };
  user?: { id: string; email: string; status: string };
}

const defaultPatients: GlobalPatient[] = [
  {
    id: 'pat-000001',
    patientCode: 'NEXO-PAT-000001',
    hospitalId: 'hosp-metro-01',
    fullName: 'Marcus Vance',
    dob: '1962-08-14',
    gender: 'Male',
    phone: '+1 (555) 019-2834',
    email: 'marcus.vance@example.com',
    address: '420 Park Avenue, Metropolis',
    emergencyContact: 'Elena Vance (Wife) - +1 (555) 019-9999',
    bloodGroup: 'A+',
    allergies: 'Sulfa Drugs',
    conditions: 'Hypertension, Cardiac Arrhythmia',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    hospital: { id: 'hosp-metro-01', name: 'Metropolitan General Hospital', city: 'Metropolis' },
    user: { id: 'usr-pat-01', email: 'marcus.vance@example.com', status: 'ACTIVE' }
  },
  {
    id: 'pat-000002',
    patientCode: 'NEXO-PAT-000002',
    hospitalId: 'hosp-metro-01',
    fullName: 'John Doe',
    dob: '1990-05-12',
    gender: 'Male',
    phone: '+1 (555) 012-3456',
    email: 'john.doe@patient.nexomedico.ai',
    address: '123 Hospital Lane, Metropolis',
    emergencyContact: 'Sarah Doe (Spouse) - +1 (555) 012-3456',
    bloodGroup: 'O+',
    allergies: 'Penicillin, Sulfa, Peanuts',
    conditions: 'Type 1 Diabetes, Mild Asthma',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    hospital: { id: 'hosp-metro-01', name: 'Metropolitan General Hospital', city: 'Metropolis' },
    user: { id: 'usr-pat-02', email: 'john.doe@patient.nexomedico.ai', status: 'ACTIVE' }
  },
  {
    id: 'pat-000003',
    patientCode: 'NEXO-PAT-000003',
    hospitalId: 'hosp-apollo-02',
    fullName: 'Yashu',
    dob: '2004-05-07',
    gender: 'Male',
    phone: '+1 (555) 765-9821',
    email: 'yashwanthvajrala7995@gmail.com',
    address: 'Green Glen Layout, Metropolis',
    emergencyContact: 'Family - +1 (555) 999-8888',
    bloodGroup: 'O+',
    allergies: 'Penicillin',
    conditions: 'Hypertension',
    createdAt: new Date().toISOString(),
    hospital: { id: 'hosp-apollo-02', name: 'Apollo City Hospital', city: 'Metropolis' },
    user: { id: 'usr-pat-03', email: 'yashwanthvajrala7995@gmail.com', status: 'ACTIVE' }
  }
];

const TEMP_PATIENT_FILE = path.join(os.tmpdir(), 'nexo_patients_cache.json');

// Persistent in-process Map to retain every patient created across requests
const allTimePatientsMap = new Map<string, GlobalPatient>();
defaultPatients.forEach(p => allTimePatientsMap.set(p.patientCode || p.id, p));

function loadTempCache(): GlobalPatient[] {
  try {
    if (fs.existsSync(TEMP_PATIENT_FILE)) {
      const data = fs.readFileSync(TEMP_PATIENT_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(p => {
          if (p && (p.patientCode || p.id)) {
            const key = p.patientCode || p.id;
            allTimePatientsMap.set(key, p);
          }
        });
      }
    }
  } catch (e) {
    // silent catch
  }
  return Array.from(allTimePatientsMap.values());
}

function saveTempCache(patients: GlobalPatient[]) {
  try {
    fs.writeFileSync(TEMP_PATIENT_FILE, JSON.stringify(patients, null, 2), 'utf8');
  } catch (e) {
    // silent catch
  }
}

export function getGlobalPatients(): GlobalPatient[] {
  return loadTempCache();
}

export function addGlobalPatient(newPatient: Partial<GlobalPatient>): GlobalPatient {
  const current = loadTempCache();

  // Search if patient already exists by email, patientCode, id, or fullName
  const emailLower = newPatient.email?.toLowerCase().trim();
  const codeUpper = newPatient.patientCode?.toUpperCase().trim();
  const idStr = newPatient.id?.trim();
  const nameLower = newPatient.fullName?.toLowerCase().trim();

  let existing = current.find(p => {
    if (idStr && p.id === idStr) return true;
    if (codeUpper && p.patientCode?.toUpperCase() === codeUpper) return true;
    if (emailLower && p.email?.toLowerCase() === emailLower) return true;
    if (emailLower && p.user?.email && p.user.email.toLowerCase() === emailLower) return true;
    if (nameLower && nameLower !== 'registered patient' && nameLower !== 'patient account' && p.fullName?.toLowerCase() === nameLower) return true;
    return false;
  });

  if (existing) {
    // Update existing patient with non-null/non-empty properties without changing patientCode or id
    if (newPatient.fullName && newPatient.fullName !== 'Registered Patient' && newPatient.fullName !== 'Patient Account') {
      existing.fullName = newPatient.fullName;
    }
    if (newPatient.dob && newPatient.dob !== 'N/A' && newPatient.dob !== '1995-01-01') {
      existing.dob = newPatient.dob;
    }
    if (newPatient.gender && newPatient.gender !== 'N/A') {
      existing.gender = newPatient.gender;
    }
    if (newPatient.phone && newPatient.phone !== 'N/A' && newPatient.phone.trim() !== '') {
      existing.phone = newPatient.phone;
    }
    if (newPatient.email && newPatient.email.includes('@')) {
      existing.email = newPatient.email;
    }
    if (newPatient.address && newPatient.address !== 'N/A') {
      existing.address = newPatient.address;
    }
    if (newPatient.emergencyContact && newPatient.emergencyContact !== 'N/A') {
      existing.emergencyContact = newPatient.emergencyContact;
    }
    if (newPatient.bloodGroup && newPatient.bloodGroup !== 'N/A') {
      existing.bloodGroup = newPatient.bloodGroup;
    }
    if (newPatient.allergies) {
      existing.allergies = newPatient.allergies;
    }
    if (newPatient.conditions) {
      existing.conditions = newPatient.conditions;
    }
    if (newPatient.userId) {
      existing.userId = newPatient.userId;
    }

    allTimePatientsMap.set(existing.patientCode || existing.id, existing);
    saveTempCache(Array.from(allTimePatientsMap.values()));
    return existing;
  }

  // Calculate max numeric NEXO-PAT-XXXXXX code to guarantee unique constant sequential patient code
  let maxNum = 0;
  current.forEach(p => {
    const match = p.patientCode?.match(/NEXO-PAT-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  const nextNum = maxNum + 1;
  const patientCode = newPatient.patientCode || `NEXO-PAT-${String(nextNum).padStart(6, '0')}`;

  const created: GlobalPatient = {
    id: newPatient.id || `pat-${Date.now()}`,
    patientCode,
    hospitalId: newPatient.hospitalId || 'hosp-metro-01',
    fullName: newPatient.fullName || 'Registered Patient',
    dob: newPatient.dob || '1995-01-01',
    gender: newPatient.gender || 'Male',
    phone: newPatient.phone || '+1 (555) 000-0000',
    email: newPatient.email || `${patientCode.toLowerCase()}@patient.nexomedico.ai`,
    address: newPatient.address || 'N/A',
    emergencyContact: newPatient.emergencyContact || newPatient.phone || '+1 (555) 000-0000',
    bloodGroup: newPatient.bloodGroup || 'O+',
    allergies: newPatient.allergies || null,
    conditions: newPatient.conditions || null,
    previousHistory: newPatient.previousHistory || null,
    userId: newPatient.userId || null,
    createdAt: newPatient.createdAt ? String(newPatient.createdAt) : new Date().toISOString(),
    hospital: newPatient.hospital || { id: 'hosp-metro-01', name: 'Metropolitan General Hospital', city: 'Metropolis' },
    user: newPatient.user || { id: `usr-${Date.now()}`, email: newPatient.email || `${patientCode.toLowerCase()}@patient.nexomedico.ai`, status: 'ACTIVE' }
  };

  allTimePatientsMap.set(created.patientCode, created);
  
  const updatedList = Array.from(allTimePatientsMap.values());
  saveTempCache(updatedList);
  return created;
}

export function togglePatientStatusInMemory(patientId: string, newStatus: string): boolean {
  const current = loadTempCache();
  const target = current.find(p => p.id === patientId || p.patientCode === patientId);
  if (target) {
    if (!target.user) {
      target.user = { id: `usr-${Date.now()}`, email: target.email, status: newStatus };
    } else {
      target.user.status = newStatus;
    }
    allTimePatientsMap.set(target.patientCode || target.id, target);
    saveTempCache(Array.from(allTimePatientsMap.values()));
    return true;
  }
  return false;
}
