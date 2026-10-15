# Membrane

**Privacy-preserving clinical trial enrollment on [Midnight](https://midnight.network).**

Membrane lets hospitals prove they have enough eligible patients for a clinical trial, without revealing patient records, the hospital's exact patient count, or any identifying data. Research sponsors publish trial criteria on-chain, hospitals prove eligibility with zero-knowledge proofs, and the Midnight network verifies them.

---

## The problem

Before a clinical trial starts, a sponsor needs to know which hospitals have enough patients matching the trial criteria (disease, age range, minimum sample size). Hospitals can't share patient data at this stage: consent, IRB approval, and data-sharing agreements aren't in place yet. Today this discovery step is slow and manual.

## The solution

Membrane splits the problem along a privacy boundary:

- **Public (on-chain):** trial criteria, trial status, enrolled hospital count, and a commitment per enrolled hospital.
- **Private (hospital-side only):** the patient database, the count of matching patients, and the hospital's credential.

A hospital computes its eligibility locally, then generates a zero-knowledge proof that its matching-patient count meets the trial's minimum. The Midnight node verifies the proof. The chain learns *that* the hospital qualifies, and nothing else.

> Membrane covers the **discovery gate** only. It does not replace patient consent, IRB review, or legal data-sharing agreements, which remain off-chain by design.

## How it works

```
<<<<<<< HEAD
bulletin-board/
├── contract/               # Smart contract in Compact language
│   └── src/               # Contract source and utilities
├── api/                   # Methods, classes and types for CLI and UI
├── bboard-cli/            # Command-line interface
│   └── src/               # CLI implementation
└── ui/                    # Web browser interface
    └── src/               # Web UI implementation
=======
Research sponsor ──createTrial()──▶  Membrane contract (Midnight)
                                            ▲
                                            │ verifies proof
Hospital backend                            │
  ├─ queries local patient DB               │
  ├─ computes matching count (witness)      │
  └─ local proof server ──proof──▶ enroll(trialId) ─┘
>>>>>>> 029228c47e3c37219bbd185f3e75e8921ffa9a34
```

1. **Sponsor creates a trial** by calling `createTrial` with the disease code, age range, and minimum patient sample count. The trial is stored in the contract's ledger state.
2. **Hospital reads the public criteria** from the ledger and queries its own patient database locally.
3. **Hospital calls `enroll(trialId)`.** The matching count is supplied as a private witness. The circuit asserts it meets the minimum, then records the hospital's commitment and increments the trial's enrolled count.
4. **The Midnight node verifies the proof** against the contract's verifying key. Invalid proofs, including enrollments with too few matching patients, are rejected.
5. **Sponsors read aggregate status** from the public ledger via the indexer.

## Features

- Multi-trial support: one deployed contract hosts many trials, keyed by trial ID hash
- Per-hospital, per-trial enrollment
- Eligibility proven from private data via Compact witnesses
- NestJS API server acting as the hospital-side backend
- Synthetic patient data seeding for demos and testing

## Tech stack

| Layer | Technology |
|---|---|
| Smart contract | [Compact](https://docs.midnight.network/compact) on Midnight |
| Proof generation | Midnight proof server (local) |
| Contract interaction | Lace Wallet (web Dapp) |
| API server | NestJS + TypeORM |
| Language | TypeScript |

## Project structure


```
membrane/
├── contract/
│   ├── membrane.compact          # Compact smart contract
│   └── managed/membrane/         # Compiler output (keys, ZKIR, generated JS)
|   ├── src/
|   |  ├── membrane.interact.ts      # CLI script for contract interaction
|   |  ├── network.ts                # Network config + wallet resolution
|   |  ├── wallet.ts                 # Wallet creation and sync
|
|__ membrane-api/


```

## Getting started

### Prerequisites

- Node.js (LTS)
- The [Compact compiler](https://docs.midnight.network/getting-started) installed
- Docker, for running the Midnight proof server locally
- A funded wallet on the target network (tNIGHT and DUST for fees on preview)

### Install

```bash
git clone https://github.com/princeigwe/membrane.git
cd membrane
npm install
```
### Setup (Local node and proof server)
```bash
docker compose up
```

### Contract compilation and deployment (local network)

```bash
cd contract
npm run compile
npm run deploy-local
```

### Contract Interaction

```bash
npm run membrane-interact
```

Update `contractAddress` in `src/membrane.interact.ts` with your own deployment's address.

### Run the API server

```bash
<<<<<<< HEAD
cd ui
npm run build
cd ..
=======
npm run start:dev
>>>>>>> 029228c47e3c37219bbd185f3e75e8921ffa9a34
```

### Contract deployment on preview network

```bash
npm run setup -- --network preview
```



On first boot the server seeds synthetic patients into the database. Subsequent boots skip seeding if data already exists.

## Demo walkthrough

1. **Sponsor** creates a trial (e.g. Type 2 diabetes, ages 40-70, minimum 30 patients).
2. **Hospital A**, with enough matching patients, enrolls. The proof is generated locally, verified on-chain, and the enrolled count increases.
3. **Hospital B**, with too few matching patients, attempts to enroll and fails, because no valid proof can be produced.
4. Compare the hospital's local patient table with what's on-chain: a trial ID, a commitment hash, and a counter. No patient data.

## Privacy model

| Data | Visibility |
|---|---|
| Trial criteria (disease code, age range, minimum sample size) | Public |
| Trial status and enrolled count | Public |
| Hospital commitment (hash of credential) | Public |
| Patient records | Private, never leaves the hospital |
| Exact matching-patient count | Private, only the threshold result is proven |
| Hospital credential | Private, only its hash is disclosed |

## Limitations

- **Witness honesty is not enforced by the proof.** The proof guarantees the circuit's constraints were satisfied by *some* witness, not that the hospital's reported count reflects its real database. A production system would need attested hospital credentials and periodic audits.
- Demo data is synthetic and randomly generated.


## Contributors

<<<<<<< HEAD
1. Copy your wallet address from the output above
2. Visit the [faucet](https://midnight-tmnight-preprod.nethermind.dev/)
3. Paste your address and request funds
4. Wait for the CLI to detect the funds (takes 2-3 minutes)

Expected output after funding is similar to:

```
Your NIGHT wallet balance is: 1000000000
```

#### Deploy Your Contract

1. Choose the contract deployment option
2. Wait for deployment (takes ~30 seconds)
3. **Save the contract address** for future use

Expected output:

```
Deployed bulletin board contract at address: [contract address]
```

#### Use the Bulletin Board

You can now:

- **Post** a message to the bulletin board
- **View** the current message
- **Remove** your message (only if you posted it)
- **Exit** when done

Each action creates a real transaction on Midnight Testnet using zero-knowledge proofs generated by the proof server.

## Option 2: Web UI Interface

The web interface uses the same proof server and requires additional browser setup.

### Start the Proof Server (if not already running)

If you haven't started the proof server for the CLI, start it now:

```bash
cd bboard-cli
docker compose -f proof-server-local.yml up -d
cd ..
```

Verify it's running:

```bash
docker ps
```

### Start the Web Interface

The UI can run against preprod or preview networks:

```bash
cd ui

# For preprod network
npm run build:start

# For preview network
npm run build:start:preview
```

The UI will be available at:

- http://127.0.0.1:8080

### Browser Setup

1. **Open the UI URL** in a browser with Lace wallet extension installed
2. **Set up Lace wallet** if it's your first time
3. **Authorize the application** when Lace wallet prompts
4. Use the bulletin board web interface

## Useful Links

- Get Testnet tNIGHT on [Preprod Faucet](https://midnight-tmnight-preprod.nethermind.dev/) or [Preview Faucet](https://midnight-tmnight-preview.nethermind.dev/)
- [Midnight Documentation](https://docs.midnight.network/examples/dapps/bboard) - Complete developer guide
- [Compatibility Matrix](https://docs.midnight.network/relnotes/support-matrix) - Current supported Midnight component versions
- [Compact Language Guide](https://docs.midnight.network/compact/writing) - Smart contract language reference
- Get Lace wallet on the [Chrome Store](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk) or the [Edge Store](https://microsoftedge.microsoft.com/addons/detail/lace/efeiemlfnahiidnjglmehaihacglceia)

## Troubleshooting

| Common Issue                       | Solution                                                                                                  |
| ---------------------------------- |-----------------------------------------------------------------------------------------------------------|
| `npm install` fails                | Ensure you're using Node `v24.11.1` or newer. Older Node versions can install with warnings but are not the target runtime |
| Contract compilation fails         | Ensure the Compact toolchain is installed and run `npm run compact` from `contract/`                      |
| Network connection timeout         | CLI requires internet connection, restart if connection times out                                         |
| Token funding takes too long       | Wait 1-2 minutes, funding is automatic in CLI                                                             |
| "Application not authorized" error | Start proof server: `docker compose -f proof-server-local.yml up -d`                                      |
| Lace wallet not detected           | Install Lace wallet browser extension and refresh page                                                    |
| Docker issues                      | Ensure Docker Desktop is running, check `docker --version`                                                |
| Port 6300 in use                   | Run `docker compose down` then restart services                                                           |
| Dependencies won't install         | Use Node.js LTS version. For older npm versions, you may need `--legacy-peer-deps`                        |
| Contract deployment fails          | Verify wallet has sufficient balance and network connection                                               |

## Notes

- CLI and UI can run simultaneously and share the same proof server
- Proof server (Docker) is required for both CLI and UI to generate zero-knowledge proofs
- Contract must be compiled before building CLI or UI
- Fund your wallet using the testnet faucet before deploying contracts

## Implementation Notes

- **Transaction fee configuration**  
  The default `additionalFeeOverhead` value (`500_000_000_000_000_000n`) from `@midnight-ntwrk/testkit-js` is required on the `undeployed` network. Lower values can fail with `BalanceCheckOverspend` on the node side. On remote networks, that overhead requires too much dust, so the CLI overrides it to `1_000n`.
- CLI private state is stored per contract address, matching the `Midnight.js 4.x` private-state provider model.
=======
- [Steve Mogbo](https://www.linkedin.com/in/steve-mogbo)
- [Prince Igwenagha](https://www.linkedin.com/in/prince-igwenagha)
- [James Asaolu](https://www.linkedin.com/in/james-asaolu)
>>>>>>> 029228c47e3c37219bbd185f3e75e8921ffa9a34
