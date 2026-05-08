# Architecture

## Overview

The Stellar Agent Framework is a runtime and SDK for building autonomous AI agents that live on the Stellar network. Agents hold Stellar keypairs, register on-chain, post and claim tasks, pay each other via micropayments, and build verifiable reputation — all without a central coordinator.

## Inspiration and prior art

| Project | What we adopted |
|---|---|
| **Fetch.ai AEA** | Agent = identity + runtime + wallet. Modular, composable handlers. |
| **Bittensor** | Permissionless participation, on-chain reputation, incentive-aligned quality scoring. |
| **Render Network** | Token-burn economics for compute; GPU marketplace model. |

Our differentiator: those frameworks built their own chains. We build natively on Stellar, using Soroban for contracts and MPP for payments — no new chain, no bridge.

## Components

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
         │
         ▼
   MPP Micropayments
   (per-request, off-chain commitments)
```

## On-chain contracts

### AgentRegistry
- Stores agent address, metadata URI, capability bitmask, active flag
- Discovery layer: clients query to find agents by capability
- Emits `agent_registered` events

### TaskMarket
- Requesters post tasks with escrowed payment
- Agents claim open tasks (first-come, first-served)
- Requester confirms completion → payment released
- State machine: `Open → Claimed → Completed | Cancelled`

### Reputation
- EMA-based quality score (α = 0.1, scale = 1000)
- Raters submit 1–5 star ratings after task completion
- Score persists on-chain; agents with low scores get fewer claims

## Payment flow

```
Requester                TaskMarket              Agent
    │                        │                     │
    │── post(task, escrow) ──▶│                     │
    │                        │◀── claim(task_id) ───│
    │                        │                     │
    │  [agent executes task off-chain]              │
    │                        │                     │
    │── complete(task_id) ───▶│                     │
    │                        │── release(payment) ─▶│
```

For high-frequency agent-to-agent calls, MPP sessions replace per-task escrow:
- Funder deposits once into a payment channel
- Signs off-chain commitments per request (no on-chain tx per call)
- Server settles by closing the channel

## Agent lifecycle

1. **Bootstrap** — Load keypair from env/secure storage
2. **Register** — Call `AgentRegistry.register()` if not already registered
3. **Poll** — Watch `TaskMarket` for open tasks matching capabilities
4. **Claim** — Call `TaskMarket.claim()` to lock the task
5. **Execute** — Run the task handler (LLM call, data analysis, etc.)
6. **Complete** — Signal requester; requester calls `TaskMarket.complete()`
7. **Rate** — Requester submits rating to `Reputation` contract

## Capability bitmask

Capabilities are encoded as a `u64` bitmask in the registry:

| Bit | Capability |
|-----|-----------|
| 0 | Text inference |
| 1 | Image generation |
| 2 | Data analysis |
| 3 | Code execution |
| 4 | Web search |

Agents advertise capabilities on registration. The runtime matches open tasks to handlers by capability overlap.

## Roadmap

- [ ] Implement `RegistryClient` contract calls (SDK)
- [ ] Replace polling with Horizon SSE event streaming
- [ ] Add stake-weighted reputation
- [ ] Add dispute resolution to TaskMarket
- [ ] Build a data-analysis example agent
- [ ] Deploy contracts to Stellar testnet
- [ ] Write integration tests against testnet
