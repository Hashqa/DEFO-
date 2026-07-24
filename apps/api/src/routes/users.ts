import { Router } from "express";
import { requireAuth, requireOwner } from "../middleware/auth";
import { inviteUser } from "../services/auth";
import { updateSubscriptionQuantity } from "../services/stripe";

export const usersRouter = Router();
usersRouter.use(requireAuth);

/** Multi-utilisateurs par compte : le titulaire ajoute un assistant. */
usersRouter.post("/", requireOwner, async (req, res) => {
  const accountId = req.accountId!;
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    res.status(400).json({ error: "email, password et fullName sont requis" });
    return;
  }
  try {
    const user = await inviteUser(accountId, { email, password, fullName });
    res.status(201).json(user);
    // Best-effort : le tarif dépend du nombre d'utilisateurs, mais un souci Stripe ne doit pas bloquer l'invitation.
    updateSubscriptionQuantity(accountId).catch((err) => {
      console.error("Échec de mise à jour de la quantité d'abonnement Stripe :", err);
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
