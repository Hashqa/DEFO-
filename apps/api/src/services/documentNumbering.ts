import type { DocumentType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const PREFIXES: Record<DocumentType, string> = {
  QUOTE: "QUO",
  INVOICE: "INV",
};

/**
 * Génère le prochain numéro séquentiel pour un compte + type de document
 * (ex. INV-2026-0001). Doit être appelé à l'intérieur de la transaction Prisma
 * qui crée le document, pour éviter les trous en cas de créations concurrentes
 * — le calcul se fait sur le count() dans la même transaction.
 */
export async function nextSequenceNumber(
  tx: Prisma.TransactionClient,
  accountId: string,
  type: DocumentType
): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.billingDocument.count({
    where: { accountId, type },
  });
  const sequence = String(count + 1).padStart(4, "0");
  return `${PREFIXES[type]}-${year}-${sequence}`;
}
