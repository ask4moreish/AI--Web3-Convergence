/**
 * Signs an unsigned XDR transaction with Freighter and submits it to Soroban RPC.
 */

import { signTransaction } from "@stellar/freighter-api";
import { SorobanRpc, Transaction, xdr } from "@stellar/stellar-sdk";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK = process.env.NEXT_PUBLIC_NETWORK ?? "TESTNET";

export async function signAndSubmit(unsignedXdr: string): Promise<string> {
  const signedXdr = await signTransaction(unsignedXdr, { network: NETWORK });

  const rpc = new SorobanRpc.Server(RPC_URL);
  const tx = new Transaction(signedXdr);
  const result = await rpc.sendTransaction(tx);

  if (result.status === "ERROR") {
    throw new Error(`Transaction failed: ${JSON.stringify(result.errorResult)}`);
  }

  // Poll for confirmation
  let getResult = await rpc.getTransaction(result.hash);
  while (getResult.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await rpc.getTransaction(result.hash);
  }

  if (getResult.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
    throw new Error("Transaction failed on-chain");
  }

  return result.hash;
}
