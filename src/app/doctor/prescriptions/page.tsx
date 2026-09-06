'use client';

import React, { useEffect, useState, Suspense } from 'react';
import {
  Pill,
  Plus,
  ShieldAlert,
  CheckCircle2,
  Send,
  AlertTriangle,
  Search,
  Globe,
  Building2,
  UserCheck,
  FlaskConical,
  Package,
  Layers,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function PrescriptionFormContent() {
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') || '';

  // Mode: 'PRESCRIPTION' | 'LAB_ORDER'
  const [activeTab, setActiveTab] = useState<'PRESCRIPTION' | 'LAB_ORDER'>('PRESCRIPTION');

  // Patient Global Search State
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Pharmacy Inventory Stock State
  const [pharmacyStock, setPharmacyStock] = useState<any[]>([]);
  const [loadingStock, setLoadingStock] = useState(true);

  // Laboratory Tests Catalog State
  const [labTestCatalog, setLabTestCatalog] = useState<any[]>([]);
  const [loadingLabTests, setLoadingLabTests] = useState(true);

  // Prescription Form State
  const [instructions, setInstructions] = useState('Take medications as prescribed after meals.');
  const [medicines, setMedicines] = useState<any[]>([
    {
      medicineId: '',
      name: '',
      strength: '500 mg',
      dosage: '1 tablet',
      route: 'Oral',
      frequency: 'Twice daily',
      durationDays: 5,
      quantity: 10,
      foodRelation: 'After food',
      instructions: 'Take with plenty of water',
      stockQty: null,
      isCustom: false
    }
  ]);

  // Lab Order Form State
  const [selectedLabTestId, setSelectedLabTestId] = useState('');
  const [labPriority, setLabPriority] = useState('ROUTINE');
  const [labNotes, setLabNotes] = useState('');

  // Alerts & Submissions
  const [safetyAlerts, setSafetyAlerts] = useState<any[]>([]);
  const [checkingSafety, setCheckingSafety] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rxSuccessMessage, setRxSuccessMessage] = useState('');
  const [labSuccessMessage, setLabSuccessMessage] = useState('');

  // Load patient, pharmacy stock, and lab test catalog
  useEffect(() => {
    // 1. Fetch Patient profile
    if (preselectedPatientId) {
      fetch(`/api/patients?global=true&q=${preselectedPatientId}`)
        .then(res => res.json())
        .then(data => {
          if (data.patients && data.patients.length > 0) {
            setSelectedPatient(data.patients[0]);
          }
        });
    } else {
      fetch('/api/patients?global=true')
        .then(res => res.json())
        .then(data => {
          if (data.patients && data.patients.length > 0) {
            setSelectedPatient(data.patients[0]);
          }
        });
    }

    // 2. Fetch Pharmacy Medicines Inventory Stock
    fetch('/api/pharmacy/medicines')
      .then(res => res.json())
      .then(data => {
        const meds = (data.medicines || []).map((m: any) => {
          const totalQty = (m.inventoryItems || []).reduce((acc: number, inv: any) => acc + inv.quantity, 0);
          return {
            id: m.id,
            code: m.code,
            name: m.name,
            genericName: m.genericName,
            category: m.category,
            totalQty,
            status: totalQty === 0 ? 'OUT_OF_STOCK' : totalQty <= 15 ? 'LOW_STOCK' : 'IN_STOCK'
          };
        });
        setPharmacyStock(meds);

        // Pre-select first medicine if available
        if (meds.length > 0) {
          setMedicines(prev => [
            {
              ...prev[0],
              medicineId: meds[0].id,
              name: meds[0].name,
              stockQty: meds[0].totalQty
            }
          ]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingStock(false));

    // 3. Fetch Lab Test Catalog
    fetch('/api/laboratory/orders')
      .then(res => res.json())
      .then(data => {
        setLabTestCatalog(data.tests || []);
        if (data.tests && data.tests.length > 0) {
          setSelectedLabTestId(data.tests[0].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingLabTests(false));
  }, [preselectedPatientId]);

  // Global Patient Search Handler
  const handleGlobalPatientSearch = async (query: string) => {
    setPatientSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/patients?global=true&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const addMedicineRow = () => {
    const defaultMed = pharmacyStock.length > 0 ? pharmacyStock[0] : null;
    setMedicines([
      ...medicines,
      {
        medicineId: defaultMed ? defaultMed.id : '',
        name: defaultMed ? defaultMed.name : '',
        strength: '500 mg',
        dosage: '1 tablet',
        route: 'Oral',
        frequency: 'Twice daily',
        durationDays: 5,
        quantity: 10,
        foodRelation: 'After food',
        instructions: '',
        stockQty: defaultMed ? defaultMed.totalQty : null,
        isCustom: !defaultMed
      }
    ]);
  };

  const removeMedicineRow = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSelectMedicineFromStock = (index: number, medicineId: string) => {
    const updated = [...medicines];
    const selected = pharmacyStock.find(m => m.id === medicineId);
    if (selected) {
      updated[index] = {
        ...updated[index],
        medicineId: selected.id,
        name: selected.name,
        stockQty: selected.totalQty
      };
    }
    setMedicines(updated);
  };

  const updateMedicineField = (index: number, field: string, value: any) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const checkDrugSafety = async () => {
    if (!selectedPatient) return;
    setCheckingSafety(true);
    setSafetyAlerts([]);
    try {
      const res = await fetch('/api/prescriptions/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          medicines
        })
      });
      const data = await res.json();
      setSafetyAlerts(data.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingSafety(false);
    }
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || medicines.length === 0) return;

    setSubmitting(true);
    setRxSuccessMessage('');
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          medicines,
          instructions,
          status: 'ISSUED'
        })
      });
      const data = await res.json();

      if (res.ok) {
        setRxSuccessMessage(`Digital Prescription issued & sent directly to Hospital Pharmacy Queue! Code: ${data.prescription.prescriptionCode}`);
        setMedicines([
          {
            medicineId: pharmacyStock[0]?.id || '',
            name: pharmacyStock[0]?.name || 'Paracetamol',
            strength: '500 mg',
            dosage: '1 tablet',
            route: 'Oral',
            frequency: 'Twice daily',
            durationDays: 5,
            quantity: 10,
            foodRelation: 'After food',
            instructions: '',
            stockQty: pharmacyStock[0]?.totalQty ?? null,
            isCustom: false
          }
        ]);
        setSafetyAlerts([]);
      } else {
        alert(data.error || 'Failed to issue prescription');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLabOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedLabTestId) return;

    setSubmitting(true);
    setLabSuccessMessage('');
    try {
      const res = await fetch('/api/laboratory/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          testId: selectedLabTestId,
          priority: labPriority,
          notes: labNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setLabSuccessMessage(`Laboratory test order #${data.order.orderCode} issued & sent directly to Hospital Laboratory Queue!`);
        setLabNotes('');
      } else {
        alert(data.error || 'Failed to submit lab test order');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLabTestObj = labTestCatalog.find(t => t.id === selectedLabTestId);

  return (
    <div className="space-y-6 max-w-5xl text-slate-900 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 uppercase tracking-widest mb-0.5">
            <Sparkles className="w-4 h-4 text-emerald-600" /> Pharmacy Inventory & Diagnostic Dispatch Engine
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            Physician Clinical Order & Dispatch Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Prescribe directly from hospital pharmacy stock & dispatch lab test orders to hospital queues in real-time
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('PRESCRIPTION')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'PRESCRIPTION'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-4 h-4" /> Pharmacy Prescription Engine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LAB_ORDER')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'LAB_ORDER'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-4 h-4" /> Laboratory Test Order Engine
          </button>
        </div>
      </div>

      {/* Global Universal Patient Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <label className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" /> Universal Patient Identity Search (Across All Hospitals) *
        </label>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={patientSearchQuery}
            onChange={(e) => handleGlobalPatientSearch(e.target.value)}
            placeholder="Search by Universal Patient ID (NEXO-PAT-000001), Name, Phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
          />

          {/* Live Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-2xl z-40 max-h-60 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPatient(p);
                    setSearchResults([]);
                    setPatientSearchQuery('');
                  }}
                  className="p-3 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-black text-slate-900 text-xs block">{p.fullName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      DOB: {p.dob} | Phone: {p.phone} | {p.gender}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {p.patientCode}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Patient Banner */}
        {selectedPatient && (
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center font-black text-lg text-white">
                {selectedPatient.fullName?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-white">{selectedPatient.fullName}</h3>
                  <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-extrabold">
                    {selectedPatient.patientCode}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  {selectedPatient.gender}, DOB: {selectedPatient.dob} | Blood: <strong className="text-cyan-400">{selectedPatient.bloodGroup || 'O+'}</strong>
                </p>
              </div>
            </div>

            {selectedPatient.allergies && (
              <div className="px-3 py-1.5 bg-rose-950/80 border border-rose-800/80 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Allergies: {selectedPatient.allergies}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ----------------- TAB 1: PHARMACY PRESCRIPTION ENGINE ----------------- */}
      {activeTab === 'PRESCRIPTION' && (
        <form onSubmit={handleSubmitPrescription} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
          {rxSuccessMessage && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> {rxSuccessMessage}
            </div>
          )}

          {/* Prescribed Medicines List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" /> Prescribed Hospital Pharmacy Medicines List
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select medicines from your hospital's real pharmacy inventory with live stock levels
                </p>
              </div>
              <button
                type="button"
                onClick={addMedicineRow}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Another Medicine
              </button>
            </div>

            <div className="space-y-4">
              {medicines.map((med, idx) => (
                <div key={idx} className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-xs flex items-center gap-2">
                      Medicine #{idx + 1}
                      {med.stockQty !== null && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                          med.stockQty === 0
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : med.stockQty <= 15
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {med.stockQty === 0 ? '🔴 OUT OF STOCK (0 units)' : `🟢 In Pharmacy Stock: ${med.stockQty} units`}
                        </span>
                      )}
                    </span>

                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicineRow(idx)}
                        className="text-rose-600 hover:text-rose-800 font-extrabold text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {/* Select Medicine from Hospital Pharmacy Stock */}
                    <div>
                      <label className="font-extrabold text-slate-900 block mb-1">
                        Medicine Name (Hospital Pharmacy Inventory) *
                      </label>
                      <select
                        required
                        value={med.medicineId}
                        onChange={(e) => handleSelectMedicineFromStock(idx, e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                      >
                        <option value="">-- Select Medicine from Pharmacy Stock --</option>
                        {pharmacyStock.map(m => (
                          <option key={m.id} value={m.id} className="font-bold text-slate-900 bg-white">
                            {m.name} ({m.genericName}) — Stock: {m.totalQty} units
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-900 block mb-1">Strength</label>
                      <input
                        type="text"
                        value={med.strength}
                        onChange={(e) => updateMedicineField(idx, 'strength', e.target.value)}
                        placeholder="e.g. 500 mg"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-900 block mb-1">Dosage Unit</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedicineField(idx, 'dosage', e.target.value)}
                        placeholder="e.g. 1 tablet"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-900 block mb-1">Frequency *</label>
                      <select
                        required
                        value={med.frequency}
                        onChange={(e) => updateMedicineField(idx, 'frequency', e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                      >
                        <option value="Morning Only (1-0-0)">Morning Only (1-0-0)</option>
                        <option value="Afternoon Only (0-1-0)">Afternoon Only (0-1-0)</option>
                        <option value="Evening Only (0-0-1)">Evening Only (0-0-1)</option>
                        <option value="Morning & Evening (1-0-1)">Morning & Evening (1-0-1)</option>
                        <option value="Morning, Afternoon & Evening (1-1-1)">Morning, Afternoon & Evening (1-1-1)</option>
                        <option value="Thrice Daily (TDS / Every 8 hours)">Thrice Daily (TDS / Every 8 hours)</option>
                        <option value="Four Times Daily (QDS / Every 6 hours)">Four Times Daily (QDS / Every 6 hours)</option>
                        <option value="Day by Day / Alternate Days (QOD)">Day by Day / Alternate Days (QOD)</option>
                        <option value="Once Daily (OD)">Once Daily (OD)</option>
                        <option value="As Needed / When Required (PRN)">As Needed / When Required (PRN)</option>
                        <option value="At Bedtime (HS)">At Bedtime (HS)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-extrabold text-slate-900 block mb-1">Duration (Days)</label>
                      <input
                        type="number"
                        value={med.durationDays}
                        onChange={(e) => updateMedicineField(idx, 'durationDays', e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black text-slate-900 bg-white shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-900 block mb-1">Relation to Food</label>
                      <select
                        value={med.foodRelation}
                        onChange={(e) => updateMedicineField(idx, 'foodRelation', e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs"
                      >
                        <option value="After food">After food</option>
                        <option value="Before food">Before food</option>
                        <option value="With food">With food</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-900 block mb-1">Total Quantity Prescribed</label>
                      <input
                        type="number"
                        value={med.quantity}
                        onChange={(e) => updateMedicineField(idx, 'quantity', e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-black text-emerald-700 bg-white shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="font-extrabold text-slate-900 block mb-1">Doctor Prescribing Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900 bg-white shadow-2xs"
            />
          </div>

          {/* Safety Alerts */}
          {safetyAlerts.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-rose-900 font-bold">
              <span className="flex items-center gap-1.5 text-sm text-rose-700 font-black">
                <AlertTriangle className="w-5 h-5 text-rose-600" /> Drug Safety & Allergy Warnings Identified
              </span>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {safetyAlerts.map((alt, idx) => (
                  <li key={idx}>{alt.details || alt.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={checkDrugSafety}
              disabled={checkingSafety}
              className="px-4 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-extrabold rounded-xl flex items-center gap-1.5 transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              {checkingSafety ? 'Checking AI Safety...' : 'Run Drug Safety & Allergy Interaction Check'}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg flex items-center gap-2 transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Dispatching...' : 'Issue & Send Digital Prescription to Pharmacy Direct'}
            </button>
          </div>
        </form>
      )}

      {/* ----------------- TAB 2: LABORATORY TEST ORDER ENGINE ----------------- */}
      {activeTab === 'LAB_ORDER' && (
        <form onSubmit={handleSubmitLabOrder} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 text-xs">
          {labSuccessMessage && (
            <div className="p-4 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" /> {labSuccessMessage}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-amber-600" /> Select Laboratory Diagnostic Test
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select diagnostic tests from your hospital's laboratory catalog to send directly to the lab queue
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-extrabold text-slate-900 block mb-1">
                  Select Hospital Lab Test (Search Catalog) *
                </label>
                <select
                  required
                  value={selectedLabTestId}
                  onChange={(e) => setSelectedLabTestId(e.target.value)}
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs text-xs"
                >
                  <option value="">-- Select Laboratory Diagnostic Test --</option>
                  {labTestCatalog.map(t => (
                    <option key={t.id} value={t.id} className="font-bold text-slate-900 bg-white">
                      {t.name} ({t.category}) — ${t.price}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-extrabold text-slate-900 block mb-1">
                  Order Priority *
                </label>
                <select
                  value={labPriority}
                  onChange={(e) => setLabPriority(e.target.value)}
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl font-extrabold bg-white text-slate-900 shadow-2xs text-xs"
                >
                  <option value="ROUTINE">ROUTINE (Standard Turnaround)</option>
                  <option value="URGENT">URGENT (Expedited Analysis)</option>
                  <option value="STAT">STAT (Immediate Emergency Analysis)</option>
                </select>
              </div>
            </div>

            {/* Selected Test Details Preview Card */}
            {selectedLabTestObj && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-slate-900">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-900 text-sm">{selectedLabTestObj.name}</span>
                  <span className="font-black text-emerald-700 text-sm">${selectedLabTestObj.price}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-slate-400 font-bold block">CATEGORY:</span> <strong>{selectedLabTestObj.category}</strong></div>
                  <div><span className="text-slate-400 font-bold block">SAMPLE REQUIRED:</span> <strong>{selectedLabTestObj.sampleType}</strong></div>
                  <div><span className="text-slate-400 font-bold block">CODE:</span> <strong className="font-mono text-amber-800">{selectedLabTestObj.code}</strong></div>
                </div>
                {selectedLabTestObj.referenceRange && (
                  <p className="text-[11px] text-slate-600 pt-1 border-t border-amber-200/60 font-mono">
                    Reference Range: {selectedLabTestObj.referenceRange}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="font-extrabold text-slate-900 block mb-1">Clinical Notes for Laboratory Technician</label>
              <textarea
                value={labNotes}
                onChange={(e) => setLabNotes(e.target.value)}
                placeholder="Specify clinical indication, fasting status, or sample collection notes..."
                rows={3}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 bg-white shadow-2xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm rounded-xl shadow-lg flex items-center gap-2 transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Dispatching...' : 'Submit & Dispatch Order to Laboratory Direct'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function DoctorPrescriptionsPage() {
  return (
    <Suspense fallback={<p className="text-xs text-slate-500 text-center py-10">Loading prescription engine...</p>}>
      <PrescriptionFormContent />
    </Suspense>
  );
}
