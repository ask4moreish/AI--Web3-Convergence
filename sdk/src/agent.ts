/**
 * Agent
 *
 * The top-level class for building an autonomous AI agent on Stellar.
 * Composes identity (wallet), on-chain presence (registry), and execution
 * (runtime) into a single ergonomic interface.
 *
 * Usage:
 *   const agent = new Agent(config, metadata);
 *   agent.on(Capability.TEXT_INFERENCE, async (task) => { ... return true; });
 *   await agent.start();
 */

import { AgentConfig, AgentMetadata, TaskHandler } from "./types";
import { AgentWallet } from "./wallet";
import { AgentRuntime, RuntimeOptions } from "./runtime";
import { RegistryClient } from "./registry";

export class Agent {
  readonly wallet: AgentWallet;
  readonly registry: RegistryClient;
  private runtime: AgentRuntime;
  private metadata: AgentMetadata;

  constructor(
    config: AgentConfig,
    metadata: AgentMetadata,
    runtimeOptions: RuntimeOptions = {}
  ) {
    this.metadata = metadata;
    this.wallet = new AgentWallet(config);
    this.registry = new RegistryClient(config, this.wallet);
    this.runtime = new AgentRuntime(config, this.wallet, runtimeOptions);
  }

  /**
   * Register a task handler for a given capability bitmask.
   * Chainable.
   */
  on(capabilityMask: bigint, handler: TaskHandler): this {
    this.runtime.on(capabilityMask, handler);
    return this;
  }

  /**
   * Register on-chain (if not already) and start the runtime loop.
   */
  async start(): Promise<void> {
    await this.ensureRegistered();
    await this.runtime.start();
  }

  /** Stop the agent gracefully. */
  stop(): void {
    this.runtime.stop();
  }

  /** Agent's Stellar address. */
  address(): string {
    return this.wallet.publicKey();
  }

  /**
   * Ensure the agent is registered in the on-chain registry.
   * Idempotent — skips if already registered.
   */
  private async ensureRegistered(): Promise<void> {
    const existing = await this.registry.get(this.wallet.publicKey());
    if (existing) {
      console.log(`[Agent] Already registered: ${this.wallet.publicKey()}`);
      return;
    }
    console.log(`[Agent] Registering on-chain...`);
    await this.registry.register(
      this.metadata.metadataUri,
      this.metadata.capabilities
    );
    console.log(`[Agent] Registered: ${this.wallet.publicKey()}`);
  }
}

/** Predefined capability bitmasks. Extend as needed. */
export const Capability = {
  TEXT_INFERENCE: 1n << 0n,
  IMAGE_GENERATION: 1n << 1n,
  DATA_ANALYSIS: 1n << 2n,
  CODE_EXECUTION: 1n << 3n,
  WEB_SEARCH: 1n << 4n,
} as const;
