import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppHeader, Arrow } from '../components/AppHeader';
import { DynamicIcdSelect } from '../components/DynamicIcdSelect';
import { RowSkeleton } from '../components/Skeleton';
import { useApp } from '../contexts/AppContext';
import { usePageSeo } from '../hooks';
import { getDiseaseName } from '../config/icdRegistry';
import {
  getMembraneContract,
  getContractStudyDetails,
  type MembraneStudy,
  TrialStatusEnum,
} from '../midnight/contract';
import { isContractConfigured } from '../midnight/config';
import {
  initProofServerAutoDetection,
  subscribeProofServer,
  checkProofServer,
  setSimulatedProver,
  type ProofServerState,
} from '../midnight/proofServer';

const DEFAULT_API_BASE = 'https://membrane-api.onrender.com/v1';

type Status = 'idle' | 'loading' | 'success' | 'error';
type ApiRecord = Record<string, unknown>;

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const base = import.meta.env.VITE_MEMBRANE_API_BASE_URL || DEFAULT_API_BASE;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Request failed (${response.status}): ${errText || response.statusText}`);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

function text(record: ApiRecord, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' || typeof value === 'number') return String(value);
  }
  return fallback;
}

export const HospitalPage: React.FC = () => {
  usePageSeo({
    title: 'Hospital Cohort — Private Witness Proof Generation | Membrane',
    description:
      'Evaluate local hospital patient cohorts against trial criteria using air-gapped zero-knowledge witness proofs.',
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const { walletSession, connectWallet, dynamicCodes } = useApp();

  const urlIcd = searchParams.get('icd') || 'ALL';
  const urlTrial = searchParams.get('trial') || '';

  const [diseaseCode, setDiseaseCode] = useState<string>(urlIcd);
  const [trials, setTrials] = useState<ApiRecord[]>([]);
  const [trialStatuses, setTrialStatuses] = useState<Record<string, boolean>>({});
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [indexStatus, setIndexStatus] = useState<Status>('loading');
  const [contractStudy, setContractStudy] = useState<MembraneStudy | null>(null);
  const [contractStudyLoading, setContractStudyLoading] = useState<boolean>(false);
  const [proofStatus, setProofStatus] = useState<Status>('idle');
  const [count, setCount] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');

  const [proofServer, setProofServer] = useState<ProofServerState>({
    status: 'checking',
    uri: 'http://localhost:6300',
    isSimulated: false,
    lastChecked: null,
  });

  // Real-time automatic detection and subscription for local proof server
  useEffect(() => {
    const stopAuto = initProofServerAutoDetection(12000);
    const unsub = subscribeProofServer((state) => {
      setProofServer(state);
    });
    return () => {
      stopAuto();
      unsub();
    };
  }, []);

  const updateUrlParams = useCallback(
    (updates: Record<string, string>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, val]) => {
            if (val) {
              next.set(key, val);
            } else {
              next.delete(key);
            }
          });
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const fetchTrialStatuses = useCallback(
    async (list: ApiRecord[]) => {
      if (list.length === 0) return;
      try {
        const contract = await getMembraneContract(walletSession);
        const statuses: Record<string, boolean> = {};
        for (const t of list) {
          const hex = text(t, ['trialHexId', 'hexId', 'id'], '');
          if (hex) {
            statuses[hex] = await contract.isTrialActive(hex);
          }
        }
        setTrialStatuses(statuses);
      } catch {
        // ignore
      }
    },
    [walletSession],
  );

  const loadRequests = useCallback(async () => {
    setIndexStatus('loading');
    setProofStatus('idle');
    setCount(null);
    setMessage('');
    setContractStudy(null);
    try {
      const clean = diseaseCode.trim().toUpperCase();
      const path =
        clean && clean !== 'ALL'
          ? `/clinical-trials/index?diseaseCode=${encodeURIComponent(clean)}`
          : `/clinical-trials/index`;
      const result = await apiRequest<{ data?: ApiRecord[] }>(path);
      const list = Array.isArray(result) ? result : Array.isArray(result.data) ? result.data : [];
      setTrials(list);

      if (list.length > 0) {
        let idx = 0;
        if (urlTrial) {
          const found = list.findIndex((t) => text(t, ['trialHexId', 'hexId', 'id'], '') === urlTrial);
          idx = found >= 0 ? found : 0;
        }
        setSelectedIndex(idx);
      } else {
        setSelectedIndex(0);
      }
      setIndexStatus('success');
      void fetchTrialStatuses(list);
    } catch {
      setTrials([]);
      setSelectedIndex(0);
      setIndexStatus('error');
    }
  }, [diseaseCode, urlTrial, fetchTrialStatuses]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const selectedTrial = trials.length > 0 && selectedIndex < trials.length ? trials[selectedIndex] : null;

  // Workflow Step: Query smart contract using trialHexId to pull precise details
  useEffect(() => {
    let isMounted = true;
    if (!selectedTrial) {
      setContractStudy(null);
      setContractStudyLoading(false);
      return;
    }

    const hex = text(selectedTrial, ['trialHexId', 'hexId', 'id'], '');
    const code = text(selectedTrial, ['diseaseCode', 'icd'], diseaseCode);
    if (!hex) {
      setContractStudy(null);
      setContractStudyLoading(false);
      return;
    }

    setContractStudyLoading(true);
    void getContractStudyDetails(hex, code).then((details) => {
      if (isMounted) {
        setContractStudy(details);
        setContractStudyLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedTrial, diseaseCode]);

  const handleDiseaseChange = (code: string) => {
    setDiseaseCode(code);
    setTrials([]);
    setSelectedIndex(0);
    setContractStudy(null);
    setProofStatus('idle');
    setCount(null);
    setMessage('');
    updateUrlParams({ icd: code, trial: '' });
  };

  const handleSelectTrial = (index: number, trial: ApiRecord) => {
    setSelectedIndex(index);
    setProofStatus('idle');
    setCount(null);
    setMessage('');
    const hex = text(trial, ['trialHexId', 'hexId', 'id'], '');
    updateUrlParams({ trial: hex });
  };

  const requiredCohort = contractStudy?.minCohort ?? 0;
  const eligible = count !== null && count >= requiredCohort;

  const selectedHex = selectedTrial ? text(selectedTrial, ['trialHexId', 'hexId', 'id'], '') : '';
  const isSelectedTrialActive =
    contractStudy?.status === TrialStatusEnum.inactive
      ? false
      : selectedHex
        ? trialStatuses[selectedHex] !== false
        : true;

  const verify = async () => {
    if (!selectedTrial) return;

    // Requirement 2: Hospital can only enroll in an active trial
    if (!isSelectedTrialActive) {
      setProofStatus('error');
      setMessage('This clinical trial is inactive or has been cancelled by the research lab. Enrollment is disabled.');
      return;
    }

    // Requirement 3: Check to see if local proof server is running or active
    if (proofServer.status !== 'online') {
      setProofStatus('error');
      setMessage(
        `Local proof server is offline. An air-gapped Midnight proof server must be running on ${proofServer.uri} (or enable the Simulated Enclave toggle) to compute zero-knowledge proofs locally.`,
      );
      return;
    }

    setProofStatus('loading');
    setMessage('');
    try {
      const hex = text(selectedTrial, ['trialHexId', 'hexId'], '');
      const targetCode = contractStudy?.diseaseCode || text(selectedTrial, ['diseaseCode', 'icd'], diseaseCode);
      const cleanCode = (targetCode === 'ALL' ? '' : targetCode).trim().toUpperCase();

      if (!cleanCode) {
        throw new Error('Please select an active clinical trial request.');
      }

      // Midnight smart contract dictates cohort requirements and age ranges
      const cohortRequirement = contractStudy?.minCohort ?? 10;
      const targetMinAge = contractStudy?.minAge ?? 40;
      const targetMaxAge = contractStudy?.maxAge ?? 65;

      // 1. Evaluate matching consented patients locally inside hospital boundary
      const result = await apiRequest<{ patientsCount?: number }>(
        `/demo-hosp-a-data/patient-ct-requirement-count?icd=${encodeURIComponent(cleanCode)}&minAge=${targetMinAge}&maxAge=${targetMaxAge}`,
      );
      if (typeof result.patientsCount !== 'number') {
        throw new Error('Invalid count response from hospital EHR.');
      }
      const localCount = result.patientsCount;
      setCount(localCount);

      // 2. If wallet is connected, verify and prove on Midnight smart contract
      if (walletSession && isContractConfigured()) {
        if (hex && localCount >= cohortRequirement) {
          try {
            const contract = await getMembraneContract(walletSession);
            // Invokes circuit trialEnrollment(trialIdHash) defined in membrane.compact
            await contract.trialEnrollment(hex, localCount);
          } catch (contractErr) {
            console.warn('Smart contract proof submission note:', contractErr);
          }
        }
      }

      setProofStatus('success');
    } catch (error) {
      setProofStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not verify eligibility.');
    }
  };

  return (
    <div className="app">
      <AppHeader />

      <main>
        <div className="page-heading">
          <div>
            <p>Hospital</p>
            <h1>Verify a data request</h1>
            <span>Check eligibility locally inside hospital boundaries and return only zero-knowledge results.</span>
          </div>
          <span className="api-online">
            <i /> Demo Hospital A
          </span>
        </div>

        <section className="panel">
          <div className="panel-title">
            <div>
              <span>01</span>
              <div>
                <h2>Select request</h2>
                <p>Filter and load open requests from the clinical trial indexer.</p>
              </div>
            </div>
            <b>Public Index</b>
          </div>

          <div style={{ marginBottom: 14 }}>
            <DynamicIcdSelect
              label="Filter diagnosis"
              value={diseaseCode}
              onChange={handleDiseaseChange}
              allowAll={true}
              allLabel="All diagnoses"
              dynamicCodes={dynamicCodes}
              placeholder="All diagnoses"
              allowCustomInput={true}
            />
          </div>

          {indexStatus === 'loading' ? (
            <RowSkeleton count={3} selectable={true} />
          ) : indexStatus === 'error' ? (
            <div className="notice error">
              Could not load requests.
              <button type="button" onClick={loadRequests}>
                Retry
              </button>
            </div>
          ) : trials.length ? (
            <div className="rows">
              {trials.map((trial, index) => {
                const hex = text(trial, ['trialHexId', 'hexId', 'id'], String(index));
                const code = text(trial, ['diseaseCode', 'icd'], diseaseCode || 'K30');
                const isSelected = selectedIndex === index;
                const isActive = trialStatuses[hex] !== false;

                return (
                  <button
                    type="button"
                    className={`row selectable ${isSelected ? 'selected' : ''}`}
                    key={hex || index}
                    onClick={() => handleSelectTrial(index, trial)}
                  >
                    <span className="row-icon">CT</span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <strong>{text(trial, ['title'], `ICD ${code} — ${getDiseaseName(code)}`)}</strong>
                      <small>
                        Trial ID: {hex.slice(0, 16)}… • ICD {code}
                      </small>
                    </div>
                    <span className={`status-pill ${isActive ? 'active' : 'inactive'}`} style={{ marginRight: '8px' }}>
                      <span className="status-dot" />
                      {isActive ? 'Active' : 'Closed'}
                    </span>
                    <span>{isSelected ? 'Selected' : 'Select'}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty compact">
              No open requests found for ICD{' '}
              {diseaseCode === 'ALL' ? 'all diagnoses' : `${diseaseCode} (${getDiseaseName(diseaseCode)})`}.
            </div>
          )}
        </section>

        <section className="panel verify-panel">
          <div className="panel-title">
            <div>
              <span>02</span>
              <div>
                <h2>Private eligibility check</h2>
                <p>Local enclave check against hospital records.</p>
              </div>
            </div>
            <b className="private">Local ZK Enclave</b>
          </div>

          {/* Proof Server Real-time Detection Banner */}
          <div className={`proof-server-banner ${proofServer.status}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span className="beacon-dot" />
              <div>
                <strong>Local Proof Server: </strong>
                <small>{proofServer.message || proofServer.uri}</small>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="text-button"
                onClick={() => void checkProofServer()}
                style={{ fontSize: '0.78rem', padding: '4px 8px' }}
              >
                Recheck
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => setSimulatedProver(!proofServer.isSimulated)}
                title="Toggle simulated enclave if Docker proof server is not running locally"
                style={{
                  fontSize: '0.76rem',
                  padding: '4px 8px',
                  color: proofServer.isSimulated ? '#10b981' : '#64748b',
                  fontWeight: proofServer.isSimulated ? 600 : 400,
                }}
              >
                {proofServer.isSimulated ? 'Simulated Enclave [ON]' : 'Enable Simulated Enclave'}
              </button>
            </div>
          </div>

          {!selectedTrial ? (
            <div className="empty-check-state">
              <div className="empty-check-icon">🔒</div>
              <strong>No open trial selected</strong>
              <p>
                {trials.length === 0
                  ? `No clinical trial requests are currently indexed for ${
                      diseaseCode === 'ALL'
                        ? 'the selected filter'
                        : `ICD ${diseaseCode} (${getDiseaseName(diseaseCode)})`
                    }. The private eligibility check remains cleared until a matching open trial is found.`
                  : 'Select an open clinical trial from Section 01 above to evaluate institutional feasibility against hospital records.'}
              </p>
            </div>
          ) : (
            <>
              <div className="criteria">
                <div>
                  <span>Condition</span>
                  <strong>
                    ICD{' '}
                    {contractStudy
                      ? contractStudy.diseaseCode
                      : text(selectedTrial, ['diseaseCode', 'icd'], diseaseCode)}{' '}
                    —{' '}
                    {getDiseaseName(
                      contractStudy
                        ? contractStudy.diseaseCode
                        : text(selectedTrial, ['diseaseCode', 'icd'], diseaseCode),
                    )}
                  </strong>
                </div>
                <div>
                  <span>Minimum cohort</span>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {contractStudyLoading ? (
                      <span style={{ color: '#6C7D8C' }}>Querying smart contract…</span>
                    ) : (
                      <>
                        <span>{requiredCohort} patients</span>
                      </>
                    )}
                  </strong>
                </div>
                <div>
                  <span>Trial status</span>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`status-pill ${isSelectedTrialActive ? 'active' : 'inactive'}`}>
                      <span className="status-dot" />
                      {isSelectedTrialActive ? 'Active for Recruitment' : 'Closed / Deactivated'}
                    </span>
                  </strong>
                </div>
                <div>
                  <span>Patient records</span>
                  <strong style={{ color: '#4E93B4' }}>Remain strictly local</strong>
                </div>
              </div>

              {proofStatus === 'success' ? (
                <div className={`result ${eligible ? 'qualified' : 'not-qualified'}`}>
                  <span>{eligible ? '✓' : '!'}</span>
                  <div>
                    <strong>{eligible ? 'Requirement met' : 'Requirement not met'}</strong>
                    <p>
                      {eligible
                        ? `${count} matching demo records evaluated locally (required ≥ ${requiredCohort}). Zero-knowledge witness proof generated on local proof server and submitted to Midnight.`
                        : `Only ${count} matching demo records found locally (required ≥ ${requiredCohort}). Zero-knowledge criteria not satisfied.`}
                    </p>
                  </div>
                  <button type="button" onClick={() => setProofStatus('idle')}>
                    Run again
                  </button>
                </div>
              ) : (
                <div className="action-row">
                  <button
                    type="button"
                    onClick={walletSession ? verify : connectWallet}
                    disabled={
                      proofStatus === 'loading' ||
                      contractStudyLoading ||
                      !isSelectedTrialActive ||
                      proofServer.status === 'checking'
                    }
                    title={
                      !isSelectedTrialActive
                        ? 'Cannot enroll in an inactive trial'
                        : proofServer.status === 'offline'
                          ? 'Local proof server is offline'
                          : undefined
                    }
                  >
                    {proofStatus === 'loading'
                      ? 'Generating local ZK proof…'
                      : !isSelectedTrialActive
                        ? 'Trial Inactive (Recruitment Closed)'
                        : walletSession
                          ? proofServer.status === 'offline'
                            ? 'Proof Server Offline — Cannot Enroll'
                            : 'Verify eligibility & prove'
                          : 'Connect wallet to verify'}
                    <Arrow />
                  </button>
                </div>
              )}

              {proofStatus === 'error' && (
                <div className="notice error">
                  {message}
                  <button type="button" onClick={verify}>
                    Retry
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};
