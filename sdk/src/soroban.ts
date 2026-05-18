import {
  Account,
  Contract,
  Keypair,
  Networks,
  rpc,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  xdr,
  BASE_FEE,
} from "@stellar/stellar-sdk";

export async function callContract(
  rpcServer: rpc.Server,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  signer: Keypair,
  networkPassphrase: string
): Promise<xdr.ScVal> {
  const source = await rpcServer.getAccount(signer.publicKey());
  const account = new Account(source.accountId(), source.sequenceNumber());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const prepared = rpc.assembleTransaction(tx, simResult).build();
  prepared.sign(signer);

  const sendResult = await rpcServer.sendTransaction(prepared);
  if (sendResult.status === "ERROR") {
    throw new Error(`Send failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  // Poll for confirmation
  let getResult = await rpcServer.getTransaction(sendResult.hash);
  while (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await rpcServer.getTransaction(sendResult.hash);
  }

  if (getResult.status === rpc.Api.GetTransactionStatus.FAILED) {
    throw new Error("Transaction failed");
  }

  return (getResult as rpc.Api.GetSuccessfulTransactionResponse)
    .returnValue ?? xdr.ScVal.scvVoid();
}

export async function viewContract(
  rpcServer: rpc.Server,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  callerPublicKey: string,
  networkPassphrase: string
): Promise<xdr.ScVal> {
  const source = await rpcServer.getAccount(callerPublicKey);
  const account = new Account(source.accountId(), source.sequenceNumber());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  return (simResult as rpc.Api.SimulateTransactionSuccessResponse)
    .result?.retval ?? xdr.ScVal.scvVoid();
}

/** Build an unsigned transaction XDR string for client-side signing (frontend). */
export async function buildUnsignedTx(
  rpcServer: rpc.Server,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  callerPublicKey: string,
  networkPassphrase: string
): Promise<string> {
  const source = await rpcServer.getAccount(callerPublicKey);
  const account = new Account(source.accountId(), source.sequenceNumber());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await rpcServer.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  return rpc.assembleTransaction(tx, simResult).build().toXDR();
}
