import Link from "next/link";
import { IconAccount, IconAppointment, IconBilling, IconClients, IconDashboard, IconInvoice, IconQuote } from "./icons";

const LINKS = [
  { href: "/quotes", label: "Devis", Icon: IconQuote },
  { href: "/invoices", label: "Factures", Icon: IconInvoice },
  { href: "/appointments", label: "Rendez-vous", Icon: IconAppointment },
  { href: "/clients", label: "Clients", Icon: IconClients },
  { href: "/dashboard", label: "Tableau de bord", Icon: IconDashboard },
  { href: "/account", label: "Compte", Icon: IconAccount },
  { href: "/billing", label: "Abonnement", Icon: IconBilling },
] as const;

interface NavBarProps {
  active: (typeof LINKS)[number]["href"];
}

export function NavBar({ active }: NavBarProps) {
  return (
    <>
      <nav>
        <span className="brand">DEFA</span>
        <div className="nav-links">
          {LINKS.map((link) =>
            link.href === active ? (
              <strong key={link.href}>{link.label}</strong>
            ) : (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            )
          )}
        </div>
      </nav>

      {/* Barre d'onglets en bas, visible uniquement sur petit écran (navigation tactile) */}
      <div className="bottom-tabs">
        {LINKS.map(({ href, label, Icon }) =>
          href === active ? (
            <span key={href} className="tab-active">
              <Icon className="tab-icon" />
              {label}
            </span>
          ) : (
            <Link key={href} href={href}>
              <Icon className="tab-icon" />
              {label}
            </Link>
          )
        )}
      </div>
    </>
  );
}
