import type { FullDocument } from "./documents";

const BASE_URL = process.env.RECOMMAND_BASE_URL ?? "https://app.recommand.eu/api/v1";

function authHeader(): string {
  const key = process.env.RECOMMAND_API_KEY;
  const secret = process.env.RECOMMAND_API_SECRET;
  if (!key || !secret) {
    throw new Error("RECOMMAND_API_KEY / RECOMMAND_API_SECRET non configurés");
  }
  return `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;
}

async function recommandFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const message = body.errors ? JSON.stringify(body.errors) : `Erreur Recommand ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

export interface RecommandCompany {
  id: string;
  name: string;
  enterpriseNumber?: string;
  vatNumber?: string;
  isSmpRecipient: boolean;
}

export interface CreateCompanyInput {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  vatNumber?: string;
  enterpriseNumber?: string;
  email?: string;
}

export interface CreateCompanyResult {
  success: boolean;
  company: RecommandCompany;
  /** Lien pour compléter la vérification d'identité de l'entreprise chez Recommand. */
  verificationUrl?: string;
}

/** Enregistre l'entreprise du compte chez Recommand — nécessaire avant de pouvoir envoyer via Peppol. */
export async function createCompany(input: CreateCompanyInput): Promise<CreateCompanyResult> {
  return recommandFetch<CreateCompanyResult>("/companies", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface VerifyRecipientResult {
  success: boolean;
  isValid: boolean;
  smpUrl?: string;
  supportedDocuments?: { name: string; docTypeId: string; serviceEndpoint: string }[];
}

/** Vérifie qu'un destinataire est bien joignable sur le réseau Peppol avant envoi. */
export async function verifyRecipient(peppolAddress: string): Promise<VerifyRecipientResult> {
  return recommandFetch<VerifyRecipientResult>("/verify", {
    method: "POST",
    body: JSON.stringify({ peppolAddress, includeEndpointDetails: true }),
  });
}

export interface SendInvoiceResult {
  success: boolean;
  id: string;
  sentOverPeppol: boolean;
  sentOverEmail: boolean;
}

/** Construit le corps JSON attendu par POST /{companyId}/send à partir de nos données. */
export function buildInvoicePayload(document: FullDocument) {
  const vatRatesUsed = [...new Set(document.lines.map((line) => line.vatRate))];

  return {
    recipient: document.client.peppolAddress,
    documentType: "invoice",
    document: {
      invoiceNumber: document.sequenceNumber,
      issueDate: document.issuedAt.toISOString().slice(0, 10),
      dueDate: document.dueAt?.toISOString().slice(0, 10),
      buyer: {
        vatNumber: document.client.vatNumber ?? undefined,
        name: document.client.name,
        street: document.client.address ?? "",
        city: document.client.city ?? "",
        postalZone: document.client.postalCode ?? "",
        country: document.client.country,
      },
      seller: {
        vatNumber: document.account.vatNumber,
        name: document.account.companyName,
        street: document.account.street ?? "",
        city: document.account.city ?? "",
        postalZone: document.account.postalCode ?? "",
        country: document.account.country,
      },
      paymentMeans: document.account.iban
        ? [{ paymentMethod: "credit_transfer", reference: document.sequenceNumber, iban: document.account.iban }]
        : undefined,
      lines: document.lines.map((line) => ({
        name: line.description,
        quantity: String(line.quantity),
        unitCode: "EA",
        netPriceAmount: String(line.unitPrice),
        netAmount: (Number(line.quantity) * Number(line.unitPrice)).toFixed(2),
        vat: { category: line.vatRate === 0 ? "Z" : "S", percentage: String(line.vatRate) },
      })),
      totals: {
        taxExclusiveAmount: Number(document.totalExclVat).toFixed(2),
        taxInclusiveAmount: Number(document.totalInclVat).toFixed(2),
        payableAmount: Number(document.totalInclVat).toFixed(2),
      },
      vat: {
        totalVatAmount: (Number(document.totalInclVat) - Number(document.totalExclVat)).toFixed(2),
        subtotals: vatRatesUsed.map((rate) => {
          const linesAtRate = document.lines.filter((line) => line.vatRate === rate);
          const taxableAmount = linesAtRate.reduce(
            (sum, line) => sum + Number(line.quantity) * Number(line.unitPrice),
            0
          );
          return {
            taxableAmount: taxableAmount.toFixed(2),
            vatAmount: (taxableAmount * (rate / 100)).toFixed(2),
            category: rate === 0 ? "Z" : "S",
            percentage: String(rate),
          };
        }),
      },
    },
  };
}

/** Envoie la facture via l'Access Point Recommand. Lève une erreur explicite si les prérequis manquent. */
export async function sendInvoice(companyId: string, document: FullDocument): Promise<SendInvoiceResult> {
  if (!document.client.peppolAddress) {
    throw new Error("Le client n'a pas d'adresse Peppol renseignée");
  }
  const payload = buildInvoicePayload(document);
  return recommandFetch<SendInvoiceResult>(`/${companyId}/send`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
