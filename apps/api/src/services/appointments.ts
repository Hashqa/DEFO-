import type { Account, Appointment, Client } from "@prisma/client";
import { prisma } from "../db";
import { getDefaultEmailSender, type EmailSender } from "./email";
import { buildIcsEvent } from "./ics";

type AppointmentWithRelations = Appointment & { client: Client; account: Account };

interface CreateAppointmentInput {
  accountId: string;
  clientId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location?: string;
  notes?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAppointmentIcs(appointment: Appointment): string {
  return buildIcsEvent({
    uid: appointment.id,
    title: appointment.title,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
    location: appointment.location ?? undefined,
    description: appointment.notes ?? undefined,
  });
}

async function sendAppointmentEmail(sender: EmailSender, appointment: AppointmentWithRelations): Promise<void> {
  if (!appointment.client.email) return;

  const calendarUrl = `${process.env.PUBLIC_API_URL ?? "http://localhost:3001"}/public/appointments/${appointment.calendarToken}/calendar.ics`;
  const formattedDate = appointment.startsAt.toLocaleString("fr-BE", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Brussels",
  });
  const ics = buildAppointmentIcs(appointment);

  await sender.send({
    to: appointment.client.email,
    subject: `Rendez-vous confirmé — ${appointment.title}`,
    body: [
      `Bonjour ${appointment.client.name},`,
      "",
      `Votre rendez-vous "${appointment.title}" avec ${appointment.account.companyName} est fixé le ${formattedDate}.`,
      appointment.location ? `Lieu : ${appointment.location}` : undefined,
      "",
      `Ajoutez-le à votre calendrier : ${calendarUrl}`,
      "",
      "Cordialement.",
    ]
      .filter((line): line is string => line !== undefined)
      .join("\n"),
    html: [
      `<p>Bonjour ${escapeHtml(appointment.client.name)},</p>`,
      `<p>Votre rendez-vous <strong>${escapeHtml(appointment.title)}</strong> avec ${escapeHtml(appointment.account.companyName)} est fixé le <strong>${formattedDate}</strong>.</p>`,
      appointment.location ? `<p>Lieu : ${escapeHtml(appointment.location)}</p>` : "",
      `<p><a href="${calendarUrl}" style="display:inline-block;background:#0e9f6e;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Ajouter à mon calendrier</a></p>`,
      "<p>Cordialement.</p>",
    ].join(""),
    attachments: [{ filename: "rendez-vous.ics", content: Buffer.from(ics).toString("base64") }],
  });
}

/** Crée le rendez-vous puis envoie (au mieux, sans bloquer la réponse en cas d'échec) la confirmation au client. */
export async function createAppointment(
  input: CreateAppointmentInput,
  sender: EmailSender = getDefaultEmailSender()
): Promise<AppointmentWithRelations> {
  if (input.endsAt <= input.startsAt) {
    throw new Error("L'heure de fin doit être après l'heure de début");
  }

  const appointment = await prisma.appointment.create({
    data: input,
    include: { client: true, account: true },
  });

  try {
    await sendAppointmentEmail(sender, appointment);
  } catch {
    // Le rendez-vous est créé même si l'email échoue (client sans email, Resend indisponible...).
  }

  return appointment;
}
