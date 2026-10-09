import { type WalletSession } from './wallet';

export interface StudyCriteria {
  diseaseCode: string;
  minAge: number;
  maxAge: number;
  minCohort: number;
}

export interface MembraneStudy {
  trialHexId: string;
  diseaseCode: string;
  minAge: number;
  maxAge: number;
  minCohort: number;
  eligibleHospitals: number;
  createdAt: string;
}

function getStoredStudies(): Record<string, MembraneStudy> {
  try {
    const raw = localStorage.getItem('membrane_ledger_studies');
    if (raw) return JSON.parse(raw) as Record<string, MembraneStudy>;
  } catch {
    // ignore
  }
  return {};
}

function saveStudy(study: MembraneStudy) {
  try {
    const current = getStoredStudies();
    current[study.trialHexId] = study;
    localStorage.setItem('membrane_ledger_studies', JSON.stringify(current));
  } catch {
    // ignore
  }
}

export interface MembraneContractApi {
  createStudy: (trialHexId: string, criteria: StudyCriteria) => Promise<{ txId: string }>;
  getStudy: (trialHexId: string) => Promise<MembraneStudy | null>;
  proveEligibility: (trialHexId: string, patientCount: number) => Promise<{ txId: string }>;
}

let activeContractInstance: MembraneContractApi | null = null;

export function resetMembraneContract(): void {
  activeContractInstance = null;
}

export async function getMembraneContract(session: WalletSession): Promise<MembraneContractApi> {
  await Promise.resolve(session);
  if (activeContractInstance) return activeContractInstance;

  activeContractInstance = {
    async createStudy(trialHexId: string, criteria: StudyCriteria): Promise<{ txId: string }> {
      // Simulate circuit compilation & zero-knowledge ledger state change
      await new Promise((resolve) => setTimeout(resolve, 800));

      const txId =
        '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');

      const study: MembraneStudy = {
        trialHexId,
        diseaseCode: criteria.diseaseCode,
        minAge: criteria.minAge,
        maxAge: criteria.maxAge,
        minCohort: criteria.minCohort,
        eligibleHospitals: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };

      saveStudy(study);
      return { txId };
    },

    async getStudy(trialHexId: string): Promise<MembraneStudy | null> {
      await Promise.resolve();
      const all = getStoredStudies();
      if (all[trialHexId]) return all[trialHexId];

      // Match prefix if short hex was provided
      for (const [key, val] of Object.entries(all)) {
        if (key.startsWith(trialHexId) || trialHexId.startsWith(key)) {
          return val;
        }
      }

      return null;
    },

    async proveEligibility(trialHexId: string, patientCount: number): Promise<{ txId: string }> {
      // Simulate witness loading, local proof server proving, and Midnight verification
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const all = getStoredStudies();
      let study = all[trialHexId];
      if (!study) {
        for (const [key, val] of Object.entries(all)) {
          if (key.startsWith(trialHexId) || trialHexId.startsWith(key)) {
            study = val;
            break;
          }
        }
      }

      if (study && patientCount < study.minCohort) {
        throw new Error(`Private cohort size (${patientCount}) does not satisfy required minimum (${study.minCohort})`);
      }

      if (study) {
        study.eligibleHospitals = (study.eligibleHospitals || 0) + 1;
        saveStudy(study);
      }

      const txId =
        '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
      return { txId };
    },
  };

  return activeContractInstance;
}
