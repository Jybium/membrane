import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { DynamicIcdSelect } from '../components/DynamicIcdSelect';
import { TableSkeleton } from '../components/Skeleton';
import { useApp } from '../contexts/AppContext';
import { getDiseaseName } from '../config/icdRegistry';

const DEFAULT_API_BASE = 'https://membrane-api.onrender.com/v1';

interface PatientRecord {
  id?: string | number;
  patientId?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  diseaseCode?: string;
  createdAt?: string;
}

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

export const EhrVaultPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { dynamicCodes, totalCohortCount } = useApp();

  const urlIcd = searchParams.get('icd') || '';
  const urlQ = searchParams.get('q') || '';

  const [filterCode, setFilterCode] = useState<string>(urlIcd);
  const [searchQuery, setSearchQuery] = useState<string>(urlQ);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

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
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const clean = filterCode.trim().toUpperCase();
      const path =
        clean && clean !== 'ALL'
          ? `/demo-hosp-a-data/patients?icd=${encodeURIComponent(clean)}&limit=100`
          : `/demo-hosp-a-data/patients?limit=100`;
      const res = await apiRequest<{ data?: PatientRecord[] } | PatientRecord[]>(path);
      const list = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
      setPatients(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load hospital patient records.');
    } finally {
      setLoading(false);
    }
  }, [filterCode]);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  const handleFilterChange = (code: string) => {
    setFilterCode(code);
    updateUrlParams({ icd: code });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateUrlParams({ q: query });
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => {
      const pId = (p.patientId || `P-${p.id}` || '').toLowerCase();
      const fn = (p.firstName || '').toLowerCase();
      const ln = (p.lastName || '').toLowerCase();
      const icd = (p.diseaseCode || '').toLowerCase();
      const cond = getDiseaseName(p.diseaseCode || '').toLowerCase();
      return pId.includes(q) || fn.includes(q) || ln.includes(q) || icd.includes(q) || cond.includes(q);
    });
  }, [patients, searchQuery]);

  return (
    <div className="app">
      <AppHeader />

      <main>
        <div className="page-heading">
          <div>
            <p>Institutional EHR Perimeter</p>
            <h1>Consented Patient Records Vault</h1>
            <span>
              Demo Hospital A internal electronic health records. Air-gapped and strictly private.
            </span>
          </div>
          <span className="api-online">
            <i /> Custody Intact
          </span>
        </div>

        <section className="panel">
          <div className="panel-title">
            <div>
              <span>01</span>
              <div>
                <h2>Filter & search records</h2>
                <p>Filter by dynamic ICD diagnosis or search patient ID and name.</p>
              </div>
            </div>
            <b>Demo Hospital A</b>
          </div>

          <div className="fields" style={{ marginBottom: 14 }}>
            <DynamicIcdSelect
              label="Filter diagnosis"
              value={filterCode}
              onChange={handleFilterChange}
              allowAll={true}
              allLabel="All diagnoses"
              dynamicCodes={dynamicCodes}
              placeholder="All diagnoses"
              allowCustomInput={true}
            />

            <label>
              Search patient ID or name
              <input
                placeholder="Search patient ID or name..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </label>
          </div>

          <div className="criteria" style={{ marginBottom: 16 }}>
            <div>
              <span>Consented records</span>
              <strong>{filteredPatients.length} Patients</strong>
            </div>
            <div>
              <span>Active diagnoses</span>
              <strong>{dynamicCodes.length || 48} Conditions</strong>
            </div>
            <div>
              <span>Integrity</span>
              <strong style={{ color: '#4E93B4' }}>Air-gapped</strong>
            </div>
          </div>

          {loading ? (
            <div className="ehr-table-wrapper">
              <table className="ehr-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Diagnosis (ICD-10)</th>
                    <th>Condition Name</th>
                    <th>Enrolled</th>
                    <th>Consent</th>
                  </tr>
                </thead>
                <TableSkeleton rows={6} />
              </table>
            </div>
          ) : error ? (
            <div className="notice error">
              {error}
              <button type="button" onClick={fetchPatients}>Retry</button>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="empty">
              <strong>No matching patient records</strong>
              <span>No patients match the current diagnosis or search query.</span>
            </div>
          ) : (
            <div className="ehr-table-wrapper">
              <table className="ehr-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Diagnosis (ICD-10)</th>
                    <th>Condition Name</th>
                    <th>Enrolled</th>
                    <th>Consent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p, idx) => {
                    const idStr = p.patientId || `P-${p.id ?? idx}`;
                    const code = p.diseaseCode || filterCode || '—';
                    return (
                      <tr key={idStr || idx}>
                        <td>
                          <strong>{idStr}</strong>
                        </td>
                        <td>
                          {p.firstName || 'Anonymous'} {p.lastName || 'Patient'}
                        </td>
                        <td>{p.age ? `${p.age} yrs` : '—'}</td>
                        <td>
                          <span className="dynamic-select-badge">ICD {code}</span>
                        </td>
                        <td>{getDiseaseName(code)}</td>
                        <td>{p.createdAt ? p.createdAt.split('T')[0] : 'Enrolled'}</td>
                        <td>
                          <span className="ehr-tag">Consented</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
