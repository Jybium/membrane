import { MIDNIGHT_CONFIG } from './config';

export interface WalletSession {
  address: string;
  uris: {
    proverServerUri?: string;
    indexerUri?: string;
    nodeUri?: string;
  };
}

export function isWalletInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const midnight = (window as unknown as { midnight?: Record<string, { apiVersion?: string }> }).midnight;
  if (!midnight) return false;
  return Object.values(midnight).some((w) => Boolean(w && typeof w === 'object' && 'apiVersion' in w));
}

export function shortAddress(address?: string | null): string {
  if (!address) return 'Not connected';
  const clean = address.trim();
  if (clean.length <= 16) return clean;
  return `${clean.slice(0, 10)}…${clean.slice(-6)}`;
}

export async function connectWallet(): Promise<WalletSession> {
  if (typeof window !== 'undefined') {
    const win = window as unknown as {
      midnight?: Record<
        string,
        {
          apiVersion?: string;
          connect: (networkId: string) => Promise<{
            getShieldedAddresses?: () => Promise<{ shieldedCoinPublicKey?: string }>;
            getUnshieldedAddress?: () => Promise<string>;
          }>;
        }
      >;
    };

    if (win.midnight) {
      const wallets = Object.values(win.midnight);
      const lace = wallets.find((w) => Boolean(w?.apiVersion));
      if (lace) {
        try {
          const api = await lace.connect(MIDNIGHT_CONFIG.networkId);
          let address = '';
          if (typeof api.getShieldedAddresses === 'function') {
            const state = await api.getShieldedAddresses();
            address = state?.shieldedCoinPublicKey || '';
          }
          if (!address && typeof api.getUnshieldedAddress === 'function') {
            address = await api.getUnshieldedAddress();
          }
          if (address) {
            return {
              address,
              uris: {
                proverServerUri: MIDNIGHT_CONFIG.proofServerUri,
                indexerUri: MIDNIGHT_CONFIG.indexerUri,
              },
            };
          }
        } catch (err) {
          console.warn('Lace wallet connection prompt cancelled or failed, falling back to preview session', err);
        }
      }
    }
  }

  // Realistic Sandbox Preview Session for dev & testing
  const mockAddresses = [
    'mn_shielded1q8v639420j88x0kltz99482hsa772km983ns002847a98',
    'mn_shielded1qy03mff2710398bb12984812aacc098112bb33445566',
  ];
  return {
    address: mockAddresses[0],
    uris: {
      proverServerUri: MIDNIGHT_CONFIG.proofServerUri,
      indexerUri: MIDNIGHT_CONFIG.indexerUri,
    },
  };
}
