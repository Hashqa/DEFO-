/** Types de domaine partagés entre apps/api, apps/web et apps/mobile. */

export type VatRate = 0 | 6 | 12 | 21;

export type BillingKind = "SERVICE" | "MATERIAL_AND_LABOR";

export type DocumentStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REFUSED" | "PAID" | "OVERDUE";

export type DocumentDirection = "PURCHASE" | "SALE";

export type DocumentType = "QUOTE" | "INVOICE";

/** Une entreprise/indépendant inscrit — tenant isolé du SaaS. */
export interface Account {
  id: string;
  companyName: string;
  vatNumber: string;
  bceNumber: string;
  logoUrl?: string;
  brandColor?: string;
  iban?: string;
  bic?: string;
  createdAt: string;
}

/** Un utilisateur rattaché à un compte (indépendant, assistant, etc.). */
export interface User {
  id: string;
  accountId: string;
  email: string;
  fullName: string;
  role: "OWNER" | "ASSISTANT";
}

export interface Client {
  id: string;
  accountId: string;
  name: string;
  vatNumber?: string;
  email?: string;
  address?: string;
  isBusiness: boolean;
}

/** Regroupement de devis/factures par chantier ou projet. */
export interface Project {
  id: string;
  accountId: string;
  clientId: string;
  name: string;
}

export interface DocumentLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: VatRate;
}

/** Devis ou facture (achat ou vente). */
export interface BillingDocument {
  id: string;
  accountId: string;
  clientId: string;
  projectId?: string;
  type: DocumentType;
  direction: DocumentDirection;
  billingKind: BillingKind;
  status: DocumentStatus;
  sequenceNumber: string;
  lines: DocumentLine[];
  totalExclVat: number;
  totalInclVat: number;
  issuedAt: string;
  dueAt?: string;
  peppolSentAt?: string;
  convertedFromQuoteId?: string;
  acceptanceToken?: string;
}

export type ConversionMode = "OWNER_DECISION" | "CLIENT_VALIDATION";

export interface Payment {
  id: string;
  accountId: string;
  documentId: string;
  amount: number;
  paidAt: string;
  source: "BANK_RECONCILIATION" | "MANUAL";
}
