import { Hono } from "hono";
import { registry, reputation, buildUnsignedTx, Address, nativeToScVal, SorobanRpc, getConfig } from "../clients";

export const agents = new Hono();

agents.get("/", async (c) => {
  try {
    const total = await registry().count();
    // Note: contract doesn't expose a list endpoint yet — return count only
    // Contributors: add an index map to the contract for full pagination
    return c.json({ agents: [], total });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

agents.get("/:address", async (c) => {
  const { address } = c.req.param();
  try {
    const [entry, score] = await Promise.all([
      registry().get(address),
      reputation().score(address),
    ]);
    return c.json({ address, entry, score });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

/** Returns unsigned XDR for the client to sign with Freighter. */
agents.post("/", async (c) => {
  const { metadataUri, capabilities, callerAddress } = await c.req.json();
  if (!metadataUri || capabilities == null || !callerAddress) {
    return c.json({ error: "metadataUri, capabilities, callerAddress required" }, 400);
  }
  try {
    const cfg = getConfig();
    const rpc = new SorobanRpc.Server(cfg.rpcUrl);
    const xdr = await buildUnsignedTx(
      rpc,
      cfg.registryContractId,
      "register",
      [
        new Address(callerAddress).toScVal(),
        nativeToScVal(metadataUri, { type: "string" }),
        nativeToScVal(BigInt(capabilities), { type: "u64" }),
      ],
      callerAddress,
      cfg.network === "testnet"
        ? "Test SDF Network ; September 2015"
        : "Public Global Stellar Network ; September 2015"
    );
    return c.json({ xdr });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
