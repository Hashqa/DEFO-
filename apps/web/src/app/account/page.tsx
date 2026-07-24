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
  street?: string;
  postalCode?: string;
  city?: string;
  country: string;
  peppolCompanyId?: string;
}

export default function AccountPage() {
  useRequireAuth();

  const [account, setAccount] = useState<AccountRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [peppolStatus, setPeppolStatus] = useState<string | null>(null);

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

  async function registerWithRecommand() {
    setError(null);
    setPeppolStatus(null);
    try {
      const result = await apiFetch<{ account: AccountRecord; verificationUrl?: string }>(
        "/account/peppol/register-company",
        { method: "POST" }
      );
      setAccount(result.account);
      setPeppolStatus(
        result.verificationUrl
          ? `Entreprise enregistrée. Vérification d'identité à compléter : ${result.verificationUrl}`
          : "Entreprise enregistrée chez Recommand."
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main>
      <nav>
        <Link href="/documents">Devis &amp; factures</Link> · <Link href="/clients">Clients</Link> ·{" "}
        <Link href="/dashboard">Tableau de bord</Link> · <strong>Compte</strong> ·{" "}
        <Link href="/billing">Abonnement</Link>
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

          <h2>Adresse</h2>
          <p>Nécessaire pour Peppol et pour l'entête de vos factures.</p>
          <label>
            Rue et numéro
            <input value={account.street ?? ""} onChange={(e) => update("street", e.target.value)} />
          </label>
          <label>
            Code postal
            <input value={account.postalCode ?? ""} onChange={(e) => update("postalCode", e.target.value)} />
          </label>
          <label>
            Ville
            <input value={account.city ?? ""} onChange={(e) => update("city", e.target.value)} />
          </label>
          <label>
            Pays (code ISO)
            <input value={account.country} onChange={(e) => update("country", e.target.value)} />
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

      {account && (
        <section>
          <h2>Peppol (facturation B2B)</h2>
          {account.peppolCompanyId ? (
            <p>Entreprise enregistrée chez Recommand (id : {account.peppolCompanyId}).</p>
          ) : (
            <>
              <p>Enregistre ton entreprise chez Recommand pour pouvoir envoyer des factures via Peppol.</p>
              <button type="button" onClick={registerWithRecommand}>
                Enregistrer chez Recommand
              </button>
            </>
          )}
          {peppolStatus && <p>{peppolStatus}</p>}
        </section>
      )}
    </main>
  );
}
