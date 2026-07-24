"use client";

import { useEffect, useState, type FormEvent } from "react";
import { NavBar } from "../../components/NavBar";
import { apiFetch } from "../../lib/api";
import { useRequireAuth } from "../../lib/useRequireAuth";

interface ClientRecord {
  id: string;
  name: string;
  vatNumber?: string;
  email?: string;
  isBusiness: boolean;
  peppolAddress?: string;
}

export default function ClientsPage() {
  useRequireAuth();

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [name, setName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isBusiness, setIsBusiness] = useState(false);
  const [peppolAddress, setPeppolAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch<ClientRecord[]>("/clients");
      setClients(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/clients", {
        method: "POST",
        body: JSON.stringify({
          name,
          vatNumber: vatNumber || undefined,
          email: email || undefined,
          isBusiness,
          peppolAddress: peppolAddress || undefined,
        }),
      });
      setName("");
      setVatNumber("");
      setEmail("");
      setIsBusiness(false);
      setPeppolAddress("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function verifyPeppol(id: string) {
    setError(null);
    setVerifyResult(null);
    try {
      const result = await apiFetch<{ isValid: boolean }>(`/clients/${id}/verify-peppol`, { method: "POST" });
      setVerifyResult(result.isValid ? "Adresse Peppol valide et joignable." : "Adresse Peppol introuvable sur le réseau.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main>
      <NavBar active="/clients" />
      <h1>Clients</h1>

      <form onSubmit={handleSubmit}>
        <input placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="N° TVA (optionnel)" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
        <input placeholder="Email (optionnel)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>
          <input type="checkbox" checked={isBusiness} onChange={(e) => setIsBusiness(e.target.checked)} />
          Client professionnel (B2B)
        </label>
        {isBusiness && (
          <input
            placeholder="Adresse Peppol (ex. 0208:0123456789)"
            value={peppolAddress}
            onChange={(e) => setPeppolAddress(e.target.value)}
          />
        )}
        <button type="submit">Ajouter</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {verifyResult && <p>{verifyResult}</p>}

      <ul>
        {clients.map((c) => (
          <li key={c.id}>
            {c.name}
            {c.vatNumber && ` — TVA ${c.vatNumber}`}
            {c.email && ` — ${c.email}`}
            {c.isBusiness && c.peppolAddress && (
              <>
                {" "}
                <button type="button" onClick={() => verifyPeppol(c.id)}>
                  Vérifier Peppol
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
