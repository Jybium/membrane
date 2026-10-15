import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMembrane } from './MembraneContext';
import { type WalletSession } from '../midnight/wallet';
import { fetchDynamicHospitalCodes, type DynamicIcdOption } from '../config/icdRegistry';

interface AppContextValue {
  walletSession: WalletSession | null;
  connectWallet: () => Promise<WalletSession | null>;
  disconnectWallet: () => void;
  toggleWallet: () => Promise<void>;
  isWalletInstalled: boolean;
  dynamicCodes: DynamicIcdOption[];
  totalCohortCount: number;
  loadingCodes: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Delegate all wallet state to MembraneContext to maintain a single source of truth across all components
  const { walletSession, connectWallet, disconnectWallet, toggleWallet, isWalletInstalled } = useMembrane();

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

  const value: AppContextValue = {
    walletSession,
    connectWallet,
    disconnectWallet,
    toggleWallet,
    isWalletInstalled,
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
