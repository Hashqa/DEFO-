import cors from "cors";
import express from "express";
import { accountRouter } from "./routes/account";
import { authRouter } from "./routes/auth";
import { billingRouter } from "./routes/billing";
import { clientsRouter } from "./routes/clients";
import { documentsRouter } from "./routes/documents";
import { projectsRouter } from "./routes/projects";
import { publicRouter } from "./routes/public";
import { statsRouter } from "./routes/stats";
import { constructWebhookEvent, handleWebhookEvent } from "./services/stripe";
import { usersRouter } from "./routes/users";

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.WEB_APP_ORIGIN ?? "http://localhost:3000" }));

/** Doit lire le corps brut (non JSON-parsé) pour vérifier la signature Stripe — monté avant express.json(). */
app.post("/billing/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.header("stripe-signature");
  if (!signature) {
    res.status(400).send("Signature Stripe manquante");
    return;
  }
  try {
    const event = constructWebhookEvent(req.body, signature);
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook error: ${(err as Error).message}`);
  }
});

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/account", accountRouter);
app.use("/users", usersRouter);
app.use("/clients", clientsRouter);
app.use("/projects", projectsRouter);
app.use("/documents", documentsRouter);
app.use("/stats", statsRouter);
app.use("/billing", billingRouter);
app.use("/public", publicRouter);

app.listen(port, () => {
  console.log(`API DEFA à l'écoute sur le port ${port}`);
});
