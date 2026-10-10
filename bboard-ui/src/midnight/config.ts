export interface MidnightConfig {
  contractAddress: string;
  networkId: string;
  networkLabel: string;
  proofServerUri: string;
  indexerUri: string;
  indexerWsUri: string;
  explorerTxUrl: (txId: string) => string;
  explorerContractUrl: (address: string) => string;
}

export const MIDNIGHT_CONFIG: MidnightConfig = {
  contractAddress:
    (import.meta.env.VITE_MEMBRANE_CONTRACT_ADDRESS as string) ||
    'e03c6abcd309f053d96913999e6ea2ba5ce3b15386860f039e2c9e65e69d03e3',
  networkId: (import.meta.env.VITE_NETWORK_ID as string) || 'preview',
  networkLabel: 'Midnight Preview',
  proofServerUri: (import.meta.env.VITE_PROOF_SERVER_URI as string) || 'http://localhost:6300',
  indexerUri: (import.meta.env.VITE_INDEXER_URI as string) || 'https://indexer.preview.midnight.network/api/v4/graphql',
  indexerWsUri:
    (import.meta.env.VITE_INDEXER_WS_URI as string) || 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  explorerTxUrl: (txId: string) =>
    `https://preview.explorer.midnight.network/tx/${txId.startsWith('0x') ? txId : '0x' + txId}`,
  explorerContractUrl: (contractAddr: string) => `https://preview.explorer.midnight.network/contract/${contractAddr}`,
};

export function isContractConfigured(): boolean {
  return Boolean(MIDNIGHT_CONFIG.contractAddress && MIDNIGHT_CONFIG.contractAddress.trim().length > 0);
}
