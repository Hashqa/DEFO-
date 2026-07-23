import { Router } from "express";
import { prisma } from "../db";
import { requireAccount } from "../middleware/auth";

export const projectsRouter = Router();
projectsRouter.use(requireAccount);

projectsRouter.get("/", async (req, res) => {
  const accountId = req.accountId!;
  const { clientId } = req.query;
  const projects = await prisma.project.findMany({
    where: { accountId, clientId: typeof clientId === "string" ? clientId : undefined },
  });
  res.json(projects);
});

projectsRouter.post("/", async (req, res) => {
  const accountId = req.accountId!;
  const { name, clientId } = req.body;
  if (!name || !clientId) {
    res.status(400).json({ error: "name et clientId sont requis" });
    return;
  }
  const client = await prisma.client.findFirst({ where: { id: clientId, accountId } });
  if (!client) {
    res.status(404).json({ error: "Client introuvable" });
    return;
  }
  const project = await prisma.project.create({ data: { accountId, clientId, name } });
  res.status(201).json(project);
});
