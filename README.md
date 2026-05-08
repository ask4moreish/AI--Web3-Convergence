# Stellar Agent Framework

A runtime and SDK for building **autonomous AI agents** that live on the Stellar network.

Agents hold Stellar keypairs, register on-chain, post and claim tasks, pay each other via micropayments, and build verifiable reputation — all without a central coordinator.

---

## Why this exists

Decentralized AI is heating up. Bittensor, Render, and Fetch.ai have proven that open compute and model marketplaces work. But they all built their own chains.

Stellar already has the primitives: Soroban smart contracts, MPP micropayments, and 5-second finality at near-zero fees. This project builds the **agent framework layer** on top — the SDK and contracts that let developers ship autonomous AI agents on Stellar without reinventing the infrastructure.

Think: Fetch.ai's `uAgents` framework, but native to Stellar.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Agent                            │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  Wallet  │  │   Runtime    │  │  RegistryClient   │ │
│  │ (keypair)│  │ (event loop) │  │ (Soroban client)  │ │
│  └──────────┘  └──────────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────────┘
         │                │                  │
         ▼                ▼                  ▼
   Stellar Network    Task Market       Agent Registry
   (XLM / USDC)      (Soroban)          (Soroban)
```

See [docs/architecture.md](docs/architecture.md) for the full design.

---

## Project structure

```
contracts/          Soroban smart contracts (Rust)
  agent-registry/   On-chain agent identity and discovery
  reputation/       EMA-based quality scoring
  task-market/      Escrow-backed task posting and claiming

sdk/                TypeScript agent framework
api/                Hono REST API server (wraps SDK + contracts)
web/                Next.js frontend (agent explorer, task board, reputation)
agents/             Example agents (reference implementations)
docs/               Architecture and protocol documentation
```

---

## Quick start

**Build contracts:**
```bash
rustup target add wasm32-unknown-unknown
cd contracts && cargo test
```

**Run the full stack (API + frontend):**
```bash
cp .env.example .env   # fill in your contract addresses
npm install
npm run dev            # starts api on :3001 and web on :3000
```

**Run the example agent:**
```bash
export STELLAR_SECRET=S...
export REGISTRY_CONTRACT_ID=C...
export TASK_MARKET_CONTRACT_ID=C...
cd agents/text-inference && npm start
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The codebase has scoped `TODO` markers that are ready to be picked up.

---

## Tech stack

| Layer | Technology |
|---|---|
| Smart contracts | Rust / Soroban |
| Agent SDK | TypeScript |
| Backend API | Hono (Node.js) |
| Frontend | Next.js 14 + Freighter wallet |
| Payments | `@stellar/mpp` (MPP + x402) |
| Network | Stellar (testnet → mainnet) |
