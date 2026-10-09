/**
 * Midnight Local Proof Server Client & Health Monitor
 *
 * Each participating hospital runs an air-gapped local proof server
 * (typically via Docker: `docker run -p 6300:6300 midnightntwrk/proof-server:latest --network preview`)
 * to compute zero-knowledge witness proofs locally without leaking patient EHR data.
 */

import { MIDNIGHT_CONFIG } from './config';

export type ProofServerStatus = 'online' | 'offline' | 'checking';

export interface ProofServerState {
  status: ProofServerStatus;
  uri: string;
  isSimulated: boolean;
  lastChecked: number | null;
  latencyMs?: number;
  message?: string;
}

const DEFAULT_PROOF_SERVER_URI = MIDNIGHT_CONFIG.proofServerUri || 'http://localhost:6300';

let currentState: ProofServerState = {
  status: 'checking',
  uri: DEFAULT_PROOF_SERVER_URI,
  isSimulated: false,
  lastChecked: null,
};

const listeners = new Set<(state: ProofServerState) => void>();

function notify() {
  const snapshot = { ...currentState };
  listeners.forEach((fn) => fn(snapshot));
}

/**
 * Pings the local hospital proof server via HTTP.
 * If running, port 6300 answers within timeout.
 */
export async function checkProofServer(targetUri?: string): Promise<boolean> {
  const uri = targetUri || currentState.uri;
  currentState = {
    ...currentState,
    status: currentState.isSimulated ? 'online' : 'checking',
    uri,
  };
  notify();

  const start = performance.now();
  let online = false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);

    // Any HTTP response (including 200, 404, or 405) indicates that the proof server is actively listening
    const res = await fetch(`${uri}`, {
      method: 'GET',
      mode: 'no-cors', // Proof server might not send CORS headers to origin localhost:5173
      signal: controller.signal,
    });
    clearTimeout(timer);

    online = true;
    const latency = Math.round(performance.now() - start);

    currentState = {
      ...currentState,
      status: 'online',
      lastChecked: Date.now(),
      latencyMs: latency,
      message: `Active on ${uri} (${latency}ms)`,
    };
  } catch {
    // If simulated mode is enabled, consider active in simulated enclave
    if (currentState.isSimulated) {
      currentState = {
        ...currentState,
        status: 'online',
        lastChecked: Date.now(),
        message: 'Active (Simulated Browser Enclave)',
      };
      online = true;
    } else {
      currentState = {
        ...currentState,
        status: 'offline',
        lastChecked: Date.now(),
        message: `Offline (No listener on ${uri})`,
      };
      online = false;
    }
  }

  notify();
  return online;
}

export function getProofServerState(): ProofServerState {
  return { ...currentState };
}

export function subscribeProofServer(fn: (state: ProofServerState) => void): () => void {
  listeners.add(fn);
  fn({ ...currentState });
  return () => listeners.delete(fn);
}

export function setSimulatedProver(enabled: boolean): void {
  currentState = {
    ...currentState,
    isSimulated: enabled,
    status: enabled ? 'online' : currentState.status === 'online' && !currentState.latencyMs ? 'offline' : currentState.status,
    message: enabled ? 'Active (Simulated Browser Enclave)' : undefined,
  };
  notify();
}

export function setProofServerUri(newUri: string): void {
  currentState = {
    ...currentState,
    uri: newUri.trim() || DEFAULT_PROOF_SERVER_URI,
  };
  void checkProofServer();
}

/**
 * Starts periodic background polling for proof server liveness (every 15 seconds).
 */
export function initProofServerAutoDetection(intervalMs = 15000): () => void {
  void checkProofServer();
  const handle = setInterval(() => {
    void checkProofServer();
  }, intervalMs);

  return () => clearInterval(handle);
}
