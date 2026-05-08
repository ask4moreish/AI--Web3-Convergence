import { AgentConfig, Task, TaskHandler } from "./types";
import { AgentWallet } from "./wallet";
import { TaskMarketClient } from "./task-market";

export interface RuntimeOptions {
  pollIntervalMs?: number;
}

export class AgentRuntime {
  private handlers: Map<bigint, TaskHandler> = new Map();
  private running = false;
  private pollIntervalMs: number;
  private taskMarket: TaskMarketClient;
  private wallet: AgentWallet;

  constructor(config: AgentConfig, wallet: AgentWallet, options: RuntimeOptions = {}) {
    this.wallet = wallet;
    this.taskMarket = new TaskMarketClient(config, wallet);
    this.pollIntervalMs = options.pollIntervalMs ?? 10_000;
  }

  on(capabilityMask: bigint, handler: TaskHandler): this {
    this.handlers.set(capabilityMask, handler);
    return this;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    console.log(`[Agent] Running. Address: ${this.wallet.publicKey()}`);
    while (this.running) {
      try { await this.tick(); } catch (err) { console.error("[Agent] Error:", err); }
      await sleep(this.pollIntervalMs);
    }
  }

  stop(): void { this.running = false; }

  private async tick(): Promise<void> {
    const tasks = await this.taskMarket.listTasks("Open");
    for (const task of tasks) {
      const handler = this.findHandler();
      if (!handler) continue;
      try {
        await this.taskMarket.claim(task.id);
        const success = await handler(task);
        if (success) {
          console.log(`[Agent] Task ${task.id} done — awaiting requester confirmation`);
        }
      } catch (err) {
        console.error(`[Agent] Task ${task.id} failed:`, err);
      }
    }
  }

  /** Match first registered handler (extend for capability-based routing). */
  private findHandler(): TaskHandler | undefined {
    return this.handlers.values().next().value;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
