"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { useRequireAuth } from "../../lib/useRequireAuth";

interface AccountRecord {
  companyName: string;
  vatNumber: string;
  bceNumber: string;
  logoUrl?: string;
  brandColor?: string;
  iban?: string;
  bic?: string;
}

export default function AccountPage() {
  useRequireAuth();

  const [account, setAccount] = useState<AccountRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch<AccountRecord>("/account")
      .then(setAccount)
      .catch((err) => setError((err as Error).message));
  }, []);

  function update<K extends keyof AccountRecord>(field: K, value: AccountRecord[K]) {
    setAccount((prev) => (prev ? { ...prev, [field]: value } : prev));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!account) return;
    setError(null);
    try {
      const updated = await apiFetch<AccountRecord>("/account", {
        method: "PATCH",
        body: JSON.stringify(account),
      });
      setAccount(updated);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main>
      <nav>
        <Link href="/documents">Devis &amp; factures</Link> · <Link href="/clients">Clients</Link> ·{" "}
        <Link href="/dashboard">Tableau de bord</Link> · <strong>Compte</strong>
      </nav>
      <h1>Mon compte</h1>
      {error && <p role="alert">{error}</p>}
      {!account && !error && <p>Chargement…</p>}

      {account && (
        <form onSubmit={handleSubmit}>
          <label>
            Nom de l'entreprise
            <input value={account.companyName} onChange={(e) => update("companyName", e.target.value)} required />
          </label>
          <label>
            N° TVA
            <input value={account.vatNumber} onChange={(e) => update("vatNumber", e.target.value)} required />
          </label>
          <label>
            N° BCE
            <input value={account.bceNumber} onChange={(e) => update("bceNumber", e.target.value)} required />
          </label>
          <label>
            Logo (URL)
            <input value={account.logoUrl ?? ""} onChange={(e) => update("logoUrl", e.target.value)} />
          </label>
          <label>
            Couleur de marque
            <input
              type="color"
              value={account.brandColor ?? "#000000"}
              onChange={(e) => update("brandColor", e.target.value)}
            />
          </label>

          <h2>Paiement (QR EPC)</h2>
          <p>Nécessaire pour afficher le QR de paiement sur vos factures.</p>
          <label>
            IBAN
            <input value={account.iban ?? ""} onChange={(e) => update("iban", e.target.value)} placeholder="BE68 5390 0754 7034" />
          </label>
          <label>
            BIC (optionnel)
            <input value={account.bic ?? ""} onChange={(e) => update("bic", e.target.value)} />
          </label>

          <button type="submit">Enregistrer</button>
          {saved && <span> Enregistré.</span>}
        </form>
      )}
    </main>
  );
}
