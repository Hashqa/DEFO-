const BASE_URL = "https://api-v2.mindee.net/v2";

function apiKey(): string {
  const key = process.env.MINDEE_API_KEY;
  if (!key) throw new Error("MINDEE_API_KEY non configuré");
  return key;
}

function modelId(): string {
  const id = process.env.MINDEE_INVOICE_MODEL_ID;
  if (!id) {
    throw new Error(
      "MINDEE_INVOICE_MODEL_ID non configuré — ajoute le modèle Invoice depuis le catalogue Mindee à ton espace pour obtenir cet id"
    );
  }
  return id;
}

interface EnqueueResponse {
  job: { id: string; status: string };
}

/** Envoie une image/PDF de facture à Mindee pour extraction (API v2, asynchrone). */
async function enqueueDocument(file: Buffer, filename: string): Promise<string> {
  const form = new FormData();
  form.append("model_id", modelId());
  form.append("file", new Blob([new Uint8Array(file)]), filename);

  const res = await fetch(`${BASE_URL}/inferences/enqueue`, {
    method: "POST",
    headers: { Authorization: apiKey() },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.detail ?? `Erreur Mindee ${res.status}`);
  }
  return (body as EnqueueResponse).job.id;
}

interface JobStatusResponse {
  job: { id: string; status: string; result?: { inference?: { id: string } } };
}

export interface MindeeField {
  value?: string | number;
  confidence?: number;
}

export interface MindeeInferenceResult {
  fields: Record<string, MindeeField>;
}

/** Interroge le job jusqu'à ce que l'extraction soit terminée (budget de temps limité). */
async function pollUntilDone(jobId: string, timeoutMs = 20000): Promise<MindeeInferenceResult> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${BASE_URL}/jobs/${jobId}`, { headers: { Authorization: apiKey() } });
    const body = (await res.json()) as JobStatusResponse;
    if (!res.ok) {
      throw new Error(`Erreur Mindee lors du suivi du job (${res.status})`);
    }
    if (body.job.status.toLowerCase().includes("process") && body.job.result?.inference) {
      const inferenceId = body.job.result.inference.id;
      const inferenceRes = await fetch(`${BASE_URL}/inferences/${inferenceId}`, {
        headers: { Authorization: apiKey() },
      });
      return (await inferenceRes.json()) as MindeeInferenceResult;
    }
    if (body.job.status.toLowerCase().includes("fail")) {
      throw new Error("Le traitement Mindee a échoué");
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Délai dépassé en attendant le résultat Mindee");
}

export interface ExtractedInvoice {
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  totalNet?: number;
  totalTax?: number;
  raw: Record<string, MindeeField>;
}

/**
 * Scanne une facture fournisseur (section 3.2). Les noms de champs exacts
 * renvoyés par le modèle Invoice v2 n'ont pas pu être vérifiés en conditions
 * réelles (aucune facture de test disponible) — cette extraction reste donc
 * best-effort ; `raw` est toujours renvoyé pour permettre une vérification
 * manuelle si le mapping ci-dessous ne correspond pas exactement.
 */
export async function scanInvoice(file: Buffer, filename: string): Promise<ExtractedInvoice> {
  const jobId = await enqueueDocument(file, filename);
  const result = await pollUntilDone(jobId);
  const fields = result.fields ?? {};

  const asNumber = (value: string | number | undefined): number | undefined => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(",", "."));
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  };
  const asString = (value: string | number | undefined): string | undefined =>
    value === undefined ? undefined : String(value);

  return {
    supplierName: asString(fields.supplier_name?.value ?? fields.supplier?.value),
    invoiceNumber: asString(fields.invoice_number?.value ?? fields.document_number?.value),
    invoiceDate: asString(fields.date?.value ?? fields.invoice_date?.value),
    totalAmount: asNumber(fields.total_amount?.value),
    totalNet: asNumber(fields.total_net?.value),
    totalTax: asNumber(fields.total_tax?.value),
    raw: fields,
  };
}
