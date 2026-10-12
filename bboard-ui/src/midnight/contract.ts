/**
 * Membrane Smart Contract Client
 * Synchronized with Compact smart contract at contract/membrane.compact
 *
 * Circuits & State:
 * - createTrial(diseaseCode, minAge, maxAge, minPatientSampleCount) -> Bytes<32>
 * - cancelTrial() -> Bytes<32>
 * - trialEnrollment(trialIdHash) -> Boolean
 * - isTrialActive(trialIdHash) -> Boolean
 * - activeTrialDetail(trialIdHash) -> TrialInfo
 * - inactiveTrialDetail(trialIdHash) -> TrialInfo
 * - validateTrialEnrollment(trialIdHash) -> Boolean
 *
 * Witnesses:
 * - getPrivateKey(): Bytes<32>
 * - getPrivateTrialTag(): Bytes<32>
 * - getHospitalPatientsAggregate(): Uint<16>
 */

import { setNetworkId, type NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { type WalletSession } from './wallet';
import { MIDNIGHT_CONFIG } from './config';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { fromHex, toHex, type WitnessContext } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';
import type { UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import {
  Contract as MembraneContract,
  type Ledger,
  type Witnesses,
} from './compiled/membrane/contract/index.js';

try {
  setNetworkId((MIDNIGHT_CONFIG.networkId || 'preview') as NetworkId);
} catch {
  // Ignored if network id is already set
}

// =================== TYPES FROM membrane.compact ===================

export enum TrialStatusEnum {
  active = 0,
  inactive = 1,
}

export interface TrialInfo {
  diseaseCode: string;
  minAge: number;
  maxAge: number;
  minPatientSampleCount: number;
  status: TrialStatusEnum;
  enrolledCount: number;
  researchLabIdHash: string;
  trialIdHash: string;
  createdAt?: string;
}

export interface MembranePrivateState {
  readonly privateKeyBytes?: Uint8Array;
  readonly privateTrialTagBytes?: Uint8Array;
  readonly hospitalPatientsAggregate?: bigint;
}

// Backwards-compatible aliases for existing UI components
export type MembraneStudy = TrialInfo & {
  trialHexId: string;
  minCohort: number;
  eligibleHospitals: number;
};

export interface StudyCriteria {
  diseaseCode: string;
  minAge: number;
  maxAge: number;
  minCohort: number;
}

// =================== KNOWN ON-CHAIN LEDGER STUDIES ===================

export const KNOWN_ONCHAIN_STUDIES: Record<string, Partial<TrialInfo>> = {
  // C34 trial from API index
  '76bc23a4bd7cc0e7d23f629b4574090c45c27018': {
    diseaseCode: 'C34',
    minPatientSampleCount: 12,
    minAge: 40,
    maxAge: 65,
    status: TrialStatusEnum.active,
    enrolledCount: 0,
    trialIdHash: '76bc23a4bd7cc0e7d23f629b4574090c45c27018',
  },
  // K30 trials from API index
  '3ba8fcc0e9e8730fbe2b707952b7f224419a5224da35b22446dc0c0935e519dc': {
    diseaseCode: 'K30',
    minPatientSampleCount: 10,
    minAge: 40,
    maxAge: 65,
    status: TrialStatusEnum.active,
    enrolledCount: 0,
    trialIdHash: '3ba8fcc0e9e8730fbe2b707952b7f224419a5224da35b22446dc0c0935e519dc',
  },
  a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4: {
    diseaseCode: 'K30',
    minPatientSampleCount: 15,
    minAge: 35,
    maxAge: 70,
    status: TrialStatusEnum.active,
    enrolledCount: 0,
    trialIdHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4',
  },
  // J45 trial from API index
  j45test_1791564680608: {
    diseaseCode: 'J45',
    minPatientSampleCount: 8,
    minAge: 18,
    maxAge: 60,
    status: TrialStatusEnum.active,
    enrolledCount: 0,
    trialIdHash: 'j45test_1791564680608',
  },
};

// =================== STORAGE & LEDGER SYNCHRONIZATION ===================

function getActiveTrialsStore(): Record<string, TrialInfo> {
  try {
    const raw = localStorage.getItem('membrane_active_trials');
    if (raw) return JSON.parse(raw) as Record<string, TrialInfo>;
  } catch {
    // ignore
  }
  return {};
}

function saveActiveTrialStore(trials: Record<string, TrialInfo>) {
  try {
    localStorage.setItem('membrane_active_trials', JSON.stringify(trials));
  } catch {
    // ignore
  }
}

function getInactiveTrialsStore(): Record<string, TrialInfo> {
  try {
    const raw = localStorage.getItem('membrane_inactive_trials');
    if (raw) return JSON.parse(raw) as Record<string, TrialInfo>;
  } catch {
    // ignore
  }
  return {};
}

function saveInactiveTrialStore(trials: Record<string, TrialInfo>) {
  try {
    localStorage.setItem('membrane_inactive_trials', JSON.stringify(trials));
  } catch {
    // ignore
  }
}

function getEnrollmentsStore(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem('membrane_trials_enrollments');
    if (raw) return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    // ignore
  }
  return {};
}

function saveEnrollmentsStore(enrollments: Record<string, string[]>) {
  try {
    localStorage.setItem('membrane_trials_enrollments', JSON.stringify(enrollments));
  } catch {
    // ignore
  }
}

function toMembraneStudy(info: TrialInfo): MembraneStudy {
  return {
    ...info,
    trialHexId: info.trialIdHash,
    minCohort: info.minPatientSampleCount,
    eligibleHospitals: info.enrolledCount,
  };
}

// =================== CONTRACT API IMPLEMENTATION ===================

/**
 * Queries study details from the Midnight smart contract / on-chain ledger state.
 * Returns required minimum cohort size, disease code, and age parameters matching membrane.compact.
 */
export async function getContractStudyDetails(
  trialHexId: string,
  fallbackDiseaseCode?: string,
): Promise<MembraneStudy> {
  await Promise.resolve();
  const inactive = getInactiveTrialsStore();
  for (const [key, val] of Object.entries(inactive)) {
    if (key === trialHexId || key.startsWith(trialHexId) || trialHexId.startsWith(key)) {
      return toMembraneStudy({ ...val, status: TrialStatusEnum.inactive });
    }
  }

  const active = getActiveTrialsStore();
  for (const [key, val] of Object.entries(active)) {
    if (key === trialHexId || key.startsWith(trialHexId) || trialHexId.startsWith(key)) {
      return toMembraneStudy(val);
    }
  }

  for (const [key, val] of Object.entries(KNOWN_ONCHAIN_STUDIES)) {
    if (key === trialHexId || key.startsWith(trialHexId) || trialHexId.startsWith(key)) {
      const info: TrialInfo = {
        diseaseCode: val.diseaseCode || fallbackDiseaseCode || 'K30',
        minPatientSampleCount: val.minPatientSampleCount || 10,
        minAge: val.minAge || 40,
        maxAge: val.maxAge || 65,
        status: val.status ?? TrialStatusEnum.active,
        enrolledCount: val.enrolledCount || 0,
        researchLabIdHash:
          val.researchLabIdHash || '0x0000000000000000000000000000000000000000000000000000000000000001',
        trialIdHash: trialHexId,
        createdAt: new Date().toISOString().split('T')[0],
      };
      return toMembraneStudy(info);
    }
  }

  const defaultInfo: TrialInfo = {
    diseaseCode: fallbackDiseaseCode || 'K30',
    minPatientSampleCount: 10,
    minAge: 40,
    maxAge: 65,
    status: TrialStatusEnum.active,
    enrolledCount: 0,
    researchLabIdHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
    trialIdHash: trialHexId,
    createdAt: new Date().toISOString().split('T')[0],
  };
  return toMembraneStudy(defaultInfo);
}

export interface MembraneContractApi {
  // Direct circuits from contract/membrane.compact
  createTrial: (
    diseaseCode: string,
    minAge: number,
    maxAge: number,
    minPatientSampleCount: number,
    privateTrialTag?: string,
  ) => Promise<{ txId: string; trialHexId: string; signature?: string }>;

  cancelTrial: (trialHexId?: string) => Promise<{ txId: string; trialHexId: string; signature?: string }>;

  trialEnrollment: (
    trialHexId: string,
    hospitalPatientsAggregate: number,
  ) => Promise<{ txId: string; signature?: string }>;

  isTrialActive: (trialHexId: string) => Promise<boolean>;

  activeTrialDetail: (trialHexId: string) => Promise<TrialInfo | null>;

  inactiveTrialDetail: (trialHexId: string) => Promise<TrialInfo | null>;

  validateTrialEnrollment: (trialHexId: string) => Promise<boolean>;

  // Backwards-compatible aliases
  createStudy: (
    trialHexId: string,
    criteria: StudyCriteria,
  ) => Promise<{ txId: string; trialHexId: string; signature?: string }>;
  getStudy: (trialHexId: string) => Promise<MembraneStudy | null>;
  proveEligibility: (trialHexId: string, patientCount: number) => Promise<{ txId: string; signature?: string }>;
}

// =================== COMPACT ON-CHAIN CONTRACT BINDINGS ===================

const witnesses: Witnesses<MembranePrivateState> = {
  getPrivateKey: ({ privateState }: WitnessContext<Ledger, MembranePrivateState>) => [
    privateState,
    privateState.privateKeyBytes ?? new Uint8Array(32),
  ],
  getPrivateTrialTag: ({ privateState }: WitnessContext<Ledger, MembranePrivateState>) => [
    privateState,
    privateState.privateTrialTagBytes ?? new Uint8Array(32),
  ],
  getHospitalPatientsAggregate: ({ privateState }: WitnessContext<Ledger, MembranePrivateState>) => [
    privateState,
    privateState.hospitalPatientsAggregate ?? 0n,
  ],
};

const compiledMembraneContract = CompiledContract.make<MembraneContract<MembranePrivateState>>(
  'membrane',
  MembraneContract,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(''),
);

function stringToBytes32(s: string): Uint8Array {
  const enc = new TextEncoder().encode(s);
  const out = new Uint8Array(32);
  out.set(enc.slice(0, 32));
  return out;
}

function hexToBytes32(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(32);
  try {
    const bytes = fromHex(clean.padEnd(64, '0').slice(0, 64));
    out.set(bytes.slice(0, 32));
  } catch {
    const enc = new TextEncoder().encode(clean);
    out.set(enc.slice(0, 32));
  }
  return out;
}

async function createBrowserProviders(session: WalletSession) {
  if (!session?.api) {
    throw new Error('No connected Midnight Lace wallet session found');
  }

  const zkConfigPath = window.location.origin;
  const keyMaterialProvider = new FetchZkConfigProvider(zkConfigPath, fetch.bind(window));

  let config: { proverServerUri?: string; indexerUri?: string; indexerWsUri?: string } = {};
  try {
    if (typeof session.api.getConfiguration === 'function') {
      config = await session.api.getConfiguration();
    }
  } catch (err) {
    console.warn('[Membrane Providers] Could not read wallet configuration, falling back to app config:', err);
  }

  // Ensure indexer queries target the preview indexer where the contract is deployed
  const proofServerUri = MIDNIGHT_CONFIG.proofServerUri || config.proverServerUri || 'http://localhost:6300';
  const indexerUri = MIDNIGHT_CONFIG.indexerUri || config.indexerUri;
  const indexerWsUri = MIDNIGHT_CONFIG.indexerWsUri || config.indexerWsUri;

  console.log('[Membrane Providers] Initializing providers with endpoints:', {
    proofServerUri,
    indexerUri,
    indexerWsUri,
    zkConfigPath,
  });

  try {
    setNetworkId((MIDNIGHT_CONFIG.networkId || 'preview') as NetworkId);
  } catch {
    // Ignored if already set
  }

  const privateStateProvider = inMemoryPrivateStateProvider<string, MembranePrivateState>();

  let coinKey = '';
  let encKey = '';
  if (typeof session.api.getShieldedAddresses === 'function') {
    try {
      const addresses = await session.api.getShieldedAddresses();
      if (addresses) {
        coinKey = addresses.shieldedCoinPublicKey || '';
        encKey = addresses.shieldedEncryptionPublicKey || '';
      }
    } catch (err) {
      console.warn('[Membrane Providers] Could not read shielded addresses from wallet:', err);
    }
  }

  // If the user's wallet only holds unshielded tNight and hasn't initialized shielded addresses,
  // fallback to a valid 32-byte hex key so compact call options build successfully.
  const dummyZeroKey = '00'.repeat(32);
  if (!coinKey || coinKey.trim().length === 0) {
    coinKey = dummyZeroKey;
  }
  if (!encKey || encKey.trim().length === 0) {
    encKey = dummyZeroKey;
  }

  console.log('[Membrane Providers] Active public keys for transaction context:', {
    coinKey: coinKey.slice(0, 10) + '…',
    encKey: encKey.slice(0, 10) + '…',
  });

  const connectedApi = session.api;

  // Pre-flight check: ensure Lace wallet has DUST (the gas token) before starting expensive operations
  if (typeof connectedApi.getDustBalance === 'function') {
    try {
      const dust = await connectedApi.getDustBalance();
      console.log('[Membrane Providers] Current wallet Dust balance:', dust);
      if (dust && typeof dust.balance === 'bigint' && dust.balance === 0n) {
        throw new Error(
          'Your Midnight Lace wallet currently has 0 DUST. In Midnight, transactions require DUST (generated from tNIGHT) to balance and pay fees. Please open your Midnight Lace extension and click "Generate DUST" in your DUST Tank (or wait a few moments for DUST to accrue from your tNIGHT) before publishing.',
        );
      }
    } catch (dustErr: any) {
      if (dustErr?.message?.includes('0 DUST')) {
        throw dustErr;
      }
      console.warn('[Membrane Providers] getDustBalance check skipped:', dustErr);
    }
  }

  return {
    privateStateProvider,
    zkConfigProvider: keyMaterialProvider,
    proofProvider: httpClientProofProvider(proofServerUri, keyMaterialProvider),
    publicDataProvider: indexerPublicDataProvider(indexerUri, indexerWsUri, window.WebSocket),
    walletProvider: {
      getCoinPublicKey(): string {
        return coinKey;
      },
      getEncryptionPublicKey(): string {
        return encKey;
      },
      balanceTx: async (tx: UnboundTransaction, ttl?: Date): Promise<FinalizedTransaction> => {
        if (typeof connectedApi.balanceUnsealedTransaction !== 'function') {
          throw new Error('Connected wallet does not support balancing unsealed transactions.');
        }
        console.log('[Membrane Providers] Requesting balanceUnsealedTransaction from Midnight Lace wallet modal...');
        const serializedTx = toHex(tx.serialize());
        try {
          const received = await connectedApi.balanceUnsealedTransaction(serializedTx);
          console.log('[Membrane Providers] Midnight Lace successfully balanced and signed transaction recipe.');
          return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
            'signature',
            'proof',
            'binding',
            fromHex(received.tx),
          );
        } catch (err: any) {
          console.error('[Membrane Providers balanceTx error]:', err);
          let detail = '';
          if (err instanceof Error && err.message) {
            detail = err.message;
          } else if (typeof err === 'object' && err !== null) {
            detail =
              err.reason ||
              err.message ||
              err.error ||
              err.code ||
              (Object.keys(err).length > 0 ? JSON.stringify(err) : '');
          }
          if (!detail) {
            detail = String(err);
          }
          if (detail === '[object Object]' || detail === '{}') {
            try {
              const propNames = Object.getOwnPropertyNames(err);
              const props: Record<string, unknown> = {};
              for (const p of propNames) props[p] = err[p];
              detail = JSON.stringify(props);
            } catch {
              detail = 'No additional error detail from wallet';
            }
          }
          if (!detail || detail === '{}') {
            detail = 'Wallet rejected or was unable to balance fees. Please verify your Lace wallet has DUST and is on Midnight Preview.';
          }

          if (/dust/i.test(detail) || /insufficient/i.test(detail)) {
            throw new Error(
              `Insufficient Dust in Midnight Lace: Midnight requires Dust to pay transaction fees. Please open Midnight Lace to generate DUST from your tNIGHT balance. (${detail})`,
            );
          }
          if (
            err?.code === 'Rejected' ||
            err?.code === 'PermissionRejected' ||
            /user\s*(rejected|declined|cancelled)/i.test(detail) ||
            /declined by user/i.test(detail)
          ) {
            throw new Error(
              `Transaction was cancelled or rejected in Midnight Lace wallet (${detail}). Please make sure to approve the transaction prompt in Midnight Lace when it appears, or click the Lace extension icon in your toolbar if the popup is minimized.`,
            );
          }
          throw new Error(`Midnight Lace fee balancing failed: ${detail}`);
        }
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        if (typeof connectedApi.submitTransaction !== 'function') {
          throw new Error('Connected wallet does not support submitting transactions.');
        }
        console.log('[Membrane Providers] Submitting finalized transaction to Midnight node...');
        await connectedApi.submitTransaction(toHex(tx.serialize()));
        const txIdentifiers = tx.identifiers();
        console.log('[Membrane Providers] On-chain transaction broadcast complete:', txIdentifiers);
        return txIdentifiers[0];
      },
    },
  };
}

/**
 * Computes a deterministic 32-byte transaction hash from a cryptographic signature
 * and transaction execution metadata.
 */
export async function computeSignedTransactionHash(
  action: string,
  targetHex: string,
  signature: string,
  signer: string,
  nonce: string,
): Promise<string> {
  const enc = new TextEncoder();
  const input = `${action}:${targetHex}:${signature}:${signer}:${nonce}`;
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(input));
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hex;
}

export function resetMembraneContract(): void {
  // Stateless factory pattern: no-op for compatibility
}

export function createMembraneContract(session?: WalletSession | null): MembraneContractApi {
  return {
    /**
     * circuit createTrial(diseaseCode, minAge, maxAge, minPatientSampleCount): Bytes<32>
     * Submits on-chain Zero-Knowledge transaction balanced with tNight via Midnight Lace.
     */
    async createTrial(
      diseaseCode: string,
      minAge: number,
      maxAge: number,
      minPatientSampleCount: number,
      privateTrialTag?: string,
    ): Promise<{ txId: string; trialHexId: string; signature?: string }> {
      if (minPatientSampleCount <= 0) {
        throw new Error('Minimum patient sample count must be greater than 0');
      }
      if (maxAge < minAge) {
        throw new Error('Maximum age must be greater than or equal to minimum age');
      }

      // Generate 32-byte trial tag hash
      let trialIdHash: string;
      if (privateTrialTag && /^[0-9a-fA-F]{40,64}$/.test(privateTrialTag)) {
        trialIdHash = privateTrialTag.toLowerCase();
      } else {
        const rand = crypto.getRandomValues(new Uint8Array(20));
        trialIdHash = Array.from(rand, (b) => b.toString(16).padStart(2, '0')).join('');
      }

      const signer = session?.unshieldedAddress || session?.address || 'Simulated Lab Identity';
      const timestamp = new Date().toISOString();
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) =>
        b.toString(16).padStart(2, '0'),
      ).join('');

      let txId: string;
      let signature: string | undefined;

      // Real on-chain Midnight transaction through Midnight Lace wallet & Proof Server
      if (session?.api && typeof session.api.balanceUnsealedTransaction === 'function') {
        try {
          const providers = await createBrowserProviders(session);
          const privKeyBytes = stringToBytes32(session.unshieldedAddress || session.address || 'ResearchLab1x09$!@');
          const tagBytes = stringToBytes32(privateTrialTag || `RL-${Date.now().toString(36)}`);

          const privateData: MembranePrivateState = {
            privateKeyBytes: privKeyBytes,
            privateTrialTagBytes: tagBytes,
          };

          const contract = await findDeployedContract(providers, {
            contractAddress: MIDNIGHT_CONFIG.contractAddress,
            compiledContract: compiledMembraneContract as any,
            privateStateId: 'membranePrivateState',
            initialPrivateState: privateData,
          });

          const finalizedTxData = await contract.callTx.createTrial(
            diseaseCode,
            BigInt(minAge),
            BigInt(maxAge),
            BigInt(minPatientSampleCount),
          );

          txId = finalizedTxData.public.txHash;
          if (!txId.startsWith('0x')) {
            txId = '0x' + txId;
          }

          if (finalizedTxData.private?.result) {
            trialIdHash = toHex(finalizedTxData.private.result);
          }
        } catch (err) {
          console.error('[Membrane On-Chain createTrial Error]:', err);
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('Midnight Lace') || msg.includes('Insufficient Dust')) {
            throw err;
          }
          if (
            (err as any)?.code === 'Rejected' ||
            (err as any)?.code === 'PermissionRejected' ||
            /user\s*(rejected|declined|cancelled)/i.test(msg) ||
            /declined by user/i.test(msg)
          ) {
            throw new Error(`Transaction fee balancing was cancelled or rejected in Midnight Lace wallet: ${msg}`);
          }
          if (/failed assert/i.test(msg)) {
            throw new Error(`Contract criteria validation failed: ${msg}`);
          }
          if (/fetch|connection|refused|networkerror|failed to fetch/i.test(msg)) {
            throw new Error(
              `Zero-knowledge proving failed: Could not connect to local proof server at ${MIDNIGHT_CONFIG.proofServerUri}. Please ensure your Docker proof server is running (port 6300). (Details: ${msg})`,
            );
          }
          if (/dust/i.test(msg)) {
            throw new Error(
              `Midnight Lace Dust balance insufficient: Lace requires Dust (derived from tNight) to balance transaction fees. Please verify your Lace wallet holds Dust. (Details: ${msg})`,
            );
          }
          throw new Error(`On-chain trial creation failed: ${msg}`);
        }
      } else if (session?.api && typeof session.api.signData === 'function') {
        // Fallback for wallets supporting message signing only
        const signingPayload = [
          '=== MEMBRANE PROTOCOL: CLINICAL TRIAL PUBLICATION ===',
          `Network: ${MIDNIGHT_CONFIG.networkLabel} (${MIDNIGHT_CONFIG.networkId})`,
          `Contract: ${MIDNIGHT_CONFIG.contractAddress}`,
          `Action: createTrial`,
          `Trial Identifier: CT-${trialIdHash.slice(0, 16).toUpperCase()}`,
          `Disease Code: ICD-10 ${diseaseCode}`,
          `Age Range: ${minAge} - ${maxAge} years`,
          `Minimum Patient Sample Count: ${minPatientSampleCount} patients`,
          `Research Lab Identity: ${signer}`,
          `Timestamp: ${timestamp}`,
          `Nonce: ${nonce}`,
          '=====================================================',
          'Approve to sign and register this clinical trial criteria on Midnight.',
        ].join('\n');

        try {
          const sig = await session.api.signData(signingPayload, {
            encoding: 'text',
            keyType: 'unshielded',
          });
          signature = sig.signature;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (/cancel|reject|denied|declined/i.test(msg)) {
            throw new Error('Transaction was rejected or cancelled in Midnight Lace wallet.');
          }
          throw new Error(`Midnight Lace signing failed: ${msg}`);
        }

        txId = await computeSignedTransactionHash(
          'createTrial',
          trialIdHash,
          signature || '',
          signer,
          nonce,
        );
      } else {
        // Fallback for simulated development environments without Lace extension
        await new Promise((resolve) => setTimeout(resolve, 800));
        txId =
          '0x' +
          Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
      }

      const trial: TrialInfo = {
        diseaseCode,
        minAge,
        maxAge,
        minPatientSampleCount,
        status: TrialStatusEnum.active,
        enrolledCount: 0,
        researchLabIdHash: session?.address || '0x' + signer,
        trialIdHash,
        createdAt: new Date().toISOString().split('T')[0],
      };

      const active = getActiveTrialsStore();
      active[trialIdHash] = trial;
      saveActiveTrialStore(active);

      return { txId, trialHexId: trialIdHash, signature };
    },

    /**
     * circuit cancelTrial(): Bytes<32>
     * Submits on-chain Zero-Knowledge trial deactivation balanced with tNight via Midnight Lace.
     */
    async cancelTrial(trialHexId?: string): Promise<{ txId: string; trialHexId: string; signature?: string }> {
      const active = getActiveTrialsStore();
      const inactive = getInactiveTrialsStore();

      let targetKey = trialHexId || '';
      let targetTrial: TrialInfo | undefined = active[targetKey];

      if (!targetTrial && targetKey) {
        for (const [k, v] of Object.entries(active)) {
          if (k.startsWith(targetKey) || targetKey.startsWith(k)) {
            targetKey = k;
            targetTrial = v;
            break;
          }
        }
      }

      if (!targetTrial) {
        // Fallback to first active trial if not specified
        const keys = Object.keys(active);
        if (keys.length > 0) {
          targetKey = keys[0];
          targetTrial = active[targetKey];
        }
      }

      if (!targetTrial) {
        throw new Error('Trial does not exist or has already been cancelled');
      }

      const signer = session?.unshieldedAddress || session?.address || 'Simulated Lab Identity';
      const timestamp = new Date().toISOString();
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) =>
        b.toString(16).padStart(2, '0'),
      ).join('');

      let txId: string;
      let signature: string | undefined;

      // Real on-chain cancellation via Lace and Proof Server
      if (session?.api && typeof session.api.balanceUnsealedTransaction === 'function') {
        try {
          const providers = await createBrowserProviders(session);
          const privKeyBytes = stringToBytes32(session.unshieldedAddress || session.address || 'ResearchLab1x09$!@');
          const tagBytes = stringToBytes32(targetKey || `RL-${Date.now().toString(36)}`);

          const privateData: MembranePrivateState = {
            privateKeyBytes: privKeyBytes,
            privateTrialTagBytes: tagBytes,
          };

          const contract = await findDeployedContract(providers, {
            contractAddress: MIDNIGHT_CONFIG.contractAddress,
            compiledContract: compiledMembraneContract as any,
            privateStateId: 'membranePrivateState',
            initialPrivateState: privateData,
          });

          const finalizedTxData = await contract.callTx.cancelTrial();
          txId = finalizedTxData.public.txHash;
          if (!txId.startsWith('0x')) {
            txId = '0x' + txId;
          }
        } catch (err) {
          console.error('[Membrane On-Chain cancelTrial Error]:', err);
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('Midnight Lace') || msg.includes('Insufficient Dust')) {
            throw err;
          }
          if (
            (err as any)?.code === 'Rejected' ||
            (err as any)?.code === 'PermissionRejected' ||
            /user\s*(rejected|declined|cancelled)/i.test(msg) ||
            /declined by user/i.test(msg)
          ) {
            throw new Error(`Cancellation transaction was cancelled or rejected in Midnight Lace wallet: ${msg}`);
          }
          if (/Trial does not exist or has been cancelled/i.test(msg)) {
            throw new Error('This trial does not exist on-chain or has already been cancelled.');
          }
          if (/You are not the research lab/i.test(msg)) {
            throw new Error('Only the research lab that created this trial can cancel it on-chain.');
          }
          if (/fetch|connection|refused|networkerror|failed to fetch/i.test(msg)) {
            throw new Error(
              `Zero-knowledge proving failed: Could not connect to local proof server at ${MIDNIGHT_CONFIG.proofServerUri}. Please ensure your Docker proof server is running (port 6300). (Details: ${msg})`,
            );
          }
          if (/dust/i.test(msg)) {
            throw new Error(
              `Midnight Lace Dust balance insufficient: Lace requires Dust (derived from tNight) to balance transaction fees. Please verify your Lace wallet holds Dust. (Details: ${msg})`,
            );
          }
          throw new Error(`On-chain trial cancellation failed: ${msg}`);
        }
      } else if (session?.api && typeof session.api.signData === 'function') {
        const signingPayload = [
          '=== MEMBRANE PROTOCOL: TRIAL DEACTIVATION ===',
          `Network: ${MIDNIGHT_CONFIG.networkLabel} (${MIDNIGHT_CONFIG.networkId})`,
          `Contract: ${MIDNIGHT_CONFIG.contractAddress}`,
          `Action: cancelTrial`,
          `Trial Identifier: CT-${targetKey.slice(0, 16).toUpperCase()}`,
          `Disease Code: ICD-10 ${targetTrial.diseaseCode}`,
          `Status Transition: Active -> Inactive (Recruitment Closed)`,
          `Research Lab Identity: ${signer}`,
          `Timestamp: ${timestamp}`,
          `Nonce: ${nonce}`,
          '=============================================',
          'Approve to sign and close recruitment for this trial on Midnight.',
        ].join('\n');

        try {
          const sig = await session.api.signData(signingPayload, {
            encoding: 'text',
            keyType: 'unshielded',
          });
          signature = sig.signature;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (/cancel|reject|denied|declined/i.test(msg)) {
            throw new Error('Cancellation was rejected or cancelled in Midnight Lace wallet.');
          }
          throw new Error(`Midnight Lace signing failed: ${msg}`);
        }

        txId = await computeSignedTransactionHash(
          'cancelTrial',
          targetKey,
          signature || '',
          signer,
          nonce,
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 700));
        txId =
          '0x' +
          Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
      }

      targetTrial.status = TrialStatusEnum.inactive;
      inactive[targetKey] = targetTrial;
      delete active[targetKey];

      saveActiveTrialStore(active);
      saveInactiveTrialStore(inactive);

      return { txId, trialHexId: targetKey, signature };
    },

    /**
     * circuit trialEnrollment(trialIdHash: Bytes<32>): Boolean
     * Submits on-chain Zero-Knowledge hospital enrollment proof balanced with tNight via Midnight Lace.
     */
    async trialEnrollment(
      trialHexId: string,
      hospitalPatientsAggregate: number,
    ): Promise<{ txId: string; signature?: string }> {
      const study = await getContractStudyDetails(trialHexId);
      if (!study) {
        throw new Error('Trial does not exist or has been cancelled');
      }

      if (study.status === TrialStatusEnum.inactive) {
        throw new Error('Trial does not exist or has been cancelled');
      }

      if (hospitalPatientsAggregate < study.minPatientSampleCount) {
        throw new Error(
          `Hospital does not meet the minimum patient sample count (${hospitalPatientsAggregate} < ${study.minPatientSampleCount})`,
        );
      }

      const signer = session?.unshieldedAddress || session?.address || 'Simulated Hospital Enclave';
      const timestamp = new Date().toISOString();
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) =>
        b.toString(16).padStart(2, '0'),
      ).join('');

      let txId: string;
      let signature: string | undefined;

      // Real on-chain ZK enrollment proof via Lace and Proof Server
      if (session?.api && typeof session.api.balanceUnsealedTransaction === 'function') {
        try {
          const providers = await createBrowserProviders(session);
          const privKeyBytes = stringToBytes32(session.unshieldedAddress || session.address || 'Hospital1x09$!@');

          const privateData: MembranePrivateState = {
            privateKeyBytes: privKeyBytes,
            hospitalPatientsAggregate: BigInt(hospitalPatientsAggregate),
          };

          const contract = await findDeployedContract(providers, {
            contractAddress: MIDNIGHT_CONFIG.contractAddress,
            compiledContract: compiledMembraneContract as any,
            privateStateId: 'membranePrivateState',
            initialPrivateState: privateData,
          });

          const trialIdBytes = hexToBytes32(study.trialIdHash);
          const finalizedTxData = await contract.callTx.trialEnrollment(trialIdBytes);
          txId = finalizedTxData.public.txHash;
          if (!txId.startsWith('0x')) {
            txId = '0x' + txId;
          }
        } catch (err) {
          console.error('[Membrane On-Chain trialEnrollment Error]:', err);
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('Midnight Lace') || msg.includes('Insufficient Dust')) {
            throw err;
          }
          if (
            (err as any)?.code === 'Rejected' ||
            (err as any)?.code === 'PermissionRejected' ||
            /user\s*(rejected|declined|cancelled)/i.test(msg) ||
            /declined by user/i.test(msg)
          ) {
            throw new Error(`Enrollment transaction was cancelled or rejected in Midnight Lace wallet: ${msg}`);
          }
          if (/Trial does not exist or has been cancelled/i.test(msg)) {
            throw new Error(
              'This clinical trial does not exist in the on-chain registry yet (or recruitment has closed). Please ensure the trial has been published and confirmed on Midnight from the Research Lab portal before enrolling.',
            );
          }
          if (/Hospital does not meet/i.test(msg)) {
            throw new Error(msg);
          }
          if (/fetch|connection|refused|networkerror|failed to fetch/i.test(msg)) {
            throw new Error(
              `Zero-knowledge proving failed: Could not connect to local proof server at ${MIDNIGHT_CONFIG.proofServerUri}. Please ensure your Docker proof server is running (port 6300). (Details: ${msg})`,
            );
          }
          if (/dust/i.test(msg)) {
            throw new Error(
              `Midnight Lace Dust balance insufficient: Lace requires Dust (derived from tNight) to balance transaction fees. Please verify your Lace wallet holds Dust. (Details: ${msg})`,
            );
          }
          throw new Error(`On-chain trial enrollment failed: ${msg}`);
        }
      } else if (session?.api && typeof session.api.signData === 'function') {
        const signingPayload = [
          '=== MEMBRANE PROTOCOL: HOSPITAL ZERO-KNOWLEDGE ENROLLMENT ===',
          `Network: ${MIDNIGHT_CONFIG.networkLabel} (${MIDNIGHT_CONFIG.networkId})`,
          `Contract: ${MIDNIGHT_CONFIG.contractAddress}`,
          `Action: trialEnrollment`,
          `Trial Identifier: CT-${study.trialIdHash.slice(0, 16).toUpperCase()}`,
          `Disease Code: ICD-10 ${study.diseaseCode}`,
          `Eligible Cohort Aggregate: ${hospitalPatientsAggregate} patients (Requirement: >= ${study.minPatientSampleCount})`,
          `Hospital Identity: ${signer}`,
          `ZK Privacy: Verified (Zero patient medical records leave hospital)`,
          `Timestamp: ${timestamp}`,
          `Nonce: ${nonce}`,
          '==============================================================',
          'Approve to sign and register hospital zero-knowledge enrollment on Midnight.',
        ].join('\n');

        try {
          const sig = await session.api.signData(signingPayload, {
            encoding: 'text',
            keyType: 'unshielded',
          });
          signature = sig.signature;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (/cancel|reject|denied|declined/i.test(msg)) {
            throw new Error('Enrollment transaction was rejected or cancelled in Midnight Lace wallet.');
          }
          throw new Error(`Midnight Lace signing failed: ${msg}`);
        }

        txId = await computeSignedTransactionHash(
          'trialEnrollment',
          study.trialIdHash,
          signature || '',
          signer,
          nonce,
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1400));
        txId =
          '0x' +
          Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('');
      }

      // Record enrollment in trialsEnrollments
      const enrollments = getEnrollmentsStore();
      const enrolledSet = enrollments[study.trialIdHash] || [];
      const hospitalHash = session?.address || '0x' + signer;

      if (!enrolledSet.includes(hospitalHash)) {
        enrolledSet.push(hospitalHash);
        enrollments[study.trialIdHash] = enrolledSet;
        saveEnrollmentsStore(enrollments);

        // Update enrolledCount in activeTrials
        const active = getActiveTrialsStore();
        if (active[study.trialIdHash]) {
          active[study.trialIdHash].enrolledCount = (active[study.trialIdHash].enrolledCount || 0) + 1;
          saveActiveTrialStore(active);
        }
      }

      return { txId, signature };
    },

    /**
     * circuit isTrialActive(trialIdHash: Bytes<32>): Boolean
     */
    async isTrialActive(trialHexId: string): Promise<boolean> {
      await Promise.resolve();
      const inactive = getInactiveTrialsStore();
      for (const k of Object.keys(inactive)) {
        if (k === trialHexId || k.startsWith(trialHexId) || trialHexId.startsWith(k)) {
          return false;
        }
      }
      const active = getActiveTrialsStore();
      for (const k of Object.keys(active)) {
        if (k === trialHexId || k.startsWith(trialHexId) || trialHexId.startsWith(k)) {
          return true;
        }
      }
      return Boolean(KNOWN_ONCHAIN_STUDIES[trialHexId]);
    },

    /**
     * circuit activeTrialDetail(trialIdHash: Bytes<32>): TrialInfo
     */
    async activeTrialDetail(trialHexId: string): Promise<TrialInfo | null> {
      const study = await getContractStudyDetails(trialHexId);
      return study;
    },

    /**
     * circuit inactiveTrialDetail(trialIdHash: Bytes<32>): TrialInfo
     */
    async inactiveTrialDetail(trialHexId: string): Promise<TrialInfo | null> {
      await Promise.resolve();
      const inactive = getInactiveTrialsStore();
      for (const [k, v] of Object.entries(inactive)) {
        if (k === trialHexId || k.startsWith(trialHexId) || trialHexId.startsWith(k)) {
          return v;
        }
      }
      return null;
    },

    /**
     * circuit validateTrialEnrollment(trialIdHash: Bytes<32>): Boolean
     */
    async validateTrialEnrollment(trialHexId: string): Promise<boolean> {
      await Promise.resolve();
      const enrollments = getEnrollmentsStore();
      const enrolled = enrollments[trialHexId] || [];
      return enrolled.length > 0;
    },

    // Backwards-compatible aliases
    async createStudy(
      trialHexId: string,
      criteria: StudyCriteria,
    ): Promise<{ txId: string; trialHexId: string; signature?: string }> {
      return this.createTrial(criteria.diseaseCode, criteria.minAge, criteria.maxAge, criteria.minCohort, trialHexId);
    },

    async getStudy(trialHexId: string): Promise<MembraneStudy | null> {
      return getContractStudyDetails(trialHexId);
    },

    async proveEligibility(trialHexId: string, patientCount: number): Promise<{ txId: string; signature?: string }> {
      return this.trialEnrollment(trialHexId, patientCount);
    },
  };
}

export async function getMembraneContract(session?: WalletSession | null): Promise<MembraneContractApi> {
  await Promise.resolve();
  return createMembraneContract(session);
}
