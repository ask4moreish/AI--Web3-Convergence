/**
 * Initialises SDK clients from environment variables.
 * The API uses a read-only "service" keypair for view calls.
 * Write operations return unsigned XDR for the user to sign with Freighter.
 */

import { AgentConfig, AgentWallet, RegistryClient, ReputationClient, TaskMarketClient } from "@stellar-agents/sdk";
import { buildUnsignedTx } from "@stellar-agents/sdk/src/soroban";
import { Address, nativeToScVal, SorobanRpc } from "@stellar/stellar-sdk";

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

export function getConfig(): AgentConfig {
  return {
    secretKey: requireEnv("STELLAR_SECRET"),
    network: (process.env.STELLAR_NETWORK ?? "testnet") as "testnet" | "mainnet",
    rpcUrl: process.env.STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org",
    horizonUrl: process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org",
    registryContractId: requireEnv("REGISTRY_CONTRACT_ID"),
    reputationContractId: requireEnv("REPUTATION_CONTRACT_ID"),
    taskMarketContractId: requireEnv("TASK_MARKET_CONTRACT_ID"),
  };
}

let _wallet: AgentWallet | null = null;
let _registry: RegistryClient | null = null;
let _reputation: ReputationClient | null = null;
let _taskMarket: TaskMarketClient | null = null;

function wallet(): AgentWallet {
  if (!_wallet) _wallet = new AgentWallet(getConfig());
  return _wallet;
}

export function registry(): RegistryClient {
  if (!_registry) _registry = new RegistryClient(getConfig(), wallet());
  return _registry;
}

export function reputation(): ReputationClient {
  if (!_reputation) _reputation = new ReputationClient(getConfig(), wallet());
  return _reputation;
}

export function taskMarket(): TaskMarketClient {
  if (!_taskMarket) _taskMarket = new TaskMarketClient(getConfig(), wallet());
  return _taskMarket;
}

export { buildUnsignedTx, Address, nativeToScVal, SorobanRpc };
