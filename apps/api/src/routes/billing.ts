import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, requireOwner } from "../middleware/auth";
import { createCheckoutSession } from "../services/stripe";

export const billingRouter = Router();
billingRouter.use(requireAuth);

billingRouter.get("/", async (req, res) => {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: req.accountId! } });
  res.json({ subscriptionStatus: account.subscriptionStatus });
});

/** Crée une session Stripe Checkout pour démarrer l'abonnement du compte. */
billingRouter.post("/checkout", requireOwner, async (req, res) => {
  try {
    const owner = await prisma.user.findFirstOrThrow({ where: { accountId: req.accountId!, role: "OWNER" } });
    const session = await createCheckoutSession(req.accountId!, owner.email);
    res.json({ url: session.url });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
