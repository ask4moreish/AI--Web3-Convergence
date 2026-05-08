/**
 * Shared helper for building, simulating, and submitting Soroban transactions.
 */

import {
  Account,
  Contract,
  Keypair,
  Networks,
  SorobanRpc,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
  BASE_FEE,
} from "@stellar/stellar-sdk";

export async function callContract(
  rpc: SorobanRpc.Server,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  signer: Keypair,
  networkPassphrase: string
): Promise<xdr.ScVal> {
  const source = await rpc.getAccount(signer.publicKey());
  const account = new Account(source.accountId(), source.sequenceNumber());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const prepared = SorobanRpc.assembleTransaction(tx, simResult).build();
  prepared.sign(signer);

  const sendResult = await rpc.sendTransaction(prepared);
  if (sendResult.status === "ERROR") {
    throw new Error(`Send failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  // Poll for confirmation
  let getResult = await rpc.getTransaction(sendResult.hash);
  while (getResult.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await rpc.getTransaction(sendResult.hash);
  }

  if (getResult.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
    throw new Error("Transaction failed");
  }

  return (getResult as SorobanRpc.Api.GetSuccessfulTransactionResponse)
    .returnValue ?? xdr.ScVal.scvVoid();
}

export async function viewContract(
  rpc: SorobanRpc.Server,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  callerPublicKey: string,
  networkPassphrase: string
): Promise<xdr.ScVal> {
  const source = await rpc.getAccount(callerPublicKey);
  const account = new Account(source.accountId(), source.sequenceNumber());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  return (simResult as SorobanRpc.Api.SimulateTransactionSuccessResponse)
    .result?.retval ?? xdr.ScVal.scvVoid();
}

/** Build an unsigned transaction XDR string for client-side signing (frontend). */
export async function buildUnsignedTx(
  rpc: SorobanRpc.Server,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  callerPublicKey: string,
  networkPassphrase: string
): Promise<string> {
  const source = await rpc.getAccount(callerPublicKey);
  const account = new Account(source.accountId(), source.sequenceNumber());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await rpc.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  return SorobanRpc.assembleTransaction(tx, simResult).build().toXDR();
}
