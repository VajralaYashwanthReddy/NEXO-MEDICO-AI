export interface PatientLabContext {
  eGFR?: number; // mL/min/1.73m² (Renal Function)
  creatinine?: number; // mg/dL
  alt?: number; // U/L (Liver Enzyme ALT)
  ast?: number; // U/L (Liver Enzyme AST)
  potassium?: number; // mEq/L
  wbc?: number; // K/µL
  allergies?: string[];
  currentMedications?: string[];
}

export interface DrugSafetyResult {
  drugName: string;
  safetyStatus: 'SAFE' | 'CAUTION' | 'CONTRAINDICATED';
  riskScore: number; // 0 to 100
  warnings: string[];
  dosageAdjustment?: string;
  clinicalRationale: string;
}

// Knowledge Base of Biomarker & Genomic Drug Interaction Rules
export function evaluateDrugSafety(
  drugName: string,
  labContext: PatientLabContext
): DrugSafetyResult {
  const normalizedDrug = drugName.trim().toLowerCase();
  const warnings: string[] = [];
  let safetyStatus: 'SAFE' | 'CAUTION' | 'CONTRAINDICATED' = 'SAFE';
  let riskScore = 10;
  let dosageAdjustment = undefined;
  let clinicalRationale = 'No severe lab biomarker contraindications identified for this drug.';

  const egfr = labContext.eGFR ?? 65;
  const alt = labContext.alt ?? 28;
  const potassium = labContext.potassium ?? 4.2;
  const allergies = (labContext.allergies || []).map(a => a.toLowerCase());
  const currentMedications = (labContext.currentMedications || []).map(m => m.toLowerCase());

  // Rule 1: Check Known Allergies
  if (allergies.some(a => normalizedDrug.includes(a) || a.includes(normalizedDrug))) {
    safetyStatus = 'CONTRAINDICATED';
    riskScore = 95;
    warnings.push(`CRITICAL ALLERGY CONFLICT: Patient has documented severe allergy to ${drugName}.`);
    clinicalRationale = `High risk of anaphylaxis or severe hypersensitivity reaction. Avoid administration.`;
    return { drugName, safetyStatus, riskScore, warnings, dosageAdjustment, clinicalRationale };
  }

  // Rule 2: Metformin & Renal Function (eGFR)
  if (normalizedDrug.includes('metformin')) {
    if (egfr < 30) {
      safetyStatus = 'CONTRAINDICATED';
      riskScore = 90;
      warnings.push(`RENAL IMPAIRMENT ALERT: eGFR = ${egfr} mL/min (< 30). Metformin is CONTRAINDICATED.`);
      clinicalRationale = `Severe risk of Lactic Acidosis due to reduced renal drug clearance.`;
    } else if (egfr < 45) {
      safetyStatus = 'CAUTION';
      riskScore = 60;
      dosageAdjustment = 'Reduce max daily dose by 50% (Max 1000mg/day) and monitor renal panel monthly.';
      warnings.push(`MODERATE RENAL REDUCTION: eGFR = ${egfr} mL/min (30-44). Dose adjustment required.`);
      clinicalRationale = `Reduced renal excretion requiring close eGFR monitoring.`;
    }
  }

  // Rule 3: NSAIDs (Ibuprofen / Naproxen / Ketorolac) & Renal Impairment
  if (normalizedDrug.includes('ibuprofen') || normalizedDrug.includes('naproxen') || normalizedDrug.includes('ketorolac')) {
    if (egfr < 45) {
      safetyStatus = 'CONTRAINDICATED';
      riskScore = 85;
      warnings.push(`NEPHROTOXICITY ALERT: eGFR = ${egfr} mL/min (< 45). NSAIDs inhibit renal prostaglandins.`);
      clinicalRationale = `Risk of precipitating Acute Kidney Injury (AKI) or rapid renal decline. Use Acetaminophen instead.`;
    }
  }

  // Rule 4: Statins (Atorvastatin / Simvastatin) & Hepatic Function (ALT/AST)
  if (normalizedDrug.includes('statin')) {
    if (alt > 3 * 35) { // 3x upper limit of normal
      safetyStatus = 'CONTRAINDICATED';
      riskScore = 88;
      warnings.push(`HEPATOTOXICITY ALERT: Serum ALT = ${alt} U/L (>3x normal limit).`);
      clinicalRationale = `Active severe hepatic injury. Hold statin therapy until transaminases normalize.`;
    } else if (alt > 45) {
      safetyStatus = 'CAUTION';
      riskScore = 50;
      dosageAdjustment = 'Initiate at lowest starting dose (10mg daily) and re-check LFTs in 4 weeks.';
      warnings.push(`ELEVATED LIVER ENZYMES: ALT = ${alt} U/L. Baseline liver enzyme elevation.`);
      clinicalRationale = `Potential for drug-induced liver injury (DILI).`;
    }
  }

  // Rule 5: ACE Inhibitors / ARBs (Lisinopril / Enalapril / Losartan) & Hyperkalemia
  if (normalizedDrug.includes('lisinopril') || normalizedDrug.includes('enalapril') || normalizedDrug.includes('losartan')) {
    if (potassium > 5.3) {
      safetyStatus = 'CONTRAINDICATED';
      riskScore = 82;
      warnings.push(`HYPERKALEMIA ALERT: Serum Potassium = ${potassium} mEq/L (> 5.3).`);
      clinicalRationale = `ACEi/ARBs impair aldosterone activation, compounding fatal cardiac dysrhythmias.`;
    }
  }

  // Rule 6: Drug-Drug Interaction (Warfarin + Aspirin/NSAIDs)
  if (normalizedDrug.includes('warfarin') && currentMedications.some(m => m.includes('aspirin') || m.includes('ibuprofen'))) {
    safetyStatus = 'CONTRAINDICATED';
    riskScore = 92;
    warnings.push(`SEVERE BLEEDING CONFLICT: Co-administration of Warfarin and NSAID/Aspirin.`);
    clinicalRationale = `Exponentially increases major gastrointestinal and intracranial hemorrhage risk.`;
  }

  if (warnings.length === 0) {
    warnings.push(`All lab biomarkers (eGFR ${egfr}, ALT ${alt}, K+ ${potassium}) are within acceptable safety thresholds.`);
  }

  return {
    drugName,
    safetyStatus,
    riskScore,
    warnings,
    dosageAdjustment,
    clinicalRationale
  };
}
