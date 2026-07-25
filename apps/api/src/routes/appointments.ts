import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { createAppointment } from "../services/appointments";
import { findOwnedAppointment, findOwnedClient } from "../services/ownership";

export const appointmentsRouter = Router();
appointmentsRouter.use(requireAuth);

appointmentsRouter.get("/", async (req, res) => {
  const accountId = req.accountId!;
  const appointments = await prisma.appointment.findMany({
    where: { accountId },
    include: { client: true },
    orderBy: { startsAt: "asc" },
  });
  res.json(appointments);
});

appointmentsRouter.post("/", async (req, res) => {
  const accountId = req.accountId!;
  const { clientId, title, startsAt, endsAt, location, notes } = req.body;
  if (!clientId || !title || !startsAt || !endsAt) {
    res.status(400).json({ error: "clientId, title, startsAt et endsAt sont requis" });
    return;
  }

  const client = await findOwnedClient(accountId, clientId);
  if (!client) {
    res.status(404).json({ error: "Client introuvable" });
    return;
  }

  try {
    const appointment = await createAppointment({
      accountId,
      clientId,
      title,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      location: location || undefined,
      notes: notes || undefined,
    });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

appointmentsRouter.delete("/:id", async (req, res) => {
  const accountId = req.accountId!;
  const existing = await findOwnedAppointment(accountId, req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Rendez-vous introuvable" });
    return;
  }
  await prisma.appointment.delete({ where: { id: existing.id } });
  res.status(204).send();
});
