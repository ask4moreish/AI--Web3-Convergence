import { Address, SorobanRpc, nativeToScVal, scValToNative, xdr } from "@stellar/stellar-sdk";
import { AgentConfig, AgentEntry } from "./types";
import { AgentWallet } from "./wallet";
import { callContract, viewContract } from "./soroban";

export class RegistryClient {
  private rpc: SorobanRpc.Server;
  private wallet: AgentWallet;
  private contractId: string;
  private networkPassphrase: string;

  constructor(config: AgentConfig, wallet: AgentWallet) {
    this.contractId = config.registryContractId;
    this.rpc = new SorobanRpc.Server(config.rpcUrl);
    this.wallet = wallet;
    this.networkPassphrase = wallet.network();
  }

  async register(metadataUri: string, capabilities: bigint): Promise<void> {
    await callContract(
      this.rpc,
      this.contractId,
      "register",
      [
        new Address(this.wallet.publicKey()).toScVal(),
        nativeToScVal(metadataUri, { type: "string" }),
        nativeToScVal(capabilities, { type: "u64" }),
      ],
      this.wallet.signer(),
      this.networkPassphrase
    );
  }

  async update(metadataUri: string, capabilities: bigint): Promise<void> {
    await callContract(
      this.rpc,
      this.contractId,
      "update",
      [
        new Address(this.wallet.publicKey()).toScVal(),
        nativeToScVal(metadataUri, { type: "string" }),
        nativeToScVal(capabilities, { type: "u64" }),
      ],
      this.wallet.signer(),
      this.networkPassphrase
    );
  }

  async setActive(active: boolean): Promise<void> {
    await callContract(
      this.rpc,
      this.contractId,
      "set_active",
      [
        new Address(this.wallet.publicKey()).toScVal(),
        nativeToScVal(active, { type: "bool" }),
      ],
      this.wallet.signer(),
      this.networkPassphrase
    );
  }

  async get(address: string): Promise<AgentEntry | null> {
    const result = await viewContract(
      this.rpc,
      this.contractId,
      "get",
      [new Address(address).toScVal()],
      this.wallet.publicKey(),
      this.networkPassphrase
    );

    if (result.switch() === xdr.ScValType.scvVoid()) return null;

    // Unwrap Option<AgentEntry>
    const inner = result.switch().name === "scvMap" ? result : result.value() as xdr.ScVal;
    if (!inner || inner.switch() === xdr.ScValType.scvVoid()) return null;

    const native = scValToNative(inner) as Record<string, unknown>;
    return {
      owner: (native.owner as { toString(): string }).toString(),
      metadataUri: native.metadata_uri as string,
      capabilities: BigInt(native.capabilities as number),
      registeredAt: native.registered_at as number,
      active: native.active as boolean,
    };
  }

  async count(): Promise<number> {
    const result = await viewContract(
      this.rpc,
      this.contractId,
      "count",
      [],
      this.wallet.publicKey(),
      this.networkPassphrase
    );
    return Number(scValToNative(result));
  }
}
