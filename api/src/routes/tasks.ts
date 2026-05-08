import { Hono } from "hono";
import { taskMarket, buildUnsignedTx, Address, nativeToScVal, SorobanRpc, getConfig } from "../clients";
import type { Task } from "@stellar-agents/sdk";

export const tasks = new Hono();

tasks.get("/", async (c) => {
  const status = (c.req.query("status") ?? "Open") as Task["status"];
  try {
    const list = await taskMarket().listTasks(status);
    return c.json({
      tasks: list.map(serializeTask),
      total: list.length,
      status,
    });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

tasks.get("/:id", async (c) => {
  const id = BigInt(c.req.param("id"));
  try {
    const task = await taskMarket().getTask(id);
    return c.json({ task: task ? serializeTask(task) : null });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

/** Returns unsigned XDR for the client to sign with Freighter. */
tasks.post("/", async (c) => {
  const { requester, descriptionUri, paymentToken, paymentAmount } = await c.req.json();
  if (!requester || !descriptionUri || !paymentToken || paymentAmount == null) {
    return c.json({ error: "requester, descriptionUri, paymentToken, paymentAmount required" }, 400);
  }
  try {
    const cfg = getConfig();
    const rpc = new SorobanRpc.Server(cfg.rpcUrl);
    const networkPassphrase = cfg.network === "testnet"
      ? "Test SDF Network ; September 2015"
      : "Public Global Stellar Network ; September 2015";
    const xdr = await buildUnsignedTx(
      rpc,
      cfg.taskMarketContractId,
      "post",
      [
        new Address(requester).toScVal(),
        nativeToScVal(descriptionUri, { type: "string" }),
        new Address(paymentToken).toScVal(),
        nativeToScVal(BigInt(paymentAmount), { type: "i128" }),
      ],
      requester,
      networkPassphrase
    );
    return c.json({ xdr });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

tasks.post("/:id/complete", async (c) => {
  const id = BigInt(c.req.param("id"));
  const { requester } = await c.req.json();
  if (!requester) return c.json({ error: "requester required" }, 400);
  try {
    const cfg = getConfig();
    const rpc = new SorobanRpc.Server(cfg.rpcUrl);
    const networkPassphrase = cfg.network === "testnet"
      ? "Test SDF Network ; September 2015"
      : "Public Global Stellar Network ; September 2015";
    const xdr = await buildUnsignedTx(
      rpc,
      cfg.taskMarketContractId,
      "complete",
      [
        new Address(requester).toScVal(),
        nativeToScVal(id, { type: "u64" }),
      ],
      requester,
      networkPassphrase
    );
    return c.json({ xdr });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

function serializeTask(t: Task) {
  return {
    ...t,
    id: t.id.toString(),
    paymentAmount: t.paymentAmount.toString(),
  };
}
