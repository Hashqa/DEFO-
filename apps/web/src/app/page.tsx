import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>DEFA</h1>
      <p>Gestion de devis &amp; factures pour indépendants belges.</p>
      <p>
        <Link href="/login">Se connecter</Link> · <Link href="/register">S'inscrire</Link>
      </p>
    </main>
  );
}
