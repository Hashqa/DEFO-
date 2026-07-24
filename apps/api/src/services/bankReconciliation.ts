import { prisma } from "../db";
import { listAccounts, listTransactions } from "./ponto";

export interface ReconciliationResult {
  matchedCount: number;
  transactionsScanned: number;
}

/**
 * Rapproche les transactions bancaires Ponto avec les factures de vente non
 * payées, en cherchant le numéro de facture (référence du QR EPC) dans la
 * communication de la transaction — section 3.4 du cahier des charges.
 */
export async function reconcilePayments(accountId: string): Promise<ReconciliationResult> {
  const pontoAccounts = await listAccounts();
  const openInvoices = await prisma.billingDocument.findMany({
    where: { accountId, type: "INVOICE", direction: "SALE", status: { notIn: ["PAID", "REFUSED"] } },
  });

  let matchedCount = 0;
  let transactionsScanned = 0;

  for (const pontoAccount of pontoAccounts) {
    const transactions = await listTransactions(pontoAccount.id);
    transactionsScanned += transactions.length;

    for (const transaction of transactions) {
      if (transaction.amount <= 0) continue;

      const existingPayment = await prisma.payment.findUnique({
        where: { externalTransactionId: transaction.id },
      });
      if (existingPayment) continue;

      const communication = `${transaction.remittanceInformation ?? ""} ${transaction.description ?? ""}`;
      const invoice = openInvoices.find(
        (doc) =>
          communication.includes(doc.sequenceNumber) &&
          Math.abs(Number(doc.totalInclVat) - transaction.amount) < 0.01
      );
      if (!invoice) continue;

      await prisma.$transaction([
        prisma.payment.create({
          data: {
            accountId,
            documentId: invoice.id,
            amount: transaction.amount,
            paidAt: new Date(transaction.valueDate),
            source: "BANK_RECONCILIATION",
            externalTransactionId: transaction.id,
          },
        }),
        prisma.billingDocument.update({ where: { id: invoice.id }, data: { status: "PAID" } }),
      ]);
      matchedCount++;
      openInvoices.splice(openInvoices.indexOf(invoice), 1);
    }
  }

  return { matchedCount, transactionsScanned };
}
