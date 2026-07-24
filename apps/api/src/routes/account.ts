import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, requireOwner } from "../middleware/auth";
import { createCompany } from "../services/peppol";

export const accountRouter = Router();
accountRouter.use(requireAuth);

accountRouter.get("/", async (req, res) => {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: req.accountId! } });
  res.json(account);
});

/** Personnalisation (logo/couleurs) + coordonnées bancaires pour le QR EPC + adresse pour Peppol. */
accountRouter.patch("/", requireOwner, async (req, res) => {
  const { companyName, vatNumber, bceNumber, logoUrl, brandColor, iban, bic, street, postalCode, city, country } =
    req.body;
  const account = await prisma.account.update({
    where: { id: req.accountId! },
    data: { companyName, vatNumber, bceNumber, logoUrl, brandColor, iban, bic, street, postalCode, city, country },
  });
  res.json(account);
});

/** Enregistre l'entreprise chez Recommand (Access Point Peppol) — prérequis à l'envoi de factures B2B. */
accountRouter.post("/peppol/register-company", requireOwner, async (req, res) => {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: req.accountId! } });
  if (!account.street || !account.city || !account.postalCode) {
    res.status(400).json({ error: "Adresse (rue, code postal, ville) requise avant l'enregistrement Peppol" });
    return;
  }
  try {
    const result = await createCompany({
      name: account.companyName,
      address: account.street,
      postalCode: account.postalCode,
      city: account.city,
      country: account.country,
      vatNumber: account.vatNumber,
    });
    const updated = await prisma.account.update({
      where: { id: account.id },
      data: { peppolCompanyId: result.company.id },
    });
    res.json({ account: updated, verificationUrl: result.verificationUrl });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
