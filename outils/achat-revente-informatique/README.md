# Cote de Reprise

Outil autonome (une seule page HTML, sans backend) pour calculer, avant d'acheter un
ordinateur ou une console :

- le **prix d'achat maximum** à ne pas dépasser pour atteindre une marge visée,
- le **coût des pièces** de réparation nécessaires,
- s'il vaut mieux **réparer avant de revendre** ou **revendre en l'état**.

## Utilisation

Ouvrir `calculateur.html` dans un navigateur (aucune installation, aucune dépendance).

Renseigner une fois les paramètres de l'activité (commission de la plateforme de vente,
frais de port, taux horaire visé, marge minimum par appareil), puis évaluer chaque
appareil : prix de revente une fois fonctionnel, état à l'achat, pièces et heures de
réparation si nécessaire. Le prix d'achat maximum et la recommandation (réparer ou
revendre en l'état) se calculent en direct.

Les appareils évalués peuvent être ajoutés à une liste de sourcing pour comparer
plusieurs opportunités côte à côte. Cette liste n'est conservée que le temps de la
session (rien n'est envoyé ni sauvegardé).

## Formule

```
Prix d'achat maximum = Prix de revente
                        − (commission plateforme × prix de revente)
                        − frais de port
                        − coût des pièces (si réparation)
                        − (heures de réparation × taux horaire)
                        − marge minimum visée
```

Ce calcul est fait à la fois pour le scénario "réparer puis revendre fonctionnel" et,
si un prix de revente en l'état est renseigné, pour le scénario "revendre sans réparer".
L'outil recommande le scénario qui laisse le plus de marge.
