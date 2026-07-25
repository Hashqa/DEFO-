import { Router } from "express";
import { prisma } from "../db";
import { buildAppointmentIcs } from "../services/appointments";
import { acceptQuoteByToken } from "../services/documents";

/**
 * Endpoints sans authentification : le token dans l'URL fait office d'accès.
 * Utilisés pour la validation en ligne d'un devis par le client (lien + clic).
 */
export const publicRouter = Router();

publicRouter.get("/quotes/:token", async (req, res) => {
  const quote = await prisma.billingDocument.findFirst({
    where: { acceptanceToken: req.params.token, type: "QUOTE" },
    include: { lines: true, client: true },
  });
  if (!quote) {
    res.status(404).json({ error: "Lien de validation invalide ou expiré" });
    return;
  }
  res.json(quote);
});

publicRouter.post("/quotes/:token/accept", async (req, res) => {
  try {
    const invoice = await acceptQuoteByToken(req.params.token);
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

/** Fichier .ics téléchargé depuis le bouton "Ajouter à mon calendrier" de l'email de confirmation. */
publicRouter.get("/appointments/:token/calendar.ics", async (req, res) => {
  const appointment = await prisma.appointment.findFirst({ where: { calendarToken: req.params.token } });
  if (!appointment) {
    res.status(404).send("Rendez-vous introuvable");
    return;
  }
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="rendez-vous.ics"');
  res.send(buildAppointmentIcs(appointment));
});
