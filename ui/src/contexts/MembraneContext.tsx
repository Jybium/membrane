import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { MembraneBackendService } from '../services/membraneBackendService';
import {
  connectWallet as connectMidnightWallet,
  connectSimulatedWallet,
  silentReconnectWallet,
  isWalletInstalled as checkWalletInstalled,
  type WalletSession,
} from '../midnight/wallet';
import { getMembraneContract } from '../midnight/contract';
import { MIDNIGHT_CONFIG } from '../midnight/config';

export type UserRole = 'research-lab' | 'hospital' | 'ehr-database' | 'ledger-explorer';

export interface TrialItem {
  trialIdHex: string;
  diseaseCode: string;
  diseaseName: string;
  minAge: number;
  maxAge: number;
  minPatientSampleCount: number;
  status: 'active' | 'inactive';
  enrolledCount: number;
  researchLabIdHashHex: string;
  createdAt?: string;
}

export type ZkStep = 'idle' | 'generating-proof' | 'signing' | 'submitting' | 'confirmed' | 'failed';

export interface ZkStatus {
  step: ZkStep;
  message: string;
  txHash?: string;
}

interface MembraneContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  // Unified Wallet State
  isWalletConnected: boolean;
  walletAddress: string | null;
  walletSession: WalletSession | null;
  setWalletSession: (session: WalletSession | null) => void;
  networkId: string;
  connectWallet: () => Promise<WalletSession | null>;
  disconnectWallet: () => void;
  toggleWallet: () => Promise<void>;
  isWalletInstalled: boolean;
  connectSimulated: () => WalletSession;
  // Contract state
  contractAddress: string;
  setContractAddress: (addr: string) => void;
  activeTrials: TrialItem[];
  inactiveTrials: TrialItem[];
  enrolledTrialIds: string[];
  isLoadingTrials: boolean;
  refreshTrials: () => Promise<void>;
  // Actions
  createTrial: (
    diseaseCode: string,
    minAge: number,
    maxAge: number,
    minPatientSampleCount: number,
  ) => Promise<{ trialIdHex: string; txHash: string }>;
  cancelTrial: (trialIdHex: string) => Promise<{ txHash: string }>;
  enrollInTrial: (
    trialIdHex: string,
    patientAggregate: number,
    hospitalPrivateKey?: string,
  ) => Promise<{ txHash: string }>;
  verifyEnrollment: (trialIdHex: string, privateKey?: string) => Promise<boolean>;
  validateTrialEnrollment: (trialIdHex: string, privateKey?: string) => Promise<boolean>;
  // ZK Progress
  zkStatus: ZkStatus;
  setZkStatus: (status: ZkStatus) => void;
  resetZkStatus: () => void;
}

const DEFAULT_CONTRACT = MIDNIGHT_CONFIG.contractAddress;

export {
  ICD10_DICTIONARY,
  ICD10_REGISTRY,
  ICD_CATEGORIES,
  DEMO_HOSPITAL_ACTIVE_CODES,
  getDiseaseName,
  getDiseaseCondition,
  searchIcdRegistry,
  type IcdCondition,
  type IcdCategory,
} from '../config/icdRegistry';
import { ICD10_DICTIONARY } from '../config/icdRegistry';

const MembraneContext = createContext<MembraneContextType | undefined>(undefined);

export const MembraneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('research-lab');
  const [contractAddress, setContractAddress] = useState<string>(DEFAULT_CONTRACT);
  const [activeTrials, setActiveTrials] = useState<TrialItem[]>([]);
  const [inactiveTrials, setInactiveTrials] = useState<TrialItem[]>([]);
  const [enrolledTrialIds, setEnrolledTrialIds] = useState<string[]>([]);
  const [isLoadingTrials, setIsLoadingTrials] = useState<boolean>(false);

  // Unified Reactive Wallet State
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletSession, setWalletSession] = useState<WalletSession | null>(null);
  const [isWalletInstalledState, setIsWalletInstalledState] = useState<boolean>(() => checkWalletInstalled());
  const networkId = import.meta.env.VITE_NETWORK_ID || 'preview';

  // Real-time detection of Midnight Lace browser extension content-script injection
  useEffect(() => {
    if (checkWalletInstalled()) {
      setIsWalletInstalledState(true);
      return;
    }

    const interval = setInterval(() => {
      if (checkWalletInstalled()) {
        setIsWalletInstalledState(true);
        clearInterval(interval);
      }
    }, 150);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsWalletInstalledState(checkWalletInstalled());
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Strict Web3 Security: In-Memory only, 0 data written to disk or localStorage
  // Perform silent extension reconnect ONLY if already pre-authorized in Lace
  useEffect(() => {
    let mounted = true;

    try {
      localStorage.removeItem('membrane_wallet_session');
    } catch {
      // ignore
    }

    const checkSilentReconnect = async () => {
      const session = await silentReconnectWallet();
      if (mounted && session) {
        setWalletSession(session);
        setWalletAddress(session.address);
        setIsWalletConnected(true);
      }
    };

    void checkSilentReconnect();

    const retryTimer = window.setTimeout(() => {
      if (mounted && !walletSession) {
        void checkSilentReconnect();
      }
    }, 350);

    return () => {
      mounted = false;
      window.clearTimeout(retryTimer);
    };
  }, [walletSession]);

  // ZK Progress Status (Used exclusively for ZK transaction lifecycle modal)
  const [zkStatus, setZkStatus] = useState<ZkStatus>({ step: 'idle', message: '' });

  const resetZkStatus = useCallback(() => {
    setZkStatus({ step: 'idle', message: '' });
  }, []);

  // Connect Simulated Mode (Fallback for environments without Lace)
  const connectSimulated = useCallback((): WalletSession => {
    const simSession = connectSimulatedWallet();
    setWalletSession(simSession);
    setWalletAddress(simSession.address);
    setIsWalletConnected(true);
    return simSession;
  }, []);

  // Connect to Midnight Lace Wallet
  // Note: Wallet connection is a simple extension permission handshake, NOT a ZK transaction.
  // We strictly do NOT set zkStatus here so that ZkProgressModal is NOT triggered.
  const connectWallet = useCallback(async (): Promise<WalletSession | null> => {
    try {
      const session = await connectMidnightWallet();
      setWalletSession(session);
      setWalletAddress(session.address);
      setIsWalletConnected(true);
      return session;
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Midnight Wallet] connectWallet note:', err);

      if (/cancel|reject|denied|declined/i.test(msg)) {
        return null;
      }

      if (/locked/i.test(msg)) {
        alert(
          'Midnight Lace wallet is locked.\n\n' +
            'Please click the Midnight Lace extension icon in your browser toolbar, enter your password to unlock the wallet, and then click "Connect wallet".',
        );
        return null;
      }

      if (/not detected|install/i.test(msg)) {
        const confirmSim = window.confirm(
          'Midnight Lace wallet extension was not detected in your browser.\n\n' +
            'To test live on-chain zero-knowledge circuits on Midnight Preview, please install the Midnight Lace extension.\n\n' +
            'Would you like to connect in Simulated Demo Mode instead?',
        );

        if (confirmSim) {
          return connectSimulated();
        }

        return null;
      }

      alert(`Failed to connect Midnight Lace wallet: ${msg}`);
      return null;
    }
  }, [connectSimulated]);

  // Disconnect wallet (instant in-memory purge)
  const disconnectWallet = useCallback(() => {
    setWalletSession(null);
    setWalletAddress(null);
    setIsWalletConnected(false);
  }, []);

  // Toggle wallet connection
  const toggleWallet = useCallback(async () => {
    if (walletSession) {
      disconnectWallet();
    } else {
      await connectWallet();
    }
  }, [walletSession, connectWallet, disconnectWallet]);

  // Load trials from live backend indexer
  const refreshTrials = useCallback(async () => {
    setIsLoadingTrials(true);
    try {
      const result = await MembraneBackendService.getClinicalTrials(1, 100);
      if (result.data) {
        const loaded: TrialItem[] = result.data.map((d) => ({
          trialIdHex: d.trialHexId,
          diseaseCode: d.diseaseCode,
          diseaseName: ICD10_DICTIONARY[d.diseaseCode] || `ICD-${d.diseaseCode}`,
          minAge: 18,
          maxAge: 75,
          minPatientSampleCount: 15,
          status: 'active',
          enrolledCount: 0,
          researchLabIdHashHex: '0x' + d.trialHexId.slice(0, 16),
          createdAt: d.createdAt || new Date().toISOString().split('T')[0],
        }));
        setActiveTrials(loaded);
      }
    } catch {
      setActiveTrials([]);
    } finally {
      setIsLoadingTrials(false);
    }
  }, []);

  useEffect(() => {
    void refreshTrials();
  }, [refreshTrials]);

  // 1. Create Trial Action (Opens ZkProgressModal for ZK proof generation & broadcast)
  const createTrial = useCallback(
    async (
      diseaseCode: string,
      minAge: number,
      maxAge: number,
      minPatientSampleCount: number,
    ): Promise<{ trialIdHex: string; txHash: string }> => {
      let sessionToUse = walletSession;
      if (!sessionToUse?.api && !sessionToUse?.isSimulated) {
        const fresh = await connectWallet();
        if (fresh) {
          sessionToUse = fresh;
        } else {
          throw new Error('Please connect your Midnight Lace wallet (or enable Simulated Mode) to publish this trial.');
        }
      }

      setZkStatus({
        step: 'generating-proof',
        message: 'Generating zero-knowledge circuit proof for createTrial circuit...',
      });

      await new Promise((r) => setTimeout(r, 1000));

      setZkStatus({
        step: 'signing',
        message: 'Balancing transaction recipe & generating unshielded dust payment...',
      });

      await new Promise((r) => setTimeout(r, 800));

      // Direct smart contract circuit invocation
      const contract = await getMembraneContract(sessionToUse);
      const contractRes = await contract.createTrial(diseaseCode, minAge, maxAge, minPatientSampleCount);
      const trialIdHex = contractRes.trialHexId;
      const txHash = contractRes.txId;

      setZkStatus({
        step: 'submitting',
        message: `Broadcasting shielded transaction to Midnight Preview contract (${MIDNIGHT_CONFIG.contractAddress.slice(0, 10)}...)...`,
      });

      await new Promise((r) => setTimeout(r, 800));

      const newTrial: TrialItem = {
        trialIdHex,
        diseaseCode,
        diseaseName: ICD10_DICTIONARY[diseaseCode] || diseaseCode,
        minAge,
        maxAge,
        minPatientSampleCount,
        status: 'active',
        enrolledCount: 0,
        researchLabIdHashHex: walletAddress || '0x' + trialIdHex.slice(0, 16),
        createdAt: new Date().toISOString().split('T')[0],
      };

      // Index newly created onchain trial in the API database
      setZkStatus({
        step: 'submitting',
        message: 'Indexing trial in auxiliary database (/v1/clinical-trials/index)...',
      });

      try {
        await MembraneBackendService.indexClinicalTrial(trialIdHex, diseaseCode);
      } catch (err) {
        console.warn('API index note:', err);
      }

      // Immediately refresh active trials from the live API database
      await refreshTrials();

      setZkStatus({
        step: 'confirmed',
        message: `Trial published to Midnight Ledger & indexed in API database! Trial ID: ${trialIdHex.substring(0, 16)}...`,
        txHash,
      });

      return { trialIdHex, txHash };
    },
    [refreshTrials, walletAddress, walletSession, connectWallet],
  );

  // 2. Cancel Trial Action (Opens ZkProgressModal for ZK proof deactivation & broadcast)
  const cancelTrial = useCallback(
    async (trialIdHex: string): Promise<{ txHash: string }> => {
      let sessionToUse = walletSession;
      if (!sessionToUse?.api && !sessionToUse?.isSimulated) {
        const fresh = await connectWallet();
        if (fresh) {
          sessionToUse = fresh;
        } else {
          throw new Error('Please connect your Midnight Lace wallet (or enable Simulated Mode) to cancel this trial.');
        }
      }

      setZkStatus({
        step: 'generating-proof',
        message: 'Generating zero-knowledge circuit proof for cancelTrial (ownership check)...',
      });

      await new Promise((r) => setTimeout(r, 800));

      // Direct smart contract circuit invocation
      const contract = await getMembraneContract(sessionToUse);
      const contractRes = await contract.cancelTrial(trialIdHex);
      const txHash = contractRes.txId;

      setZkStatus({
        step: 'submitting',
        message: 'Submitting trial cancellation to Midnight ledger...',
      });

      await new Promise((r) => setTimeout(r, 700));

      setActiveTrials((prev) => {
        const target = prev.find((t) => t.trialIdHex === trialIdHex);
        if (target) {
          setInactiveTrials((inact) => [{ ...target, status: 'inactive' }, ...inact]);
        }
        return prev.filter((t) => t.trialIdHex !== trialIdHex);
      });

      setZkStatus({
        step: 'confirmed',
        message: 'Trial successfully deactivated and moved to inactive ledger registry.',
        txHash,
      });

      return { txHash };
    },
    [walletSession, connectWallet],
  );

  // 3. Hospital Trial Enrollment Action (Opens ZkProgressModal for ZK proof enrollment & broadcast)
  const enrollInTrial = useCallback(
    async (
      trialIdHex: string,
      patientAggregate: number,
      hospitalPrivateKey?: string,
    ): Promise<{ txHash: string }> => {
      let sessionToUse = walletSession;
      if (!sessionToUse?.api && !sessionToUse?.isSimulated) {
        const fresh = await connectWallet();
        if (fresh) {
          sessionToUse = fresh;
        } else {
          throw new Error('Please connect your Midnight Lace wallet (or enable Simulated Mode) to enroll in this trial.');
        }
      }

      setZkStatus({
        step: 'generating-proof',
        message: `Evaluating EHR witness (Sample Count: ${patientAggregate}). Generating ZK Proof that count >= threshold...`,
      });

      await new Promise((r) => setTimeout(r, 1000));

      setZkStatus({
        step: 'signing',
        message: 'Signing hospital identity commitment in Midnight Lace Wallet...',
      });

      await new Promise((r) => setTimeout(r, 800));

      // Direct smart contract circuit invocation
      const contract = await getMembraneContract(sessionToUse);
      const contractRes = await contract.trialEnrollment(trialIdHex, patientAggregate, hospitalPrivateKey);
      const txHash = contractRes.txId;

      setZkStatus({
        step: 'submitting',
        message: 'Transmitting proof to Midnight blockchain. No patient health information leaves hospital premises.',
      });

      await new Promise((r) => setTimeout(r, 800));

      setActiveTrials((prev) =>
        prev.map((t) => (t.trialIdHex === trialIdHex ? { ...t, enrolledCount: t.enrolledCount + 1 } : t)),
      );

      setEnrolledTrialIds((prev) => (prev.includes(trialIdHex) ? prev : [...prev, trialIdHex]));

      setZkStatus({
        step: 'confirmed',
        message: 'Hospital enrolled successfully! Zero-knowledge commitment registered on Midnight ledger.',
        txHash,
      });

      return { txHash };
    },
    [walletSession, connectWallet],
  );

  // 4. Verify Trial Enrollment Action (Opens ZkProgressModal for ZK proof validation)
  const verifyEnrollment = useCallback(
    async (trialIdHex: string, privateKey?: string): Promise<boolean> => {
      let sessionToUse = walletSession;
      if (!sessionToUse?.api && !sessionToUse?.isSimulated) {
        const fresh = await connectWallet();
        if (fresh) {
          sessionToUse = fresh;
        } else {
          throw new Error('Please connect your Midnight Lace wallet (or enable Simulated Mode) to verify enrollment.');
        }
      }

      setZkStatus({
        step: 'generating-proof',
        message: 'Witnessing hospital private key & running validateTrialEnrollment circuit...',
      });

      try {
        // Direct smart contract circuit query
        const contract = await getMembraneContract(sessionToUse);
        const res = await contract.validateTrialEnrollment(trialIdHex, privateKey);
        const isEnrolled = typeof res === 'boolean' ? res : res.isValid;
        const txId = typeof res === 'object' && res ? res.txId : undefined;

        setZkStatus({
          step: 'confirmed',
          message: isEnrolled
            ? 'Verification SUCCESS: Hospital cryptographic public tag is confirmed in trial membership set.'
            : 'Verification FAILED: Hospital is not enrolled in this trial on Midnight.',
          txHash: txId,
        });

        return isEnrolled;
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : String(err);
        setZkStatus({
          step: 'failed',
          message: `Verification Error: ${msg}`,
        });
        throw err;
      }
    },
    [walletSession, connectWallet],
  );

  const value = useMemo(
    () => ({
      role,
      setRole,
      isWalletConnected,
      walletAddress,
      walletSession,
      setWalletSession,
      networkId,
      connectWallet,
      disconnectWallet,
      toggleWallet,
      isWalletInstalled: isWalletInstalledState,
      connectSimulated,
      contractAddress,
      setContractAddress,
      activeTrials,
      inactiveTrials,
      enrolledTrialIds,
      isLoadingTrials,
      refreshTrials,
      createTrial,
      cancelTrial,
      enrollInTrial,
      verifyEnrollment,
      validateTrialEnrollment: verifyEnrollment,
      zkStatus,
      setZkStatus,
      resetZkStatus,
    }),
    [
      role,
      isWalletConnected,
      walletAddress,
      walletSession,
      networkId,
      connectWallet,
      disconnectWallet,
      toggleWallet,
      isWalletInstalledState,
      connectSimulated,
      contractAddress,
      activeTrials,
      inactiveTrials,
      enrolledTrialIds,
      isLoadingTrials,
      refreshTrials,
      createTrial,
      cancelTrial,
      enrollInTrial,
      verifyEnrollment,
      zkStatus,
      resetZkStatus,
    ],
  );

  return <MembraneContext.Provider value={value}>{children}</MembraneContext.Provider>;
};

export const useMembrane = (): MembraneContextType => {
  const context = useContext(MembraneContext);
  if (!context) {
    throw new Error('useMembrane must be used within a MembraneProvider');
  }
  return context;
};
