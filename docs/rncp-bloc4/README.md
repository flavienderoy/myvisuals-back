# Dossier RNCP 39583 — Bloc 4

Livrable d'évaluation du **Bloc 4 — Maintenir l'application logicielle en
condition opérationnelle**, et ses sources de génération.

| Fichier | Rôle |
|---|---|
| [`Dossier-Bloc4-Deroy.pdf`](./Dossier-Bloc4-Deroy.pdf) | **Le livrable** — 20 pages, A4 |
| [`SPEC-DOSSIER.md`](./SPEC-DOSSIER.md) | Cahier des charges : plan page par page, budgets, gabarits d'images |
| `build/` | Sources HTML/CSS du document |
| `figures/` | Les 15 figures, aux dimensions calculées pour l'impression |

## Régénérer le PDF

```bash
cd docs/rncp-bloc4/build
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=20000 \
  --print-to-pdf="../Dossier-Bloc4-Deroy.pdf" "file://$PWD/dossier.html"
```

Le document doit tenir en **20 pages exactement**. Contrôle :

```bash
pdftotext ../Dossier-Bloc4-Deroy.pdf - | grep -c $'\f'
```

## Régénérer une figure

Les figures de code et de sortie de commande sont produites par
[`scripts/render-code.mjs`](../../scripts/render-code.mjs) :

```bash
node scripts/render-code.mjs server/controllers/healthController.js \
  --lines 109-124 --width 860 \
  --title "healthController.js — sonde d'aptitude" \
  --out docs/rncp-bloc4/figures/F05.png
```

**La largeur en pixels détermine la lisibilité à l'impression.** Une figure
rendue en 1400 px puis réduite à 150 mm tombe sous 4 pt, illisible. Viser
650–900 px pour obtenir 6 à 8 pt sur la page.

## Sources du contenu

Le dossier ne contient aucune affirmation non vérifiable. Tout provient de :

- [`docs/SUPERVISION.md`](../SUPERVISION.md) — § 2
- [`docs/PROCESSUS_ANOMALIES.md`](../PROCESSUS_ANOMALIES.md) — § 3
- [`docs/PROCESSUS_DEPENDANCES.md`](../PROCESSUS_DEPENDANCES.md) — § 1
- [`docs/anomalies/`](../anomalies/) — § 4, § 5, § 6 (5 fiches)
- [`CHANGELOG.md`](../../CHANGELOG.md) — § 7
- Les [issues](https://github.com/flavienderoy/myvisuals-back/issues?q=is%3Aissue) #1, #2, #6, #7, #8

## Figures en attente

Deux emplacements sont réservés dans le PDF, en attente des captures :

| Réf. | Contenu | Prérequis |
|---|---|---|
| Figure 7 | Moniteur UptimeRobot et son historique | Créer le moniteur sur `/health/ready` |
| Figure 8 | Politiques d'alerte Cloud Monitoring | Créer les politiques de seuil |

Elles correspondent à la recommandation **R6** du § 8.
