import { Hono } from "hono";
import {
  reputation as reputationClient,
  buildUnsignedTx,
  Address,
  nativeToScVal,
  SorobanRpc,
  getConfig,
} from "../clients";

export const reputation = new Hono();

reputation.get("/:address", async (c) => {
  const { address } = c.req.param();
  try {
    const score = await reputationClient().score(address);
    return c.json({
      address,
      ema: score ? score.ema.toString() : null,
      count: score ? score.count : null,
      score: score ? Number(score.ema) / 1000 : null,
    });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});

/** Returns unsigned XDR for the client to sign with Freighter. */
reputation.post("/rate", async (c) => {
  const { rater, agent, rating } = await c.req.json();
  if (!rater || !agent || rating == null) {
    return c.json({ error: "rater, agent, rating required" }, 400);
  }
  if (rating < 1 || rating > 5) {
    return c.json({ error: "rating must be 1–5" }, 400);
  }
  try {
    const cfg = getConfig();
    const rpc = new SorobanRpc.Server(cfg.rpcUrl);
    const networkPassphrase =
      cfg.network === "testnet"
        ? "Test SDF Network ; September 2015"
        : "Public Global Stellar Network ; September 2015";
    const xdr = await buildUnsignedTx(
      rpc,
      cfg.reputationContractId,
      "rate",
      [
        new Address(rater).toScVal(),
        new Address(agent).toScVal(),
        nativeToScVal(Number(rating), { type: "u32" }),
      ],
      rater,
      networkPassphrase
    );
    return c.json({ xdr });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
