import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, hashPassword } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hospitalId = searchParams.get('hospitalId') || '';
    const search = searchParams.get('q') || '';
    const departmentId = searchParams.get('departmentId') || '';

    const doctors = await prisma.doctorProfile.findMany({
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

    return NextResponse.json({ doctors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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
      const firstHosp = await prisma.hospital.findFirst({ select: { id: true } });
      targetHospitalId = firstHosp?.id || '';
    }

    if (!targetHospitalId) {
      return NextResponse.json({ error: 'No active hospital tenant context found' }, { status: 400 });
    }

    // Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return NextResponse.json({ error: `User with email '${email}' already exists` }, { status: 400 });
    }

    // Hash password
    const rawPassword = password || 'doctor123';
    const passwordHash = await hashPassword(rawPassword);

    // Create User Account with role DOCTOR
    const doctorUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'DOCTOR',
        hospitalId: targetHospitalId,
        status: 'ACTIVE'
      }
    });

    // Auto-generate employeeId and licenseNo if not provided
    const docCount = await prisma.doctorProfile.count({ where: { hospitalId: targetHospitalId } });
    const generatedEmployeeId = employeeId || `EMP-DOC-${String(docCount + 101).padStart(3, '0')}`;
    const generatedLicenseNo = licenseNo || `MD-LIC-2026-${String(docCount + 1001)}`;

    // Create Doctor Profile
    const doctorProfile = await prisma.doctorProfile.create({
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

    await createAuditLog({
      hospitalId: targetHospitalId,
      userId: user.id,
      action: 'DOCTOR_ONBOARD_CREATE',
      resource: `Doctor:${doctorProfile.registrationNo}`,
      details: { name, email, departmentId, specialization }
    });

    return NextResponse.json({
      message: 'Doctor account onboarded successfully',
      doctor: doctorProfile,
      credentials: {
        doctorId: doctorProfile.id,
        name: doctorUser.name,
        email: doctorUser.email,
        password: rawPassword,
        departmentName: doctorProfile.department?.name || 'General Clinical Department',
        licenseNo: doctorProfile.registrationNo,
        loginUrl: '/login'
      }
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: { user: true }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    // Update User Account
    const userUpdateData: any = {};
    if (name) userUpdateData.name = name;
    if (email) userUpdateData.email = email.toLowerCase().trim();
    if (status) userUpdateData.status = status;
    if (password) userUpdateData.passwordHash = await hashPassword(password);

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: doctor.userId },
        data: userUpdateData
      });
    }

    // Update Doctor Profile
    const profileUpdateData: any = {};
    if (specialization) profileUpdateData.specialization = specialization;
    if (departmentId !== undefined) profileUpdateData.departmentId = departmentId || null;
    if (licenseNo) profileUpdateData.registrationNo = licenseNo;
    if (consultationFee !== undefined) profileUpdateData.consultationFee = parseFloat(consultationFee);
    if (status) profileUpdateData.status = status;

    const updatedDoctor = await prisma.doctorProfile.update({
      where: { id: doctorId },
      data: profileUpdateData,
      include: {
        user: { select: { id: true, name: true, email: true, status: true } },
        hospital: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, code: true } }
      }
    });

    await createAuditLog({
      hospitalId: doctor.hospitalId,
      userId: user.id,
      action: status ? `DOCTOR_${status}` : 'DOCTOR_UPDATE',
      resource: `Doctor:${doctor.registrationNo}`,
      details: { doctorId, ...userUpdateData, ...profileUpdateData }
    });

    return NextResponse.json({ message: 'Doctor details updated successfully', doctor: updatedDoctor });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });
    }

    // Delete doctor profile and associated user
    await prisma.doctorProfile.delete({ where: { id: doctorId } });
    await prisma.user.delete({ where: { id: doctor.userId } });

    await createAuditLog({
      hospitalId: doctor.hospitalId,
      userId: user.id,
      action: 'DOCTOR_DELETE',
      resource: `Doctor:${doctor.registrationNo}`,
      details: { doctorId }
    });

    return NextResponse.json({ message: 'Doctor profile and account removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
