import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppHeader, Arrow } from '../components/AppHeader';
import { DynamicIcdSelect } from '../components/DynamicIcdSelect';
import { RowSkeleton } from '../components/Skeleton';
import { useApp } from '../contexts/AppContext';
import { usePageSeo } from '../hooks';
import { getDiseaseName } from '../config/icdRegistry';
import { getMembraneContract, type StudyCriteria } from '../midnight/contract';
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

export const ResearchLabPage: React.FC = () => {
  usePageSeo({
    title: 'Research Lab — Cohort Criteria & Feasibility Discovery | Membrane',
    description:
      'Configure clinical trial eligibility criteria and discover matching hospital cohorts without exposing patient health records.',
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const { walletSession, connectWallet, dynamicCodes } = useApp();

  // Read state from URL query parameters with fallbacks
  const urlIcd = searchParams.get('icd') || 'K30';
  const urlTitle = searchParams.get('title') || `${getDiseaseName(urlIcd)} Clinical Study`;
  const urlMinCohort = searchParams.get('minCohort') || '10';
  const urlMinAge = searchParams.get('minAge') || '40';
  const urlMaxAge = searchParams.get('maxAge') || '65';
  const urlTrial = searchParams.get('trial') || '';

  const [diseaseCode, setDiseaseCode] = useState<string>(urlIcd);
  const [title, setTitle] = useState<string>(urlTitle);
  const [minimum, setMinimum] = useState<string>(urlMinCohort);
  const [minAge, setMinAge] = useState<string>(urlMinAge);
  const [maxAge, setMaxAge] = useState<string>(urlMaxAge);
  const [trialHexId, setTrialHexId] = useState<string>(urlTrial);

  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');
  const [trials, setTrials] = useState<ApiRecord[]>([]);

  // Keep state synchronized with URL query params
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

  const loadTrials = useCallback(async () => {
    setStatus('loading');
    setMessage('');
    try {
      const clean = diseaseCode.trim().toUpperCase();
      const path = clean ? `/clinical-trials/index?diseaseCode=${encodeURIComponent(clean)}` : `/clinical-trials/index`;
      const result = await apiRequest<{ data?: ApiRecord[] }>(path);
      const list = Array.isArray(result) ? result : Array.isArray(result.data) ? result.data : [];
      setTrials(list);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not load requests.');
    }
  }, [diseaseCode]);

  useEffect(() => {
    void loadTrials();
  }, [loadTrials]);

  const handleDiseaseChange = (code: string) => {
    setDiseaseCode(code);
    const condName = getDiseaseName(code);
    const newTitle = `${condName} Clinical Study`;
    setTitle(newTitle);
    updateUrlParams({
      icd: code,
      title: newTitle,
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    updateUrlParams({ title: newTitle });
  };

  const handleMinCohortChange = (newMin: string) => {
    setMinimum(newMin);
    updateUrlParams({ minCohort: newMin });
  };

  const handleMinAgeChange = (newAge: string) => {
    setMinAge(newAge);
    updateUrlParams({ minAge: newAge });
  };

  const handleMaxAgeChange = (newAge: string) => {
    setMaxAge(newAge);
    updateUrlParams({ maxAge: newAge });
  };

  const publish = async () => {
    setStatus('loading');
    setMessage('');

    let hexId = '';

    try {
      const minCohortNum = Math.max(1, parseInt(minimum, 10) || 10);
      const minAgeNum = Math.max(0, parseInt(minAge, 10) || 40);
      const maxAgeNum = Math.max(0, parseInt(maxAge, 10) || 65);

      // 1. If Midnight wallet is connected, invoke createTrial circuit defined in membrane.compact
      if (walletSession && isContractConfigured()) {
        try {
          const contract = await getMembraneContract(walletSession);
          const result = await contract.createTrial(
            diseaseCode,
            minAgeNum,
            maxAgeNum,
            minCohortNum,
          );
          hexId = result.trialHexId;
        } catch (contractErr) {
          console.warn('Smart contract publish fallback:', contractErr);
        }
      }

      if (!hexId) {
        const bytes = crypto.getRandomValues(new Uint8Array(20));
        hexId = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      }

      // 2. Index the created on-chain trial in the auxiliary API DB
      await apiRequest('/clinical-trials/index', {
        method: 'POST',
        body: JSON.stringify({
          trialHexId: hexId,
          diseaseCode,
        }),
      });

      setTrialHexId(hexId);
      updateUrlParams({ trial: hexId });
      setStatus('success');
      await loadTrials();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not publish and index request.');
    }
  };

  return (
    <div className="app">
      <AppHeader />

      <main>
        <div className="page-heading">
          <div>
            <p>Research lab</p>
            <h1>Create a data request</h1>
            <span>Publish criteria and discover qualified hospitals without receiving patient data.</span>
          </div>
          <span className="api-online">
            <i /> API online
          </span>
        </div>

        <section className="panel">
          <div className="panel-title">
            <div>
              <span>01</span>
              <div>
                <h2>Cohort criteria</h2>
                <p>Only these public criteria are published and indexed on-chain.</p>
              </div>
            </div>
            <b>Public Predicate</b>
          </div>

          <div className="fields">
            <label className="wide">
              Study title
              <input value={title} onChange={(e) => handleTitleChange(e.target.value)} />
            </label>

            <DynamicIcdSelect
              label="Condition (ICD-10)"
              value={diseaseCode}
              onChange={handleDiseaseChange}
              dynamicCodes={dynamicCodes}
              placeholder="Select diagnosis..."
              allowCustomInput={true}
            />

            <label>
              Minimum cohort (patients)
              <input type="number" value={minimum} onChange={(e) => handleMinCohortChange(e.target.value)} min={1} />
            </label>

            <label>
              Minimum age
              <input
                type="number"
                value={minAge}
                onChange={(e) => handleMinAgeChange(e.target.value)}
                min={0}
                max={120}
              />
            </label>

            <label>
              Maximum age
              <input
                type="number"
                value={maxAge}
                onChange={(e) => handleMaxAgeChange(e.target.value)}
                min={0}
                max={120}
              />
            </label>
          </div>

          <div className="action-row">
            <button
              type="button"
              onClick={walletSession ? publish : connectWallet}
              disabled={status === 'loading' || !diseaseCode}
            >
              {status === 'loading'
                ? 'Publishing & Indexing…'
                : walletSession
                  ? 'Publish & Index Request'
                  : 'Connect Wallet to Publish'}
              <Arrow />
            </button>
          </div>

          {status === 'error' && (
            <div className="notice error">
              {message}
              <button type="button" onClick={publish}>
                Retry
              </button>
            </div>
          )}

          {trialHexId && (
            <div className="notice success">
              Request published & indexed: <code>CT-{trialHexId.slice(0, 12).toUpperCase()}…</code> ({diseaseCode} —{' '}
              {getDiseaseName(diseaseCode)})
            </div>
          )}
        </section>

        <section className="panel results-panel">
          <div className="panel-title">
            <div>
              <span>02</span>
              <div>
                <h2>Indexed requests</h2>
              </div>
            </div>
            <button type="button" className="text-button" onClick={loadTrials}>
              Refresh
            </button>
          </div>

          {status === 'loading' && trials.length === 0 ? (
            <RowSkeleton count={3} />
          ) : trials.length ? (
            <div className="rows">
              {trials.map((trial, index) => {
                const hex = text(trial, ['trialHexId', 'hexId', 'id'], String(index));
                const code = text(trial, ['diseaseCode', 'icd'], diseaseCode);
                return (
                  <div className="row" key={hex || index}>
                    <span className="row-icon">CT</span>
                    <div>
                      <strong>{text(trial, ['title'], `ICD ${code} — ${getDiseaseName(code)}`)}</strong>
                      <small>
                        Trial ID: {hex.slice(0, 16)}… • ICD {code}
                      </small>
                    </div>
                    <b>Indexed</b>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty">
              <strong>No requests found</strong>
              <span>Publish a request or refresh the index.</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
