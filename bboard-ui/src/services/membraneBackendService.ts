/**
 * Client for Membrane Auxiliary Backend API (membrane-api)
 * Connects to live production endpoints at https://membrane-api.onrender.com/v1
 * for clinical trials indexing and hospital EHR cohort calculations.
 *
 * Live Endpoints:
 * - GET  /v1                                               -> Health check
 * - POST /v1/clinical-trials/index                         -> Index new trial { trialHexId, diseaseCode }
 * - GET  /v1/clinical-trials/index?diseaseCode={code}       -> Query indexed trials
 * - GET  /v1/demo-hosp-a-data/patients?icd={icd}           -> Query Demo A hospital patients
 * - GET  /v1/demo-hosp-a-data/patient-ct-requirement-count -> Get matching patient count for criteria
 */

const API_BASE_URL =
  (import.meta.env.VITE_MEMBRANE_API_URL as string) || 'https://membrane-api.onrender.com/v1';

export interface IndexedTrialDto {
  id?: number | string;
  trialHexId: string;
  diseaseCode: string;
  createdAt?: string;
}

export interface PatientDto {
  id: string | number;
  patientId?: string;
  firstName?: string;
  lastName?: string;
  age: number;
  diseaseCode: string;
  createdAt?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta?: {
    totalItems: number;
    itemCount: number;
    itemsPerPage?: number;
    totalPages?: number;
    currentPage?: number;
  };
}

export type BackendMode = 'online' | 'airgapped' | 'offline';

let currentMode: BackendMode = 'online';
const listeners = new Set<(mode: BackendMode) => void>();

function notifyListeners() {
  listeners.forEach((cb) => cb(currentMode));
}

export const MembraneBackendService = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  getMode(): BackendMode {
    return currentMode;
  },

  isBackendConnected(): boolean {
    return currentMode === 'online';
  },

  subscribeModeChange(cb: (mode: BackendMode) => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  setMode(mode: BackendMode) {
    currentMode = mode;
    notifyListeners();
  },

  /**
   * Health check to test live connection to Membrane API.
   */
  async checkBackendConnection(): Promise<{ success: boolean; message: string; url: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(`${API_BASE_URL}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        currentMode = 'online';
        notifyListeners();
        return {
          success: true,
          message: 'Connected to live Membrane API on Render.',
          url: API_BASE_URL,
        };
      }
      throw new Error(`HTTP status ${res.status}`);
    } catch (err) {
      currentMode = 'offline';
      notifyListeners();
      const msg = err instanceof Error ? err.message : 'Connection failed';
      return {
        success: false,
        message: `Membrane API unreachable (${msg}).`,
        url: API_BASE_URL,
      };
    }
  },

  /**
   * Fetches indexed clinical trials from live API:
   * GET /v1/clinical-trials/index?diseaseCode={diseaseCode}
   */
  async getClinicalTrials(
    page = 1,
    limit = 20,
    diseaseCode = '',
  ): Promise<PaginatedResult<IndexedTrialDto>> {
    const url = new URL(`${API_BASE_URL}/clinical-trials/index`);
    if (diseaseCode) {
      url.searchParams.set('diseaseCode', diseaseCode);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Failed to fetch clinical trials (${res.status} ${res.statusText})`);
      }

      const json = await res.json();
      const items: IndexedTrialDto[] = Array.isArray(json)
        ? (json as IndexedTrialDto[])
        : Array.isArray(json?.data)
          ? (json.data as IndexedTrialDto[])
          : [];

      currentMode = 'online';
      notifyListeners();

      return {
        data: items,
        meta: {
          totalItems: items.length,
          itemCount: items.length,
          itemsPerPage: limit,
          totalPages: Math.ceil(items.length / limit) || 1,
          currentPage: page,
        },
      };
    } catch (err) {
      currentMode = 'offline';
      notifyListeners();
      throw err;
    }
  },

  /**
   * Indexes a newly created on-chain clinical trial on live API:
   * POST /v1/clinical-trials/index
   * Body: { trialHexId, diseaseCode }
   */
  async indexClinicalTrial(trialHexId: string, diseaseCode: string): Promise<IndexedTrialDto> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(`${API_BASE_URL}/clinical-trials/index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ trialHexId, diseaseCode }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        let errMsg = `Failed to index clinical trial (${res.status} ${res.statusText})`;
        try {
          const errBody = await res.json();
          if (errBody?.message) errMsg = String(errBody.message);
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      currentMode = 'online';
      notifyListeners();

      const text = await res.text();
      return text ? (JSON.parse(text) as IndexedTrialDto) : { trialHexId, diseaseCode };
    } catch (err) {
      currentMode = 'offline';
      notifyListeners();
      throw err;
    }
  },

  /**
   * Evaluates Demo A hospital candidate count for clinical trial requirements:
   * GET /v1/demo-hosp-a-data/patient-ct-requirement-count?icd={icd}&minAge={minAge}&maxAge={maxAge}
   */
  async getPatientRequirementCount(
    diseaseCode: string,
    minAge: number,
    maxAge: number,
  ): Promise<number> {
    const url = new URL(`${API_BASE_URL}/demo-hosp-a-data/patient-ct-requirement-count`);
    url.searchParams.set('icd', diseaseCode);
    url.searchParams.set('minAge', minAge.toString());
    url.searchParams.set('maxAge', maxAge.toString());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Failed to query patient requirement count (${res.status} ${res.statusText})`);
      }

      const json = await res.json();
      currentMode = 'online';
      notifyListeners();
      return typeof json?.patientsCount === 'number' ? json.patientsCount : 0;
    } catch (err) {
      currentMode = 'offline';
      notifyListeners();
      throw err;
    }
  },

  /**
   * Fetches the hospital's private consented patients from live API:
   * GET /v1/demo-hosp-a-data/patients?icd={icd}
   */
  async getHospitalPatients(
    page = 1,
    limit = 20,
    diseaseCode = '',
  ): Promise<PaginatedResult<PatientDto>> {
    const url = new URL(`${API_BASE_URL}/demo-hosp-a-data/patients`);
    if (diseaseCode) {
      url.searchParams.set('icd', diseaseCode);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Failed to query hospital patients (${res.status} ${res.statusText})`);
      }

      const json = await res.json();
      const items: PatientDto[] = Array.isArray(json)
        ? (json as PatientDto[])
        : Array.isArray(json?.data)
          ? (json.data as PatientDto[])
          : [];

      currentMode = 'online';
      notifyListeners();

      const start = (page - 1) * limit;
      const paged = items.slice(start, start + limit);

      return {
        data: paged,
        meta: {
          totalItems: items.length,
          itemCount: paged.length,
          itemsPerPage: limit,
          totalPages: Math.ceil(items.length / limit) || 1,
          currentPage: page,
        },
      };
    } catch (err) {
      currentMode = 'offline';
      notifyListeners();
      throw err;
    }
  },
};
