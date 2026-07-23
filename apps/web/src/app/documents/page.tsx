"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, fetchDocumentPdfUrl } from "../../lib/api";
import { useRequireAuth } from "../../lib/useRequireAuth";

interface DocumentRecord {
  id: string;
  type: "QUOTE" | "INVOICE";
  sequenceNumber: string;
  status: string;
  totalInclVat: string;
  client: { name: string };
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

  async function convertToInvoice(id: string) {
    setError(null);
    try {
      await apiFetch(`/documents/${id}/convert`, { method: "POST" });
      const data = await apiFetch<DocumentRecord[]>("/documents");
      setDocuments(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function viewPdf(id: string) {
    try {
      const url = await fetchDocumentPdfUrl(id);
      window.open(url, "_blank");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const [reminderResult, setReminderResult] = useState<string | null>(null);

  async function runReminders() {
    setError(null);
    setReminderResult(null);
    try {
      const result = await apiFetch<{ sentCount: number; total: number }>("/documents/reminders/run", {
        method: "POST",
      });
      setReminderResult(`${result.sentCount}/${result.total} relance(s) envoyée(s).`);
      const data = await apiFetch<DocumentRecord[]>("/documents");
      setDocuments(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main>
      <nav>
        <strong>Devis &amp; factures</strong> · <Link href="/clients">Clients</Link> ·{" "}
        <Link href="/dashboard">Tableau de bord</Link> · <Link href="/account">Compte</Link>
      </nav>
      <h1>Devis &amp; factures</h1>
      <p>
        <Link href="/documents/new">+ Nouveau devis/facture</Link>{" "}
        <button type="button" onClick={runReminders}>
          Envoyer les relances de paiement
        </button>
      </p>
      {error && <p role="alert">{error}</p>}
      {reminderResult && <p>{reminderResult}</p>}

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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
