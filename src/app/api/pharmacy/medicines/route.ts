import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const medicines = await prisma.medicine.findMany({
      where: { hospitalId: user.hospitalId },
      include: {
        inventoryItems: {
          orderBy: { expiryDate: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    const alerts: Array<{ medicineId: string; medicineName: string; type: string; details: string }> = [];

    for (const m of medicines) {
      const totalQty = m.inventoryItems.reduce((acc, inv) => acc + inv.quantity, 0);
      if (totalQty === 0) {
        alerts.push({ medicineId: m.id, medicineName: m.name, type: 'OUT_OF_STOCK', details: 'Zero stock remaining in pharmacy' });
      } else if (totalQty <= 15) {
        alerts.push({ medicineId: m.id, medicineName: m.name, type: 'LOW_STOCK', details: `Only ${totalQty} units left in stock` });
      }

      for (const inv of m.inventoryItems) {
        if (inv.status === 'EXPIRING_SOON') {
          alerts.push({ medicineId: m.id, medicineName: m.name, type: 'EXPIRING_SOON', details: `Batch ${inv.batchNo} expires on ${inv.expiryDate}` });
        }
      }
    }

    return NextResponse.json({ medicines, alerts });
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

    const { code, name, genericName, category, manufacturer, batchNo, expiryDate, quantity, unitPrice, reorderLevel } = await req.json();

    if (!code || !name || !genericName || !quantity) {
      return NextResponse.json({ error: 'Medicine code, name, generic name, and quantity are required' }, { status: 400 });
    }

    const medicine = await prisma.medicine.upsert({
      where: { hospitalId_code: { hospitalId: user.hospitalId, code: code.toUpperCase().trim() } },
      update: { name, genericName, category: category || 'General' },
      create: {
        hospitalId: user.hospitalId,
        code: code.toUpperCase().trim(),
        name,
        genericName,
        category: category || 'General',
        manufacturer: manufacturer || 'Pharma Supplier'
      }
    });

    const qtyNum = parseInt(quantity);
    const status = qtyNum <= (reorderLevel || 10) ? 'LOW_STOCK' : 'IN_STOCK';

    const inventory = await prisma.pharmacyInventory.create({
      data: {
        hospitalId: user.hospitalId,
        medicineId: medicine.id,
        batchNo: batchNo || `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: expiryDate || '2027-12-31',
        quantity: qtyNum,
        reorderLevel: parseInt(reorderLevel || '10'),
        unitPrice: parseFloat(unitPrice || '1.0'),
        status
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'MEDICINE_INVENTORY_ADD',
      resource: `Medicine:${medicine.code}`,
      details: { name: medicine.name, quantity: qtyNum }
    });

    return NextResponse.json({ message: 'Stock added successfully', medicine, inventory }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// RESTOCK / INCREASE STOCK ENDPOINT
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !user.hospitalId) {
      return NextResponse.json({ error: 'Unauthorized hospital tenant context' }, { status: 401 });
    }

    const { inventoryId, addedQuantity } = await req.json();

    if (!inventoryId || !addedQuantity) {
      return NextResponse.json({ error: 'inventoryId and addedQuantity are required' }, { status: 400 });
    }

    const inventoryItem = await prisma.pharmacyInventory.findFirst({
      where: { id: inventoryId, hospitalId: user.hospitalId },
      include: { medicine: true }
    });

    if (!inventoryItem) {
      return NextResponse.json({ error: 'Inventory batch not found' }, { status: 404 });
    }

    const addQty = parseInt(addedQuantity);
    const newQty = inventoryItem.quantity + addQty;
    const newStatus = newQty > inventoryItem.reorderLevel ? 'IN_STOCK' : 'LOW_STOCK';

    const updatedInventory = await prisma.pharmacyInventory.update({
      where: { id: inventoryId },
      data: {
        quantity: newQty,
        status: newStatus
      }
    });

    await createAuditLog({
      hospitalId: user.hospitalId,
      userId: user.id,
      action: 'MEDICINE_RESTOCK',
      resource: `Medicine:${inventoryItem.medicine.name}`,
      details: { batchNo: inventoryItem.batchNo, addedQuantity: addQty, newTotalQuantity: newQty }
    });

    return NextResponse.json({
      message: `Stock increased by +${addQty} units successfully!`,
      inventory: updatedInventory
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
