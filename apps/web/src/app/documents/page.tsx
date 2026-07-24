"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavBar } from "../../components/NavBar";
import { apiFetch, fetchDocumentPdfUrl } from "../../lib/api";
import { useRequireAuth } from "../../lib/useRequireAuth";

interface DocumentRecord {
  id: string;
  type: "QUOTE" | "INVOICE";
  direction: "PURCHASE" | "SALE";
  sequenceNumber: string;
  status: string;
  totalInclVat: string;
  client: { name: string; isBusiness: boolean; peppolAddress?: string };
  peppolSentAt?: string;
}

export default function DocumentsPage() {
  useRequireAuth();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DocumentRecord[]>("/documents")
      .then(setDocuments)
      .catch((err) => setError((err as Error).message));
  }, []);

  /** Les actions ci-dessous partagent toutes la forme "appeler l'API, puis recharger la liste, en gérant l'erreur". */
  async function runAction<T>(action: () => Promise<T>, onSuccess?: (result: T) => void) {
    setError(null);
    try {
      const result = await action();
      onSuccess?.(result);
      const data = await apiFetch<DocumentRecord[]>("/documents");
      setDocuments(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const convertToInvoice = (id: string) => runAction(() => apiFetch(`/documents/${id}/convert`, { method: "POST" }));

  const sendPeppol = (id: string) => runAction(() => apiFetch(`/documents/${id}/send-peppol`, { method: "POST" }));

  async function viewPdf(id: string) {
    try {
      const url = await fetchDocumentPdfUrl(id);
      window.open(url, "_blank");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const [reconcileResult, setReconcileResult] = useState<string | null>(null);

  function reconcilePayments() {
    setReconcileResult(null);
    return runAction(
      () =>
        apiFetch<{ matchedCount: number; transactionsScanned: number }>("/documents/reconcile-payments", {
          method: "POST",
        }),
      (result) =>
        setReconcileResult(
          `${result.matchedCount} facture(s) rapprochée(s) sur ${result.transactionsScanned} transaction(s) scannée(s).`
        )
    );
  }

  const [reminderResult, setReminderResult] = useState<string | null>(null);

  function runReminders() {
    setReminderResult(null);
    return runAction(
      () => apiFetch<{ sentCount: number; total: number }>("/documents/reminders/run", { method: "POST" }),
      (result) => setReminderResult(`${result.sentCount}/${result.total} relance(s) envoyée(s).`)
    );
  }

  return (
    <main>
      <NavBar active="/documents" />
      <h1>Devis &amp; factures</h1>
      <p>
        <Link href="/documents/new">+ Nouveau devis/facture</Link>{" "}
        <button type="button" onClick={runReminders}>
          Envoyer les relances de paiement
        </button>{" "}
        <button type="button" onClick={reconcilePayments}>
          Rapprocher les paiements bancaires (Ponto)
        </button>
      </p>
      {error && <p role="alert">{error}</p>}
      {reminderResult && <p>{reminderResult}</p>}
      {reconcileResult && <p>{reconcileResult}</p>}

      <table>
        <thead>
          <tr>
            <th>N°</th>
            <th>Type</th>
            <th>Client</th>
            <th>Statut</th>
            <th>Total TTC</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr key={d.id}>
              <td>{d.sequenceNumber}</td>
              <td>{d.type === "QUOTE" ? "Devis" : "Facture"}</td>
              <td>{d.client?.name}</td>
              <td>{d.status}</td>
              <td>{d.totalInclVat} €</td>
              <td>
                <button type="button" onClick={() => viewPdf(d.id)}>
                  PDF
                </button>
                {d.type === "QUOTE" && (
                  <button type="button" onClick={() => convertToInvoice(d.id)}>
                    Convertir en facture
                  </button>
                )}
                {d.type === "INVOICE" && d.direction === "SALE" && d.client?.isBusiness && d.client?.peppolAddress && (
                  <button type="button" onClick={() => sendPeppol(d.id)} disabled={Boolean(d.peppolSentAt)}>
                    {d.peppolSentAt ? "Envoyé via Peppol" : "Envoyer via Peppol"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
