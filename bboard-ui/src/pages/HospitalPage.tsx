import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppHeader, Arrow } from '../components/AppHeader';
import { DynamicIcdSelect } from '../components/DynamicIcdSelect';
import { RowSkeleton } from '../components/Skeleton';
import { useApp } from '../contexts/AppContext';
import { getDiseaseName } from '../config/icdRegistry';
import { getMembraneContract } from '../midnight/contract';
import { isContractConfigured } from '../midnight/config';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { walletSession, connectWallet, dynamicCodes, totalCohortCount } = useApp();

  const urlIcd = searchParams.get('icd') || 'K30';
  const urlTrial = searchParams.get('trial') || '';
  const urlMinCohort = parseInt(searchParams.get('minCohort') || '200', 10) || 200;

  const [diseaseCode, setDiseaseCode] = useState<string>(urlIcd);
  const [minimum, setMinimum] = useState<number>(urlMinCohort);
  const [trials, setTrials] = useState<ApiRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [indexStatus, setIndexStatus] = useState<Status>('loading');
  const [proofStatus, setProofStatus] = useState<Status>('idle');
  const [count, setCount] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');

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

  const loadRequests = useCallback(async () => {
    setIndexStatus('loading');
    try {
      const clean = diseaseCode.trim().toUpperCase();
      const path =
        clean && clean !== 'ALL'
          ? `/clinical-trials/index?diseaseCode=${encodeURIComponent(clean)}`
          : `/clinical-trials/index`;
      const result = await apiRequest<{ data?: ApiRecord[] }>(path);
      const list = Array.isArray(result) ? result : Array.isArray(result.data) ? result.data : [];
      setTrials(list);

      // If URL specified a trial hex ID, find its index
      if (urlTrial) {
        const found = list.findIndex((t) => text(t, ['trialHexId', 'hexId', 'id'], '') === urlTrial);
        setSelectedIndex(found >= 0 ? found : 0);
      } else {
        setSelectedIndex(0);
      }
      setIndexStatus('success');
    } catch {
      setIndexStatus('error');
    }
  }, [diseaseCode, urlTrial]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleDiseaseChange = (code: string) => {
    setDiseaseCode(code);
    updateUrlParams({ icd: code });
  };

  const handleSelectTrial = (index: number, trial: ApiRecord) => {
    setSelectedIndex(index);
    setProofStatus('idle');
    setCount(null);
    const hex = text(trial, ['trialHexId', 'hexId', 'id'], '');
    updateUrlParams({ trial: hex });
  };

  const handleMinChange = (val: number) => {
    setMinimum(val);
    updateUrlParams({ minCohort: String(val) });
  };

  const verify = async () => {
    setProofStatus('loading');
    setMessage('');
    try {
      const cleanCode = (diseaseCode || '').trim().toUpperCase();
      const result = await apiRequest<{ patientsCount?: number }>(
        `/demo-hosp-a-data/patient-ct-requirement-count?icd=${encodeURIComponent(cleanCode)}&minAge=40&maxAge=65`,
      );
      if (typeof result.patientsCount !== 'number') {
        throw new Error('Invalid count response from hospital EHR.');
      }
      const localCount = result.patientsCount;
      setCount(localCount);

      // If wallet is connected, verify on Midnight smart contract
      if (walletSession && isContractConfigured() && trials[selectedIndex]) {
        const hex = text(trials[selectedIndex], ['trialHexId', 'hexId'], '');
        if (hex && localCount >= minimum) {
          try {
            const contract = await getMembraneContract(walletSession);
            await contract.proveEligibility(hex, localCount);
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

  const eligible = count !== null && count >= minimum;
  const selectedTrial = trials[selectedIndex];

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
                return (
                  <button
                    type="button"
                    className={`row selectable ${isSelected ? 'selected' : ''}`}
                    key={hex || index}
                    onClick={() => handleSelectTrial(index, trial)}
                  >
                    <span className="row-icon">CT</span>
                    <div>
                      <strong>{text(trial, ['title'], `ICD ${code} — ${getDiseaseName(code)}`)}</strong>
                      <small>
                        Trial ID: {hex.slice(0, 16)}… • ICD {code}
                      </small>
                    </div>
                    <span>{isSelected ? 'Selected' : 'Select'}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty compact">No open requests found for ICD {diseaseCode || 'selected filter'}.</div>
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

          <div className="criteria">
            <div>
              <span>Condition</span>
              <strong>
                ICD {selectedTrial ? text(selectedTrial, ['diseaseCode', 'icd'], diseaseCode) : diseaseCode} —{' '}
                {getDiseaseName(selectedTrial ? text(selectedTrial, ['diseaseCode', 'icd'], diseaseCode) : diseaseCode)}
              </strong>
            </div>
            <div>
              <span>Minimum cohort</span>
              <strong>
                <input type="number" value={minimum} onChange={(e) => handleMinChange(Number(e.target.value) || 0)} />{' '}
                patients
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
                  {count} matching demo records were evaluated locally inside institutional custody. Only this
                  zero-knowledge predicate result is shared on Midnight.
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
                disabled={proofStatus === 'loading'}
              >
                {proofStatus === 'loading'
                  ? 'Evaluating locally…'
                  : walletSession
                    ? 'Verify eligibility & prove'
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
        </section>
      </main>
    </div>
  );
};
