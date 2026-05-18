import { Address, rpc, nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";
import { AgentConfig, Task } from "./types";
import { AgentWallet } from "./wallet";
import { callContract, viewContract } from "./soroban";

export class TaskMarketClient {
  private rpcServer: rpc.Server;
  private wallet: AgentWallet;
  private contractId: string;
  private networkPassphrase: string;

  constructor(config: AgentConfig, wallet: AgentWallet) {
    this.contractId = config.taskMarketContractId;
    this.rpcServer = new rpc.Server(config.rpcUrl);
    this.wallet = wallet;
    this.networkPassphrase = wallet.network();
  }

  /** Post a new task with escrowed payment. Returns the task ID. */
  async post(
    descriptionUri: string,
    paymentToken: string,
    paymentAmount: bigint
  ): Promise<bigint> {
    const result = await callContract(
      this.rpcServer,
      this.contractId,
      "post",
      [
        new Address(this.wallet.publicKey()).toScVal(),
        nativeToScVal(descriptionUri, { type: "string" }),
        new Address(paymentToken).toScVal(),
        nativeToScVal(paymentAmount, { type: "i128" }),
      ],
      this.wallet.signer(),
      this.networkPassphrase
    );
    return BigInt(scValToNative(result) as number);
  }

  /** Claim an open task as this agent. */
  async claim(taskId: bigint): Promise<void> {
    await callContract(
      this.rpcServer,
      this.contractId,
      "claim",
      [
        new Address(this.wallet.publicKey()).toScVal(),
        nativeToScVal(taskId, { type: "u64" }),
      ],
      this.wallet.signer(),
      this.networkPassphrase
    );
  }

  /** Confirm task completion and release payment to the assignee. */
  async complete(taskId: bigint): Promise<void> {
    await callContract(
      this.rpcServer,
      this.contractId,
      "complete",
      [
        new Address(this.wallet.publicKey()).toScVal(),
        nativeToScVal(taskId, { type: "u64" }),
      ],
      this.wallet.signer(),
      this.networkPassphrase
    );
  }

  /** Cancel an open task and refund the requester. */
  async cancel(taskId: bigint): Promise<void> {
    await callContract(
      this.rpcServer,
      this.contractId,
      "cancel",
      [
        new Address(this.wallet.publicKey()).toScVal(),
        nativeToScVal(taskId, { type: "u64" }),
      ],
      this.wallet.signer(),
      this.networkPassphrase
    );
  }

  /** Fetch a single task by ID. */
  async getTask(taskId: bigint): Promise<Task | null> {
    const result = await viewContract(
      this.rpcServer,
      this.contractId,
      "get_task",
      [nativeToScVal(taskId, { type: "u64" })],
      this.wallet.publicKey(),
      this.networkPassphrase
    );

    if (result.switch() === xdr.ScValType.scvVoid()) return null;
    return decodeTask(result);
  }

  /** Total number of tasks ever posted. */
  async taskCount(): Promise<bigint> {
    const result = await viewContract(
      this.rpcServer,
      this.contractId,
      "task_count",
      [],
      this.wallet.publicKey(),
      this.networkPassphrase
    );
    return BigInt(scValToNative(result) as number);
  }

  /**
   * Fetch all tasks up to `count`, scanning from task ID 1.
   * Filters by status if provided.
   */
  async listTasks(status?: Task["status"], limit = 50): Promise<Task[]> {
    const total = await this.taskCount();
    const tasks: Task[] = [];
    for (let id = 1n; id <= total && tasks.length < limit; id++) {
      const task = await this.getTask(id);
      if (task && (!status || task.status === status)) {
        tasks.push(task);
      }
    }
    return tasks;
  }
}

function decodeTask(val: xdr.ScVal): Task {
  const native = scValToNative(val) as Record<string, unknown>;
  const statusMap: Record<string, Task["status"]> = {
    Open: "Open",
    Claimed: "Claimed",
    Completed: "Completed",
    Cancelled: "Cancelled",
  };
  return {
    id: BigInt(native.id as number),
    requester: (native.requester as { toString(): string }).toString(),
    descriptionUri: native.description_uri as string,
    paymentToken: (native.payment_token as { toString(): string }).toString(),
    paymentAmount: BigInt(native.payment_amount as number),
    status: statusMap[native.status as string] ?? "Open",
    assignee: native.assignee
      ? (native.assignee as { toString(): string }).toString()
      : undefined,
  };
}
