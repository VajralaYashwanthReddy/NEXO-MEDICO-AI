import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { eventBroadcaster } from '@/lib/events';
import { getGlobalHospitals, addGlobalHospital, updateGlobalHospitalStatus, deleteGlobalHospitalInMemory } from '@/lib/hospitalStore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('q') || '').toLowerCase().trim();

  let dbHospitals: any[] = [];
  try {
    dbHospitals = await prisma.hospital.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { registrationNo: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : {},
      include: {
        users: {
          where: { role: 'HOSPITAL_ADMIN' },
          select: { id: true, name: true, email: true, status: true }
        },
        _count: {
          select: {
            users: true,
            doctorProfiles: true,
            nurseProfiles: true,
            staffProfiles: true,
            patients: true,
            wards: true,
            beds: true,
            admissions: true,
            prescriptions: true,
            labOrders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (err: any) {
    console.warn('Prisma DB query failed in /api/admin/hospitals:', err.message);
    const storeHospitals = getGlobalHospitals();
    return NextResponse.json({ hospitals: storeHospitals });
  }

  return NextResponse.json({ hospitals: dbHospitals });
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Only Platform Super Admin can add hospital tenants directly' }, { status: 403 });
    }

    const body = await req.json();
    const { name, type, registrationNo, email, phone, emergencyContact, address, city, state, country } = body;

    if (!name || !registrationNo || !email || !phone) {
      return NextResponse.json({ error: 'Hospital name, registration number, email, and phone are required' }, { status: 400 });
    }

    const regClean = registrationNo.trim().toUpperCase();
    const emailClean = email.toLowerCase().trim();
    const phoneClean = phone.trim();

    // Check duplicate in DB
    const existingDb = await prisma.hospital.findFirst({
      where: {
        OR: [
          { registrationNo: regClean },
          { email: emailClean },
          { phone: phoneClean }
        ]
      }
    });

    if (existingDb) {
      if (existingDb.email === emailClean) {
        return NextResponse.json({ error: 'Email already exists. Please use a different email address.', field: 'email' }, { status: 409 });
      }
      if (existingDb.phone === phoneClean) {
        return NextResponse.json({ error: 'Phone number already exists. Please use a different phone number.', field: 'phone' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Registration number already exists. Please use a different registration number.', field: 'registrationNo' }, { status: 409 });
    }

    const createdHospital = await prisma.hospital.create({
      data: {
        name,
        type: type || 'General Hospital',
        registrationNo: regClean,
        email: emailClean,
        phone: phoneClean,
        emergencyContact: emergencyContact || phoneClean,
        address: address || 'Main Medical Complex',
        city: city || 'Metropolis',
        state: state || 'NY',
        country: country || 'USA',
        status: 'ACTIVE'
      }
    });

    addGlobalHospital(createdHospital);

    try {
      await createAuditLog({
        hospitalId: createdHospital.id,
        userId: user.id,
        action: 'PLATFORM_SUPER_ADMIN_CREATE_HOSPITAL',
        resource: `Hospital:${createdHospital.registrationNo}`,
        details: { name: createdHospital.name, registrationNo: createdHospital.registrationNo }
      });
    } catch (aErr) {}

    try {
      eventBroadcaster.broadcast('HOSPITAL_REGISTERED', { hospital: createdHospital });
    } catch (e) {}

    return NextResponse.json({ message: 'Hospital tenant registered successfully', hospital: createdHospital }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Only Platform Super Admin can update hospital status or profile' }, { status: 403 });
    }

    const { hospitalId, status, name, type, email, phone, emergencyContact, address, city, state, country } = await req.json();

    if (!hospitalId) {
      return NextResponse.json({ error: 'hospitalId is required' }, { status: 400 });
    }

    const existingHosp = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    });

    if (!existingHosp) {
      return NextResponse.json({ error: 'Hospital tenant not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      if (status !== 'ACTIVE' && status !== 'SUSPENDED') {
        return NextResponse.json({ error: 'Invalid status. Must be ACTIVE or SUSPENDED.' }, { status: 400 });
      }
      updateData.status = status;
    }
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone) updateData.phone = phone;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (country) updateData.country = country;

    const updatedHosp = await prisma.hospital.update({
      where: { id: hospitalId },
      data: updateData
    });

    if (status) {
      updateGlobalHospitalStatus(hospitalId, status);

      // Audit log for suspension or reactivation
      try {
        await createAuditLog({
          hospitalId: hospitalId,
          userId: user.id,
          action: status === 'SUSPENDED' ? 'PLATFORM_SUPER_ADMIN_SUSPEND_HOSPITAL' : 'PLATFORM_SUPER_ADMIN_REACTIVATE_HOSPITAL',
          resource: `Hospital:${hospitalId} (${updatedHosp.name})`,
          details: {
            hospitalName: updatedHosp.name,
            registrationNo: updatedHosp.registrationNo,
            previousStatus: existingHosp.status,
            newStatus: status,
            superAdminEmail: user.email,
            timestamp: new Date().toISOString()
          }
        });
      } catch (aErr) {}

      try {
        eventBroadcaster.broadcast('HOSPITAL_STATUS_UPDATED', { hospitalId, status });
      } catch (e) {}
    }

    return NextResponse.json({
      message: `Hospital ${status === 'SUSPENDED' ? 'suspended' : status === 'ACTIVE' ? 'reactivated' : 'updated'} successfully`,
      hospital: updatedHosp
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Only Platform Super Admin can delete hospital tenants' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get('hospitalId');

    if (!hospitalId) {
      return NextResponse.json({ error: 'hospitalId is required' }, { status: 400 });
    }

    const targetHospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    });

    if (!targetHospital) {
      return NextResponse.json({ error: 'Hospital tenant not found' }, { status: 404 });
    }

    // Transactional cascade deletion of all tenant data in topological order
    await prisma.$transaction(async (tx) => {
      // 1. Hospital-specific audit logs
      await tx.auditLog.deleteMany({ where: { hospitalId } });

      // 2. Support tickets
      await tx.supportIssue.deleteMany({ where: { hospitalId } });

      // 3. AI Prediction Logs
      await tx.aIPredictionLog.deleteMany({ where: { hospitalId } });

      // 4. ICU logs & ICU units
      await tx.iCUBedLog.deleteMany({ where: { hospitalId } });
      await tx.iCUUnit.deleteMany({ where: { hospitalId } });

      // 5. Admissions & Discharges
      await tx.discharge.deleteMany({ where: { hospitalId } });
      await tx.admission.deleteMany({ where: { hospitalId } });

      // 6. Beds & Wards
      await tx.bed.deleteMany({ where: { hospitalId } });
      await tx.ward.deleteMany({ where: { hospitalId } });

      // 7. Clinical diagnostic records
      await tx.medicalImage.deleteMany({ where: { hospitalId } });
      await tx.labReport.deleteMany({ where: { hospitalId } });
      await tx.labOrder.deleteMany({ where: { hospitalId } });
      await tx.labTest.deleteMany({ where: { hospitalId } });

      // 8. Pharmacy logs & inventory
      await tx.dispensingLog.deleteMany({ where: { hospitalId } });
      await tx.pharmacyInventory.deleteMany({ where: { hospitalId } });
      await tx.medicine.deleteMany({ where: { hospitalId } });

      // 9. Prescriptions & Prescription items
      const prescriptions = await tx.prescription.findMany({ where: { hospitalId }, select: { id: true } });
      const prescriptionIds = prescriptions.map(p => p.id);
      if (prescriptionIds.length > 0) {
        await tx.prescriptionItem.deleteMany({ where: { prescriptionId: { in: prescriptionIds } } });
        await tx.drugInteractionAlert.deleteMany({ where: { prescriptionId: { in: prescriptionIds } } });
      }
      await tx.prescription.deleteMany({ where: { hospitalId } });

      // 10. Consultations, Appointments, Medical Records
      await tx.consultation.deleteMany({ where: { hospitalId } });
      await tx.appointment.deleteMany({ where: { hospitalId } });
      await tx.medicalRecord.deleteMany({ where: { hospitalId } });

      // 11. Patients
      await tx.patient.updateMany({ where: { hospitalId }, data: { userId: null } });
      await tx.patient.deleteMany({ where: { hospitalId } });

      // 12. Staff, Doctor, Nurse profiles
      await tx.doctorProfile.deleteMany({ where: { hospitalId } });
      await tx.nurseProfile.deleteMany({ where: { hospitalId } });
      await tx.staffProfile.deleteMany({ where: { hospitalId } });

      // 13. Departments
      await tx.department.deleteMany({ where: { hospitalId } });

      // 14. Hospital users & user permissions
      const hospitalUsers = await tx.user.findMany({ where: { hospitalId }, select: { id: true } });
      const hospitalUserIds = hospitalUsers.map(u => u.id);
      if (hospitalUserIds.length > 0) {
        await tx.userPermission.deleteMany({ where: { userId: { in: hospitalUserIds } } });
        await tx.user.deleteMany({ where: { id: { in: hospitalUserIds } } });
      }

      // 15. Finally delete the Hospital entity
      await tx.hospital.delete({ where: { id: hospitalId } });
    });

    // Remove from in-memory fallback store
    deleteGlobalHospitalInMemory(hospitalId);

    // Record permanent audit log (with hospitalId: null to persist without FK constraint)
    try {
      await createAuditLog({
        hospitalId: null,
        userId: user.id,
        action: 'PLATFORM_SUPER_ADMIN_DELETE_HOSPITAL',
        resource: `Hospital:${targetHospital.id} (${targetHospital.name})`,
        details: {
          hospitalId: targetHospital.id,
          hospitalName: targetHospital.name,
          registrationNo: targetHospital.registrationNo,
          deletedBy: user.email,
          deletedAt: new Date().toISOString()
        }
      });
    } catch (aErr) {}

    try {
      eventBroadcaster.broadcast('HOSPITAL_DELETED', { hospitalId });
    } catch (e) {}

    return NextResponse.json({ message: 'Hospital tenant permanently deleted successfully', hospitalId });
  } catch (err: any) {
    console.error('Hospital deletion transaction failed:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete hospital tenant' }, { status: 500 });
  }
}
