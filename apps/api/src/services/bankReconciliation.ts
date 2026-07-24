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
  const [openInvoices, transactionsByAccount] = await Promise.all([
    prisma.billingDocument.findMany({
      where: { accountId, type: "INVOICE", direction: "SALE", status: { notIn: ["PAID", "REFUSED"] } },
    }),
    Promise.all(pontoAccounts.map((account) => listTransactions(account.id))),
  ]);

  const allTransactions = transactionsByAccount.flat();
  const candidates = allTransactions.filter((transaction) => transaction.amount > 0);
  const alreadyReconciled = await prisma.payment.findMany({
    where: { externalTransactionId: { in: candidates.map((transaction) => transaction.id) } },
    select: { externalTransactionId: true },
  });
  const reconciledIds = new Set(alreadyReconciled.map((payment) => payment.externalTransactionId));

  let matchedCount = 0;

  for (const transaction of candidates) {
    if (reconciledIds.has(transaction.id)) continue;

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

  return { matchedCount, transactionsScanned: allTransactions.length };
}
