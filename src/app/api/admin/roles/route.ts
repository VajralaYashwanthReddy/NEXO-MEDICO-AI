import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const granularPermissions = [
      { code: 'PATIENT_READ', name: 'View Patient Profiles', module: 'Patients' },
      { code: 'PATIENT_CREATE', name: 'Register New Patient', module: 'Patients' },
      { code: 'PATIENT_UPDATE', name: 'Update Patient Details', module: 'Patients' },
      { code: 'PATIENT_DELETE', name: 'Archive Patient Record', module: 'Patients' },
      { code: 'MEDICAL_RECORD_READ', name: 'Read Clinical History', module: 'Medical Records' },
      { code: 'MEDICAL_RECORD_CREATE', name: 'Create Encounter Note', module: 'Medical Records' },
      { code: 'PRESCRIPTION_CREATE', name: 'Issue Digital Prescription', module: 'Prescriptions' },
      { code: 'PRESCRIPTION_READ', name: 'View Prescriptions History', module: 'Prescriptions' },
      { code: 'PHARMACY_MANAGE', name: 'Manage Medicine Inventory & Dispensing', module: 'Pharmacy' },
      { code: 'LAB_MANAGE', name: 'Process Diagnostic Lab Orders & OCR', module: 'Laboratory' },
      { code: 'ICU_MANAGE', name: 'Log Hourly ICU Vitals & Bed Status', module: 'ICU / Wards' },
      { code: 'AI_USE', name: 'Execute AI Radiology & Disease Risk Inference', module: 'AI Services' },
      { code: 'AI_ADMIN', name: 'Manage & Deploy AI Models', module: 'AI Services' },
      { code: 'ANALYTICS_VIEW', name: 'View Operational Dashboards', module: 'Analytics' },
      { code: 'AUDIT_VIEW', name: 'Inspect System Security Audit Logs', module: 'Security' },
      { code: 'USER_MANAGE', name: 'Create & Provision Staff Accounts', module: 'User Management' },
      { code: 'HOSPITAL_MANAGE', name: 'Manage Hospital Tenant Settings', module: 'Platform' },
      { code: 'SYSTEM_SETTINGS', name: 'Super Admin Platform Configurations', module: 'Platform' }
    ];

    const roles = [
      { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Platform-level master administrator above all hospital tenants', permissions: granularPermissions.map(p => p.code) },
      { code: 'HOSPITAL_ADMIN', name: 'Hospital Administrator', description: 'Administrator for a single hospital organization tenant', permissions: ['PATIENT_READ', 'PATIENT_CREATE', 'MEDICAL_RECORD_READ', 'PRESCRIPTION_READ', 'PHARMACY_MANAGE', 'LAB_MANAGE', 'ICU_MANAGE', 'ANALYTICS_VIEW', 'USER_MANAGE', 'HOSPITAL_MANAGE'] },
      { code: 'DOCTOR', name: 'Attending Physician', description: 'Medical Doctor with prescription, consultation & AI diagnostic authority', permissions: ['PATIENT_READ', 'PATIENT_CREATE', 'MEDICAL_RECORD_READ', 'MEDICAL_RECORD_CREATE', 'PRESCRIPTION_CREATE', 'PRESCRIPTION_READ', 'AI_USE', 'ANALYTICS_VIEW'] },
      { code: 'NURSE', name: 'Inpatient Ward & ICU Nurse', description: 'Nursing staff responsible for ward beds & ICU hourly vitals monitoring', permissions: ['PATIENT_READ', 'MEDICAL_RECORD_READ', 'ICU_MANAGE', 'PRESCRIPTION_READ'] },
      { code: 'PHARMACIST', name: 'Hospital Pharmacist', description: 'Pharmacy staff managing drug inventory, safety checks & dispensing', permissions: ['PATIENT_READ', 'PRESCRIPTION_READ', 'PHARMACY_MANAGE'] },
      { code: 'LAB_TECH', name: 'Laboratory Diagnostic Specialist', description: 'Lab technician processing blood tests, lab orders & OCR extractions', permissions: ['PATIENT_READ', 'LAB_MANAGE'] },
      { code: 'PATIENT', name: 'Patient Self-Service User', description: 'Patient account accessing personal medical history & health score', permissions: ['PATIENT_READ', 'PRESCRIPTION_READ'] }
    ];

    return NextResponse.json({ roles, granularPermissions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
