'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FileText } from 'lucide-react';

export default function PatientTimelinePage() {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch default patient record
    fetch('/api/patients')
      .then(r => r.json())
      .then(d => {
        if (d.patients && d.patients.length > 0) {
          fetch(`/api/patients/${d.patients[0].id}/timeline`)
            .then(r => r.json())
            .then(t => setTimeline(t.patientTimeline));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-xs text-slate-500">Loading your medical timeline...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" /> My Complete Personal Medical Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single health record history (`NEXO-PAT-000001`) with all clinical encounters
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base border-b pb-2">Medical Encounters & Visits</h3>
        <div className="space-y-4 text-xs">
          {timeline?.medicalRecords?.map((rec: any) => (
            <div key={rec.id} className="p-4 bg-slate-50 border rounded-xl space-y-1">
              <div className="flex justify-between font-bold text-cyan-800">
                <span>{rec.title}</span>
                <span className="text-slate-400 font-mono">{new Date(rec.visitDate).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-700 font-medium">{rec.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
