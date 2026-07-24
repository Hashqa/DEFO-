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
          <section className="stat-grid">
            <div className="stat-card" style={{ "--stat-color": "#0e9f6e" } as React.CSSProperties}>
              <span className="stat-label">Chiffre d'affaires (HT)</span>
              <span className="stat-value">{stats.revenueExclVat.toFixed(2)} €</span>
            </div>
            <div className="stat-card" style={{ "--stat-color": "#b5620a" } as React.CSSProperties}>
              <span className="stat-label">Achats (HT)</span>
              <span className="stat-value">{stats.purchasesExclVat.toFixed(2)} €</span>
            </div>
            <div className="stat-card" style={{ "--stat-color": "#1d5fc9" } as React.CSSProperties}>
              <span className="stat-label">Marge estimée</span>
              <span className="stat-value">{stats.margin.toFixed(2)} €</span>
            </div>
            <div className="stat-card" style={{ "--stat-color": "#6b7280" } as React.CSSProperties}>
              <span className="stat-label">Factures de vente</span>
              <span className="stat-value">{stats.invoiceCount}</span>
            </div>
          </section>

          <section>
            <h2>Top clients</h2>
            {stats.topClients.length === 0 && <p>Aucune facture de vente pour l'instant.</p>}
            {stats.topClients.length > 0 && (
              <ul className="card-list">
                {stats.topClients.map((c) => (
                  <li key={c.clientId}>
                    {c.name} — {c.totalInclVat.toFixed(2)} € TTC
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
