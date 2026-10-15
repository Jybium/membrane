import { MIDNIGHT_CONFIG } from './config';

export interface WalletSession {
  address: string;
  unshieldedAddress?: string;
  shieldedAddress?: string;
  uris: {
    proverServerUri?: string;
    indexerUri?: string;
    nodeUri?: string;
  };
  api?: any;
  isSimulated?: boolean;
}

export interface MidnightExtensionProvider {
  apiVersion?: string;
  name?: string;
  icon?: string;
  isEnabled?: () => Promise<boolean>;
  connect?: (networkId: string) => Promise<{
    getShieldedAddresses?: () => Promise<{
      shieldedAddress?: string;
      shieldedCoinPublicKey?: string;
      shieldedEncryptionPublicKey?: string;
    }>;
    getUnshieldedAddress?: () => Promise<string | { unshieldedAddress: string }>;
    signData?: (data: string, options: unknown) => Promise<{ data: string; signature: string; verifyingKey: string }>;
    balanceUnsealedTransaction?: (tx: string, options?: unknown) => Promise<{ tx: string }>;
    submitTransaction?: (tx: string) => Promise<void>;
  }>;
  enable?: () => Promise<{
    getShieldedAddresses?: () => Promise<{
      shieldedAddress?: string;
      shieldedCoinPublicKey?: string;
      shieldedEncryptionPublicKey?: string;
    }>;
    getUnshieldedAddress?: () => Promise<string | { unshieldedAddress: string }>;
    signData?: (data: string, options: unknown) => Promise<{ data: string; signature: string; verifyingKey: string }>;
    balanceUnsealedTransaction?: (tx: string, options?: unknown) => Promise<{ tx: string }>;
    submitTransaction?: (tx: string) => Promise<void>;
  }>;
}

/**
 * Returns the Midnight Lace or Midnight-compliant extension provider if present in window.midnight.
 */
export function getMidnightProvider(): MidnightExtensionProvider | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as { midnight?: Record<string, MidnightExtensionProvider>; midnightLace?: MidnightExtensionProvider };
  if (!win.midnight || typeof win.midnight !== 'object') {
    if (win.midnightLace && typeof win.midnightLace === 'object') {
      return win.midnightLace;
    }
    return null;
  }

  // Prioritize Lace (mnLace or lace) if specifically registered
  if (win.midnight.mnLace && typeof win.midnight.mnLace === 'object') {
    return win.midnight.mnLace;
  }
  if (win.midnight.lace && typeof win.midnight.lace === 'object') {
    return win.midnight.lace;
  }
  if (win.midnight['midnight-lace'] && typeof win.midnight['midnight-lace'] === 'object') {
    return win.midnight['midnight-lace'];
  }

  // Otherwise pick any Midnight-compliant provider
  for (const val of Object.values(win.midnight)) {
    if (
      val &&
      typeof val === 'object' &&
      (typeof val.connect === 'function' || typeof val.enable === 'function' || typeof val.isEnabled === 'function')
    ) {
      return val;
    }
  }

  return null;
}

/**
 * Waits up to timeoutMs for the Midnight Lace extension to inject into window.midnight.
 */
export async function waitForMidnightProvider(timeoutMs = 1500): Promise<MidnightExtensionProvider | null> {
  const immediate = getMidnightProvider();
  if (immediate) return immediate;

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 100));
    const detected = getMidnightProvider();
    if (detected) return detected;
  }
  return null;
}

export function isWalletInstalled(): boolean {
  return Boolean(getMidnightProvider());
}

export function shortAddress(address?: string | null): string {
  if (!address) return 'Not connected';
  const clean = address.trim();
  if (clean.length <= 16) return clean;
  return `${clean.slice(0, 10)}…${clean.slice(-6)}`;
}

/**
 * Silently reconnects the wallet session if and only if the current origin is
 * ALREADY authorized in the Midnight Lace browser extension.
 *
 * Strict Web3 Security:
 * - 0 data saved to disk / localStorage.
 * - lace.isEnabled() is queried first: if false or ungranted, NEVER prompts or interrupts the user.
 * - If authorized, completes handshake silently in memory.
 */
export async function silentReconnectWallet(): Promise<WalletSession | null> {
  if (typeof window === 'undefined') return null;

  try {
    const provider = await waitForMidnightProvider(600);
    if (!provider) return null;

    // Check if user has already granted permission to this site in Midnight Lace
    let isAuthorized = false;
    if (typeof provider.isEnabled === 'function') {
      try {
        isAuthorized = await provider.isEnabled();
      } catch {
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      // Not pre-authorized: strictly never prompt during silent background reconnect
      return null;
    }

    // Origin is already authorized: silently acquire connected API
    let api: any = null;
    if (typeof provider.connect === 'function') {
      try {
        api = await provider.connect(MIDNIGHT_CONFIG.networkId);
      } catch {
        api = await provider.connect('');
      }
    } else if (typeof provider.enable === 'function') {
      api = await provider.enable();
    }

    if (!api) return null;

    let address = '';
    let unshieldedAddress = '';
    let shieldedAddress = '';

    if (typeof api.getUnshieldedAddress === 'function') {
      try {
        const unshielded = await api.getUnshieldedAddress();
        unshieldedAddress = typeof unshielded === 'string' ? unshielded : unshielded?.unshieldedAddress || '';
      } catch (e) {
        console.debug('Error querying unshielded address:', e);
      }
    }

    if (typeof api.getShieldedAddresses === 'function') {
      try {
        const state = await api.getShieldedAddresses();
        shieldedAddress = state?.shieldedAddress || '';
        address = state?.shieldedCoinPublicKey || state?.shieldedAddress || '';
      } catch (e) {
        console.debug('Error querying shielded address:', e);
      }
    }

    if (!address && unshieldedAddress) {
      address = unshieldedAddress;
    }
    if (!address) {
      // Wallet is locked or not authorized: strictly do not create a fake session
      return null;
    }

    return {
      address,
      unshieldedAddress,
      shieldedAddress,
      uris: {
        proverServerUri: MIDNIGHT_CONFIG.proofServerUri,
        indexerUri: MIDNIGHT_CONFIG.indexerUri,
      },
      api,
      isSimulated: false,
    };
  } catch (err) {
    console.debug('Silent Midnight Lace reconnection check bypassed:', err);
  }

  return null;
}

/**
 * Creates an in-memory simulated wallet session for dev and preview testing without the Lace extension.
 */
export function connectSimulatedWallet(): WalletSession {
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
    isSimulated: true,
  };
}

/**
 * User-initiated wallet connection (e.g. clicking the "Connect wallet" button).
 * Invokes the Midnight Lace prompt if the extension is present.
 */
export async function connectWallet(): Promise<WalletSession> {
  if (typeof window === 'undefined') {
    throw new Error('Browser window environment required for wallet connection.');
  }

  // Allow up to 2 seconds for Lace extension content-script injection
  const provider = await waitForMidnightProvider(2000);
  if (!provider) {
    console.warn('[Midnight Wallet] No Midnight Lace provider found in window.midnight.');
    throw new Error(
      'Midnight Lace wallet extension was not detected. Please ensure Midnight Lace is installed in your browser, enabled for this site, and unlocked.',
    );
  }

  console.log('[Midnight Wallet] Initiating connection via Midnight Lace provider...', provider);

  let api: any = null;
  try {
    if (typeof provider.connect === 'function') {
      try {
        api = await provider.connect(MIDNIGHT_CONFIG.networkId);
      } catch (err: any) {
        console.warn(
          `[Midnight Wallet] connect('${MIDNIGHT_CONFIG.networkId}') failed, retrying without network hint:`,
          err,
        );
        api = await provider.connect('');
      }
    } else if (typeof provider.enable === 'function') {
      api = await provider.enable();
    }
  } catch (err: any) {
    console.error('[Midnight Wallet] provider.connect rejected or failed:', err);
    const msg = err instanceof Error ? err.message : String(err);
    if (/cancel|reject|denied|declined/i.test(msg)) {
      throw new Error('Connection request was cancelled in Midnight Lace wallet.');
    }
    throw new Error(`Midnight Lace connection error: ${msg}`);
  }

  if (!api) {
    throw new Error('Midnight Lace wallet responded but did not provide a connected API instance.');
  }

  let address = '';
  let unshieldedAddress = '';
  let shieldedAddress = '';
  let isLocked = false;

  if (typeof api.getShieldedAddresses === 'function') {
    try {
      const state = await api.getShieldedAddresses();
      shieldedAddress = state?.shieldedAddress || '';
      address = state?.shieldedCoinPublicKey || state?.shieldedAddress || '';
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/locked/i.test(msg)) {
        isLocked = true;
      }
      console.warn('[Midnight Wallet] Error querying shielded address:', e);
    }
  }

  if (!address && typeof api.getUnshieldedAddress === 'function') {
    try {
      const unshielded = await api.getUnshieldedAddress();
      unshieldedAddress = typeof unshielded === 'string' ? unshielded : unshielded?.unshieldedAddress || '';
      if (unshieldedAddress) {
        address = unshieldedAddress;
      }
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/locked/i.test(msg)) {
        isLocked = true;
      }
      console.warn('[Midnight Wallet] Error querying unshielded address:', e);
    }
  }

  // If the wallet is locked or no address was returned, trigger the Midnight Lace extension dialog
  if (isLocked || !address) {
    console.log('[Midnight Wallet] Wallet locked or unauthenticated. Triggering Midnight Lace popup challenge...');
    if (typeof api.signData === 'function') {
      try {
        const timestamp = new Date().toISOString();
        await api.signData(
          `Membrane Clinical Protocol\nAuthorize & unlock Midnight Lace wallet session.\nTimestamp: ${timestamp}`,
          { encoding: 'text', keyType: 'unshielded' },
        );

        // After user unlocks in the popup dialog and approves, re-fetch addresses
        if (typeof api.getShieldedAddresses === 'function') {
          const state = await api.getShieldedAddresses();
          shieldedAddress = state?.shieldedAddress || '';
          address = state?.shieldedCoinPublicKey || state?.shieldedAddress || '';
        }
        if (!address && typeof api.getUnshieldedAddress === 'function') {
          const unshielded = await api.getUnshieldedAddress();
          unshieldedAddress = typeof unshielded === 'string' ? unshielded : unshielded?.unshieldedAddress || '';
          if (unshieldedAddress) address = unshieldedAddress;
        }
      } catch (signErr: any) {
        const signMsg = signErr instanceof Error ? signErr.message : String(signErr);
        if (/cancel|reject|denied|declined/i.test(signMsg)) {
          throw new Error('Connection request was cancelled in Midnight Lace wallet.');
        }
        if (/locked/i.test(signMsg)) {
          throw new Error(
            'Midnight Lace wallet is locked. Please click the Midnight Lace extension icon in your browser toolbar, enter your password to unlock the wallet, and then click Connect wallet.',
          );
        }
        throw new Error(
          `Midnight Lace wallet is locked or not authenticated. Please click the Midnight Lace extension icon in your toolbar, unlock it, and try again. (${signMsg})`,
        );
      }
    }
  }

  if (!address && unshieldedAddress) {
    address = unshieldedAddress;
  }

  if (!address) {
    throw new Error(
      'Midnight Lace wallet is locked. Please click the Midnight Lace extension icon in your browser toolbar, enter your password to unlock the wallet, and then click Connect wallet.',
    );
  }

  console.log('[Midnight Wallet] Successfully connected to Midnight Lace! Address:', address);

  return {
    address,
    unshieldedAddress,
    shieldedAddress,
    uris: {
      proverServerUri: MIDNIGHT_CONFIG.proofServerUri,
      indexerUri: MIDNIGHT_CONFIG.indexerUri,
    },
    api,
    isSimulated: false,
  };
}
