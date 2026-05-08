# Contributing

This project is open to contributors. The codebase is intentionally scaffolded with skeleton implementations and `TODO` markers — these are the contribution targets.

## Project structure

```
contracts/          Soroban smart contracts (Rust)
  agent-registry/   On-chain agent identity and discovery
  reputation/       EMA-based quality scoring
  task-market/      Escrow-backed task posting and claiming

sdk/                TypeScript agent framework
  src/
    agent.ts        Top-level Agent class
    wallet.ts       Stellar keypair + balance management
    runtime.ts      Event loop and task dispatcher
    registry.ts     Contract client for agent-registry
    types.ts        Shared types

agents/             Example agents (reference implementations)
  text-inference/   LLM-backed text processing agent

docs/               Architecture and protocol documentation
```

## How to contribute

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Find a `TODO` comment in the code — these are scoped, well-defined tasks
3. Implement it, add tests, and open a PR

## Setting up

**Contracts (Rust/Soroban):**
```bash
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli --features opt
cd contracts && cargo test
```

**SDK (TypeScript):**
```bash
npm install
npm run build
npm test
```

## Good first issues

- `sdk/src/registry.ts` — Implement `get()` and `register()` using `@stellar/stellar-sdk`'s `Contract.call()`
- `sdk/src/runtime.ts` — Replace polling stub with Horizon SSE event streaming
- `contracts/reputation/src/lib.rs` — Add stake-weighted rating influence
- `contracts/task-market/src/lib.rs` — Add dispute resolution window before payment release
- `agents/text-inference/index.ts` — Wire up a real LLM API call

## Code style

- Rust: `cargo fmt` + `cargo clippy`
- TypeScript: ESLint + Prettier (config in root)
- All public functions must have doc comments
- New contract functions must have a corresponding test

## Testing

```bash
# Contracts
cd contracts && cargo test

# SDK
cd sdk && npm test
```
