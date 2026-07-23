"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { useRequireAuth } from "../../lib/useRequireAuth";

interface TopClient {
  clientId: string;
  name: string;
  totalInclVat: number;
}

interface AccountStats {
  revenueExclVat: number;
  purchasesExclVat: number;
  margin: number;
  invoiceCount: number;
  topClients: TopClient[];
}

export default function DashboardPage() {
  useRequireAuth();

  const [stats, setStats] = useState<AccountStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AccountStats>("/stats")
      .then(setStats)
      .catch((err) => setError((err as Error).message));
  }, []);

  return (
    <main>
      <nav>
        <Link href="/documents">Devis &amp; factures</Link> · <Link href="/clients">Clients</Link> ·{" "}
        <strong>Tableau de bord</strong> · <Link href="/account">Compte</Link>
      </nav>
      <h1>Tableau de bord</h1>
      {error && <p role="alert">{error}</p>}
      {!stats && !error && <p>Chargement…</p>}

      {stats && (
        <>
          <section>
            <p>Chiffre d'affaires (HT, factures émises) : <strong>{stats.revenueExclVat.toFixed(2)} €</strong></p>
            <p>Achats (HT) : <strong>{stats.purchasesExclVat.toFixed(2)} €</strong></p>
            <p>Marge estimée : <strong>{stats.margin.toFixed(2)} €</strong></p>
            <p>Nombre de factures de vente : {stats.invoiceCount}</p>
          </section>

          <section>
            <h2>Top clients</h2>
            {stats.topClients.length === 0 && <p>Aucune facture de vente pour l'instant.</p>}
            <ol>
              {stats.topClients.map((c) => (
                <li key={c.clientId}>
                  {c.name} — {c.totalInclVat.toFixed(2)} € TTC
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </main>
  );
}
