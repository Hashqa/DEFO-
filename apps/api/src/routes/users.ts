import { Router } from "express";
import { requireAuth, requireOwner } from "../middleware/auth";
import { inviteUser } from "../services/auth";

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
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
