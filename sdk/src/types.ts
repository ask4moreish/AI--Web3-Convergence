/**
 * Core types for the Stellar Agent Framework.
 *
 * Inspired by Fetch.ai's AEA architecture: agents have identity, wallet,
 * runtime, and resources. On Stellar, identity = keypair, wallet = Stellar
 * account, runtime = event loop + task executor.
 */

export interface AgentConfig {
  /** Stellar secret key (S...). Loaded from env or secure storage. */
  secretKey: string;
  /** Network passphrase: "Test SDF Network ; September 2015" or "Public Global Stellar Network ; September 2015" */
  network: "testnet" | "mainnet";
  /** RPC endpoint for Soroban calls. */
  rpcUrl: string;
  /** Horizon endpoint for classic Stellar operations. */
  horizonUrl: string;
  /** Agent registry contract address. */
  registryContractId: string;
  /** Reputation contract address. */
  reputationContractId: string;
  /** Task market contract address. */
  taskMarketContractId: string;
}

export interface AgentMetadata {
  name: string;
  description: string;
  /** Bitmask of capabilities (matches on-chain registry). */
  capabilities: bigint;
  /** IPFS CID or HTTPS URL for extended metadata. */
  metadataUri: string;
}

export interface Task {
  id: bigint;
  requester: string;
  descriptionUri: string;
  paymentToken: string;
  paymentAmount: bigint;
  status: "Open" | "Claimed" | "Completed" | "Cancelled";
  assignee?: string;
}

export interface AgentEntry {
  owner: string;
  metadataUri: string;
  capabilities: bigint;
  registeredAt: number;
  active: boolean;
}

export interface ScoreEntry {
  /** EMA score × 1000 (e.g. 4500 = 4.5 / 5.0). */
  ema: bigint;
  count: number;
}

/**
 * A handler function that processes a claimed task.
 * Return true to signal completion, false to abandon.
 */
export type TaskHandler = (task: Task) => Promise<boolean>;
