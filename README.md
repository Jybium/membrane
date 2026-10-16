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
Research sponsor ──createTrial()──▶  Membrane contract (Midnight)
                                            ▲
                                            │ verifies proof
Hospital backend                            │
  ├─ queries local patient DB               │
  ├─ computes matching count (witness)      │
  └─ local proof server ──proof──▶ enroll(trialId) ─┘
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
npm run start:dev
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

- [Steve Mogbo](https://www.linkedin.com/in/steve-mogbo)
- [Prince Igwenagha](https://www.linkedin.com/in/prince-igwenagha)
- [James Asaolu](https://www.linkedin.com/in/james-asaolu)
