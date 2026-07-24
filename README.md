# DEFA — Devis & Factures (Belgique)

[![CI](https://github.com/Hashqa/DEFO-/actions/workflows/ci.yml/badge.svg)](https://github.com/Hashqa/DEFO-/actions/workflows/ci.yml)

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

## Stack technique

- **Backend** : Node.js, TypeScript, Express, Prisma (PostgreSQL)
- **Web** : Next.js, TypeScript
- **Mobile** : Expo (React Native), TypeScript, avec SQLite local pour le mode hors-ligne
- **Abonnements** : Stripe (Checkout + webhook)
- **Facturation Peppol** : Recommand (Access Point certifié)
- **Rapprochement bancaire** : Ponto (PSD2)
- **Emails** : Resend
- **Scan factures fournisseurs (OCR)** : Mindee

## Démarrage

```bash
npm install
cp apps/api/.env.example apps/api/.env   # renseigner les clés nécessaires
cp apps/web/.env.example apps/web/.env
npm run dev --workspace=apps/api
npm run dev --workspace=apps/web
```

## Tests

```bash
npm test --workspace=apps/api
```

## Statut

Fonctionnalités en place : authentification multi-utilisateurs, gestion des devis/factures
(numérotation légale, conversion devis→facture, export PDF avec QR de paiement EPC),
intégrations Peppol/Stripe/Ponto/Resend, tableau de bord, mode hors-ligne mobile de base.

Voir le cahier des charges pour le détail du périmètre visé et [`docs/cahier-des-charges.md`](./docs/cahier-des-charges.md)
pour les décisions encore ouvertes (langues FR/NL, etc.).
