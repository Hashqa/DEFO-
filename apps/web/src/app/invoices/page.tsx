"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavBar } from "../../components/NavBar";
import { DocumentsTable, type DocumentRecord } from "../../components/DocumentsTable";
import { apiFetch, fetchDocumentPdfUrl } from "../../lib/api";
import { useRequireAuth } from "../../lib/useRequireAuth";

export default function InvoicesPage() {
  useRequireAuth();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reconcileResult, setReconcileResult] = useState<string | null>(null);
  const [reminderResult, setReminderResult] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch<DocumentRecord[]>("/documents?type=INVOICE");
      setDocuments(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function sendPeppol(id: string) {
    setError(null);
    try {
      await apiFetch(`/documents/${id}/send-peppol`, { method: "POST" });
      await load();
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

  async function reconcilePayments() {
    setError(null);
    setReconcileResult(null);
    try {
      const result = await apiFetch<{ matchedCount: number; transactionsScanned: number }>(
        "/documents/reconcile-payments",
        { method: "POST" }
      );
      setReconcileResult(
        `${result.matchedCount} facture(s) rapprochée(s) sur ${result.transactionsScanned} transaction(s) scannée(s).`
      );
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function runReminders() {
    setError(null);
    setReminderResult(null);
    try {
      const result = await apiFetch<{ sentCount: number; total: number }>("/documents/reminders/run", {
        method: "POST",
      });
      setReminderResult(`${result.sentCount}/${result.total} relance(s) envoyée(s).`);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main>
      <NavBar active="/invoices" />
      <h1>Factures</h1>
      <div className="toolbar">
        <Link href="/documents/new?type=INVOICE" className="btn">
          + Nouvelle facture
        </Link>
        <button type="button" onClick={runReminders}>
          Envoyer les relances de paiement
        </button>
        <button type="button" onClick={reconcilePayments}>
          Rapprocher les paiements bancaires (Ponto)
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {reminderResult && <p>{reminderResult}</p>}
      {reconcileResult && <p>{reconcileResult}</p>}

      <DocumentsTable documents={documents} onViewPdf={viewPdf} onSendPeppol={sendPeppol} />
    </main>
  );
}
