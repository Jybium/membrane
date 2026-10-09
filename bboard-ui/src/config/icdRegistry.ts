/**
 * Comprehensive ICD-10 Clinical Diagnostics Registry & Dynamic Cohort Discovery
 *
 * Supports arbitrary ICD-10 diagnosis codes (standard 3- to 5-character alphanumeric format)
 * with clinical specialty categories, descriptions, and dynamic discovery of cohorts
 * directly from the Demo Hospital EHR API.
 */

export interface IcdCondition {
  code: string;
  name: string;
  category: string;
  description?: string;
}

export const ICD_CATEGORIES = [
  'All Categories',
  'Hospital Cohorts (Live Demo)',
  'Cardiovascular',
  'Oncology & Hematology',
  'Metabolic & Endocrine',
  'Respiratory',
  'Digestive & Gastrointestinal',
  'Neurology & Mental Health',
  'Musculoskeletal & Rheumatic',
  'Infectious Diseases',
  'Renal & Genitourinary',
  'Dermatology',
  'Ophthalmology & ENT',
] as const;

export type IcdCategory = (typeof ICD_CATEGORIES)[number];

/**
 * Standard registry mapping ICD-10 codes to human-readable clinical diagnoses.
 * Covers all 48 codes present in the Demo Hospital A database plus primary WHO clinical trial categories.
 */
export const ICD10_REGISTRY: Record<string, IcdCondition> = {
  // Demo Hospital A - Active Live Codes
  A15: { code: 'A15', name: 'Respiratory Tuberculosis', category: 'Infectious Diseases', description: 'Confirmed mycobacterium tuberculosis infection of lung' },
  B18: { code: 'B18', name: 'Chronic Viral Hepatitis', category: 'Infectious Diseases', description: 'Chronic hepatitis B or C infection' },
  B20: { code: 'B20', name: 'Human Immunodeficiency Virus [HIV] Disease', category: 'Infectious Diseases', description: 'HIV infection resulting in infectious or parasitic diseases' },
  C18: { code: 'C18', name: 'Malignant Neoplasm of Colon', category: 'Oncology & Hematology', description: 'Colorectal adenocarcinoma / colon malignancy' },
  C34: { code: 'C34', name: 'Malignant Neoplasm of Bronchus and Lung', category: 'Oncology & Hematology', description: 'Non-small cell or small cell lung carcinoma (NSCLC/SCLC)' },
  C50: { code: 'C50', name: 'Malignant Neoplasm of Breast', category: 'Oncology & Hematology', description: 'Invasive ductal or lobular breast carcinoma' },
  C61: { code: 'C61', name: 'Malignant Neoplasm of Prostate', category: 'Oncology & Hematology', description: 'Prostate adenocarcinoma' },
  D50: { code: 'D50', name: 'Iron Deficiency Anemia', category: 'Oncology & Hematology', description: 'Microcytic hypochromic anemia secondary to blood loss or malabsorption' },
  D64: { code: 'D64', name: 'Other Anemias', category: 'Oncology & Hematology', description: 'Normocytic, refractory or sideroblastic anemias' },
  E03: { code: 'E03', name: 'Hypothyroidism', category: 'Metabolic & Endocrine', description: 'Primary or subclinical thyroid hormone deficiency' },
  E05: { code: 'E05', name: 'Hyperthyroidism (Thyrotoxicosis)', category: 'Metabolic & Endocrine', description: 'Graves disease or toxic multinodular goiter' },
  E10: { code: 'E10', name: 'Type 1 Diabetes Mellitus', category: 'Metabolic & Endocrine', description: 'Autoimmune pancreatic beta-cell destruction with insulin deficiency' },
  E11: { code: 'E11', name: 'Type 2 Diabetes Mellitus', category: 'Metabolic & Endocrine', description: 'Insulin resistance with relative insulin secretory defect' },
  E66: { code: 'E66', name: 'Overweight and Obesity', category: 'Metabolic & Endocrine', description: 'Adiposity excess (BMI ≥ 30 kg/m²)' },
  E78: { code: 'E78', name: 'Disorders of Lipoprotein Metabolism (Hyperlipidemia)', category: 'Metabolic & Endocrine', description: 'Mixed dyslipidemia, hypercholesterolemia, hypertriglyceridemia' },
  F03: { code: 'F03', name: 'Unspecified Dementia', category: 'Neurology & Mental Health', description: 'Progressive neurocognitive cognitive decline' },
  F32: { code: 'F32', name: 'Major Depressive Disorder', category: 'Neurology & Mental Health', description: 'Single or recurrent severe unipolar depressive episodes' },
  F41: { code: 'F41', name: 'Other Anxiety Disorders (GAD / Panic)', category: 'Neurology & Mental Health', description: 'Generalized anxiety disorder and panic conditions' },
  G20: { code: 'G20', name: 'Parkinson’s Disease', category: 'Neurology & Mental Health', description: 'Idiopathic neurodegenerative movement disorder' },
  G40: { code: 'G40', name: 'Epilepsy and Recurrent Seizures', category: 'Neurology & Mental Health', description: 'Focal or generalized recurrent seizure disorders' },
  G43: { code: 'G43', name: 'Migraine', category: 'Neurology & Mental Health', description: 'Episodic or chronic vascular neuro-headache with/without aura' },
  H25: { code: 'H25', name: 'Age-Related Cataract', category: 'Ophthalmology & ENT', description: 'Lens opacification causing vision impairment' },
  H40: { code: 'H40', name: 'Glaucoma', category: 'Ophthalmology & ENT', description: 'Optic neuropathy with elevated intraocular pressure' },
  H66: { code: 'H66', name: 'Suppurative and Chronic Otitis Media', category: 'Ophthalmology & ENT', description: 'Middle ear chronic or acute inflammatory process' },
  I10: { code: 'I10', name: 'Essential (Primary) Hypertension', category: 'Cardiovascular', description: 'Chronic systemic arterial hypertension without secondary etiology' },
  I21: { code: 'I21', name: 'Acute Myocardial Infarction', category: 'Cardiovascular', description: 'Acute coronary syndrome / STEMI or NSTEMI cardiac necrosis' },
  I25: { code: 'I25', name: 'Chronic Ischemic Heart Disease', category: 'Cardiovascular', description: 'Coronary artery disease, stable angina, prior CABG/PCI' },
  I48: { code: 'I48', name: 'Atrial Fibrillation and Flutter', category: 'Cardiovascular', description: 'Supraventricular tachyarrhythmia with thromboembolism risk' },
  I50: { code: 'I50', name: 'Heart Failure', category: 'Cardiovascular', description: 'HFrEF / HFpEF reduced ejection fraction ventricular dysfunction' },
  I63: { code: 'I63', name: 'Cerebral Infarction (Ischemic Stroke)', category: 'Cardiovascular', description: 'Focal ischemic cerebral vascular accident' },
  J18: { code: 'J18', name: 'Pneumonia (Unspecified Organism)', category: 'Respiratory', description: 'Community-acquired or hospital-acquired lower respiratory infection' },
  J20: { code: 'J20', name: 'Acute Bronchitis', category: 'Respiratory', description: 'Acute tracheobronchial airway inflammation' },
  J44: { code: 'J44', name: 'Chronic Obstructive Pulmonary Disease (COPD)', category: 'Respiratory', description: 'Chronic bronchitis and emphysema with airflow obstruction' },
  J45: { code: 'J45', name: 'Asthma', category: 'Respiratory', description: 'Chronic reactive airway inflammatory disease with bronchospasm' },
  K21: { code: 'K21', name: 'Gastro-Esophageal Reflux Disease (GERD)', category: 'Digestive & Gastrointestinal', description: 'Acid reflux with esophagitis or non-erosive symptoms' },
  K29: { code: 'K29', name: 'Gastritis and Duodenitis', category: 'Digestive & Gastrointestinal', description: 'Mucosal gastric inflammation or erosion' },
  K30: { code: 'K30', name: 'Functional Dyspepsia', category: 'Digestive & Gastrointestinal', description: 'Chronic epigastric pain and postprandial distress syndrome' },
  K59: { code: 'K59', name: 'Other Functional Intestinal Disorders (IBS / Constipation)', category: 'Digestive & Gastrointestinal', description: 'Irritable bowel syndrome and slow-transit motility disorders' },
  K80: { code: 'K80', name: 'Cholelithiasis (Gallstones)', category: 'Digestive & Gastrointestinal', description: 'Gallbladder or biliary duct calculous disease' },
  L20: { code: 'L20', name: 'Atopic Dermatitis (Eczema)', category: 'Dermatology', description: 'Chronic pruritic inflammatory cutaneous disorder' },
  L40: { code: 'L40', name: 'Psoriasis', category: 'Dermatology', description: 'Immune-mediated erythematosquamous plaque psoriasis' },
  M17: { code: 'M17', name: 'Osteoarthritis of Knee (Gonarthrosis)', category: 'Musculoskeletal & Rheumatic', description: 'Primary or bilateral degenerative cartilage joint disease' },
  M19: { code: 'M19', name: 'Other and Unspecified Osteoarthritis', category: 'Musculoskeletal & Rheumatic', description: 'Polyarticular or generalized joint degenerative osteoarthritis' },
  M54: { code: 'M54', name: 'Dorsalgia (Chronic Back Pain)', category: 'Musculoskeletal & Rheumatic', description: 'Lumbago, cervicalgia, or radicular back pain' },
  M81: { code: 'M81', name: 'Osteoporosis without Pathological Fracture', category: 'Musculoskeletal & Rheumatic', description: 'Postmenopausal or senile bone mineral density reduction (T ≤ -2.5)' },
  N18: { code: 'N18', name: 'Chronic Kidney Disease (CKD Stages 1-5)', category: 'Renal & Genitourinary', description: 'Progressive renal insufficiency with reduced eGFR or albuminuria' },
  N39: { code: 'N39', name: 'Other Disorders of Urinary System (Recurrent UTI)', category: 'Renal & Genitourinary', description: 'Lower tract urinary infection or persistent dysuria' },
  N40: { code: 'N40', name: 'Benign Prostatic Hyperplasia (BPH)', category: 'Renal & Genitourinary', description: 'Prostatic enlargement causing lower urinary tract symptoms' },
  O14: { code: 'O14', name: 'Pre-eclampsia', category: 'Cardiovascular', description: 'Gestational hypertension with proteinuria or end-organ dysfunction' },
  Q21: { code: 'Q21', name: 'Congenital Malformations of Cardiac Septa', category: 'Cardiovascular', description: 'Atrial or ventricular septal defect (ASD/VSD)' },
  S72: { code: 'S72', name: 'Fracture of Femur', category: 'Musculoskeletal & Rheumatic', description: 'Proximal or femoral shaft fracture' },

  // Additional Primary Clinical Trial Cohort Codes
  C25: { code: 'C25', name: 'Malignant Neoplasm of Pancreas', category: 'Oncology & Hematology', description: 'Pancreatic ductal adenocarcinoma' },
  C43: { code: 'C43', name: 'Malignant Melanoma of Skin', category: 'Oncology & Hematology', description: 'Cutaneous melanoma malignancy' },
  C56: { code: 'C56', name: 'Malignant Neoplasm of Ovary', category: 'Oncology & Hematology', description: 'High-grade serous ovarian carcinoma' },
  C67: { code: 'C67', name: 'Malignant Neoplasm of Bladder', category: 'Oncology & Hematology', description: 'Urothelial bladder carcinoma' },
  C85: { code: 'C85', name: 'Non-Hodgkin Lymphoma', category: 'Oncology & Hematology', description: 'Diffuse large B-cell or follicular lymphoma' },
  C92: { code: 'C92', name: 'Myeloid Leukemia', category: 'Oncology & Hematology', description: 'Acute or chronic myeloid leukemia (AML/CML)' },
  D57: { code: 'D57', name: 'Sickle-Cell Disorders', category: 'Oncology & Hematology', description: 'Hemoglobin SS or SC sickle disease' },
  G30: { code: 'G30', name: 'Alzheimer’s Disease', category: 'Neurology & Mental Health', description: 'Early-onset or late-onset Alzheimer’s dementia' },
  G35: { code: 'G35', name: 'Multiple Sclerosis', category: 'Neurology & Mental Health', description: 'Relapsing-remitting or progressive demyelinating disease' },
  G12: { code: 'G12', name: 'Spinal Muscular Atrophy and Motor Neuron Diseases', category: 'Neurology & Mental Health', description: 'ALS and motor neuron degeneration' },
  K50: { code: 'K50', name: 'Crohn’s Disease', category: 'Digestive & Gastrointestinal', description: 'Transmural granulomatous regional enteritis' },
  K51: { code: 'K51', name: 'Ulcerative Colitis', category: 'Digestive & Gastrointestinal', description: 'Mucosal ulcerative inflammatory bowel disease' },
  M05: { code: 'M05', name: 'Seropositive Rheumatoid Arthritis', category: 'Musculoskeletal & Rheumatic', description: 'Rheumatoid factor / anti-CCP positive polyarthritis' },
  M06: { code: 'M06', name: 'Other Rheumatoid Arthritis', category: 'Musculoskeletal & Rheumatic', description: 'Seronegative rheumatoid arthritis' },
  M32: { code: 'M32', name: 'Systemic Lupus Erythematosus (SLE)', category: 'Musculoskeletal & Rheumatic', description: 'Multisystem autoimmune connective tissue disease' },
};

/**
 * All 48 codes active in Demo Hospital A with baseline cohort sizes.
 */
export const DEMO_HOSPITAL_ACTIVE_CODES = [
  'A15', 'B18', 'B20', 'C18', 'C34', 'C50', 'C61', 'D50', 'D64', 'E03',
  'E05', 'E10', 'E11', 'E66', 'E78', 'F03', 'F32', 'F41', 'G20', 'G40',
  'G43', 'H25', 'H40', 'H66', 'I10', 'I21', 'I25', 'I48', 'I50', 'I63',
  'J18', 'J20', 'J44', 'J45', 'K21', 'K29', 'K30', 'K59', 'K80', 'L20',
  'L40', 'M17', 'M19', 'M54', 'M81', 'N18', 'N39', 'N40', 'O14', 'Q21',
  'S72',
];

/**
 * Return friendly disease name for any ICD-10 code, even user-entered or uncataloged codes.
 */
export function getDiseaseName(code: string | undefined | null): string {
  if (!code) return 'Any Condition / All Cohorts';
  const clean = code.trim().toUpperCase();
  if (ICD10_REGISTRY[clean]) {
    return ICD10_REGISTRY[clean].name;
  }
  // Check prefix match (e.g. K30.0 -> K30)
  const base = clean.split('.')[0];
  if (ICD10_REGISTRY[base]) {
    return `${ICD10_REGISTRY[base].name} (${clean})`;
  }
  return `ICD-10 Condition (${clean})`;
}

/**
 * Return complete metadata for a code.
 */
export function getDiseaseCondition(code: string): IcdCondition {
  const clean = code.trim().toUpperCase();
  if (ICD10_REGISTRY[clean]) {
    return ICD10_REGISTRY[clean];
  }
  return {
    code: clean,
    name: getDiseaseName(clean),
    category: 'Custom Clinical Condition',
  };
}

/**
 * Filter registry conditions by query and optional specialty category.
 */
export function searchIcdRegistry(
  query: string,
  category: string = 'All Categories',
  limit: number = 30,
): IcdCondition[] {
  const cleanQ = query.trim().toUpperCase();
  const allConditions = Object.values(ICD10_REGISTRY);

  let filtered = allConditions;

  if (category === 'Hospital Cohorts (Live Demo)') {
    const activeSet = new Set(DEMO_HOSPITAL_ACTIVE_CODES);
    filtered = filtered.filter((c) => activeSet.has(c.code));
  } else if (category && category !== 'All Categories') {
    filtered = filtered.filter((c) => c.category === category);
  }

  if (cleanQ) {
    filtered = filtered.filter(
      (c) =>
        c.code.includes(cleanQ) ||
        c.name.toUpperCase().includes(cleanQ) ||
        (c.description && c.description.toUpperCase().includes(cleanQ)),
    );
  }

  return filtered.slice(0, limit);
}

/**
 * Flattened dictionary compatible with existing MembraneContext consumers.
 */
export const ICD10_DICTIONARY: Record<string, string> = Object.fromEntries(
  Object.entries(ICD10_REGISTRY).map(([code, cond]) => [code, cond.name]),
);

export interface DynamicIcdOption {
  code: string;
  name: string;
  patientCount?: number;
  category?: string;
}

let cachedDynamicCodes: DynamicIcdOption[] | null = null;

export async function fetchDynamicHospitalCodes(apiBaseUrl?: string): Promise<DynamicIcdOption[]> {
  const base = apiBaseUrl || (import.meta.env.VITE_MEMBRANE_API_URL as string) || 'https://membrane-api.onrender.com/v1';
  try {
    const [p1Res, p2Res] = await Promise.all([
      fetch(`${base}/demo-hosp-a-data/patients?limit=100&page=1`),
      fetch(`${base}/demo-hosp-a-data/patients?limit=100&page=2`),
    ]);

    const [d1, d2] = await Promise.all([
      p1Res.ok ? p1Res.json() : { data: [] },
      p2Res.ok ? p2Res.json() : { data: [] },
    ]);

    const patients: Array<{ diseaseCode?: string }> = [
      ...(Array.isArray(d1?.data) ? d1.data : []),
      ...(Array.isArray(d2?.data) ? d2.data : []),
    ];

    const counts: Record<string, number> = {};
    for (const p of patients) {
      if (p.diseaseCode) {
        const c = p.diseaseCode.trim().toUpperCase();
        counts[c] = (counts[c] || 0) + 1;
      }
    }

    const options: DynamicIcdOption[] = Object.entries(counts)
      .map(([code, patientCount]) => ({
        code,
        name: getDiseaseName(code),
        patientCount,
        category: getDiseaseCondition(code).category,
      }))
      .sort((a, b) => (b.patientCount || 0) - (a.patientCount || 0));

    if (options.length > 0) {
      cachedDynamicCodes = options;
      return options;
    }
  } catch {
    // If API is unreachable, use DEMO_HOSPITAL_ACTIVE_CODES
  }

  return DEMO_HOSPITAL_ACTIVE_CODES.map((code) => ({
    code,
    name: getDiseaseName(code),
    patientCount: 0,
    category: getDiseaseCondition(code).category,
  }));
}

export function getCachedDynamicCodes(): DynamicIcdOption[] {
  if (cachedDynamicCodes) return cachedDynamicCodes;
  return DEMO_HOSPITAL_ACTIVE_CODES.map((code) => ({
    code,
    name: getDiseaseName(code),
    patientCount: 0,
    category: getDiseaseCondition(code).category,
  }));
}

