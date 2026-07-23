import { randomUUID } from "node:crypto";
import type {
  BillingDocument,
  BillingKind,
  DocumentDirection,
  DocumentType,
} from "@prisma/client";
import { prisma } from "../db";
import { nextSequenceNumber } from "./documentNumbering";

export interface DocumentLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: 0 | 6 | 12 | 21;
}

export interface CreateDocumentInput {
  clientId: string;
  projectId?: string;
  type: DocumentType;
  direction: DocumentDirection;
  billingKind: BillingKind;
  dueAt?: string;
  lines: DocumentLineInput[];
}

export function computeTotals(lines: DocumentLineInput[]) {
  return lines.reduce(
    (totals, line) => {
      const lineExclVat = line.quantity * line.unitPrice;
      const lineInclVat = lineExclVat * (1 + line.vatRate / 100);
      return {
        totalExclVat: totals.totalExclVat + lineExclVat,
        totalInclVat: totals.totalInclVat + lineInclVat,
      };
    },
    { totalExclVat: 0, totalInclVat: 0 }
  );
}

export async function createDocument(accountId: string, input: CreateDocumentInput) {
  if (input.lines.length === 0) {
    throw new Error("Un devis/facture doit contenir au moins une ligne");
  }
  const { totalExclVat, totalInclVat } = computeTotals(input.lines);

  return prisma.$transaction(async (tx) => {
    const sequenceNumber = await nextSequenceNumber(tx, accountId, input.type);
    return tx.billingDocument.create({
      data: {
        accountId,
        clientId: input.clientId,
        projectId: input.projectId,
        type: input.type,
        direction: input.direction,
        billingKind: input.billingKind,
        sequenceNumber,
        totalExclVat,
        totalInclVat,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        lines: {
          create: input.lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            vatRate: line.vatRate,
          })),
        },
      },
      include: { lines: true },
    });
  });
}

export async function listDocuments(
  accountId: string,
  filters: { type?: DocumentType; direction?: DocumentDirection; clientId?: string; projectId?: string }
) {
  return prisma.billingDocument.findMany({
    where: { accountId, ...filters },
    include: { lines: true },
    orderBy: { issuedAt: "desc" },
  });
}

export async function getDocument(accountId: string, id: string) {
  return prisma.billingDocument.findFirst({
    where: { id, accountId },
    include: { lines: true, client: true, project: true, account: true },
  });
}

async function assertConvertibleQuote(accountId: string, quoteId: string) {
  const quote = await prisma.billingDocument.findFirst({
    where: { id: quoteId, accountId, type: "QUOTE" },
    include: { lines: true },
  });
  if (!quote) {
    throw new Error("Devis introuvable");
  }
  if (quote.convertedFromQuoteId !== null) {
    // convertedFromQuoteId is only set on invoices; guard kept for type-safety.
  }
  return quote;
}

async function createInvoiceFromQuote(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  quote: BillingDocument & { lines: { description: string; quantity: unknown; unitPrice: unknown; vatRate: number }[] }
) {
  const sequenceNumber = await nextSequenceNumber(tx, quote.accountId, "INVOICE");
  return tx.billingDocument.create({
    data: {
      accountId: quote.accountId,
      clientId: quote.clientId,
      projectId: quote.projectId ?? undefined,
      type: "INVOICE",
      direction: quote.direction,
      billingKind: quote.billingKind,
      sequenceNumber,
      totalExclVat: quote.totalExclVat,
      totalInclVat: quote.totalInclVat,
      convertedFromQuoteId: quote.id,
      lines: {
        create: quote.lines.map((line) => ({
          description: line.description,
          quantity: line.quantity as unknown as number,
          unitPrice: line.unitPrice as unknown as number,
          vatRate: line.vatRate,
        })),
      },
    },
    include: { lines: true },
  });
}

/** Décision seule de l'indépendant : conversion immédiate du devis en facture. */
export async function convertQuoteByOwnerDecision(accountId: string, quoteId: string) {
  const quote = await assertConvertibleQuote(accountId, quoteId);
  return prisma.$transaction(async (tx) => {
    const invoice = await createInvoiceFromQuote(tx, quote);
    await tx.billingDocument.update({
      where: { id: quote.id },
      data: { status: "ACCEPTED" },
    });
    return invoice;
  });
}

/**
 * Génère un lien de validation en ligne pour le client. Le devis passe en
 * statut SENT ; la facture n'est créée que lorsque le client clique
 * (voir `acceptQuoteByToken`).
 */
export async function requestClientValidation(accountId: string, quoteId: string) {
  await assertConvertibleQuote(accountId, quoteId);
  const acceptanceToken = randomUUID();
  return prisma.billingDocument.update({
    where: { id: quoteId },
    data: { status: "SENT", acceptanceToken },
  });
}

/** Appelé depuis l'endpoint public quand le client clique sur le lien de validation. */
export async function acceptQuoteByToken(token: string) {
  const quote = await prisma.billingDocument.findFirst({
    where: { acceptanceToken: token, type: "QUOTE" },
    include: { lines: true },
  });
  if (!quote) {
    throw new Error("Lien de validation invalide ou expiré");
  }
  return prisma.$transaction(async (tx) => {
    const invoice = await createInvoiceFromQuote(tx, quote);
    await tx.billingDocument.update({
      where: { id: quote.id },
      data: { status: "ACCEPTED", acceptanceToken: null },
    });
    return invoice;
  });
}
