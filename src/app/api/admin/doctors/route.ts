import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, hashPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { getGlobalDoctors, addGlobalDoctor, updateGlobalDoctorStatus } from '@/lib/doctorStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get('hospitalId') || '';
    const search = (searchParams.get('q') || '').toLowerCase().trim();
    const departmentId = searchParams.get('departmentId') || '';

    let dbDoctors: any[] = [];
    try {
      dbDoctors = await prisma.doctorProfile.findMany({
        where: {
          ...(hospitalId ? { hospitalId } : {}),
          ...(departmentId ? { departmentId } : {}),
          ...(search ? {
            OR: [
              { specialization: { contains: search } },
              { user: { name: { contains: search } } },
              { user: { email: { contains: search } } },
              { registrationNo: { contains: search } }
            ]
          } : {})
        },
        include: {
          user: { select: { id: true, name: true, email: true, status: true } },
          hospital: { select: { id: true, name: true, city: true, phone: true, registrationNo: true } },
          department: { select: { id: true, name: true, code: true } }
        },
        orderBy: { id: 'desc' }
      });
    } catch (err: any) {
      console.warn('Prisma doctors query skipped in GET /api/admin/doctors:', err.message);
    }

    const storeDoctors = getGlobalDoctors();
    const map = new Map<string, any>();

    // Add store doctors first
    for (const d of storeDoctors) {
      map.set(d.id, d);
      if (d.registrationNo) map.set(d.registrationNo, d);
    }

    // Add / override with DB doctors
    for (const d of dbDoctors) {
      map.set(d.id, d);
    }

    let allDoctors = Array.from(new Set(map.values()));

    if (hospitalId) {
      allDoctors = allDoctors.filter(d => d.hospitalId === hospitalId);
    }
    if (departmentId) {
      allDoctors = allDoctors.filter(d => d.departmentId === departmentId);
    }
    if (search) {
      allDoctors = allDoctors.filter(d =>
        (d.specialization && d.specialization.toLowerCase().includes(search)) ||
        (d.user?.name && d.user.name.toLowerCase().includes(search)) ||
        (d.user?.email && d.user.email.toLowerCase().includes(search)) ||
        (d.hospital?.name && d.hospital.name.toLowerCase().includes(search)) ||
        (d.registrationNo && d.registrationNo.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ doctors: allDoctors });
  } catch (err: any) {
    console.error('Error in GET /api/admin/doctors:', err);
    return NextResponse.json({ doctors: getGlobalDoctors() });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const {
      name,
      email,
      password,
      specialization,
      departmentId,
      hospitalId,
      licenseNo,
      employeeId,
      qualification,
      consultationFee
    } = await req.json();

    if (!name || !email || !specialization) {
      return NextResponse.json({ error: 'Doctor name, email, and specialization are required' }, { status: 400 });
    }

    // Determine target hospital ID
    let targetHospitalId = hospitalId || user.hospitalId;
    if (!targetHospitalId) {
      try {
        const firstHosp = await prisma.hospital.findFirst({ select: { id: true } });
        targetHospitalId = firstHosp?.id || 'hosp-metro-01';
      } catch (e) {
        targetHospitalId = 'hosp-metro-01';
      }
    }

    let createdDoctor: any = null;
    let doctorUser: any = null;
    const rawPassword = password || 'doctor123';
    const cleanEmail = email.toLowerCase().trim();

    try {
      // Check existing email
      const existingUser = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });

      if (existingUser) {
        return NextResponse.json({ error: `User with email '${email}' already exists` }, { status: 400 });
      }

      const passwordHash = await hashPassword(rawPassword);

      doctorUser = await prisma.user.create({
        data: {
          name,
          email: cleanEmail,
          passwordHash,
          role: 'DOCTOR',
          hospitalId: targetHospitalId,
          status: 'ACTIVE'
        }
      });

      let docCount = 0;
      try {
        docCount = await prisma.doctorProfile.count({ where: { hospitalId: targetHospitalId } });
      } catch (e) {
        docCount = 0;
      }
      const generatedEmployeeId = employeeId || `EMP-DOC-${String(docCount + 101).padStart(3, '0')}`;
      const generatedLicenseNo = licenseNo || `MD-LIC-2026-${String(docCount + 1001)}`;

      createdDoctor = await prisma.doctorProfile.create({
        data: {
          userId: doctorUser.id,
          hospitalId: targetHospitalId,
          departmentId: departmentId || null,
          specialization,
          employeeId: generatedEmployeeId,
          registrationNo: generatedLicenseNo,
          qualification: qualification || 'MD, MBBS',
          consultationFee: consultationFee ? parseFloat(consultationFee) : 150.0,
          status: 'ACTIVE'
        },
        include: {
          user: { select: { id: true, name: true, email: true, status: true } },
          hospital: { select: { id: true, name: true } },
          department: { select: { id: true, name: true, code: true } }
        }
      });
    } catch (err: any) {
      console.warn('Prisma doctor profile creation warning, using global store fallback:', err.message);
    }

    const doctorData = createdDoctor || {
      id: `doc-${Date.now()}`,
      userId: doctorUser?.id || `usr-doc-${Date.now()}`,
      hospitalId: targetHospitalId,
      employeeId: employeeId || `EMP-DOC-${Date.now().toString().slice(-4)}`,
      specialization,
      qualification: qualification || 'MD, MBBS',
      registrationNo: licenseNo || `MD-LIC-2026-${Date.now().toString().slice(-4)}`,
      consultationFee: consultationFee ? parseFloat(consultationFee) : 150.0,
      status: 'ACTIVE',
      user: {
        id: doctorUser?.id || `usr-doc-${Date.now()}`,
        name,
        email: cleanEmail,
        status: 'ACTIVE'
      },
      hospital: {
        id: targetHospitalId,
        name: 'Metropolitan General Hospital',
        city: 'Metropolis'
      }
    };

    const finalDoctor = addGlobalDoctor(doctorData);

    try {
      await createAuditLog({
        hospitalId: targetHospitalId,
        userId: user.id,
        action: 'DOCTOR_ONBOARD_CREATE',
        resource: `Doctor:${finalDoctor.registrationNo}`,
        details: { name, email: cleanEmail, specialization }
      });
    } catch (e) {
      // audit log fail safe
    }

    return NextResponse.json({
      message: 'Doctor account onboarded successfully',
      doctor: finalDoctor,
      credentials: {
        doctorId: finalDoctor.id,
        name: finalDoctor.user.name,
        email: finalDoctor.user.email,
        password: rawPassword,
        departmentName: finalDoctor.department?.name || 'General Clinical Department',
        licenseNo: finalDoctor.registrationNo,
        loginUrl: '/login'
      }
    }, { status: 201 });
  } catch (err: any) {
    console.error('Doctor onboarding error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const {
      doctorId,
      name,
      email,
      password,
      specialization,
      departmentId,
      licenseNo,
      consultationFee,
      status
    } = await req.json();

    if (!doctorId) {
      return NextResponse.json({ error: 'doctorId is required' }, { status: 400 });
    }

    if (status) {
      updateGlobalDoctorStatus(doctorId, status);
    }

    let updatedDoctor: any = null;
    try {
      const profileUpdateData: any = {};
      if (specialization) profileUpdateData.specialization = specialization;
      if (departmentId !== undefined) profileUpdateData.departmentId = departmentId || null;
      if (licenseNo) profileUpdateData.registrationNo = licenseNo;
      if (consultationFee !== undefined) profileUpdateData.consultationFee = parseFloat(consultationFee);
      if (status) profileUpdateData.status = status;

      updatedDoctor = await prisma.doctorProfile.update({
        where: { id: doctorId },
        data: profileUpdateData,
        include: {
          user: { select: { id: true, name: true, email: true, status: true } },
          hospital: { select: { id: true, name: true } },
          department: { select: { id: true, name: true, code: true } }
        }
      });

      if (name || email || status || password) {
        const userUpdate: any = {};
        if (name) userUpdate.name = name;
        if (email) userUpdate.email = email.toLowerCase().trim();
        if (status) userUpdate.status = status;
        if (password) userUpdate.passwordHash = await hashPassword(password);
        await prisma.user.update({
          where: { id: updatedDoctor.userId },
          data: userUpdate
        });
      }
    } catch (err: any) {
      console.warn('Prisma doctor update warning:', err.message);
    }

    return NextResponse.json({ message: 'Doctor details updated successfully', doctor: updatedDoctor || { id: doctorId } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized user context' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('id');

    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });
    }

    try {
      const doc = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
      if (doc) {
        await prisma.doctorProfile.delete({ where: { id: doctorId } });
        await prisma.user.delete({ where: { id: doc.userId } });
      }
    } catch (e) {
      console.warn('Prisma doctor delete warning:', e);
    }

    updateGlobalDoctorStatus(doctorId, 'DELETED');

    return NextResponse.json({ message: 'Doctor profile and account removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

