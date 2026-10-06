# Spooky Burst : publication sur Stake Engine

Ce dossier contient tout ce qu'il faut pour publier le jeu sur Stake Engine.

| Élément de la checklist Stake | Fichier à fournir |
|---|---|
| Tuile de jeu (3:4) | `tile-3x4.png` (1200×1600) |
| Illustration de couverture (16:9) | `cover-16x9.png` (1920×1080) |
| Version front-end | contenu de `frontend/` (ou `spooky-burst-frontend.zip`) |
| Version mathématique | contenu de `math/publish/` (ou `spooky-burst-math.zip`) |
| Validation mathématique | automatique après l'envoi des fichiers mathématiques |
| Niveau de mise | à choisir dans le tableau de bord Stake (modèle de niveaux de mise) |

## Étapes de publication

1. **Médias** : ajoute `tile-3x4.png` et `cover-16x9.png` dans la bibliothèque média du jeu. Place la tuile comme couverture.
2. **Mathématiques** : dans « Téléchargement des fichiers », envoie les 7 fichiers de `math/publish/` (sans sous-dossier) : `index.json`, les 3 fichiers `books_*.jsonl.zst` et les 3 fichiers `lookUpTable_*_0.csv`. Publie la version.
3. **Front-end** : envoie le contenu de `frontend/` (`index.html` doit être à la racine, avec `engine.js` et le dossier `theme/`). Publie la version.
4. **Niveaux de mise** : choisis un modèle de niveaux de mise dans le tableau de bord. Le jeu lit automatiquement les niveaux envoyés par le serveur.
5. Lance la validation, puis la soumission.

## Modes de jeu

| Mode | Nom côté serveur | Coût | Retour théorique | Gain max |
|---|---|---|---|---|
| Jeu normal | `base` | 1 × la mise | 96,20 % | 25 000 × |
| Achat du bonus | `bonus` | 100 × la mise | 96,20 % | 25 000 × |
| Super bonus | `super` | 300 × la mise | 96,20 % | 25 000 × |

Les trois modes passent les contrôles du Math SDK officiel (`utils/rgs_verification.py`), sans avertissement de volatilité. Les statistiques détaillées sont dans `math/report.json` :

- format : paiements entiers, multiples de 10, minimum 10 ; poids entiers ; livres identiques aux tables ;
- retour au joueur de 96,20 % dans chaque mode, sous la limite de 96,7 %, avec un écart nul entre modes ;
- etl40b, etl10k, p5k, p10k et CVaR sous les limites « 3 étoiles ».

## Comment c'est construit

- `engine.js` : le moteur du jeu (grille 7×7, cascades, cases multiplicatrices x2 → x3 → x5 → x10 → x25 → x50 → x100, free spins 8 à 20, Super bonus avec 10 cases au hasard à x5, gain minimum de 10× par bonus, plafond à 25 000×, bonus naturel environ 1 spin sur 135). Il produit chaque partie sous forme de liste d'événements. Tous les gains sont en dixièmes de mise, comme l'exige Stake.
- `math/generate.js` : simule 150 000 parties normales et 12 000 parties par mode bonus, ajoute des parties « gain max », calcule les poids (retour exact de 96,2 % et respect des limites de volatilité), écrit les fichiers et vérifie le format.
- `tools/build_frontend.py` : fabrique `frontend/` à partir du jeu (`../index.html`). Le front-end demande chaque partie au serveur Stake (`/wallet/authenticate`, `/wallet/play`, `/wallet/end-round`) et anime les événements reçus. Il gère aussi :
  - la reprise d'une partie interrompue ;
  - le rejeu (`?replay=true`) ;
  - les devises et les niveaux de mise ;
  - les options imposées par la juridiction (turbo, autoplay, achat de bonus, barre espace, durée minimale, minuteur de session, position nette) ;
  - l'anglais et le français.

  Sans paramètres Stake dans l'URL, il tourne en démo avec le moteur local.
- `tools/mock-rgs.js` : faux serveur Stake pour tester en local avec les vrais fichiers mathématiques.
- `tools/verify_stake.py` : lance les contrôles officiels du Math SDK sur `math/publish/`.

## Refaire les fichiers

```bash
node stake/math/generate.js 150000 12000 12000       # fichiers mathématiques (≈ 1 min)
python3 stake/tools/build_frontend.py                # front-end
node stake/tools/mock-rgs.js 8787                    # test local
# puis ouvrir http://localhost:8787/index.html?sessionID=test&lang=en&rgs_url=http://localhost:8787
```

Après toute modification des gains dans `engine.js`, il faut régénérer **les deux** (mathématiques et front-end), puis republier les deux versions.
