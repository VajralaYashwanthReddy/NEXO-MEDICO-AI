import fs from 'fs';
import path from 'path';
import os from 'os';
import { eventBroadcaster } from '@/lib/events';

export interface RegisteredHospital {
  id: string;
  name: string;
  type: string;
  registrationNo: string;
  email: string;
  phone: string;
  emergencyContact: string;
  address: string;
  city: string;
  state: string;
  country: string;
  status: string;
  createdAt: string | Date;
  _count?: {
    users: number;
    doctorProfiles: number;
    nurseProfiles: number;
    staffProfiles: number;
    patients: number;
    wards: number;
    beds: number;
    admissions: number;
    prescriptions: number;
    labOrders: number;
  };
}

const defaultHospitals: RegisteredHospital[] = [
  {
    id: 'hosp-metro-01',
    name: 'Metropolitan General Hospital',
    type: 'Multi-Specialty Research Hospital',
    registrationNo: 'METRO-HOSP-001',
    email: 'admin@metrohospital.com',
    phone: '+1 (555) 234-5678',
    emergencyContact: '+1 (555) 911-0000',
    address: '100 Medical Center Drive',
    city: 'Metropolis',
    state: 'NY',
    country: 'USA',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    _count: {
      users: 18,
      doctorProfiles: 6,
      nurseProfiles: 8,
      staffProfiles: 4,
      patients: 12,
      wards: 4,
      beds: 45,
      admissions: 8,
      prescriptions: 15,
      labOrders: 10
    }
  },
  {
    id: 'hosp-apollo-02',
    name: 'Apollo City Hospital',
    type: 'Multi-Specialty Healthcare',
    registrationNo: 'APOLLO-REG-999',
    email: 'contact@apollocity.com',
    phone: '+1 (555) 123-4567',
    emergencyContact: '+1 (555) 911-2222',
    address: '45 Healthcare Boulevard',
    city: 'Metropolis',
    state: 'NY',
    country: 'USA',
    status: 'ACTIVE',
    createdAt: '2026-02-15T00:00:00.000Z',
    _count: {
      users: 12,
      doctorProfiles: 4,
      nurseProfiles: 5,
      staffProfiles: 3,
      patients: 8,
      wards: 3,
      beds: 30,
      admissions: 5,
      prescriptions: 9,
      labOrders: 6
    }
  },
  {
    id: 'hosp-apex-03',
    name: 'Apex Super Specialty & Research Institute',
    type: 'Academic Super Specialty',
    registrationNo: 'APEX-INST-2026',
    email: 'info@apexhealth.org',
    phone: '+1 (555) 888-9999',
    emergencyContact: '+1 (555) 911-3333',
    address: '800 Innovation Way',
    city: 'Metropolis',
    state: 'NY',
    country: 'USA',
    status: 'ACTIVE',
    createdAt: '2026-03-01T00:00:00.000Z',
    _count: {
      users: 25,
      doctorProfiles: 10,
      nurseProfiles: 12,
      staffProfiles: 5,
      patients: 18,
      wards: 6,
      beds: 60,
      admissions: 12,
      prescriptions: 22,
      labOrders: 14
    }
  }
];

const TEMP_HOSPITALS_FILE = path.join(os.tmpdir(), 'nexo_hospitals_cache.json');
const allTimeHospitalsMap = new Map<string, RegisteredHospital>();

defaultHospitals.forEach(h => {
  allTimeHospitalsMap.set(h.id, h);
  if (h.registrationNo) allTimeHospitalsMap.set(h.registrationNo, h);
});

function loadTempCache(): RegisteredHospital[] {
  try {
    if (fs.existsSync(TEMP_HOSPITALS_FILE)) {
      const data = fs.readFileSync(TEMP_HOSPITALS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(h => {
          if (h && (h.id || h.registrationNo)) {
            if (h.id) allTimeHospitalsMap.set(h.id, h);
            if (h.registrationNo) allTimeHospitalsMap.set(h.registrationNo, h);
          }
        });
      }
    }
  } catch (e) {}
  return Array.from(new Set(allTimeHospitalsMap.values()));
}

function saveTempCache(hospitals: RegisteredHospital[]) {
  try {
    fs.writeFileSync(TEMP_HOSPITALS_FILE, JSON.stringify(hospitals, null, 2), 'utf8');
  } catch (e) {}
}

export function getGlobalHospitals(): RegisteredHospital[] {
  return loadTempCache();
}

export function addGlobalHospital(hospital: Partial<RegisteredHospital>): RegisteredHospital {
  const current = loadTempCache();
  const regNo = (hospital.registrationNo || `REG-${Date.now()}`).toUpperCase().trim();
  const hospId = hospital.id || `hosp-${Date.now()}`;

  const newHosp: RegisteredHospital = {
    id: hospId,
    name: hospital.name || 'New Hospital Organization',
    type: hospital.type || 'General Hospital',
    registrationNo: regNo,
    email: hospital.email ? hospital.email.toLowerCase().trim() : 'admin@hospital.com',
    phone: hospital.phone || '+1 (555) 000-1122',
    emergencyContact: hospital.emergencyContact || hospital.phone || '+1 (555) 911-0000',
    address: hospital.address || '100 Medical Center Way',
    city: hospital.city || 'Metropolis',
    state: hospital.state || 'NY',
    country: hospital.country || 'USA',
    status: hospital.status || 'ACTIVE',
    createdAt: hospital.createdAt ? String(hospital.createdAt) : new Date().toISOString(),
    _count: hospital._count || {
      users: 6,
      doctorProfiles: 4,
      nurseProfiles: 5,
      staffProfiles: 3,
      patients: 8,
      wards: 3,
      beds: 30,
      admissions: 4,
      prescriptions: 10,
      labOrders: 6
    }
  };

  allTimeHospitalsMap.set(newHosp.id, newHosp);
  allTimeHospitalsMap.set(newHosp.registrationNo, newHosp);

  const updatedList = Array.from(new Set(allTimeHospitalsMap.values()));
  saveTempCache(updatedList);

  try {
    eventBroadcaster.broadcast('HOSPITAL_REGISTERED', {
      hospital: newHosp,
      hospitalId: newHosp.id,
      name: newHosp.name,
      registrationNo: newHosp.registrationNo
    });
  } catch (e) {}

  return newHosp;
}

export function updateGlobalHospitalStatus(hospitalId: string, status: string): RegisteredHospital | null {
  const current = loadTempCache();
  const target = current.find(h => h.id === hospitalId || h.registrationNo === hospitalId);
  if (target) {
    target.status = status;
    allTimeHospitalsMap.set(target.id, target);
    if (target.registrationNo) allTimeHospitalsMap.set(target.registrationNo, target);

    const updatedList = Array.from(new Set(allTimeHospitalsMap.values()));
    saveTempCache(updatedList);

    try {
      eventBroadcaster.broadcast('HOSPITAL_STATUS_UPDATED', {
        hospitalId: target.id,
        status,
        name: target.name
      });
    } catch (e) {}

    return target;
  }
  return null;
}
