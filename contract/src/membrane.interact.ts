import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';
import { Buffer } from 'buffer';


// Midnight SDK imports
import { findDeployedContract, getPublicStates } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { resolveNetwork, getOrCreateWallet, formatWalletBackupNotice, getDeployment } from './network';
import { createWallet, persistWalletState, unshieldedToken, type WalletContext } from './wallet';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { contracts, networkId, types, utils } from '@midnight-ntwrk/midnight-js';

import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

//importing the compiled Javascript code of the Membrane contract 
// import { Contract, Ledger, Witnesses } from '../compiled/membrane/contract/index.js';
import { Contract, Ledger, Witnesses, ledger } from '../compiled/membrane/contract/index.js';
import { MembranePrivateState } from './witnesses';
import { WitnessContext } from '@midnight-ntwrk/compact-runtime';


// Enable WebSocket for GraphQL subscriptions
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

// Identifier under which this contract's private state is stored. 
const PRIVATE_STATE_ID = 'membranePrivateState';


const contractAddress = "59b304a3d386622c5f419400119a70710ff728aa35d916ca03ffb56081a2cc64"


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '..', 'compiled', 'membrane');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');


const { network, config: networkConfig } = resolveNetwork();
const WALLET = getOrCreateWallet(network);
const SEED = WALLET.seed;
{
  const notice = formatWalletBackupNotice(WALLET, network);
  if (notice) console.log(notice);
}

// defining witnesses
const witnesses: Witnesses<MembranePrivateState> = {
  getPrivateKey: ({ privateState }:  WitnessContext<Ledger, MembranePrivateState>) => [
    privateState, 
    privateState.privateKeyBytes ?? new Uint8Array(0)
  ],

  getPrivateTrialTag: ({ privateState }:  WitnessContext<Ledger, MembranePrivateState>) => [
    privateState, 
    privateState.privateTrialTagBytes ?? new Uint8Array(0)
  ],

  getHospitalPatientsAggregate: ({ privateState }:  WitnessContext<Ledger, MembranePrivateState>) => [
    privateState, 
    privateState.hospitalPatientsAggregate ?? 0n
  ],

};


// computing the contract to be interact, from the zero-knowledge intermediate representation
const Membrane = await import(pathToFileURL(contractPath).href)
const compiledContract = CompiledContract.make<Contract<MembranePrivateState>>('membrane', Membrane.Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
)


// providers
async function createProviders(walletCtx: WalletContext) {
  // The SDK requires the private-state password to be at least 16 characters.
  // The default below is a placeholder for local devnet only — set a strong
  // password via PRIVATE_STATE_PASSWORD when you move to a non-local target.
  const privateStatePassword = process.env.PRIVATE_STATE_PASSWORD?.trim() || 'Local-Devnet-Development-Placeholder-1';

  const walletProvider = {
    // In Midnight.js 4.1.x the WalletProvider interface returns the key objects
    // (CoinPublicKey / EncPublicKey) directly — no longer hex strings.
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      // balanceUnboundTransaction -> finalizeRecipe is the complete balancing
      // path in wallet-sdk 1.x; the earlier explicit signRecipe step is gone.
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: PRIVATE_STATE_ID,
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS), 
    zkConfigProvider,  //The zkConfigProvider serves the compiler artifacts, meaning the proving key, verifier key, and ZKIR for each circuit.
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}


const seed = SEED;
const walletCtx = await createWallet({ network, networkConfig, seed });
const providers = await createProviders(walletCtx);

// the on-chain, public state of a contract, which consists of the public data and balances in the contract
const contractState = await providers.publicDataProvider.queryContractState(contractAddress)

if (contractState === null) {
  throw new Error('No contract state found at this address');
}
const contractLedgerData = ledger(contractState.data)

const walletState = await walletCtx.wallet.waitForSyncedState();

const walletAddress = walletCtx.unshieldedKeystore.getBech32Address();
const walletBalance = walletState.unshielded.balances[unshieldedToken().raw] ?? 0n;

console.log("Wallet Address", walletAddress)
console.log(`  Balance: ${walletBalance.toLocaleString()} tNight\n`)


// helper function to convert string to bytes32
function stringToBytes32(s: string): Uint8Array {
  const encoded = new TextEncoder().encode(s);
  if (encoded.length > 32) {
    throw new RangeError(`String is ${encoded.length} bytes, max is 32`)
  }
  const out = new Uint8Array(32)
  out.set(encoded)
  return out
}


const researchLabPrivateData: MembranePrivateState = {
  privateKeyBytes: stringToBytes32("ResearchLab1x09$!@"),
  privateTrialTagBytes: stringToBytes32("RL1-0001")
}

const hospitalPrivateData: MembranePrivateState = {
  privateKeyBytes: stringToBytes32("Hospital1x09$!@"),
  hospitalPatientsAggregate: 200n
}


// Membrane circuit interactions
async function createTrial(
  diseaseCode: string,
  minAge: number | bigint,
  maxAge: number | bigint,
  minPatientSampleCount: number | bigint,
  privateData: MembranePrivateState
){
  const contract = await findDeployedContract(providers, {
    contractAddress: contractAddress,  
    compiledContract: compiledContract as any,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: privateData, 
  })

  const finalizedTxData = await contract.callTx.createTrial(
    diseaseCode,
    BigInt(minAge),
    BigInt(maxAge),
    BigInt(minPatientSampleCount),
  )

  // converting the circuit result from bytes to a hex string
  const trialIdHashHex = Buffer.from(finalizedTxData.private.result).toString('hex')

  console.log("Tx Hash:", finalizedTxData.public.txHash)
  console.log("Created Trial ID (hash):", trialIdHashHex);
}



async  function getLatestActiveTrials(){
  // Assuming contractLedgerData is the complete ledger from contractState.data
console.log("--- Latest Inputed ---");

  // this returns the latest inputted active trial. you cannot directly return a whole value of a Map<k,v> ledger state-type 
  for (const [trialHash, registry] of contractLedgerData.activeTrials) {
    console.log(`Trial ID: ${Buffer.from(trialHash).toString('hex')}`)
    console.log(`Research lab ID: ${Buffer.from(registry.researchLabIdHash).toString('hex')}`)
    console.log(`Disease Code: ${registry.diseaseCode}`)
    console.log(`Min Age: ${registry.minAge}`)
    console.log(`Max Age: ${registry.maxAge}`)
    console.log(`Status: ${registry.status}`)
    console.log(`Min Patient Sample Count: ${registry.minPatientSampleCount}`)
    console.log(`Enrolled Count: ${registry.enrolledCount}`)

    console.log('====================')
  }
}


async function cancelTrial(
  privateData: MembranePrivateState
){
  const contract = await findDeployedContract(providers, {
    contractAddress: contractAddress,  
    compiledContract: compiledContract as any,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: privateData, 
  })

  const finalizedTxData = await contract.callTx.cancelTrial()

  // converting the circuit result from bytes to a hex string
  const trialIdHashHex = Buffer.from(finalizedTxData.private.result).toString('hex')

  console.log("Tx Hash:", finalizedTxData.public.txHash)
  console.log("Cancelled Trial ID (hash):", trialIdHashHex)
}


async function trialEnrollment(
  trialIdBytes: Uint8Array,
  privateData: MembranePrivateState
){
  const contract = await findDeployedContract(providers, {
    contractAddress: contractAddress,  
    compiledContract: compiledContract as any,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: privateData, 
  })

  const finalizedTxData = await contract.callTx.trialEnrollment(trialIdBytes)

  const result = finalizedTxData.private.result
  console.log("Trial enrollment completed: ", result)
}

async function isTrialActive(
  trialIdBytes: Uint8Array
){
  const contract = await findDeployedContract(providers, {
    contractAddress: contractAddress,  
    compiledContract: compiledContract as any,
    privateStateId: PRIVATE_STATE_ID,
    // no private data is needed for circuit computation
  })

  const finalizedTxData = await contract.callTx.isTrialActive(trialIdBytes)

  const circuitResult = finalizedTxData.private.result
  console.log("Is trial active: ", circuitResult)
}


async function activeTrialDetail(trialIdBytes: Uint8Array) {
  const contract = await findDeployedContract(providers, {
    contractAddress: contractAddress,  
    compiledContract: compiledContract as any,
    privateStateId: PRIVATE_STATE_ID,
    // no private data is needed for circuit computation
  })

  const finalizedTxData = await contract.callTx.activeTrialDetail(trialIdBytes)

  const result = finalizedTxData.private.result
  console.log("===== Active trial detail ======")

  console.log("Trial ID Hash:", Buffer.from(result.trialIdHash).toString('hex'))
  console.log("Disease Code:", result.diseaseCode)
  console.log("Minimum Age:", result.minAge.toString())
  console.log("Maximum Age:", result.maxAge.toString())
  console.log("Minimum Patient Sample Count:", result.minPatientSampleCount.toString())
  console.log("Status:", result.status.toString())
  console.log("Enrolled Count:", result.enrolledCount.toString())
  console.log("Research Lab ID Hash:", Buffer.from(result.researchLabIdHash).toString('hex'))
  console.log("============================")
}


const trialIdHashHex = "f006cbd0974d319413c265cef619d1ef6257cf7a2872af0e171e04bc8f773cff"

const trialIdBytes = Buffer.from(
  trialIdHashHex, 
  'hex'
)

// Membrane contract calls

// await createTrial("ICD-001", 12n, 15n, 200n, researchLabPrivateData)
// await getLatestActiveTrials()
// await cancelTrial(researchLabPrivateData)
// await trialEnrollment(trialIdBytes, hospitalPrivateData)
// await isTrialActive(trialIdBytes)
// await activeTrialDetail(trialIdBytes)

await walletCtx.wallet.stop()
process.exit(0)