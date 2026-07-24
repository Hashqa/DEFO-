"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NavBar } from "../../components/NavBar";
import { DocumentsTable, type DocumentRecord } from "../../components/DocumentsTable";
import { apiFetch, fetchDocumentPdfUrl } from "../../lib/api";
import { useRequireAuth } from "../../lib/useRequireAuth";

export default function QuotesPage() {
  useRequireAuth();

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch<DocumentRecord[]>("/documents?type=QUOTE");
      setDocuments(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function convertToInvoice(id: string) {
    setError(null);
    try {
      await apiFetch(`/documents/${id}/convert`, { method: "POST" });
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

  return (
    <main>
      <NavBar active="/quotes" />
      <h1>Devis</h1>
      <div className="toolbar">
        <Link href="/documents/new?type=QUOTE" className="btn">
          + Nouveau devis
        </Link>
      </div>
      {error && <p role="alert">{error}</p>}

      <DocumentsTable documents={documents} onViewPdf={viewPdf} onConvertToInvoice={convertToInvoice} />
    </main>
  );
}
