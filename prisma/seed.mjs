import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Nexo Medico AI Database Seeding...');

  // 1. Seed Roles
  const rolesData = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Platform level super administrator' },
    { code: 'HOSPITAL_ADMIN', name: 'Hospital Administrator', description: 'Central administrator for a specific hospital tenant' },
    { code: 'DOCTOR', name: 'Physician / Specialist', description: 'Medical doctor with consultation and prescribing rights' },
    { code: 'NURSE', name: 'Registered Nurse', description: 'Nursing staff managing vitals, beds, and inpatient care' },
    { code: 'RECEPTIONIST', name: 'Hospital Receptionist', description: 'Front desk staff handling appointments and patient registration' },
    { code: 'PHARMACIST', name: 'Licensed Pharmacist', description: 'Pharmacy staff verifying prescriptions and dispensing medicines' },
    { code: 'LAB_TECH', name: 'Laboratory Technician', description: 'Lab technician conducting tests and uploading reports' },
    { code: 'RADIOLOGY_TECH', name: 'Radiology Specialist', description: 'Radiology technician processing imaging studies' },
    { code: 'ICU_STAFF', name: 'ICU Specialist Staff', description: 'Critical care staff monitoring ICU beds and vitals' },
    { code: 'HR_ADMIN', name: 'HR & Staff Admin', description: 'Staff manager overseeing staff assignments and permissions' },
    { code: 'PATIENT', name: 'Patient Account', description: 'Registered patient viewing records and booking appointments' },
  ];

  for (const r of rolesData) {
    await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: r,
    });
  }

  // 2. Seed System Permissions
  const permissionsData = [
    { code: 'PATIENT_VIEW', name: 'View Patients', module: 'PATIENTS', description: 'Can view patient demographics and list' },
    { code: 'PATIENT_CREATE', name: 'Create Patient', module: 'PATIENTS', description: 'Can register new hospital patients' },
    { code: 'PATIENT_EDIT', name: 'Edit Patient', module: 'PATIENTS', description: 'Can modify patient information' },
    { code: 'PATIENT_DELETE', name: 'Delete Patient', module: 'PATIENTS', description: 'Can archive or delete patient records' },
    { code: 'MEDICAL_RECORD_VIEW', name: 'View Clinical Records', module: 'CLINICAL', description: 'Can view clinical notes and history' },
    { code: 'MEDICAL_RECORD_CREATE', name: 'Create Clinical Record', module: 'CLINICAL', description: 'Can document new medical encounters' },
    { code: 'MEDICAL_RECORD_EDIT', name: 'Edit Clinical Record', module: 'CLINICAL', description: 'Can modify existing medical records' },
    { code: 'PRESCRIPTION_VIEW', name: 'View Prescriptions', module: 'PHARMACY', description: 'Can view prescription history' },
    { code: 'PRESCRIPTION_CREATE', name: 'Issue Prescription', module: 'CLINICAL', description: 'Can create and sign digital prescriptions' },
    { code: 'PRESCRIPTION_EDIT', name: 'Edit Prescription', module: 'CLINICAL', description: 'Can alter draft prescriptions' },
    { code: 'LAB_REPORT_VIEW', name: 'View Lab Reports', module: 'LABORATORY', description: 'Can access laboratory diagnostic reports' },
    { code: 'LAB_REPORT_UPLOAD', name: 'Upload Lab Report', module: 'LABORATORY', description: 'Can perform OCR and submit lab reports' },
    { code: 'PHARMACY_VIEW', name: 'View Pharmacy Stock', module: 'PHARMACY', description: 'Can inspect drug inventory levels' },
    { code: 'MEDICINE_CREATE', name: 'Manage Medicines', module: 'PHARMACY', description: 'Can add or edit medicine inventory items' },
    { code: 'MEDICINE_DISPENSE', name: 'Dispense Medicines', module: 'PHARMACY', description: 'Can process and dispense issued prescriptions' },
    { code: 'ICU_VIEW', name: 'View ICU Dashboard', module: 'ICU', description: 'Can monitor ICU bed statuses and vitals' },
    { code: 'ICU_MANAGE', name: 'Manage ICU Beds', module: 'ICU', description: 'Can assign patients to ICU beds and log vitals' },
    { code: 'APPOINTMENT_VIEW', name: 'View Appointments', module: 'APPOINTMENTS', description: 'Can access appointment schedules' },
    { code: 'APPOINTMENT_CREATE', name: 'Book Appointment', module: 'APPOINTMENTS', description: 'Can schedule patient appointments' },
    { code: 'APPOINTMENT_MANAGE', name: 'Manage Appointments', module: 'APPOINTMENTS', description: 'Can reschedule or cancel appointments' },
    { code: 'ANALYTICS_VIEW', name: 'View Hospital Analytics', module: 'ANALYTICS', description: 'Can view hospital metrics and financial reports' },
    { code: 'ADMIN_MANAGE', name: 'Hospital Administration', module: 'ADMIN', description: 'Full administrative control over tenant settings and staff' },
  ];

  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { name: p.name, module: p.module, description: p.description },
      create: p,
    });
  }

  // 3. Map Roles to Permissions
  const rolePermissionMap = {
    SUPER_ADMIN: permissionsData.map(p => p.code),
    HOSPITAL_ADMIN: permissionsData.map(p => p.code),
    DOCTOR: ['PATIENT_VIEW', 'PATIENT_CREATE', 'PATIENT_EDIT', 'MEDICAL_RECORD_VIEW', 'MEDICAL_RECORD_CREATE', 'MEDICAL_RECORD_EDIT', 'PRESCRIPTION_VIEW', 'PRESCRIPTION_CREATE', 'PRESCRIPTION_EDIT', 'LAB_REPORT_VIEW', 'APPOINTMENT_VIEW', 'APPOINTMENT_CREATE', 'APPOINTMENT_MANAGE', 'ICU_VIEW', 'ANALYTICS_VIEW'],
    NURSE: ['PATIENT_VIEW', 'MEDICAL_RECORD_VIEW', 'PRESCRIPTION_VIEW', 'LAB_REPORT_VIEW', 'ICU_VIEW', 'ICU_MANAGE', 'APPOINTMENT_VIEW'],
    PHARMACIST: ['PRESCRIPTION_VIEW', 'PHARMACY_VIEW', 'MEDICINE_CREATE', 'MEDICINE_DISPENSE', 'PATIENT_VIEW'],
    LAB_TECH: ['LAB_REPORT_VIEW', 'LAB_REPORT_UPLOAD', 'PATIENT_VIEW'],
    ICU_STAFF: ['ICU_VIEW', 'ICU_MANAGE', 'PATIENT_VIEW', 'MEDICAL_RECORD_VIEW'],
    RECEPTIONIST: ['PATIENT_VIEW', 'PATIENT_CREATE', 'PATIENT_EDIT', 'APPOINTMENT_VIEW', 'APPOINTMENT_CREATE', 'APPOINTMENT_MANAGE'],
    PATIENT: ['PATIENT_VIEW', 'MEDICAL_RECORD_VIEW', 'PRESCRIPTION_VIEW', 'LAB_REPORT_VIEW', 'APPOINTMENT_VIEW', 'APPOINTMENT_CREATE']
  };

  for (const [roleCode, permCodes] of Object.entries(rolePermissionMap)) {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) continue;

    for (const pCode of permCodes) {
      const perm = await prisma.permission.findUnique({ where: { code: pCode } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id }
        });
      }
    }
  }

  // 4. Create Super Admin User
  const defaultPassword = await bcrypt.hash('password123', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@nexomedico.ai' },
    update: {},
    create: {
      email: 'superadmin@nexomedico.ai',
      passwordHash: defaultPassword,
      name: 'Nexo Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    }
  });

  // 5. Create Sample Hospital Tenant
  const hospital = await prisma.hospital.upsert({
    where: { registrationNo: 'METRO-HOSP-2026-001' },
    update: {},
    create: {
      name: 'Metropolitan General Hospital & Research Center',
      type: 'Multi-Specialty Research Hospital',
      registrationNo: 'METRO-HOSP-2026-001',
      email: 'contact@metrohospital.org',
      phone: '+1 (555) 019-2831',
      address: '742 Healthcare Boulevard, Medical District',
      city: 'Metropolis',
      state: 'New York',
      country: 'USA',
      website: 'https://metrohospital.org',
      emergencyContact: '+1 (555) 911-0000',
      deptCount: 6,
      bedCount: 150,
      status: 'ACTIVE'
    }
  });

  // 6. Create Hospital Admin
  const hospitalAdminUser = await prisma.user.upsert({
    where: { email: 'admin@metrohospital.org' },
    update: { hospitalId: hospital.id },
    create: {
      email: 'admin@metrohospital.org',
      passwordHash: defaultPassword,
      name: 'Dr. Arthur Vance (Hospital Administrator)',
      role: 'HOSPITAL_ADMIN',
      hospitalId: hospital.id,
      status: 'ACTIVE'
    }
  });

  // 7. Create Departments
  const depts = [
    { code: 'CARD', name: 'Cardiology', description: 'Heart and cardiovascular system medical center', location: 'Wing A - 3rd Floor', contact: 'Ext 301' },
    { code: 'NEUR', name: 'Neurology', description: 'Brain, spine, and central nervous system specialty', location: 'Wing B - 4th Floor', contact: 'Ext 402' },
    { code: 'GENMED', name: 'General Medicine', description: 'Comprehensive internal medicine & diagnostics', location: 'Main Building - 2nd Floor', contact: 'Ext 205' },
    { code: 'ORTHO', name: 'Orthopedics', description: 'Bone, joint, and musculoskeletal therapy', location: 'Wing C - 1st Floor', contact: 'Ext 104' },
    { code: 'EMERG', name: 'Emergency Trauma Center', description: '24/7 Acute trauma and critical triage unit', location: 'Ground Floor East Entrance', contact: 'Ext 911' },
    { code: 'ICU_DEPT', name: 'Intensive Care Unit', description: 'Advanced mechanical ventilation & life support', location: 'Wing A - 5th Floor', contact: 'Ext 555' }
  ];

  const deptMap = {};
  for (const d of depts) {
    const deptObj = await prisma.department.upsert({
      where: { hospitalId_code: { hospitalId: hospital.id, code: d.code } },
      update: { name: d.name, description: d.description, location: d.location },
      create: { ...d, hospitalId: hospital.id }
    });
    deptMap[d.code] = deptObj.id;
  }

  // 8. Create Doctors
  const doctorUser1 = await prisma.user.upsert({
    where: { email: 'dr.smith@metrohospital.org' },
    update: { hospitalId: hospital.id },
    create: {
      email: 'dr.smith@metrohospital.org',
      passwordHash: defaultPassword,
      name: 'Dr. Sarah Smith, MD',
      role: 'DOCTOR',
      hospitalId: hospital.id,
      departmentId: deptMap['CARD'],
      status: 'ACTIVE'
    }
  });

  await prisma.doctorProfile.upsert({
    where: { userId: doctorUser1.id },
    update: {},
    create: {
      userId: doctorUser1.id,
      hospitalId: hospital.id,
      employeeId: 'DOC-CARD-001',
      qualification: 'MD, FACC (Cardiology)',
      specialization: 'Interventional Cardiology',
      registrationNo: 'MC-NY-84720',
      experienceYears: 14,
      consultationFee: 150.0,
      departmentId: deptMap['CARD'],
      status: 'ACTIVE'
    }
  });

  const doctorUser2 = await prisma.user.upsert({
    where: { email: 'dr.patel@metrohospital.org' },
    update: { hospitalId: hospital.id },
    create: {
      email: 'dr.patel@metrohospital.org',
      passwordHash: defaultPassword,
      name: 'Dr. Rajesh Patel, MD',
      role: 'DOCTOR',
      hospitalId: hospital.id,
      departmentId: deptMap['NEUR'],
      status: 'ACTIVE'
    }
  });

  await prisma.doctorProfile.upsert({
    where: { userId: doctorUser2.id },
    update: {},
    create: {
      userId: doctorUser2.id,
      hospitalId: hospital.id,
      employeeId: 'DOC-NEUR-002',
      qualification: 'MD, DM (Neurology)',
      specialization: 'Neuro-vascular Disorders',
      registrationNo: 'MC-NY-92104',
      experienceYears: 11,
      consultationFee: 175.0,
      departmentId: deptMap['NEUR'],
      status: 'ACTIVE'
    }
  });

  // 9. Create Nurse, Pharmacist, Lab Tech
  const nurseUser = await prisma.user.upsert({
    where: { email: 'nurse.sarah@metrohospital.org' },
    update: { hospitalId: hospital.id },
    create: {
      email: 'nurse.sarah@metrohospital.org',
      passwordHash: defaultPassword,
      name: 'Nurse Sarah Connor, BSN',
      role: 'NURSE',
      hospitalId: hospital.id,
      status: 'ACTIVE'
    }
  });
  await prisma.nurseProfile.upsert({
    where: { userId: nurseUser.id },
    update: {},
    create: {
      userId: nurseUser.id,
      hospitalId: hospital.id,
      employeeId: 'NUR-ICU-101',
      shift: 'DAY',
      status: 'ACTIVE'
    }
  });

  const pharmaUser = await prisma.user.upsert({
    where: { email: 'pharma.alex@metrohospital.org' },
    update: { hospitalId: hospital.id },
    create: {
      email: 'pharma.alex@metrohospital.org',
      passwordHash: defaultPassword,
      name: 'Alex Rivera, PharmD',
      role: 'PHARMACIST',
      hospitalId: hospital.id,
      status: 'ACTIVE'
    }
  });

  const labUser = await prisma.user.upsert({
    where: { email: 'lab.tech@metrohospital.org' },
    update: { hospitalId: hospital.id },
    create: {
      email: 'lab.tech@metrohospital.org',
      passwordHash: defaultPassword,
      name: 'Elena Rostova, MT(ASCP)',
      role: 'LAB_TECH',
      hospitalId: hospital.id,
      status: 'ACTIVE'
    }
  });

  // 10. Create Sample Patient
  const patientUser = await prisma.user.upsert({
    where: { email: 'john.doe@gmail.com' },
    update: { hospitalId: hospital.id },
    create: {
      email: 'john.doe@gmail.com',
      passwordHash: defaultPassword,
      name: 'John Doe',
      role: 'PATIENT',
      hospitalId: hospital.id,
      status: 'ACTIVE'
    }
  });

  const patientObj = await prisma.patient.upsert({
    where: { patientCode: 'NEXO-PAT-000001' },
    update: {},
    create: {
      patientCode: 'NEXO-PAT-000001',
      hospitalId: hospital.id,
      userId: patientUser.id,
      fullName: 'John Doe',
      dob: '1982-06-14',
      gender: 'Male',
      phone: '+1 (555) 321-7890',
      email: 'john.doe@gmail.com',
      address: '104 Maple Street, Brooklyn, NY',
      emergencyContact: 'Jane Doe (Spouse) - +1 (555) 987-6543',
      bloodGroup: 'O+',
      allergies: 'Penicillin, Sulfa Drugs',
      conditions: 'Type 2 Diabetes Mellitus, Essential Hypertension',
      previousHistory: 'Appendectomy (2018), Mild Asthma in childhood'
    }
  });

  // 11. Seed Medicines & Pharmacy Inventory
  const medicinesList = [
    { code: 'MED-PAR-500', name: 'Paracetamol', genericName: 'Acetaminophen', category: 'Analgesic / Antipyretic', manufacturer: 'PharmaCorp Inc', unitPrice: 0.50, qty: 500, status: 'IN_STOCK' },
    { code: 'MED-AMO-500', name: 'Amoxicillin', genericName: 'Amoxicillin Trihydrate', category: 'Antibiotic', manufacturer: 'BioMed Labs', unitPrice: 1.25, qty: 8, status: 'LOW_STOCK' },
    { code: 'MED-ATO-20', name: 'Atorvastatin', genericName: 'Atorvastatin Calcium', category: 'Cardiovascular', manufacturer: 'HeartCare Rx', unitPrice: 2.10, qty: 350, status: 'IN_STOCK' },
    { code: 'MED-MET-500', name: 'Metformin', genericName: 'Metformin Hydrochloride', category: 'Antidiabetic', manufacturer: 'EndoPharma', unitPrice: 0.85, qty: 600, status: 'IN_STOCK' },
    { code: 'MED-LIS-10', name: 'Lisinopril', genericName: 'Lisinopril', category: 'Antihypertensive', manufacturer: 'VascularHealth', unitPrice: 1.10, qty: 15, status: 'EXPIRING_SOON' }
  ];

  for (const m of medicinesList) {
    const med = await prisma.medicine.upsert({
      where: { hospitalId_code: { hospitalId: hospital.id, code: m.code } },
      update: { name: m.name, genericName: m.genericName },
      create: {
        hospitalId: hospital.id,
        code: m.code,
        name: m.name,
        genericName: m.genericName,
        category: m.category,
        manufacturer: m.manufacturer,
        storageInfo: 'Store below 25°C in a dry place'
      }
    });

    await prisma.pharmacyInventory.create({
      data: {
        hospitalId: hospital.id,
        medicineId: med.id,
        batchNo: `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: '2027-12-31',
        quantity: m.qty,
        reorderLevel: 20,
        unitPrice: m.unitPrice,
        status: m.status
      }
    });
  }

  // 12. Seed Lab Tests Catalog
  const labTestsList = [
    { code: 'LAB-CBC', name: 'Complete Blood Count (CBC)', category: 'Hematology', sampleType: 'Whole Blood', price: 45.0, range: 'Hb: 13.5-17.5 g/dL, WBC: 4.5-11.0 k/uL' },
    { code: 'LAB-FBS', name: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry', sampleType: 'Blood Plasma', price: 25.0, range: '70 - 99 mg/dL' },
    { code: 'LAB-LIPID', name: 'Lipid Profile Panel', category: 'Biochemistry', sampleType: 'Serum', price: 65.0, range: 'Cholesterol < 200 mg/dL, Triglycerides < 150 mg/dL' },
    { code: 'LAB-KFT', name: 'Kidney Function Test (KFT)', category: 'Biochemistry', sampleType: 'Serum', price: 55.0, range: 'Creatinine: 0.7-1.3 mg/dL, BUN: 7-20 mg/dL' },
    { code: 'LAB-LFT', name: 'Liver Function Test (LFT)', category: 'Biochemistry', sampleType: 'Serum', price: 60.0, range: 'ALT: 7-56 U/L, AST: 10-40 U/L' }
  ];

  for (const lt of labTestsList) {
    await prisma.labTest.upsert({
      where: { hospitalId_code: { hospitalId: hospital.id, code: lt.code } },
      update: { name: lt.name, price: lt.price, referenceRange: lt.range },
      create: {
        hospitalId: hospital.id,
        code: lt.code,
        name: lt.name,
        category: lt.category,
        sampleType: lt.sampleType,
        price: lt.price,
        referenceRange: lt.range
      }
    });
  }

  // 13. Seed Wards, Beds & ICU Units
  const wardsList = [
    { code: 'WARD-GEN-A', name: 'General Ward Alpha', type: 'General', bedsCount: 10 },
    { code: 'WARD-PRIV-B', name: 'Private Suite Wing', type: 'Private', bedsCount: 5 },
    { code: 'WARD-ICU-1', name: 'Intensive Care Unit 1', type: 'ICU', bedsCount: 5 }
  ];

  for (const w of wardsList) {
    const wardObj = await prisma.ward.upsert({
      where: { hospitalId_code: { hospitalId: hospital.id, code: w.code } },
      update: { name: w.name, totalBeds: w.bedsCount },
      create: {
        hospitalId: hospital.id,
        code: w.code,
        name: w.name,
        type: w.type,
        totalBeds: w.bedsCount
      }
    });

    for (let i = 1; i <= w.bedsCount; i++) {
      const bNum = `${w.code.split('-')[1]}-${i < 10 ? '0' + i : i}`;
      await prisma.bed.upsert({
        where: { wardId_bedNumber: { wardId: wardObj.id, bedNumber: bNum } },
        update: {},
        create: {
          wardId: wardObj.id,
          hospitalId: hospital.id,
          bedNumber: bNum,
          status: i === 1 ? 'OCCUPIED' : (i === 2 ? 'CLEANING' : 'AVAILABLE')
        }
      });
    }
  }

  await prisma.iCUUnit.upsert({
    where: { hospitalId_code: { hospitalId: hospital.id, code: 'ICU-UNIT-01' } },
    update: {},
    create: {
      hospitalId: hospital.id,
      code: 'ICU-UNIT-01',
      name: 'Cardiac & Trauma Critical ICU',
      capacity: 5,
      location: 'Wing A - 5th Floor'
    }
  });

  console.log('✅ Nexo Medico AI Database Seeding Completed Successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 Credentials summary:');
  console.log('Super Admin:     superadmin@nexomedico.ai / password123');
  console.log('Hospital Admin:  admin@metrohospital.org / password123');
  console.log('Doctor (Cardio): dr.smith@metrohospital.org / password123');
  console.log('Doctor (Neuro):  dr.patel@metrohospital.org / password123');
  console.log('Nurse:           nurse.sarah@metrohospital.org / password123');
  console.log('Pharmacist:      pharma.alex@metrohospital.org / password123');
  console.log('Lab Tech:        lab.tech@metrohospital.org / password123');
  console.log('Patient:         john.doe@gmail.com / password123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
