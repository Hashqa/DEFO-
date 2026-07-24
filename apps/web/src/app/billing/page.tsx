"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { useRequireAuth } from "../../lib/useRequireAuth";

interface BillingStatus {
  subscriptionStatus: "NONE" | "ACTIVE" | "PAST_DUE" | "CANCELED";
}

const STATUS_LABELS: Record<BillingStatus["subscriptionStatus"], string> = {
  NONE: "Pas encore abonné",
  ACTIVE: "Abonnement actif",
  PAST_DUE: "Paiement en retard",
  CANCELED: "Abonnement annulé",
};

export default function BillingPage() {
  useRequireAuth();

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<"success" | "canceled" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("success")) setCheckoutResult("success");
    else if (params.has("canceled")) setCheckoutResult("canceled");
  }, []);

  useEffect(() => {
    apiFetch<BillingStatus>("/billing")
      .then(setStatus)
      .catch((err) => setError((err as Error).message));
  }, []);

  async function startCheckout() {
    setError(null);
    setLoading(true);
    try {
      const result = await apiFetch<{ url: string }>("/billing/checkout", { method: "POST" });
      window.location.href = result.url;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <main>
      <nav>
        <Link href="/documents">Devis &amp; factures</Link> · <Link href="/clients">Clients</Link> ·{" "}
        <Link href="/dashboard">Tableau de bord</Link> · <Link href="/account">Compte</Link> ·{" "}
        <strong>Abonnement</strong>
      </nav>
      <h1>Abonnement</h1>

      {checkoutResult === "success" && <p>Paiement effectué — l'abonnement sera actif sous peu.</p>}
      {checkoutResult === "canceled" && <p>Paiement annulé.</p>}

      {error && <p role="alert">{error}</p>}
      {!status && !error && <p>Chargement…</p>}

      {status && (
        <>
          <p>Statut : {STATUS_LABELS[status.subscriptionStatus]}</p>
          {status.subscriptionStatus !== "ACTIVE" && (
            <button type="button" onClick={startCheckout} disabled={loading}>
              {loading ? "Redirection…" : "S'abonner (9,90 €/mois)"}
            </button>
          )}
        </>
      )}
    </main>
  );
}
