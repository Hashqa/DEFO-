import { prisma } from "../db";
import { getDefaultEmailSender, type EmailSender } from "./email";

const REMINDER_AFTER_DAYS = Number(process.env.REMINDER_AFTER_DAYS ?? 7);
const REMINDER_INTERVAL_DAYS = Number(process.env.REMINDER_INTERVAL_DAYS ?? 7);

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/** Factures de vente en retard, pas relancées récemment — section 3.7. */
export async function findDueReminders(accountId?: string) {
  return prisma.billingDocument.findMany({
    where: {
      ...(accountId ? { accountId } : {}),
      type: "INVOICE",
      direction: "SALE",
      status: { in: ["SENT", "ACCEPTED", "OVERDUE"] },
      dueAt: { lt: daysAgo(REMINDER_AFTER_DAYS) },
      OR: [{ lastReminderSentAt: null }, { lastReminderSentAt: { lt: daysAgo(REMINDER_INTERVAL_DAYS) } }],
    },
    include: { client: true, account: true },
  });
}

async function sendReminder(sender: EmailSender, invoice: Awaited<ReturnType<typeof findDueReminders>>[number]) {
  if (!invoice.client.email) return false;

  await sender.send({
    to: invoice.client.email,
    subject: `Rappel de paiement — facture ${invoice.sequenceNumber}`,
    body: [
      `Bonjour ${invoice.client.name},`,
      "",
      `La facture ${invoice.sequenceNumber} d'un montant de ${Number(invoice.totalInclVat).toFixed(2)} €, émise par ${invoice.account.companyName}, est en retard de paiement.`,
      "Merci de régulariser dans les meilleurs délais.",
      "",
      "Cordialement.",
    ].join("\n"),
  });

  await prisma.billingDocument.update({
    where: { id: invoice.id },
    data: { status: "OVERDUE", lastReminderSentAt: new Date() },
  });
  return true;
}

/** Les factures sont indépendantes les unes des autres : les relances partent en parallèle plutôt qu'une par une. */
export async function sendPaymentReminders(
  sender: EmailSender = getDefaultEmailSender(),
  accountId?: string
): Promise<{ sentCount: number; total: number }> {
  const invoices = await findDueReminders(accountId);
  const results = await Promise.allSettled(invoices.map((invoice) => sendReminder(sender, invoice)));
  const sentCount = results.filter((result) => result.status === "fulfilled" && result.value).length;

  return { sentCount, total: invoices.length };
}
