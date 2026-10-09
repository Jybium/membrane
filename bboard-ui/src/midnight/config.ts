export interface MidnightConfig {
  contractAddress: string;
  networkId: string;
  networkLabel: string;
  proofServerUri: string;
  indexerUri: string;
  explorerTxUrl: (txId: string) => string;
  explorerContractUrl: (address: string) => string;
}

export const MIDNIGHT_CONFIG: MidnightConfig = {
  contractAddress:
    (import.meta.env.VITE_MEMBRANE_CONTRACT_ADDRESS as string) ||
    'f3f879471a37ae9485f9816289b79dd76329b48620f5b3b03229072a1fe8cc3d',
  networkId: (import.meta.env.VITE_NETWORK_ID as string) || 'preview',
  networkLabel: 'Midnight Preview',
  proofServerUri: (import.meta.env.VITE_PROOF_SERVER_URI as string) || 'http://localhost:6300',
  indexerUri: (import.meta.env.VITE_INDEXER_URI as string) || 'https://indexer.preview.midnight.network/api/v1/graphql',
  explorerTxUrl: (txId: string) =>
    `https://preview.explorer.midnight.network/tx/${txId.startsWith('0x') ? txId : '0x' + txId}`,
  explorerContractUrl: (contractAddr: string) => `https://preview.explorer.midnight.network/contract/${contractAddr}`,
};

export function isContractConfigured(): boolean {
  return Boolean(MIDNIGHT_CONFIG.contractAddress && MIDNIGHT_CONFIG.contractAddress.trim().length > 0);
}
