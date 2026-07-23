"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, setToken } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [bceNumber, setBceNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await apiFetch<{ token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ companyName, vatNumber, bceNumber, fullName, email, password }),
      });
      setToken(result.token);
      router.push("/documents");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main>
      <h1>Inscription</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nom de l'entreprise"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
        <input
          placeholder="N° TVA"
          value={vatNumber}
          onChange={(e) => setVatNumber(e.target.value)}
          required
        />
        <input
          placeholder="N° BCE"
          value={bceNumber}
          onChange={(e) => setBceNumber(e.target.value)}
          required
        />
        <input
          placeholder="Votre nom complet"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Créer mon compte</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <p>
        Déjà un compte ? <Link href="/login">Se connecter</Link>
      </p>
    </main>
  );
}
