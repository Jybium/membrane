import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  connectWallet as connectMidnightWallet,
  isWalletInstalled,
  type WalletSession,
} from '../midnight/wallet';
import {
  fetchDynamicHospitalCodes,
  type DynamicIcdOption,
} from '../config/icdRegistry';

interface AppContextValue {
  walletSession: WalletSession | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  toggleWallet: () => Promise<void>;
  isWalletInstalled: boolean;
  dynamicCodes: DynamicIcdOption[];
  totalCohortCount: number;
  loadingCodes: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const WALLET_STORAGE_KEY = 'membrane_wallet_session';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletSession, setWalletSession] = useState<WalletSession | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(WALLET_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as WalletSession;
      }
    } catch (e) {
      console.warn('Could not restore wallet session:', e);
    }
    return null;
  });
  const [dynamicCodes, setDynamicCodes] = useState<DynamicIcdOption[]>([]);
  const [totalCohortCount, setTotalCohortCount] = useState<number>(200);
  const [loadingCodes, setLoadingCodes] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    void fetchDynamicHospitalCodes()
      .then((codes) => {
        if (!mounted) return;
        setDynamicCodes(codes);
        const sum = codes.reduce((acc, c) => acc + (c.patientCount || 0), 0);
        setTotalCohortCount(sum || 200);
      })
      .finally(() => {
        if (mounted) setLoadingCodes(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      const session = await connectMidnightWallet();
      setWalletSession(session);
      try {
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(session));
      } catch (storageErr) {
        console.warn('Failed to persist wallet session:', storageErr);
      }
    } catch (err) {
      console.warn('Wallet connection note:', err);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletSession(null);
    try {
      localStorage.removeItem(WALLET_STORAGE_KEY);
    } catch (storageErr) {
      console.warn('Failed to clear stored wallet session:', storageErr);
    }
  }, []);

  const toggleWallet = useCallback(async () => {
    if (walletSession) {
      disconnectWallet();
    } else {
      await connectWallet();
    }
  }, [walletSession, connectWallet, disconnectWallet]);

  const value: AppContextValue = {
    walletSession,
    connectWallet,
    disconnectWallet,
    toggleWallet,
    isWalletInstalled: isWalletInstalled(),
    dynamicCodes,
    totalCohortCount,
    loadingCodes,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
