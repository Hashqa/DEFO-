import { prisma } from "../db";

export interface StatsRange {
  from?: Date;
  to?: Date;
}

export interface TopClient {
  clientId: string;
  name: string;
  totalInclVat: number;
}

export interface AccountStats {
  revenueExclVat: number;
  purchasesExclVat: number;
  /** Approximation simple : ventes HT - achats HT sur la même période, pas un rapprochement ligne à ligne. */
  margin: number;
  invoiceCount: number;
  topClients: TopClient[];
}

function sumExclVat(documents: { totalExclVat: unknown }[]): number {
  return documents.reduce((total, doc) => total + Number(doc.totalExclVat), 0);
}

/** Tableau de bord : CA, marge, top clients (section 3.7). Ne compte que les factures émises (hors brouillons). */
export async function computeStats(accountId: string, range: StatsRange = {}): Promise<AccountStats> {
  const issuedAtFilter =
    range.from || range.to
      ? { issuedAt: { gte: range.from, lte: range.to } }
      : {};

  const [salesInvoices, purchaseInvoices] = await Promise.all([
    prisma.billingDocument.findMany({
      where: { accountId, type: "INVOICE", direction: "SALE", status: { not: "DRAFT" }, ...issuedAtFilter },
      include: { client: true },
    }),
    prisma.billingDocument.findMany({
      where: { accountId, type: "INVOICE", direction: "PURCHASE", status: { not: "DRAFT" }, ...issuedAtFilter },
    }),
  ]);

  const revenueExclVat = sumExclVat(salesInvoices);
  const purchasesExclVat = sumExclVat(purchaseInvoices);

  const byClient = new Map<string, TopClient>();
  for (const invoice of salesInvoices) {
    const existing = byClient.get(invoice.clientId);
    const totalInclVat = Number(invoice.totalInclVat);
    if (existing) {
      existing.totalInclVat += totalInclVat;
    } else {
      byClient.set(invoice.clientId, { clientId: invoice.clientId, name: invoice.client.name, totalInclVat });
    }
  }
  const topClients = [...byClient.values()].sort((a, b) => b.totalInclVat - a.totalInclVat).slice(0, 5);

  return {
    revenueExclVat,
    purchasesExclVat,
    margin: revenueExclVat - purchasesExclVat,
    invoiceCount: salesInvoices.length,
    topClients,
  };
}
