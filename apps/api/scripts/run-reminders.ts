import { prisma } from "../src/db";
import { sendPaymentReminders } from "../src/services/reminders";

/** À exécuter via un cron (ex. tous les jours) : relances tous comptes confondus. */
async function main() {
  const result = await sendPaymentReminders();
  console.log(`Relances envoyées : ${result.sentCount}/${result.total}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
