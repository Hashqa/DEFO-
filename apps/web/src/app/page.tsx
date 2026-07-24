import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <div className="hero">
        <div className="brand-mark">D</div>
        <h1>DEFA</h1>
        <p>Gestion de devis &amp; factures pour indépendants belges.</p>
        <div className="cta-row">
          <Link href="/login">Se connecter</Link>
          <Link href="/register">S'inscrire</Link>
        </div>
      </div>
    </main>
  );
}
