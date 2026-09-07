export interface RegisteredDoctor {
  id: string;
  userId: string;
  hospitalId: string;
  employeeId: string;
  specialization: string;
  qualification: string;
  registrationNo: string;
  experienceYears: number;
  consultationFee: number;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  hospital?: {
    id: string;
    name: string;
    city?: string;
    phone?: string;
    registrationNo?: string;
  } | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

const defaultDoctors: RegisteredDoctor[] = [
  {
    id: 'doc-01',
    userId: 'usr-doc-01',
    hospitalId: 'hosp-metro-01',
    employeeId: 'EMP-DOC-101',
    qualification: 'MD, DM (Cardiology)',
    specialization: 'Cardiology',
    registrationNo: 'MD-LIC-2026-1001',
    experienceYears: 12,
    consultationFee: 150.0,
    status: 'ACTIVE',
    user: { id: 'usr-doc-01', name: 'Dr. Sarah Smith', email: 'dr.smith@metrohospital.org', status: 'ACTIVE' },
    hospital: { id: 'hosp-metro-01', name: 'Metropolitan General Hospital', city: 'Metropolis', phone: '+1 (555) 234-5678', registrationNo: 'METRO-HOSP-001' },
    department: { id: 'dept-card-03', name: 'Cardiology', code: 'CARD' }
  },
  {
    id: 'doc-02',
    userId: 'usr-doc-02',
    hospitalId: 'hosp-metro-01',
    employeeId: 'EMP-DOC-102',
    qualification: 'MBBS, MD (Neurology)',
    specialization: 'Neurology',
    registrationNo: 'MD-LIC-2026-1002',
    experienceYears: 10,
    consultationFee: 180.0,
    status: 'ACTIVE',
    user: { id: 'usr-doc-02', name: 'Dr. Rajesh Patel', email: 'dr.patel@metrohospital.org', status: 'ACTIVE' },
    hospital: { id: 'hosp-metro-01', name: 'Metropolitan General Hospital', city: 'Metropolis', phone: '+1 (555) 234-5678', registrationNo: 'METRO-HOSP-001' },
    department: { id: 'dept-neur-04', name: 'Neurology', code: 'NEUR' }
  },
  {
    id: 'doc-03',
    userId: 'usr-doc-03',
    hospitalId: 'hosp-apollo-02',
    employeeId: 'EMP-DOC-103',
    qualification: 'MS, MCh (Orthopedics)',
    specialization: 'Orthopedics',
    registrationNo: 'MD-LIC-2026-1003',
    experienceYears: 14,
    consultationFee: 200.0,
    status: 'ACTIVE',
    user: { id: 'usr-doc-03', name: 'Dr. Elena Rostova', email: 'dr.elena@apollocity.com', status: 'ACTIVE' },
    hospital: { id: 'hosp-apollo-02', name: 'Apollo City Hospital', city: 'Metropolis', phone: '+1 (555) 123-4567', registrationNo: 'APOLLO-REG-999' },
    department: { id: 'dept-orth-05', name: 'Orthopedics', code: 'ORTHO' }
  },
  {
    id: 'doc-04',
    userId: 'usr-doc-04',
    hospitalId: 'hosp-apex-03',
    employeeId: 'EMP-DOC-104',
    qualification: 'MD, DNB (Oncology)',
    specialization: 'Oncology',
    registrationNo: 'MD-LIC-2026-1004',
    experienceYears: 15,
    consultationFee: 220.0,
    status: 'ACTIVE',
    user: { id: 'usr-doc-04', name: 'Dr. Marcus Vance', email: 'dr.vance@apexhealth.org', status: 'ACTIVE' },
    hospital: { id: 'hosp-apex-03', name: 'Apex Super Specialty & Research Institute', city: 'Metropolis', phone: '+1 (555) 888-9999', registrationNo: 'APEX-INST-2026' },
    department: { id: 'dept-onc-06', name: 'Oncology', code: 'ONCO' }
  }
];

const globalForDoctors = globalThis as unknown as { globalDoctorsStore: RegisteredDoctor[] };

if (!globalForDoctors.globalDoctorsStore) {
  globalForDoctors.globalDoctorsStore = [...defaultDoctors];
}

export function getGlobalDoctors(): RegisteredDoctor[] {
  return globalForDoctors.globalDoctorsStore;
}

export function addGlobalDoctor(doc: Partial<RegisteredDoctor>): RegisteredDoctor {
  const newDoc: RegisteredDoctor = {
    id: doc.id || `doc-${Date.now()}`,
    userId: doc.userId || `usr-doc-${Date.now()}`,
    hospitalId: doc.hospitalId || 'hosp-metro-01',
    employeeId: doc.employeeId || `EMP-DOC-${Date.now().toString().slice(-4)}`,
    specialization: doc.specialization || 'General Medicine',
    qualification: doc.qualification || 'MD, MBBS',
    registrationNo: doc.registrationNo || `MD-LIC-2026-${Date.now().toString().slice(-4)}`,
    experienceYears: doc.experienceYears || 5,
    consultationFee: doc.consultationFee || 150.0,
    status: doc.status || 'ACTIVE',
    user: doc.user || {
      id: doc.userId || `usr-doc-${Date.now()}`,
      name: 'Dr. Attending Physician',
      email: 'doctor@hospital.com',
      status: 'ACTIVE'
    },
    hospital: doc.hospital || {
      id: doc.hospitalId || 'hosp-metro-01',
      name: 'Metropolitan General Hospital',
      city: 'Metropolis'
    },
    department: doc.department || {
      id: 'dept-gen-01',
      name: 'General Medicine',
      code: 'GENMED'
    }
  };

  const existsIdx = globalForDoctors.globalDoctorsStore.findIndex(
    d => d.id === newDoc.id || d.registrationNo === newDoc.registrationNo || (d.user?.email && d.user.email === newDoc.user?.email)
  );

  if (existsIdx >= 0) {
    globalForDoctors.globalDoctorsStore[existsIdx] = newDoc;
  } else {
    globalForDoctors.globalDoctorsStore.unshift(newDoc);
  }

  return newDoc;
}

export function updateGlobalDoctorStatus(doctorId: string, status: string): RegisteredDoctor | null {
  const doc = globalForDoctors.globalDoctorsStore.find(d => d.id === doctorId);
  if (doc) {
    doc.status = status;
    if (doc.user) doc.user.status = status;
    return doc;
  }
  return null;
}
