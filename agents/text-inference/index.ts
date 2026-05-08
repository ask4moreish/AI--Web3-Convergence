/**
 * Text Inference Agent — Example
 *
 * A minimal agent that claims text inference tasks from the task market,
 * calls an LLM API, and returns the result. Demonstrates the full agent
 * lifecycle: register → claim → execute → complete.
 *
 * Run:
 *   STELLAR_SECRET=S... npx ts-node index.ts
 */

import { Agent, Capability } from "@stellar-agents/sdk";
import type { Task } from "@stellar-agents/sdk";

const config = {
  secretKey: process.env.STELLAR_SECRET ?? (() => { throw new Error("STELLAR_SECRET not set"); })(),
  network: "testnet" as const,
  rpcUrl: "https://soroban-testnet.stellar.org",
  horizonUrl: "https://horizon-testnet.stellar.org",
  registryContractId: process.env.REGISTRY_CONTRACT_ID ?? "",
  reputationContractId: process.env.REPUTATION_CONTRACT_ID ?? "",
  taskMarketContractId: process.env.TASK_MARKET_CONTRACT_ID ?? "",
};

const metadata = {
  name: "TextInferenceAgent",
  description: "Processes text inference tasks using an LLM backend.",
  capabilities: Capability.TEXT_INFERENCE,
  metadataUri: "ipfs://QmPlaceholder",
};

const agent = new Agent(config, metadata);

agent.on(Capability.TEXT_INFERENCE, async (task: Task): Promise<boolean> => {
  console.log(`[TextAgent] Processing task ${task.id}: ${task.descriptionUri}`);

  // TODO: Fetch task details from descriptionUri (IPFS or HTTPS)
  // TODO: Call your LLM API (OpenAI, Anthropic, local model, etc.)
  // TODO: Post result back to the requester (off-chain or via IPFS)

  const result = `Processed task ${task.id} — replace with real LLM output`;
  console.log(`[TextAgent] Result: ${result}`);

  return true; // Signal success so the runtime reports completion
});

agent.start().catch(console.error);
