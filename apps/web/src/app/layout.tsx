export const metadata = {
  title: "DEFA — Devis & Factures",
  description: "Gestion de devis et factures pour indépendants belges",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
