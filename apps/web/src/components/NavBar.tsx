import Link from "next/link";

const LINKS = [
  { href: "/documents", label: "Devis & factures" },
  { href: "/clients", label: "Clients" },
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/account", label: "Compte" },
  { href: "/billing", label: "Abonnement" },
] as const;

interface NavBarProps {
  active: (typeof LINKS)[number]["href"];
}

export function NavBar({ active }: NavBarProps) {
  return (
    <nav>
      {LINKS.map((link, i) => (
        <span key={link.href}>
          {i > 0 && " · "}
          {link.href === active ? <strong>{link.label}</strong> : <Link href={link.href}>{link.label}</Link>}
        </span>
      ))}
    </nav>
  );
}
