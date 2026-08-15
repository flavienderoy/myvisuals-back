# Description

<!-- Que change cette PR, et pourquoi ? -->

## Anomalie ou évolution liée

<!--
Correction d'anomalie : `Closes #<numéro de l'issue [ANO]>`
Le lien est obligatoire pour un correctif — c'est lui qui alimente
automatiquement le journal de version (CHANGELOG.md).
-->

Closes #

## Type de changement

- [ ] 🐞 Correction d'anomalie (`fix:`)
- [ ] ✨ Nouvelle fonctionnalité (`feat:`)
- [ ] ♻️ Refactorisation sans changement de comportement (`refactor:`)
- [ ] ⬆️ Mise à jour de dépendances (`chore(deps):`)
- [ ] 📚 Documentation (`docs:`)
- [ ] ⚠️ Changement incompatible (impose une montée de version majeure)

## Cause racine

<!--
Correctifs uniquement. Décrire *pourquoi* le défaut existait, pas seulement ce
qui a été modifié. Un correctif dont la cause racine n'est pas comprise a de
fortes chances de réapparaître sous une autre forme.
-->

## Vérifications

- [ ] `npm run lint` passe sans erreur
- [ ] `npm test` passe intégralement
- [ ] **Un test de non-régression couvre le cas défaillant** et échoue si le correctif est retiré
- [ ] `npm audit --audit-level=high` ne signale rien de nouveau
- [ ] La documentation impactée est à jour (README, Swagger, `docs/`)

## Journal de version

- [ ] Entrée ajoutée dans `CHANGELOG.md` sous `## [Non publié]`
- [ ] Version de `package.json` alignée si cette PR publie une version

## Impact sur la supervision

<!--
Cette PR modifie-t-elle un indicateur, une sonde ou un seuil d'alerte ?
Introduit-elle une nouvelle dépendance externe qui mériterait sa propre sonde ?
Si oui, mettre à jour docs/SUPERVISION.md.
-->

- [ ] Sans impact sur la supervision
- [ ] `docs/SUPERVISION.md` mis à jour

## Plan de retour arrière

<!--
Comment annuler ce changement s'il dégrade la production ?
Cas standard : `git revert` puis redéploiement de la révision Cloud Run
précédente. Signaler explicitement toute migration de schéma non réversible.
-->
