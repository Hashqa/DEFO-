import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

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
  const { name, vatNumber, email, address, isBusiness } = req.body;
  if (!name) {
    res.status(400).json({ error: "Le nom du client est requis" });
    return;
  }
  const client = await prisma.client.create({
    data: { accountId, name, vatNumber, email, address, isBusiness: Boolean(isBusiness) },
  });
  res.status(201).json(client);
});
