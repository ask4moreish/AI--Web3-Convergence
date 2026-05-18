/**
 * AgentWallet
 *
 * Wraps a Stellar keypair and provides signing + balance queries.
 * Inspired by Fetch.ai's wallet component: agents hold private keys and sign
 * transactions autonomously.
 */

import { Horizon, Keypair, Networks } from "@stellar/stellar-sdk";
import { AgentConfig } from "./types";

export class AgentWallet {
  private keypair: Keypair;
  private horizonServer: Horizon.Server;
  private networkPassphrase: string;

  constructor(config: AgentConfig) {
    this.keypair = Keypair.fromSecret(config.secretKey);
    this.horizonServer = new Horizon.Server(config.horizonUrl);
    this.networkPassphrase =
      config.network === "testnet"
        ? Networks.TESTNET
        : Networks.PUBLIC;
  }

  /** Returns the agent's public address (G...). */
  publicKey(): string {
    return this.keypair.publicKey();
  }

  /** Returns the Keypair for signing transactions. */
  signer(): Keypair {
    return this.keypair;
  }

  /** Fetch XLM balance from Horizon. */
  async getBalance(): Promise<string> {
    const account = await this.horizonServer.loadAccount(this.publicKey());
    const xlmBalance = account.balances.find(
      (b) => b.asset_type === "native"
    );
    return xlmBalance ? xlmBalance.balance : "0";
  }

  /** Network passphrase for transaction signing. */
  network(): string {
    return this.networkPassphrase;
  }
}
