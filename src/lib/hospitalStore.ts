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

const globalForHospitals = globalThis as unknown as { globalHospitalsStore: RegisteredHospital[] };

if (!globalForHospitals.globalHospitalsStore) {
  globalForHospitals.globalHospitalsStore = [...defaultHospitals];
}

export function getGlobalHospitals(): RegisteredHospital[] {
  return globalForHospitals.globalHospitalsStore;
}

export function addGlobalHospital(hospital: Partial<RegisteredHospital>): RegisteredHospital {
  const newHosp: RegisteredHospital = {
    id: hospital.id || `hosp-${Date.now()}`,
    name: hospital.name || 'New Hospital Organization',
    type: hospital.type || 'General Hospital',
    registrationNo: hospital.registrationNo || `REG-${Date.now()}`,
    email: hospital.email || 'admin@hospital.com',
    phone: hospital.phone || '+1 (555) 000-1122',
    emergencyContact: hospital.emergencyContact || hospital.phone || '+1 (555) 911-0000',
    address: hospital.address || '100 Medical Center Way',
    city: hospital.city || 'Metropolis',
    state: hospital.state || 'NY',
    country: hospital.country || 'USA',
    status: 'ACTIVE',
    createdAt: hospital.createdAt ? String(hospital.createdAt) : new Date().toISOString(),
    _count: hospital._count || {
      users: 5,
      doctorProfiles: 3,
      nurseProfiles: 4,
      staffProfiles: 2,
      patients: 6,
      wards: 2,
      beds: 20,
      admissions: 3,
      prescriptions: 8,
      labOrders: 5
    }
  };

  const exists = globalForHospitals.globalHospitalsStore.some(
    h => h.id === newHosp.id || h.registrationNo === newHosp.registrationNo
  );
  if (!exists) {
    globalForHospitals.globalHospitalsStore.unshift(newHosp);
  }
  return newHosp;
}

export function updateGlobalHospitalStatus(hospitalId: string, status: string): RegisteredHospital | null {
  const hosp = globalForHospitals.globalHospitalsStore.find(h => h.id === hospitalId);
  if (hosp) {
    hosp.status = status;
    return hosp;
  }
  return null;
}
