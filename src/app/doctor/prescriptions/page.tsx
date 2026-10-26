'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';
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
  Info,
  Printer,
  Trash2,
  Eye,
  FileText
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function PrescriptionFormContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const preselectedPatientId = searchParams.get('patientId') || '';
  const preselectedDiagnosis = searchParams.get('diagnosis') || '';
  const preselectedAppointmentId = searchParams.get('appointmentId') || '';

  // Mode: 'PRESCRIPTION' | 'LAB_ORDER'
  const [activeTab, setActiveTab] = useState<'PRESCRIPTION' | 'LAB_ORDER'>('PRESCRIPTION');

  // Patient Global Search State
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Linked Clinical Diagnosis
  const [linkedDiagnosis, setLinkedDiagnosis] = useState(preselectedDiagnosis);

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
  const [createdPrescriptionCode, setCreatedPrescriptionCode] = useState('');

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

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
    const fetchPharmacyStock = () => {
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

          // Pre-select first medicine if available and none selected yet
          if (meds.length > 0) {
            setMedicines(prev => {
              if (prev.length > 0 && !prev[0].medicineId) {
                return [
                  {
                    ...prev[0],
                    medicineId: meds[0].id,
                    name: meds[0].name,
                    stockQty: meds[0].totalQty
                  },
                  ...prev.slice(1)
                ];
              }
              return prev;
            });
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingStock(false));
    };

    fetchPharmacyStock();
    const stockInterval = setInterval(fetchPharmacyStock, 5000);

    // 3. Fetch Lab Test Catalog
    fetch('/api/laboratory/orders')
      .then(res => res.json())
      .then(data => {
        const tests = data.availableTests || data.tests || [];
        setLabTestCatalog(tests);
        if (tests.length > 0) {
          setSelectedLabTestId(tests[0].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingLabTests(false));

    return () => clearInterval(stockInterval);
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
          instructions: `${instructions}${linkedDiagnosis ? `\n[Linked Diagnosis]: ${linkedDiagnosis}` : ''}`,
          status: 'ISSUED'
        })
      });
      const data = await res.json();

      if (res.ok) {
        setCreatedPrescriptionCode(data.prescription.prescriptionCode);
        setRxSuccessMessage(`Digital Prescription issued & sent directly to Hospital Pharmacy Queue! Code: ${data.prescription.prescriptionCode}`);
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
          notes: `${labNotes}${linkedDiagnosis ? ` [Indication: ${linkedDiagnosis}]` : ''}`
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
            Prescribe directly from hospital pharmacy inventory with live stock indicators and multi-line safety verification.
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
          <Globe className="w-4 h-4 text-blue-600" /> Universal Patient Identity Search *
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
            <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> {rxSuccessMessage}
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print Prescription
              </button>
            </div>
          )}

          {/* Linked Diagnosis Field */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <label className="font-extrabold text-slate-900 block text-xs">
              Linked Clinical Diagnosis / Indication
            </label>
            <input
              type="text"
              value={linkedDiagnosis}
              onChange={(e) => setLinkedDiagnosis(e.target.value)}
              placeholder="e.g. Essential Hypertension / Acute Bronchitis"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-bold text-blue-900 bg-white"
            />
          </div>

          {/* Prescribed Medicines List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" /> Prescribed Hospital Pharmacy Medicines List
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select medicines from real hospital pharmacy stock with live stock quantity tracking.
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
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800">Medicine #{idx + 1}</span>
                      {/* Live Stock Badge */}
                      {med.stockQty !== null && (
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold ${
                          med.stockQty === 0 ? 'bg-rose-100 text-rose-800' :
                          med.stockQty <= 15 ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {med.stockQty === 0 ? 'OUT OF STOCK' : `${med.stockQty} in stock`}
                        </span>
                      )}
                    </div>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicineRow(idx)}
                        className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="font-extrabold text-slate-700 block mb-1">Select from Inventory</label>
                      <select
                        value={med.medicineId}
                        onChange={(e) => handleSelectMedicineFromStock(idx, e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
                      >
                        <option value="">-- Choose from Pharmacy Inventory --</option>
                        {pharmacyStock.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.category}) — {p.totalQty} in stock
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-extrabold text-slate-700 block mb-1">Medication Name / Custom</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedicineField(idx, 'name', e.target.value)}
                        placeholder="e.g. Amoxicillin 500mg"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Strength</label>
                      <input
                        type="text"
                        value={med.strength}
                        onChange={(e) => updateMedicineField(idx, 'strength', e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white"
                        placeholder="500 mg"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedicineField(idx, 'dosage', e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white"
                        placeholder="1 tablet"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Frequency</label>
                      <select
                        value={med.frequency}
                        onChange={(e) => updateMedicineField(idx, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white font-semibold"
                      >
                        <option value="Once daily">Once daily (OD)</option>
                        <option value="Twice daily">Twice daily (BD)</option>
                        <option value="Thrice daily">Thrice daily (TDS)</option>
                        <option value="Four times daily">Four times daily (QID)</option>
                        <option value="Every 8 hours">Every 8 hours</option>
                        <option value="SOS / As needed">SOS / As needed</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Route</label>
                      <select
                        value={med.route}
                        onChange={(e) => updateMedicineField(idx, 'route', e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white font-semibold"
                      >
                        <option value="Oral">Oral</option>
                        <option value="Intravenous (IV)">Intravenous (IV)</option>
                        <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                        <option value="Topical">Topical</option>
                        <option value="Inhalation">Inhalation</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Duration (Days)</label>
                      <input
                        type="number"
                        value={med.durationDays}
                        onChange={(e) => {
                          const d = parseInt(e.target.value) || 1;
                          updateMedicineField(idx, 'durationDays', d);
                          updateMedicineField(idx, 'quantity', d * 2);
                        }}
                        className="w-full px-3 py-2 border rounded-xl bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Quantity (Units)</label>
                      <input
                        type="number"
                        value={med.quantity}
                        onChange={(e) => updateMedicineField(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border rounded-xl bg-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-600 block mb-1">Relation to Food</label>
                      <select
                        value={med.foodRelation}
                        onChange={(e) => updateMedicineField(idx, 'foodRelation', e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl bg-white"
                      >
                        <option value="After food">After food</option>
                        <option value="Before food">Before food</option>
                        <option value="With food">With food</option>
                        <option value="Empty stomach">Empty stomach</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="font-extrabold text-slate-900 block mb-1">General Prescribing Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900 bg-white"
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

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={checkDrugSafety}
                disabled={checkingSafety}
                className="px-4 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-extrabold rounded-xl flex items-center gap-1.5 transition-all"
              >
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                {checkingSafety ? 'Checking Safety...' : 'Run Drug Safety Check'}
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Eye className="w-4 h-4 text-slate-600" /> Preview Prescription
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg flex items-center gap-2 transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Dispatching...' : 'Issue & Send Digital Prescription to Pharmacy Queue'}
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
                  Select diagnostic tests from your hospital's laboratory catalog to send directly to the lab queue.
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
              {submitting ? 'Dispatching...' : 'Submit & Dispatch Order to Laboratory Queue'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* PRINT-READY PRESCRIPTION MODAL                                            */}
      {/* ========================================================================= */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Official Hospital Medical Prescription
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Prescription Template */}
            <div className="border-2 border-slate-200 p-6 rounded-2xl space-y-6 bg-white font-sans text-xs">
              {/* Header */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">NEXO MEDICO AI HEALTHCARE</h2>
                  <p className="text-slate-500">Department of Internal Medicine & Clinical Specialties</p>
                  <p className="text-[11px] text-slate-400 font-mono">Licensed Central Hospital Medical Center</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-700 font-serif italic">℞</span>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Date: {new Date().toLocaleDateString()}
                  </p>
                  {createdPrescriptionCode && (
                    <p className="font-mono font-bold text-slate-800">
                      Code: {createdPrescriptionCode}
                    </p>
                  )}
                </div>
              </div>

              {/* Patient Banner */}
              {selectedPatient && (
                <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2 border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Patient Name</span>
                    <strong className="text-slate-900 text-sm">{selectedPatient.fullName}</strong>
                    <span className="text-slate-500 block font-mono text-[11px]">
                      {selectedPatient.patientCode} • {selectedPatient.gender}, DOB: {selectedPatient.dob}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Documented Allergies</span>
                    <strong className="text-rose-600 block">{selectedPatient.allergies || 'No known allergies'}</strong>
                    {linkedDiagnosis && (
                      <span className="text-blue-900 font-bold block mt-1">Diagnosis: {linkedDiagnosis}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Medicines Table */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px]">Medications (Rx)</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 bg-slate-50 p-2 font-black text-slate-600 text-[10px] uppercase">
                    <span className="col-span-5">Medicine & Strength</span>
                    <span className="col-span-2">Dosage</span>
                    <span className="col-span-3">Frequency & Food</span>
                    <span className="col-span-2 text-right">Duration</span>
                  </div>
                  {medicines.map((m, i) => (
                    <div key={i} className="grid grid-cols-12 p-2.5 items-center text-xs">
                      <span className="col-span-5 font-bold text-slate-900">
                        {i + 1}. {m.name || 'Medication'} <span className="text-slate-500 font-normal">({m.strength})</span>
                      </span>
                      <span className="col-span-2 font-medium text-slate-700">{m.dosage}</span>
                      <span className="col-span-3 text-slate-600">{m.frequency} ({m.foodRelation})</span>
                      <span className="col-span-2 text-right font-mono font-bold text-slate-800">{m.durationDays} days</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              {instructions && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-0.5">Instructions:</span>
                  <p className="text-slate-600">{instructions}</p>
                </div>
              )}

              {/* Signature Block */}
              <div className="pt-8 flex justify-between items-end border-t border-dashed">
                <span className="text-[10px] text-slate-400 font-mono">
                  Electronically generated and verified via Nexo Medico AI EMR.
                </span>
                <div className="text-right">
                  <div className="w-40 border-b border-slate-400 mb-1" />
                  <span className="font-bold text-slate-800 block">Attending Physician</span>
                  <span className="text-[10px] text-slate-400 font-mono">Signature & Stamp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorPrescriptionsPage() {
  return (
    <Suspense fallback={<p className="text-xs text-slate-500 text-center py-10">Loading prescription engine...</p>
}>
      <PrescriptionFormContent />
    </Suspense>
  );
}
