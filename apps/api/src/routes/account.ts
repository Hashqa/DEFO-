import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, requireOwner } from "../middleware/auth";

export const accountRouter = Router();
accountRouter.use(requireAuth);

accountRouter.get("/", async (req, res) => {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: req.accountId! } });
  res.json(account);
});

/** Personnalisation (logo/couleurs) + coordonnées bancaires pour le QR EPC. */
accountRouter.patch("/", requireOwner, async (req, res) => {
  const { companyName, vatNumber, bceNumber, logoUrl, brandColor, iban, bic } = req.body;
  const account = await prisma.account.update({
    where: { id: req.accountId! },
    data: { companyName, vatNumber, bceNumber, logoUrl, brandColor, iban, bic },
  });
  res.json(account);
});
