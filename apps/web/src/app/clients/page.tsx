"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { useRequireAuth } from "../../lib/useRequireAuth";

interface ClientRecord {
  id: string;
  name: string;
  vatNumber?: string;
  email?: string;
}

export default function ClientsPage() {
  useRequireAuth();

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [name, setName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ name, vatNumber: vatNumber || undefined, email: email || undefined }),
      });
      setName("");
      setVatNumber("");
      setEmail("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main>
      <nav>
        <Link href="/documents">Devis &amp; factures</Link> · <strong>Clients</strong> ·{" "}
        <Link href="/dashboard">Tableau de bord</Link> · <Link href="/account">Compte</Link>
      </nav>
      <h1>Clients</h1>

      <form onSubmit={handleSubmit}>
        <input placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="N° TVA (optionnel)" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
        <input placeholder="Email (optionnel)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit">Ajouter</button>
      </form>
      {error && <p role="alert">{error}</p>}

      <ul>
        {clients.map((c) => (
          <li key={c.id}>
            {c.name}
            {c.vatNumber && ` — TVA ${c.vatNumber}`}
            {c.email && ` — ${c.email}`}
          </li>
        ))}
      </ul>
    </main>
  );
}
