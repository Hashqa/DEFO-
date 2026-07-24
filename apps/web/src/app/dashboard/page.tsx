"use client";

import { NavBar } from "../../components/NavBar";
import { useApiResource } from "../../lib/useApiResource";
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

  const { data: stats, error } = useApiResource<AccountStats>("/stats");

  return (
    <main>
      <NavBar active="/dashboard" />
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
