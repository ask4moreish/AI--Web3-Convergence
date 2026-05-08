import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { agents } from "./routes/agents";
import { tasks } from "./routes/tasks";
import { reputation } from "./routes/reputation";

export const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/agents", agents);
app.route("/tasks", tasks);
app.route("/reputation", reputation);

export default app;
