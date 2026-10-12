/**
 * Direct On-Chain Midnight Ledger Client
 * Queries the live Midnight Preview Indexer (GraphQL v4) for real-time contract
 * deployment state, block confirmations, actions, and ledger verification.
 */

import { MIDNIGHT_CONFIG } from './config';

export interface OnchainContractState {
  address: string;
  isDeployed: boolean;
  stateBytesLength: number;
  latestBlockHeight?: number;
  latestBlockTimestamp?: number;
  latestTxId?: number | string;
  lastChecked: number | null;
  status: 'online' | 'offline' | 'checking';
  error?: string;
}

const GET_CONTRACT_QUERY = `
query GetContract($address: String!) {
  contract(address: $address) {
    address
    state
    actions {
      address
      transaction {
        hash
        block {
          height
          timestamp
        }
      }
    }
  }
}
`;

let currentOnchainState: OnchainContractState = {
  address: MIDNIGHT_CONFIG.contractAddress,
  isDeployed: false,
  stateBytesLength: 0,
  lastChecked: null,
  status: 'checking',
};

const listeners = new Set<(state: OnchainContractState) => void>();

function notify() {
  const snapshot = { ...currentOnchainState };
  listeners.forEach((fn) => fn(snapshot));
}

/**
 * Queries the Midnight Testnet v4 Indexer directly via GraphQL.
 * Real-time, CORS-enabled, runs directly in any browser.
 */
export async function fetchOnchainContractState(): Promise<OnchainContractState> {
  currentOnchainState = {
    ...currentOnchainState,
    status: 'checking',
    error: undefined,
  };
  notify();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(MIDNIGHT_CONFIG.indexerUri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: GET_CONTRACT_QUERY,
        variables: { address: MIDNIGHT_CONFIG.contractAddress },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Indexer HTTP ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as {
      data?: {
        contract?: {
          address: string;
          state: string;
          actions?: Array<{
            address: string;
            transaction?: {
              hash: string;
              block?: {
                height: number;
                timestamp: number;
              };
            };
          }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message);
    }

    const contract = json.data?.contract;
    if (!contract) {
      currentOnchainState = {
        address: MIDNIGHT_CONFIG.contractAddress,
        isDeployed: false,
        stateBytesLength: 0,
        lastChecked: Date.now(),
        status: 'online',
        error: 'Contract not yet indexed on this network',
      };
    } else {
      const actions = contract.actions || [];
      const latestAction = actions[actions.length - 1];

      currentOnchainState = {
        address: contract.address,
        isDeployed: true,
        stateBytesLength: contract.state ? Math.floor(contract.state.length / 2) : 0,
        latestBlockHeight: latestAction?.transaction?.block?.height,
        latestBlockTimestamp: latestAction?.transaction?.block?.timestamp,
        latestTxId: latestAction?.transaction?.hash,
        lastChecked: Date.now(),
        status: 'online',
      };
    }
  } catch (err) {
    currentOnchainState = {
      ...currentOnchainState,
      status: 'offline',
      lastChecked: Date.now(),
      error: err instanceof Error ? err.message : 'Could not query Midnight indexer',
    };
  }

  notify();
  return { ...currentOnchainState };
}

export function getOnchainContractState(): OnchainContractState {
  return { ...currentOnchainState };
}

export function subscribeOnchainContract(fn: (state: OnchainContractState) => void): () => void {
  listeners.add(fn);
  fn({ ...currentOnchainState });
  return () => listeners.delete(fn);
}

/**
 * Auto-detect on-chain state on load and poll every 30 seconds
 */
export function initOnchainAutoSync(intervalMs = 30000): () => void {
  void fetchOnchainContractState();
  const handle = setInterval(() => {
    void fetchOnchainContractState();
  }, intervalMs);

  return () => clearInterval(handle);
}
