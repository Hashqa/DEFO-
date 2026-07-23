import { prisma } from "../db";
import { ConsoleEmailSender, type EmailSender } from "./email";

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

export async function sendPaymentReminders(
  sender: EmailSender = new ConsoleEmailSender(),
  accountId?: string
): Promise<{ sentCount: number; total: number }> {
  const invoices = await findDueReminders(accountId);
  let sentCount = 0;

  for (const invoice of invoices) {
    if (!invoice.client.email) continue;

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
    sentCount++;
  }

  return { sentCount, total: invoices.length };
}
