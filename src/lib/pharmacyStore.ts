import fs from 'fs';
import path from 'path';
import os from 'os';
import { eventBroadcaster } from '@/lib/events';

export interface InventoryItem {
  id: string;
  hospitalId: string;
  medicineId: string;
  batchNo: string;
  expiryDate: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON';
  createdAt: string;
}

export interface GlobalMedicine {
  id: string;
  hospitalId: string;
  code: string;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  inventoryItems: InventoryItem[];
  createdAt: string;
}

const defaultMedicines: GlobalMedicine[] = [
  {
    id: 'med-000001',
    hospitalId: 'hosp-metro-01',
    code: 'MED-PAR-500',
    name: 'Paracetamol 500mg',
    genericName: 'Acetaminophen',
    category: 'Analgesic',
    manufacturer: 'Sun Pharma',
    createdAt: new Date().toISOString(),
    inventoryItems: [
      {
        id: 'inv-000001',
        hospitalId: 'hosp-metro-01',
        medicineId: 'med-000001',
        batchNo: 'BATCH-1001',
        expiryDate: '2027-12-31',
        quantity: 150,
        reorderLevel: 15,
        unitPrice: 50,
        status: 'IN_STOCK',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'med-000002',
    hospitalId: 'hosp-metro-01',
    code: 'MED-AMX-500',
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin Trihydrate',
    category: 'Antibiotics',
    manufacturer: 'Cipla Laboratories',
    createdAt: new Date().toISOString(),
    inventoryItems: [
      {
        id: 'inv-000002',
        hospitalId: 'hosp-metro-01',
        medicineId: 'med-000002',
        batchNo: 'BATCH-1002',
        expiryDate: '2026-10-15',
        quantity: 80,
        reorderLevel: 20,
        unitPrice: 120,
        status: 'IN_STOCK',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'med-000003',
    hospitalId: 'hosp-metro-01',
    code: 'MED-ATO-020',
    name: 'Atorvastatin 20mg',
    genericName: 'Atorvastatin Calcium',
    category: 'Cardiovascular',
    manufacturer: 'Dr. Reddy Laboratories',
    createdAt: new Date().toISOString(),
    inventoryItems: [
      {
        id: 'inv-000003',
        hospitalId: 'hosp-metro-01',
        medicineId: 'med-000003',
        batchNo: 'BATCH-1003',
        expiryDate: '2027-06-30',
        quantity: 200,
        reorderLevel: 30,
        unitPrice: 180,
        status: 'IN_STOCK',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'med-000004',
    hospitalId: 'hosp-metro-01',
    code: 'MED-MET-500',
    name: 'Metformin 500mg',
    genericName: 'Metformin Hydrochloride',
    category: 'Antidiabetic',
    manufacturer: 'Lupin Pharmaceuticals',
    createdAt: new Date().toISOString(),
    inventoryItems: [
      {
        id: 'inv-000004',
        hospitalId: 'hosp-metro-01',
        medicineId: 'med-000004',
        batchNo: 'BATCH-1004',
        expiryDate: '2028-01-01',
        quantity: 120,
        reorderLevel: 25,
        unitPrice: 45,
        status: 'IN_STOCK',
        createdAt: new Date().toISOString()
      }
    ]
  }
];

const TEMP_PHARMACY_FILE = path.join(os.tmpdir(), 'nexo_pharmacy_cache.json');
const allTimeMedicinesMap = new Map<string, GlobalMedicine>();

defaultMedicines.forEach(m => allTimeMedicinesMap.set(m.id, m));

function loadTempCache(): GlobalMedicine[] {
  try {
    if (fs.existsSync(TEMP_PHARMACY_FILE)) {
      const data = fs.readFileSync(TEMP_PHARMACY_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(m => {
          if (m && m.id) {
            allTimeMedicinesMap.set(m.id, m);
          }
        });
      }
    }
  } catch (e) {}
  return Array.from(allTimeMedicinesMap.values());
}

function saveTempCache(medicines: GlobalMedicine[]) {
  try {
    fs.writeFileSync(TEMP_PHARMACY_FILE, JSON.stringify(medicines, null, 2), 'utf8');
  } catch (e) {}
}

export function getGlobalMedicines(hospitalId?: string | null): GlobalMedicine[] {
  const current = loadTempCache();
  if (!hospitalId) return current;
  return current.filter(m => m.hospitalId === hospitalId || m.hospitalId === 'hosp-metro-01' || !m.hospitalId);
}

export function addGlobalMedicine(data: {
  code: string;
  name: string;
  genericName: string;
  category?: string;
  manufacturer?: string;
  batchNo?: string;
  expiryDate?: string;
  quantity: number | string;
  unitPrice?: number | string;
  reorderLevel?: number | string;
  hospitalId?: string | null;
}): { medicine: GlobalMedicine; inventory: InventoryItem } {
  const current = loadTempCache();
  const cleanCode = data.code.toUpperCase().trim();
  const targetHospitalId = data.hospitalId || 'hosp-metro-01';

  let existing = current.find(
    m => m.code.toUpperCase() === cleanCode && (m.hospitalId === targetHospitalId || !m.hospitalId)
  );

  const qtyNum = typeof data.quantity === 'number' ? data.quantity : parseInt(data.quantity) || 100;
  const priceNum = typeof data.unitPrice === 'number' ? data.unitPrice : parseFloat(data.unitPrice || '50') || 50;
  const reorderNum = typeof data.reorderLevel === 'number' ? data.reorderLevel : parseInt(data.reorderLevel || '15') || 15;
  const status = qtyNum <= reorderNum ? 'LOW_STOCK' : 'IN_STOCK';

  const newInventoryItem: InventoryItem = {
    id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    hospitalId: targetHospitalId,
    medicineId: existing ? existing.id : `med-${Date.now()}`,
    batchNo: data.batchNo || `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
    expiryDate: data.expiryDate || '2027-12-31',
    quantity: qtyNum,
    reorderLevel: reorderNum,
    unitPrice: priceNum,
    status,
    createdAt: new Date().toISOString()
  };

  if (existing) {
    existing.inventoryItems.unshift(newInventoryItem);
    allTimeMedicinesMap.set(existing.id, existing);
  } else {
    existing = {
      id: newInventoryItem.medicineId,
      hospitalId: targetHospitalId,
      code: cleanCode,
      name: data.name,
      genericName: data.genericName,
      category: data.category || 'General',
      manufacturer: data.manufacturer || 'Pharma Supplier',
      inventoryItems: [newInventoryItem],
      createdAt: new Date().toISOString()
    };
    allTimeMedicinesMap.set(existing.id, existing);
  }

  const updatedList = Array.from(allTimeMedicinesMap.values());
  saveTempCache(updatedList);

  try {
    eventBroadcaster.broadcast('MEDICINE_STOCK_UPDATED', {
      medicineId: existing.id,
      medicineName: existing.name,
      code: existing.code,
      quantity: qtyNum,
      hospitalId: targetHospitalId
    });
  } catch (e) {}

  return { medicine: existing, inventory: newInventoryItem };
}

export function restockGlobalMedicine(inventoryId: string, addedQuantity: number): InventoryItem | null {
  const current = loadTempCache();
  for (const m of current) {
    const inv = m.inventoryItems.find(i => i.id === inventoryId);
    if (inv) {
      inv.quantity += addedQuantity;
      inv.status = inv.quantity <= inv.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK';
      allTimeMedicinesMap.set(m.id, m);
      saveTempCache(Array.from(allTimeMedicinesMap.values()));

      try {
        eventBroadcaster.broadcast('MEDICINE_STOCK_UPDATED', {
          medicineId: m.id,
          medicineName: m.name,
          addedQuantity,
          newQuantity: inv.quantity,
          hospitalId: m.hospitalId
        });
      } catch (e) {}

      return inv;
    }
  }
  return null;
}
