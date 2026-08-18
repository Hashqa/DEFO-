# Cote de Reprise

Outil autonome (une seule page HTML, sans backend) pour calculer, avant d'acheter un
ordinateur ou une console :

- le **prix d'achat maximum** à ne pas dépasser (si vous connaissez le prix de revente),
- le **prix de revente minimum** à demander (si vous connaissez le prix d'achat — ex. "je
  l'achète 80 €, l'écran coûte 40 €, je la revends à combien ?"),
- le **bénéfice réel** si les deux prix sont connus,
- le **coût des pièces** de réparation nécessaires (avec une bibliothèque de prix
  réutilisable),
- s'il vaut mieux **réparer avant de revendre** ou **revendre en l'état**.

## Utilisation

Ouvrir `calculateur.html` dans un navigateur (aucune installation, aucune dépendance).

Renseigner une fois les paramètres de l'activité (commission de la plateforme de vente,
frais de port, taux horaire visé, marge minimum par appareil). Pour chaque appareil,
renseigner ce que vous savez :

- seulement le **prix de revente** → l'outil calcule le prix d'achat maximum,
- seulement le **prix d'achat** → l'outil calcule le prix de revente minimum,
- les **deux** → l'outil calcule le bénéfice réel.

Si l'appareil est "à réparer", ajouter les pièces nécessaires (avec suggestion
automatique du prix depuis la bibliothèque) et les heures de réparation. La comparaison
"réparer / revendre en l'état" n'apparaît que lorsqu'un prix de revente réaliste est
connu pour les deux états — comparer uniquement les prix minimums serait trompeur
(l'état non réparé demande toujours moins, par construction).

Les appareils évalués peuvent être ajoutés à une liste de sourcing pour comparer
plusieurs opportunités côte à côte. Les paramètres, la bibliothèque de pièces et la
liste de sourcing sont mémorisés dans le navigateur (`localStorage`) — rien n'est
envoyé ni partagé ailleurs, et les données restent propres à ce navigateur/appareil.

## Formules

```
Prix d'achat maximum = prix de revente
                        − (commission plateforme × prix de revente)
                        − frais de port
                        − coût des pièces (si réparation)
                        − (heures de réparation × taux horaire)
                        − marge minimum visée

Prix de revente minimum = (prix d'achat
                            + frais de port
                            + coût des pièces (si réparation)
                            + (heures de réparation × taux horaire)
                            + marge minimum visée)
                           ÷ (1 − commission plateforme)

Bénéfice réel = prix de revente
                − (commission plateforme × prix de revente)
                − frais de port
                − coût des pièces (si réparation)
                − (heures de réparation × taux horaire)
                − prix d'achat
```

Ces calculs sont faits à la fois pour le scénario "réparer puis revendre fonctionnel"
et, si un prix de revente en l'état est renseigné, pour le scénario "revendre sans
réparer". L'outil recommande le scénario le plus rentable dès que les deux ont un prix
de revente réel (pas seulement calculé) à comparer.
