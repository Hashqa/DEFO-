# Color Burst / Spooky Burst

Machine à sous web en grille 7×7, avec groupes (clusters), cascades et cases multiplicatrices qui doublent.
Démo jouable en crédits fictifs : un seul fichier HTML, sans dépendance à installer.

Deux thèmes sont inclus, au choix dans le menu en haut de l'écran :

- **Classique** : formes géométriques colorées.
- **Halloween (Spooky Burst)** : décors, symboles, animations de gain et musique, tous générés par les scripts du dossier `tools/`.

## Lancer le jeu

Ouvrir `index.html` dans un navigateur, ou servir le dossier :

```bash
npx serve games/color-burst
```

## Règles

- Un groupe de **5 symboles identiques ou plus**, reliés horizontalement ou verticalement, paie. Chaque symbole en plus multiplie le gain par 1,5, jusqu'à 15 et plus.
- **Cascades** : les symboles gagnants explosent, les autres tombent et de nouveaux arrivent.
- **Cases multiplicatrices** : une case où un symbole gagnant explose passe à x2, puis double à chaque nouvelle explosion, jusqu'à x1024. Un groupe additionne les multiplicateurs des cases qu'il recouvre.
- **Free spins** : 3, 4, 5, 6 et 7 symboles Bonus ou plus donnent 10, 12, 15, 20 et 30 spins. En free spins, les multiplicateurs restent jusqu'à la fin, et 3 Bonus ou plus ajoutent 5 spins.
- **Achat du bonus** : 100 fois la mise. **Super bonus** (toutes les cases démarrent à x2) : 300 fois la mise.
- Un bonus rapporte au minimum **10 fois la mise**. Le gain maximum est de **25 000 fois la mise**.

Les gains s'affichent en argent selon la mise. La table interne, en multiples de la mise, se trouve dans la constante `PAYTABLE`.

## Mathématiques (simulations)

| Mesure | Résultat |
|---|---|
| Retour au joueur, jeu normal avec bonus naturels (600 000 spins) | environ **96 %** |
| Bonus naturel | environ 1 tous les 140 spins |
| Spins qui rapportent quelque chose | environ 43 % |
| Retour de l'achat de bonus (1 000 achats) | environ 85 % |
| Retour du Super bonus (1 000 achats) | environ 85 % |
| Plus gros gain observé | plus de 10 000 fois la mise (Super bonus) |

Pour refaire les tests :

```bash
node tools/simulate.js spins 100000   # spins normaux, bonus naturels inclus
node tools/simulate.js n 1000         # 1 000 achats de chaque bonus
```

Le simulateur lit les constantes directement dans `index.html` : toute modification des réglages est donc prise en compte.

## Réglages principaux (dans `index.html`)

| Constante | Rôle |
|---|---|
| `PAYTABLE` | gains par symbole et par taille de groupe |
| `BASE_WEIGHTS`, `BOOST_BASE` | fréquence des couleurs, couleur dominante tirée à chaque spin |
| `BOOST_FS`, `BOOST_FS_HOT`, `HOT_CHANCE` | profil des free spins, avec des spins « chauds » occasionnels |
| `SCATTER_W` | fréquence des symboles Bonus, donc du déclenchement du bonus |
| `BUY_STD`, `BUY_SUP` | prix d'achat des bonus |
| `MIN_BONUS_X`, `MAX_WIN_X` | gain minimum d'un bonus, gain maximum |
| `MAX_MULT` | plafond des cases multiplicatrices |

## Thèmes et ressources

Le jeu cherche automatiquement les fichiers suivants. Il utilise ses dessins intégrés quand un fichier est absent.

```
theme/<id>/background.jpg       décor (16:9, centre libre pour la grille 7×7)
theme/<id>/background-fs.jpg    décor des free spins (même cadrage)
theme/<id>/symbols/0..7.png     symboles (0 = le meilleur, 6 = le plus faible, 7 = Bonus), fond transparent
theme/<id>/win/0..7.webp        animations de gain, WebP animé à fond transparent
theme/<id>/music.mp3            musique en boucle
```

Pour régénérer les ressources Halloween (il faut Playwright avec Chromium, et ffmpeg) :

```bash
node tools/render-backgrounds.js   # décors peints par code (painter.html)
node tools/render-symbols.js       # symboles PNG et animations WebP (studio.html)
node tools/render-music.js         # boucle musicale de 32 s en MP3 (music.html)
```

## Avant toute exploitation en argent réel

Ce projet est une démo en crédits fictifs. Une version en argent réel demande au minimum :

- une licence de jeux d'argent, ou un partenariat avec un opérateur qui en a une ;
- la certification du générateur aléatoire et du taux de retour par un laboratoire indépendant agréé ;
- l'intégration côté serveur : aujourd'hui, le tirage est fait dans le navigateur.
