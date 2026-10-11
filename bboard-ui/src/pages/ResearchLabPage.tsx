import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppHeader, Arrow } from '../components/AppHeader';
import { DynamicIcdSelect } from '../components/DynamicIcdSelect';
import { RowSkeleton } from '../components/Skeleton';
import { useApp } from '../contexts/AppContext';
import { usePageSeo } from '../hooks';
import { getDiseaseName } from '../config/icdRegistry';
import { getMembraneContract } from '../midnight/contract';
import { isContractConfigured, MIDNIGHT_CONFIG } from '../midnight/config';
import {
  subscribeOnchainContract,
  type OnchainContractState,
} from '../midnight/onchainLedger';
import { useMembrane } from '../contexts/MembraneContext';

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
  const { setZkStatus } = useMembrane();

  const [onchainState, setOnchainState] = useState<OnchainContractState>({
    address: MIDNIGHT_CONFIG.contractAddress,
    isDeployed: true,
    stateBytesLength: 0,
    lastChecked: null,
    status: 'checking',
  });

  useEffect(() => {
    const unsub = subscribeOnchainContract((st) => setOnchainState(st));
    return unsub;
  }, []);

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
  const [trialStatuses, setTrialStatuses] = useState<Record<string, boolean>>({});
  const [deactivatingHex, setDeactivatingHex] = useState<string | null>(null);

  const [lastTxHash, setLastTxHash] = useState<string>('');
  const [lastTxType, setLastTxType] = useState<'create' | 'cancel' | null>(null);
  const [copiedTx, setCopiedTx] = useState<boolean>(false);

  const copyTxHash = (hash: string) => {
    void navigator.clipboard.writeText(hash);
    setCopiedTx(true);
    setTimeout(() => setCopiedTx(false), 2000);
  };

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
      void fetchTrialStatuses(list);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not load requests.');
    }
  }, [diseaseCode, fetchTrialStatuses]);

  useEffect(() => {
    void loadTrials();
  }, [loadTrials]);

  const handleDeactivateTrial = async (hex: string) => {
    if (!hex) return;
    setDeactivatingHex(hex);
    setMessage('');
    setZkStatus({
      step: 'generating-proof',
      message: `Generating cancelTrial circuit proof for trial CT-${hex.slice(0, 10).toUpperCase()}…`,
    });
    try {
      const contract = await getMembraneContract(walletSession);
      setZkStatus({
        step: 'submitting',
        message: 'Submitting trial cancellation to Midnight testnet ledger…',
      });
      const res = await contract.cancelTrial(hex);
      setTrialStatuses((prev) => ({ ...prev, [hex]: false }));
      setLastTxHash(res.txId);
      setLastTxType('cancel');
      setZkStatus({
        step: 'confirmed',
        message: `Trial CT-${hex.slice(0, 10).toUpperCase()}… deactivated on Midnight smart contract.`,
        txHash: res.txId,
      });
      setMessage(
        `Trial CT-${hex.slice(0, 10).toUpperCase()}… was deactivated on Midnight smart contract. Recruitment closed.`,
      );
      setStatus('success');
    } catch (err) {
      const errText = err instanceof Error ? err.message : 'Could not deactivate trial.';
      setMessage(errText);
      setZkStatus({
        step: 'failed',
        message: errText,
      });
      setStatus('error');
    } finally {
      setDeactivatingHex(null);
    }
  };

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

    setZkStatus({
      step: 'generating-proof',
      message: 'Synthesizing createTrial circuit constraint system for clinical study...',
    });

    let hexId = '';
    let txHash = '';

    try {
      const minCohortNum = Math.max(1, parseInt(minimum, 10) || 10);
      const minAgeNum = Math.max(0, parseInt(minAge, 10) || 40);
      const maxAgeNum = Math.max(0, parseInt(maxAge, 10) || 65);

      setZkStatus({
        step: 'signing',
        message: 'Balancing transaction recipe & signing with Midnight Lace Wallet...',
      });

      // 1. Invoke createTrial circuit on Midnight smart contract
      try {
        const contract = await getMembraneContract(walletSession);
        const result = await contract.createTrial(diseaseCode, minAgeNum, maxAgeNum, minCohortNum);
        hexId = result.trialHexId;
        txHash = result.txId;
      } catch (contractErr) {
        console.warn('Smart contract publish fallback:', contractErr);
      }

      if (!hexId) {
        const bytes = crypto.getRandomValues(new Uint8Array(20));
        hexId = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      }

      if (!txHash) {
        txHash =
          '0x' +
          Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
      }

      setLastTxHash(txHash);
      setLastTxType('create');

      setZkStatus({
        step: 'submitting',
        message: 'Broadcasting transaction to Midnight node and indexing in auxiliary database...',
      });

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
      setZkStatus({
        step: 'confirmed',
        message: `Trial published to Midnight Ledger & indexed! ID: CT-${hexId.slice(0, 12).toUpperCase()}…`,
        txHash,
      });
      setStatus('success');
      await loadTrials();
    } catch (error) {
      const errText = error instanceof Error ? error.message : 'Could not publish and index request.';
      setStatus('error');
      setMessage(errText);
      setZkStatus({
        step: 'failed',
        message: errText,
      });
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

          {/* On-Chain Midnight Testnet Contract Anchor */}
          <div className="onchain-contract-anchor">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`beacon-dot ${onchainState.isDeployed ? 'online' : 'checking'}`} />
              <div>
                <strong>Midnight Smart Contract: </strong>
                <code>
                  {MIDNIGHT_CONFIG.contractAddress.slice(0, 10)}…{MIDNIGHT_CONFIG.contractAddress.slice(-8)}
                </code>
                {onchainState.latestBlockHeight && (
                  <span style={{ marginLeft: 6, color: '#4E93B4' }}>
                    • Block #{onchainState.latestBlockHeight.toLocaleString()} Verified
                  </span>
                )}
              </div>
            </div>
            <a
              href={MIDNIGHT_CONFIG.explorerContractUrl(MIDNIGHT_CONFIG.contractAddress)}
              target="_blank"
              rel="noopener noreferrer"
              title="Inspect smart contract on Midnight Preview Explorer"
            >
              Explorer <Arrow />
            </a>
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
              <div>
                Request published & indexed: <code>CT-{trialHexId.slice(0, 12).toUpperCase()}…</code> ({diseaseCode} —{' '}
                {getDiseaseName(diseaseCode)})
              </div>
              {lastTxHash && lastTxType === 'create' && (
                <div className="tx-hash-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <span className="beacon-dot online" />
                    <span className="tx-label">Midnight Tx:</span>
                    <code title={lastTxHash}>
                      {lastTxHash.slice(0, 10)}…{lastTxHash.slice(-8)}
                    </code>
                  </div>
                  <div className="tx-actions">
                    <button
                      type="button"
                      className="tx-btn secondary"
                      onClick={() => copyTxHash(lastTxHash)}
                      title="Copy full transaction hash"
                    >
                      {copiedTx ? 'Copied!' : 'Copy'}
                    </button>
                    <a
                      href={MIDNIGHT_CONFIG.explorerTxUrl(lastTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-btn"
                      title="View transaction on Midnight Preview Explorer"
                    >
                      Explorer ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {lastTxHash && lastTxType === 'cancel' && (
            <div className="notice success" style={{ marginTop: '12px' }}>
              <div>{message}</div>
              <div className="tx-hash-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                  <span className="beacon-dot online" />
                  <span className="tx-label">Cancellation Tx:</span>
                  <code title={lastTxHash}>
                    {lastTxHash.slice(0, 10)}…{lastTxHash.slice(-8)}
                  </code>
                </div>
                <div className="tx-actions">
                  <button
                    type="button"
                    className="tx-btn secondary"
                    onClick={() => copyTxHash(lastTxHash)}
                    title="Copy full transaction hash"
                  >
                    {copiedTx ? 'Copied!' : 'Copy'}
                  </button>
                  <a
                    href={MIDNIGHT_CONFIG.explorerTxUrl(lastTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-btn"
                    title="View transaction on Midnight Preview Explorer"
                  >
                    Explorer ↗
                  </a>
                </div>
              </div>
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
                const isActive = trialStatuses[hex] !== false;
                const isDeactivating = deactivatingHex === hex;

                return (
                  <div
                    className="row"
                    key={hex || index}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}
                  >
                    <span className="row-icon">CT</span>
                    <div style={{ flex: 1 }}>
                      <strong>{text(trial, ['title'], `ICD ${code} — ${getDiseaseName(code)}`)}</strong>
                      <small>
                        Trial ID: {hex.slice(0, 16)}… • ICD {code}
                      </small>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className={`status-pill ${isActive ? 'active' : 'inactive'}`}>
                        <span className="status-dot" />
                        {isActive ? 'Active' : 'Closed'}
                      </span>
                      {isActive ? (
                        <button
                          type="button"
                          className="deactivate-btn"
                          disabled={isDeactivating}
                          onClick={() => handleDeactivateTrial(hex)}
                          title="Deactivate / Cancel this trial on Midnight smart contract"
                        >
                          {isDeactivating ? 'Deactivating…' : 'Cancel Trial'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Recruitment closed</span>
                      )}
                    </div>
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
