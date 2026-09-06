import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { eventBroadcaster } from '@/lib/events';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    const orders = await prisma.labOrder.findMany({
      where: {
        hospitalId: user.hospitalId,
        ...(patientId ? { patientId } : {}),
        ...(status ? { status } : {})
      },
      include: {
        patient: true,
        test: true,
        report: true
      },
      orderBy: { orderedAt: 'desc' }
    });

    // Auto-seed standard hospital lab tests if none exist for this hospital
    let tests = await prisma.labTest.findMany({
      where: { hospitalId: user.hospitalId },
      orderBy: { name: 'asc' }
    });

    if (tests.length === 0) {
      const defaultTests = [
        { code: 'CBC', name: 'Complete Blood Count (CBC)', category: 'Hematology', sampleType: 'Whole Blood', price: 45.0, referenceRange: 'WBC: 4.5-11.0 k/uL, RBC: 4.3-5.9 M/uL, Hb: 13.5-17.5 g/dL' },
        { code: 'CMP', name: 'Comprehensive Metabolic Panel (CMP)', category: 'Biochemistry', sampleType: 'Serum', price: 75.0, referenceRange: 'Glucose: 70-99 mg/dL, BUN: 7-20 mg/dL, Creatinine: 0.7-1.3 mg/dL' },
        { code: 'LIPID', name: 'Lipid Profile & Cholesterol Panel', category: 'Biochemistry', sampleType: 'Serum', price: 55.0, referenceRange: 'Total Chol: <200 mg/dL, LDL: <100 mg/dL, HDL: >40 mg/dL' },
        { code: 'HBA1C', name: 'HbA1c Glycated Hemoglobin', category: 'Biochemistry', sampleType: 'Blood', price: 40.0, referenceRange: 'Normal: <5.7%, Prediabetes: 5.7-6.4%, Diabetes: >6.5%' },
        { code: 'THYROID', name: 'Thyroid Function Panel (TSH, T3, T4)', category: 'Endocrinology', sampleType: 'Serum', price: 85.0, referenceRange: 'TSH: 0.4-4.0 mIU/L' },
        { code: 'URINE', name: 'Routine Urinalysis & Microscopy', category: 'Pathology', sampleType: 'Urine', price: 30.0, referenceRange: 'Color: Yellow, pH: 5.0-8.0, Protein: Negative' },
        { code: 'XRAY-CHEST', name: 'Chest X-Ray PA & Lateral View', category: 'Radiology', sampleType: 'Digital Imaging', price: 90.0, referenceRange: 'Clear lung fields, normal cardiothoracic ratio' },
        { code: 'MRI-BRAIN', name: 'MRI Brain Scan (Non-Contrast)', category: 'Radiology', sampleType: 'Digital Imaging', price: 350.0, referenceRange: 'No acute intracranial hemorrhage or territorial infarction' }
      ];

      for (const t of defaultTests) {
        await prisma.labTest.create({
          data: {
            hospitalId: user.hospitalId,
            ...t
          }
        });
      }

      tests = await prisma.labTest.findMany({
        where: { hospitalId: user.hospitalId },
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json({ orders, tests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const { patientId, doctorId, testId, priority } = await req.json();

    if (!patientId || !testId) {
      return NextResponse.json({ error: 'Patient ID and Test ID are required' }, { status: 400 });
    }

    const test = await prisma.labTest.findFirst({
      where: { id: testId, hospitalId: user.hospitalId }
    });

    if (!test) {
      return NextResponse.json({ error: 'Laboratory test not found' }, { status: 404 });
    }

    const docId = doctorId || user.id;
    const count = await prisma.labOrder.count({ where: { hospitalId: user.hospitalId } });
    const orderCode = `LAB-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const order = await prisma.labOrder.create({
      data: {
        orderCode,
        patientId,
        doctorId: docId,
        hospitalId: user.hospitalId,
        testId: test.id,
        testName: test.name,
        priority: priority || 'ROUTINE',
        status: 'ORDERED'
      },
      include: {
        patient: true,
        test: true
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'LAB_TEST_ORDER',
      resource: `LabOrder:${order.orderCode}`,
      details: { patientId, testName: test.name }
    });

    eventBroadcaster.broadcast('LAB_ORDER_CREATED', order, user.hospitalId);

    return NextResponse.json({ message: 'Lab test ordered successfully', order }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    const order = await prisma.labOrder.update({
      where: { id: orderId },
      data: { status }
    });

    eventBroadcaster.broadcast('LAB_ORDER_STATUS_CHANGED', order, user.hospitalId);

    return NextResponse.json({ message: 'Order status updated', order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
