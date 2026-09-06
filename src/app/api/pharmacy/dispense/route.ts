import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { eventBroadcaster } from '@/lib/events';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const { prescriptionId, notes } = await req.json();

    if (!prescriptionId) {
      return NextResponse.json({ error: 'Prescription ID is required' }, { status: 400 });
    }

    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, hospitalId: user.hospitalId },
      include: { items: true, patient: true }
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    if (prescription.status === 'DISPENSED') {
      return NextResponse.json({ error: 'Prescription has already been dispensed' }, { status: 400 });
    }

    // Process inventory deduction for each item in the prescription
    for (const item of prescription.items) {
      const med = await prisma.medicine.findFirst({
        where: {
          hospitalId: user.hospitalId,
          OR: [
            { name: { contains: item.medicineName } },
            { genericName: { contains: item.medicineName } }
          ]
        },
        include: { inventoryItems: true }
      });

      if (med && med.inventoryItems.length > 0) {
        const inv = med.inventoryItems[0];
        const newQty = Math.max(0, inv.quantity - item.quantity);
        const newStatus = newQty === 0 ? 'OUT_OF_STOCK' : (newQty <= inv.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK');
        
        await prisma.pharmacyInventory.update({
          where: { id: inv.id },
          data: { quantity: newQty, status: newStatus }
        });
      }
    }

    // Update prescription status to DISPENSED
    const updatedRx = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: 'DISPENSED' }
    });

    // Record Dispensing Log
    const log = await prisma.dispensingLog.create({
      data: {
        hospitalId: user.hospitalId,
        prescriptionId,
        dispensedByUserId: user.id,
        notes: notes || 'Dispensed cleanly by pharmacist'
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'MEDICINE_DISPENSE',
      resource: `Prescription:${prescription.prescriptionCode}`,
      details: { patientId: prescription.patientId, itemsCount: prescription.items.length }
    });

    eventBroadcaster.broadcast('PRESCRIPTION_DISPENSED', updatedRx, user.hospitalId);

    return NextResponse.json({ message: 'Prescription verified and dispensed successfully', prescription: updatedRx, log });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
