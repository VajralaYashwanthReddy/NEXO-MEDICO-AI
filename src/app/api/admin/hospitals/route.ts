import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';

    const hospitals = await prisma.hospital.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { registrationNo: { contains: search } },
          { city: { contains: search } },
          { email: { contains: search } }
        ]
      } : {},
      include: {
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

    return NextResponse.json({ hospitals });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const { name, type, registrationNo, email, phone, emergencyContact, address, city, state, country } = await req.json();

    if (!name || !registrationNo || !email || !phone) {
      return NextResponse.json({ error: 'Hospital name, registration number, email, and phone are required' }, { status: 400 });
    }

    const existing = await prisma.hospital.findUnique({
      where: { registrationNo: registrationNo.trim().toUpperCase() }
    });

    if (existing) {
      return NextResponse.json({ error: `Hospital with registration number '${registrationNo}' already exists` }, { status: 400 });
    }

    const hospital = await prisma.hospital.create({
      data: {
        name,
        type: type || 'General Hospital',
        registrationNo: registrationNo.trim().toUpperCase(),
        email: email.toLowerCase().trim(),
        phone,
        emergencyContact: emergencyContact || phone,
        address: address || 'Main Medical Complex',
        city: city || 'Metropolis',
        state: state || 'NY',
        country: country || 'USA',
        status: 'ACTIVE'
      }
    });

    await createAuditLog({
      hospitalId: hospital.id,
      userId: user?.id || null,
      action: 'PLATFORM_SUPER_ADMIN_CREATE_HOSPITAL',
      resource: `Hospital:${hospital.registrationNo}`,
      details: { name: hospital.name, registrationNo: hospital.registrationNo }
    });

    return NextResponse.json({ message: 'Hospital tenant registered successfully', hospital }, { status: 201 });
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

    const { hospitalId, status, name, type, email, phone, emergencyContact, address, city, state, country } = await req.json();

    if (!hospitalId) {
      return NextResponse.json({ error: 'hospitalId is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone) updateData.phone = phone;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (country) updateData.country = country;

    const hospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: updateData
    });

    await createAuditLog({
      hospitalId: hospital.id,
      userId: user.id,
      action: 'UPDATE_HOSPITAL_PROFILE',
      resource: `Hospital:${hospital.registrationNo}`,
      details: updateData
    });

    return NextResponse.json({ message: `Hospital profile updated successfully`, hospital });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
