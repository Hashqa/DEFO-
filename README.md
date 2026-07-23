# DEFA — Devis & Factures (Belgique)

SaaS multi-tenant de gestion de devis et factures pour indépendants belges (services IT,
kinés, parcs et jardins, etc.), conforme Peppol.

Le cahier des charges complet se trouve dans [`docs/cahier-des-charges.md`](./docs/cahier-des-charges.md).

## Structure du monorepo

```
apps/
  api/      Backend (Node.js + TypeScript + Express + Prisma)
  web/      Dashboard web (Next.js)
  mobile/   Application mobile native (Expo / React Native)
packages/
  shared/   Types et logique de domaine partagés entre apps
```

## Stack technique (point de départ)

- **Backend** : Node.js, TypeScript, Express, Prisma (PostgreSQL)
- **Web** : Next.js, TypeScript
- **Mobile** : Expo (React Native), TypeScript, avec base de données locale pour le mode
  hors-ligne
- **Paiement abonnement** : Stripe (à intégrer)
- **Facturation Peppol** : Access Point certifié (Storecove, Recommand — à choisir)
- **Rapprochement bancaire** : Ponto (PSD2, Belgique)

Ce choix de stack n'est pas figé — à ajuster selon les préférences du porteur de projet.

## Démarrage

```bash
npm install
npm run dev --workspace=apps/api
npm run dev --workspace=apps/web
```

## Statut

Scaffold initial du projet — aucune fonctionnalité métier implémentée. Voir le cahier des
charges pour le périmètre complet visé.
