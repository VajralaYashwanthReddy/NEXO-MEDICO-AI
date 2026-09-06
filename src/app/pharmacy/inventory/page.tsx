'use client';

import React, { useEffect, useState } from 'react';
import { Pill, Plus, AlertTriangle, Package, CheckCircle2, TrendingUp, X } from 'lucide-react';

export default function PharmacyInventoryPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [restockModalItem, setRestockModalItem] = useState<any>(null);
  const [addedQuantity, setAddedQuantity] = useState('50');
  const [submittingRestock, setSubmittingRestock] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Add new medicine form
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    genericName: '',
    category: 'Analgesic',
    manufacturer: 'PharmaCorp',
    batchNo: 'BATCH-1001',
    expiryDate: '2027-12-31',
    quantity: '100',
    unitPrice: '1.50',
    reorderLevel: '15'
  });

  const fetchMedicines = () => {
    fetch('/api/pharmacy/medicines')
      .then(res => res.json())
      .then(data => setMedicines(data.medicines || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Add new drug stock
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/pharmacy/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        setSuccessMessage('New drug stock added successfully!');
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchMedicines();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Restock existing batch
  const handleIncreaseStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalItem || !addedQuantity) return;

    setSubmittingRestock(true);
    try {
      const res = await fetch('/api/pharmacy/medicines', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: restockModalItem.id,
          addedQuantity: parseInt(addedQuantity)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setRestockModalItem(null);
        setSuccessMessage(data.message || 'Stock increased successfully!');
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchMedicines();
      } else {
        alert(data.error || 'Restock failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRestock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Pill className="w-6 h-6 text-emerald-600" /> Pharmacy Medicine Inventory & Batch Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor drug stock quantities, expiry dates, batch numbers, and reorder levels
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Drug Stock
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {successMessage}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-slate-500 text-center py-10">Loading medicine inventory...</p>
      ) : (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-4">Drug Code / Name</th>
                <th className="p-4">Generic Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Stock Batches & Quantities</th>
                <th className="p-4">Unit Price</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicines.map((med) => (
                <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <span className="font-extrabold text-slate-900 block text-sm">{med.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{med.code}</span>
                  </td>
                  <td className="p-4 text-slate-700 font-medium">{med.genericName}</td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold text-[10px]">
                      {med.category}
                    </span>
                  </td>
                  <td className="p-4 space-y-1.5">
                    {med.inventoryItems?.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{inv.quantity} Units</span>
                          <span className="text-[10px] text-slate-400 font-mono">({inv.batchNo} | Exp: {inv.expiryDate})</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            inv.status === 'IN_STOCK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'LOW_STOCK'
                              ? 'bg-rose-100 text-rose-800 animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Restock Button per batch */}
                        <button
                          onClick={() => {
                            setRestockModalItem({ ...inv, medicineName: med.name });
                            setAddedQuantity('50');
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow-sm flex items-center gap-1 transition-all shrink-0"
                        >
                          <TrendingUp className="w-3 h-3" /> + Increase Stock
                        </button>
                      </div>
                    ))}
                  </td>
                  <td className="p-4 font-bold text-slate-800">${med.inventoryItems?.[0]?.unitPrice || '1.00'}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        if (med.inventoryItems?.[0]) {
                          setRestockModalItem({ ...med.inventoryItems[0], medicineName: med.name });
                          setAddedQuantity('50');
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg border border-emerald-200 inline-flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ----------------- MODAL 1: RESTOCK / INCREASE STOCK ----------------- */}
      {restockModalItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  RESTOCK INVENTORY BATCH
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  Increase Stock for {restockModalItem.medicineName}
                </h3>
              </div>
              <button onClick={() => setRestockModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Batch Number:</span>
                <span className="font-bold text-slate-800 font-mono">{restockModalItem.batchNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Current Stock Remaining:</span>
                <span className="font-extrabold text-cyan-800">{restockModalItem.quantity} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Expiry Date:</span>
                <span className="font-semibold text-slate-700">{restockModalItem.expiryDate}</span>
              </div>
            </div>

            <form onSubmit={handleIncreaseStock} className="space-y-4 pt-1">
              <div>
                <label className="font-bold text-slate-800 text-sm">Units to Add / Increase *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={addedQuantity}
                  onChange={(e) => setAddedQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full mt-1 px-3.5 py-2.5 border rounded-xl text-base font-extrabold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  New Total Stock will be: <strong>{restockModalItem.quantity + (parseInt(addedQuantity) || 0)} Units</strong>
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setRestockModalItem(null)} className="px-4 py-2 text-slate-500 font-bold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRestock}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow flex items-center gap-1.5"
                >
                  <TrendingUp className="w-4 h-4" /> {submittingRestock ? 'Updating Inventory...' : 'Confirm Restock & Increase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: ADD NEW DRUG STOCK ----------------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Add New Medicine Batch Stock</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStock} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Drug Code *</label>
                  <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="MED-PAR-500" className="w-full mt-1 px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Brand Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Paracetamol" className="w-full mt-1 px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Generic Name *</label>
                <input type="text" required value={formData.genericName} onChange={(e) => setFormData({ ...formData, genericName: e.target.value })} placeholder="Acetaminophen" className="w-full mt-1 px-3 py-2 border rounded-lg" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Quantity *</label>
                  <input type="number" required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Batch No</label>
                  <input type="text" value={formData.batchNo} onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Unit Price ($)</label>
                  <input type="number" step="0.1" value={formData.unitPrice} onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow">Save Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
