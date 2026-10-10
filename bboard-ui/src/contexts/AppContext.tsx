import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  connectWallet as connectMidnightWallet,
  silentReconnectWallet,
  isWalletInstalled,
  type WalletSession,
} from '../midnight/wallet';
import { fetchDynamicHospitalCodes, type DynamicIcdOption } from '../config/icdRegistry';

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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Strict Web3 Security: In-Memory only, 0 data written to disk or localStorage
  const [walletSession, setWalletSession] = useState<WalletSession | null>(null);
  const [dynamicCodes, setDynamicCodes] = useState<DynamicIcdOption[]>([]);
  const [totalCohortCount, setTotalCohortCount] = useState<number>(200);
  const [loadingCodes, setLoadingCodes] = useState<boolean>(true);

  // Load dynamic clinical registry data & hospital statistics
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

  // Strict Web3 Security & Silent Extension Reconnect:
  // 1. Purge any legacy disk-stored session to guarantee 0 data on disk
  // 2. Perform silent extension reconnection via Midnight Lace if already authorized
  useEffect(() => {
    let mounted = true;

    // Purge any legacy disk data
    try {
      localStorage.removeItem('membrane_wallet_session');
    } catch {
      // ignore
    }

    const checkSilentReconnect = async () => {
      const session = await silentReconnectWallet();
      if (mounted && session) {
        setWalletSession(session);
      }
    };

    void checkSilentReconnect();

    // Browser extensions sometimes inject window.midnight 100-250ms after initial script execution
    const retryTimer = window.setTimeout(() => {
      if (mounted && !walletSession) {
        void checkSilentReconnect();
      }
    }, 250);

    return () => {
      mounted = false;
      window.clearTimeout(retryTimer);
    };
  }, []);

  // User-initiated wallet connect (modal/Lace prompt)
  const connectWallet = useCallback(async () => {
    try {
      const session = await connectMidnightWallet();
      // Keep strictly in React memory — zero disk persistence
      setWalletSession(session);
    } catch (err) {
      console.warn('Wallet connection note:', err);
    }
  }, []);

  // Instant in-memory purge upon disconnect
  const disconnectWallet = useCallback(() => {
    setWalletSession(null);
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
