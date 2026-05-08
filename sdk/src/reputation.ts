import { Address, SorobanRpc, nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";
import { AgentConfig, ScoreEntry } from "./types";
import { AgentWallet } from "./wallet";
import { callContract, viewContract } from "./soroban";

export class ReputationClient {
  private rpc: SorobanRpc.Server;
  private wallet: AgentWallet;
  private contractId: string;
  private networkPassphrase: string;

  constructor(config: AgentConfig, wallet: AgentWallet) {
    this.contractId = config.reputationContractId;
    this.rpc = new SorobanRpc.Server(config.rpcUrl);
    this.wallet = wallet;
    this.networkPassphrase = wallet.network();
  }

  /** Submit a 1–5 star rating for an agent. */
  async rate(agentAddress: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) throw new Error("Rating must be 1–5");
    await callContract(
      this.rpc,
      this.contractId,
      "rate",
      [
        new Address(this.wallet.publicKey()).toScVal(),
        new Address(agentAddress).toScVal(),
        nativeToScVal(rating, { type: "u32" }),
      ],
      this.wallet.signer(),
      this.networkPassphrase
    );
  }

  /** Fetch the EMA score entry for an agent. Returns null if unrated. */
  async score(agentAddress: string): Promise<ScoreEntry | null> {
    const result = await viewContract(
      this.rpc,
      this.contractId,
      "score",
      [new Address(agentAddress).toScVal()],
      this.wallet.publicKey(),
      this.networkPassphrase
    );

    if (result.switch() === xdr.ScValType.scvVoid()) return null;

    const native = scValToNative(result) as Record<string, unknown>;
    return {
      ema: BigInt(native.ema as number),
      count: native.count as number,
    };
  }
}
