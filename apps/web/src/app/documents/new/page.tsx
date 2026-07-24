"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, apiUpload } from "../../../lib/api";
import { useRequireAuth } from "../../../lib/useRequireAuth";

interface ExtractedInvoice {
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  totalNet?: number;
  totalTax?: number;
  raw: Record<string, unknown>;
}

interface ClientRecord {
  id: string;
  name: string;
}

interface LineInput {
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: "0" | "6" | "12" | "21";
}

const EMPTY_LINE: LineInput = { description: "", quantity: "1", unitPrice: "0", vatRate: "21" };

export default function NewDocumentPage() {
  useRequireAuth();
  const router = useRouter();

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState<"QUOTE" | "INVOICE">("QUOTE");
  const [direction, setDirection] = useState<"SALE" | "PURCHASE">("SALE");
  const [billingKind, setBillingKind] = useState<"SERVICE" | "MATERIAL_AND_LABOR">("SERVICE");
  const [lines, setLines] = useState<LineInput[]>([{ ...EMPTY_LINE }]);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedInvoice | null>(null);

  async function handleScan(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setScanning(true);
    try {
      const result = await apiUpload<ExtractedInvoice>("/documents/scan-invoice", file);
      setExtracted(result);
      if (result.totalNet !== undefined) {
        setLines([
          {
            description: result.supplierName
              ? `Facture ${result.supplierName}${result.invoiceNumber ? ` (${result.invoiceNumber})` : ""}`
              : "Facture fournisseur (scannée)",
            quantity: "1",
            unitPrice: String(result.totalNet),
            vatRate: "21",
          },
        ]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    apiFetch<ClientRecord[]>("/clients")
      .then(setClients)
      .catch((err) => setError((err as Error).message));
  }, []);

  function updateLine(index: number, field: keyof LineInput, value: string) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/documents", {
        method: "POST",
        body: JSON.stringify({
          clientId,
          type,
          direction,
          billingKind,
          lines: lines.map((l) => ({
            description: l.description,
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice),
            vatRate: Number(l.vatRate),
          })),
        }),
      });
      router.push("/documents");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main>
      <h1>Nouveau devis/facture</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Client
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as "QUOTE" | "INVOICE")}>
            <option value="QUOTE">Devis</option>
            <option value="INVOICE">Facture</option>
          </select>
        </label>

        <label>
          Sens
          <select value={direction} onChange={(e) => setDirection(e.target.value as "SALE" | "PURCHASE")}>
            <option value="SALE">Vente</option>
            <option value="PURCHASE">Achat</option>
          </select>
        </label>

        <label>
          Logique de facturation
          <select
            value={billingKind}
            onChange={(e) => setBillingKind(e.target.value as "SERVICE" | "MATERIAL_AND_LABOR")}
          >
            <option value="SERVICE">Service (temps/prestation)</option>
            <option value="MATERIAL_AND_LABOR">Matière première + main d'œuvre</option>
          </select>
        </label>

        {direction === "PURCHASE" && (
          <div>
            <h2>Scanner la facture (achats)</h2>
            <input type="file" accept="image/*,.pdf" onChange={handleScan} disabled={scanning} />
            {scanning && <p>Analyse en cours…</p>}
            {extracted && (
              <details>
                <summary>Données extraites (à vérifier)</summary>
                <pre>{JSON.stringify(extracted, null, 2)}</pre>
              </details>
            )}
          </div>
        )}

        <h2>Lignes</h2>
        {lines.map((line, i) => (
          <div key={i}>
            <input
              placeholder="Description"
              value={line.description}
              onChange={(e) => updateLine(i, "description", e.target.value)}
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Qté"
              value={line.quantity}
              onChange={(e) => updateLine(i, "quantity", e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              placeholder="PU HT"
              value={line.unitPrice}
              onChange={(e) => updateLine(i, "unitPrice", e.target.value)}
            />
            <select value={line.vatRate} onChange={(e) => updateLine(i, "vatRate", e.target.value as LineInput["vatRate"])}>
              <option value="0">0%</option>
              <option value="6">6%</option>
              <option value="12">12%</option>
              <option value="21">21%</option>
            </select>
            {lines.length > 1 && (
              <button type="button" onClick={() => removeLine(i)}>
                Retirer
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addLine}>
          + Ligne
        </button>

        {error && <p role="alert">{error}</p>}
        <div>
          <button type="submit">Créer</button>
        </div>
      </form>
    </main>
  );
}
