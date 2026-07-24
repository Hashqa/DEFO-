import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { verifyRecipient } from "../services/peppol";

export const clientsRouter = Router();
clientsRouter.use(requireAuth);

clientsRouter.get("/", async (req, res) => {
  const accountId = req.accountId!;
  const clients = await prisma.client.findMany({ where: { accountId } });
  res.json(clients);
});

clientsRouter.get("/:id", async (req, res) => {
  const accountId = req.accountId!;
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, accountId },
  });
  if (!client) {
    res.status(404).json({ error: "Client introuvable" });
    return;
  }
  res.json(client);
});

clientsRouter.post("/", async (req, res) => {
  const accountId = req.accountId!;
  const { name, vatNumber, email, address, postalCode, city, country, isBusiness, peppolAddress } = req.body;
  if (!name) {
    res.status(400).json({ error: "Le nom du client est requis" });
    return;
  }
  const client = await prisma.client.create({
    data: {
      accountId,
      name,
      vatNumber,
      email,
      address,
      postalCode,
      city,
      country,
      isBusiness: Boolean(isBusiness),
      peppolAddress,
    },
  });
  res.status(201).json(client);
});

clientsRouter.patch("/:id", async (req, res) => {
  const accountId = req.accountId!;
  const existing = await prisma.client.findFirst({ where: { id: req.params.id, accountId } });
  if (!existing) {
    res.status(404).json({ error: "Client introuvable" });
    return;
  }
  const { name, vatNumber, email, address, postalCode, city, country, isBusiness, peppolAddress } = req.body;
  const client = await prisma.client.update({
    where: { id: existing.id },
    data: { name, vatNumber, email, address, postalCode, city, country, isBusiness, peppolAddress },
  });
  res.json(client);
});

/** Vérifie que l'adresse Peppol du client est joignable avant d'envoyer une facture. */
clientsRouter.post("/:id/verify-peppol", async (req, res) => {
  const accountId = req.accountId!;
  const client = await prisma.client.findFirst({ where: { id: req.params.id, accountId } });
  if (!client) {
    res.status(404).json({ error: "Client introuvable" });
    return;
  }
  if (!client.peppolAddress) {
    res.status(400).json({ error: "Ce client n'a pas d'adresse Peppol renseignée" });
    return;
  }
  try {
    const result = await verifyRecipient(client.peppolAddress);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
