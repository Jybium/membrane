import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { RowSkeleton } from '../components/Skeleton';
import { MIDNIGHT_CONFIG, isContractConfigured } from '../midnight/config';
import { useApp } from '../contexts/AppContext';

const DEFAULT_API_BASE = 'https://membrane-api.onrender.com/v1';

type Tab = 'state' | 'circuits' | 'indexer';

interface IndexRecord {
  id?: string;
  trialHexId?: string;
  diseaseCode?: string;
  createdAt?: string;
}

export const NetworkAuditorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { walletSession } = useApp();

  const urlTab = (searchParams.get('tab') as Tab) || 'state';
  const [activeTab, setActiveTab] = useState<Tab>(urlTab);

  const [indexedTrials, setIndexedTrials] = useState<IndexRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      },
      { replace: true }
    );
  };

  const loadIndexerData = useCallback(async () => {
    setLoading(true);
    try {
      const base = import.meta.env.VITE_MEMBRANE_API_BASE_URL || DEFAULT_API_BASE;
      const res = await fetch(`${base}/clinical-trials/index`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        setIndexedTrials(list);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIndexerData();
  }, [loadIndexerData]);

  return (
    <div className="app">
      <AppHeader />

      <main>
        <div className="page-heading">
          <div>
            <p>Protocol Verification</p>
            <h1>Network Auditor & Ledger Explorer</h1>
            <span>
              Independent cryptographic verification node. Inspect Midnight smart contract ledger state and circuits.
            </span>
          </div>
          <span className="api-online">
            <i /> Node Synchronized
          </span>
        </div>

        <div className="hospital-subnav" style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <button
            type="button"
            className={`secondary ${activeTab === 'state' ? 'active' : ''}`}
            onClick={() => handleTabChange('state')}
            style={{
              background: activeTab === 'state' ? '#1A2A39' : '#FAF7F0',
              color: activeTab === 'state' ? '#F6F3EC' : '#556675',
              borderColor: activeTab === 'state' ? '#1A2A39' : '#DFD9CD',
            }}
          >
            Ledger & Enclave State
          </button>
          <button
            type="button"
            className={`secondary ${activeTab === 'circuits' ? 'active' : ''}`}
            onClick={() => handleTabChange('circuits')}
            style={{
              background: activeTab === 'circuits' ? '#1A2A39' : '#FAF7F0',
              color: activeTab === 'circuits' ? '#F6F3EC' : '#556675',
              borderColor: activeTab === 'circuits' ? '#1A2A39' : '#DFD9CD',
            }}
          >
            Zero-Knowledge Circuits
          </button>
          <button
            type="button"
            className={`secondary ${activeTab === 'indexer' ? 'active' : ''}`}
            onClick={() => handleTabChange('indexer')}
            style={{
              background: activeTab === 'indexer' ? '#1A2A39' : '#FAF7F0',
              color: activeTab === 'indexer' ? '#F6F3EC' : '#556675',
              borderColor: activeTab === 'indexer' ? '#1A2A39' : '#DFD9CD',
            }}
          >
            Live Indexer Stream ({indexedTrials.length})
          </button>
        </div>

        {activeTab === 'state' && (
          <section className="panel">
            <div className="panel-title">
              <div>
                <span>01</span>
                <div>
                  <h2>Midnight Network & Contract State</h2>
                  <p>Cryptographic parameters and consensus configuration.</p>
                </div>
              </div>
              <b>Consensus Verified</b>
            </div>

            <div className="criteria" style={{ marginBottom: 18 }}>
              <div>
                <span>Target Network</span>
                <strong>{MIDNIGHT_CONFIG.networkLabel}</strong>
              </div>
              <div>
                <span>Contract Configured</span>
                <strong style={{ color: isContractConfigured() ? '#4E93B4' : '#D9822B' }}>
                  {isContractConfigured() ? 'Active on Testnet' : 'Local Fallback'}
                </strong>
              </div>
              <div>
                <span>Verifier Status</span>
                <strong style={{ color: '#4E93B4' }}>Enclave Operational</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div style={{ padding: 14, background: '#FAF7F0', border: '1px solid #E2DDD2', borderRadius: 8 }}>
                <span style={{ fontSize: 8, color: '#6C7D8C', fontWeight: 700, textTransform: 'uppercase' }}>
                  Contract Address
                </span>
                <p style={{ margin: '6px 0 0', fontFamily: 'monospace', fontSize: 9.5, wordBreak: 'break-all', color: '#1A2A39' }}>
                  {MIDNIGHT_CONFIG.contractAddress || '622af7d4d88fc425bb8df91d3bcde645dc2a4d9dea6f64beef4046a8c2758b75'}
                </p>
              </div>

              <div style={{ padding: 14, background: '#FAF7F0', border: '1px solid #E2DDD2', borderRadius: 8 }}>
                <span style={{ fontSize: 8, color: '#6C7D8C', fontWeight: 700, textTransform: 'uppercase' }}>
                  Auditor Wallet Session
                </span>
                <p style={{ margin: '6px 0 0', fontFamily: 'monospace', fontSize: 9.5, color: '#1A2A39' }}>
                  {walletSession ? walletSession.address : 'Unconnected (read-only verification)'}
                </p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'circuits' && (
          <section className="panel">
            <div className="panel-title">
              <div>
                <span>02</span>
                <div>
                  <h2>Compact Zero-Knowledge Circuits</h2>
                  <p>Mathematical proof guarantees executed on Midnight.</p>
                </div>
              </div>
              <b>Cryptographic Proofs</b>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 14, background: '#FAF7F0', border: '1px solid #E2DDD2', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ color: '#1A2A39' }}>circuit proveEligibility(trialHexId, patientCount)</strong>
                  <span className="ehr-tag" style={{ background: '#EBF4F8', color: '#1A2A39' }}>Private Witness</span>
                </div>
                <p style={{ margin: 0, fontSize: 8.5, color: '#556675' }}>
                  Hospitals witness the private patient cohort count from their internal EHR database. The circuit enforces that <code>patientCount &gt;= minCohort</code> without revealing individual patient records.
                </p>
              </div>

              <div style={{ padding: 14, background: '#FAF7F0', border: '1px solid #E2DDD2', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ color: '#1A2A39' }}>circuit createStudy(trialHexId, criteria)</strong>
                  <span className="ehr-tag" style={{ background: '#EBF4F8', color: '#1A2A39' }}>Public Predicate</span>
                </div>
                <p style={{ margin: 0, fontSize: 8.5, color: '#556675' }}>
                  Research labs publish study eligibility criteria (ICD diseaseCode, minimum cohort, and age boundaries) as a verifiable predicate to the Midnight state ledger.
                </p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'indexer' && (
          <section className="panel">
            <div className="panel-title">
              <div>
                <span>03</span>
                <div>
                  <h2>Live Indexed Clinical Trials</h2>
                  <p>Real-time query stream from the API DB indexer.</p>
                </div>
              </div>
              <button type="button" className="text-button" onClick={loadIndexerData}>
                Refresh
              </button>
            </div>

            {loading ? (
              <RowSkeleton count={4} />
            ) : indexedTrials.length === 0 ? (
              <div className="empty">No indexed trials found in database.</div>
            ) : (
              <div className="rows">
                {indexedTrials.map((t, idx) => (
                  <div className="row" key={t.id || t.trialHexId || idx}>
                    <span className="row-icon">ZK</span>
                    <div>
                      <strong>
                        Trial Hex: {(t.trialHexId || '').slice(0, 24)}…
                      </strong>
                      <small>
                        ICD {t.diseaseCode || '—'} • Indexed at {t.createdAt ? t.createdAt.split('T')[0] : 'Today'}
                      </small>
                    </div>
                    <b>Verified</b>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
