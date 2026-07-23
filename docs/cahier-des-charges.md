# Cahier des charges — Appli de devis/factures (Belgique)

## 1. Objectif du projet

Créer un **site web + application mobile** permettant à des indépendants de gérer leurs
devis et factures (achats et ventes), avec scan de QR code, conforme à la réglementation
belge (Peppol).

## 2. Utilisateurs cibles

- Le porteur du projet : facturation de **services IT** (indépendant)
- Amis kinés
- Amis dans le secteur **parcs et jardins**
- Plus largement : tout indépendant belge (produit SaaS, inscription libre)

Chaque utilisateur a son **propre compte isolé** (architecture multi-entreprise, données
séparées).

## 3. Fonctionnalités principales

### 3.1 Devis et factures

- Gestion des **achats** et des **ventes**
- Deux logiques de facturation :
  - **Services** (temps/prestation — ex. IT)
  - **Matière première + main d'œuvre** (ex. kiné, paysagiste)
- Lien achat → vente flexible :
  - Rattachement automatique d'une facture d'achat à un chantier/client + ajout main
    d'œuvre
  - Ou ressaisie manuelle des articles, selon le cas
- Regroupement des devis/factures par **chantier ou projet**
- Conversion devis → facture :
  - Validation en ligne par le client (lien + clic), **ou**
  - Décision seule de l'indépendant
  - Les deux modes doivent être proposés

### 3.2 Scan QR code

- Scan d'une facture fournisseur reçue → enregistrement automatique (achats)
- Scan pour paiement (QR EPC bancaire, voir 3.4)

### 3.3 Conformité légale belge

- **Peppol** obligatoire pour la facturation B2B dès le 1er janvier 2026 (format Peppol BIS 3.0
  / UBL structuré)
- Intégration via un **Access Point Peppol certifié** (ex. Storecove, Recommand) plutôt que
  connexion directe au réseau
- PDF classique conservé pour la facturation B2C (non concernée par Peppol)
- Mentions légales obligatoires : n° BCE, TVA, numérotation séquentielle sans trou, taux
  de TVA multiples (21/12/6/0%)
- **Archivage** : conservation en ligne limitée à 1 an (maîtrise des coûts), avec obligation
  pour l'utilisateur de télécharger/imprimer ses documents pour respecter la durée légale
  de conservation (7 ans en Belgique) — prévoir une notification d'alerte avant
  suppression

### 3.4 Paiement

- **Pas de PayPal**
- QR code de paiement **EPC (SEPA)** : virement bancaire pré-rempli, sans intermédiaire de
  paiement ni frais de transaction
- **Rapprochement automatique des paiements** via API bancaire PSD2 dès le lancement
  (ex. Ponto — spécialisé banques belges)

### 3.5 Comptes et accès

- Inscription **libre en ligne**, avec paiement automatique de l'abonnement
- **Multi-utilisateurs par compte** possible (ex. indépendant + assistant), à activer au cas
  par cas, avec tarif dépendant du nombre d'utilisateurs
- Personnalisation des documents : logo + couleurs par compte

### 3.6 Comptabilité

- Export direct vers logiciel de comptabilité externe (type Winbooks, Horus) pour le
  comptable

### 3.7 Suivi et pilotage

- Tableau de bord avec statistiques : chiffre d'affaires, marge, top clients
- Relances automatiques (email/notification) après X jours de retard de paiement

### 3.8 Mobile et hors-ligne

- **Application mobile native** (plutôt que web responsive), malgré la charge de
  développement plus lourde
- **Mode hors-ligne indispensable** : création de devis/factures et scan sans réseau,
  synchronisation ensuite

### 3.9 Catalogue produits/services

- Pas de modèles de prix pré-remplis par métier : chaque utilisateur fixe librement ses prix

### 3.10 Langues

- Pas encore décidé (marché belge → probable besoin FR/NL, à trancher)

## 4. Modèle économique

- **Abonnement mensuel** par utilisateur/entreprise
- Tarif variable selon le nombre d'utilisateurs par compte

## 5. Statut juridique du porteur de projet

- Statut d'indépendant complémentaire actuellement arrêté, réactivable
- Changement de statut prévu en septembre (stagiaire IFAPME) — impact sur le cumul
  d'activité à clarifier avec un guichet d'entreprise/secrétariat social avant lancement
  commercial

## 6. Briques techniques identifiées

| Besoin | Solution envisagée |
|---|---|
| Facturation Peppol | Access Point certifié (API) |
| Paiement QR | Génération QR EPC (norme EPC069-12) |
| Rapprochement bancaire | Ponto (PSD2, spécialisé Belgique) ou équivalent |
| App mobile | Développement natif ou cross-platform (React Native/Flutter) |
| Hébergement données | RGPD — UE/Belgique à trancher |
| Abonnements | Système de paiement récurrent (ex. Stripe) |

## 7. Estimation budgétaire (ordre de grandeur)

- **Développement solo (Claude Code)** : quelques centaines d'euros (temps personnel +
  hébergement)
- **Freelance, périmètre complet** (Peppol + PSD2 + natif + hors-ligne) : ~20 000 à 50 000 €+
- **Agence** : 2 à 4x le tarif freelance

## 8. Décision actuelle

Projet mis en pause pour évaluer le budget et le timing (changement de statut professionnel
en septembre). Le porteur souhaite viser directement la version complète plutôt qu'un MVP
réduit, une fois le projet relancé.

*Document généré à partir des échanges de définition du projet — à réutiliser comme point
de départ avec Claude Code ou un développeur le moment venu.*
