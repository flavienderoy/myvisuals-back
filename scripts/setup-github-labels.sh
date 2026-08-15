#!/usr/bin/env bash
#
# Crée le jeu de labels utilisé par le processus de traitement des anomalies.
#
# Les labels ne sont pas décoratifs : ce sont eux qui rendent le suivi
# mesurable. Sans `severity:*` on ne peut pas vérifier le respect des délais
# d'engagement ; sans `source:*` on ne peut pas mesurer la part des anomalies
# détectées par la supervision *avant* tout signalement client — l'indicateur
# qui dit si le dispositif de supervision sert réellement à quelque chose.
#
# Prérequis : GitHub CLI authentifié (`brew install gh && gh auth login`).
#
# Usage :
#   ./scripts/setup-github-labels.sh                          # dépôt courant
#   ./scripts/setup-github-labels.sh flavienderoy/myvisuals-client
#
# @see docs/PROCESSUS_ANOMALIES.md

set -euo pipefail

REPO_ARG=()
if [[ $# -gt 0 ]]; then
    REPO_ARG=(--repo "$1")
    echo "Dépôt cible : $1"
else
    echo "Dépôt cible : dépôt courant"
fi

if ! command -v gh >/dev/null 2>&1; then
    echo "❌ GitHub CLI (gh) introuvable. Installation : brew install gh" >&2
    exit 1
fi

# nom | couleur | description
LABELS=(
    # ─── Nature ───────────────────────────────────────────
    "bug|d73a4a|Anomalie confirmée : le logiciel ne fait pas ce qu'il devrait"
    "support|0e8a16|Signalement utilisateur en cours de qualification"
    "regression|b60205|Fonctionnait dans une version précédente"

    # ─── Sévérité (pilote les délais d'engagement) ────────
    "severity:S1|b60205|Critique — service indisponible, perte ou fuite de données"
    "severity:S2|d93f0b|Majeure — fonction clé inutilisable, sans contournement"
    "severity:S3|fbca04|Mineure — fonction dégradée, contournement possible"
    "severity:S4|c2e0c6|Cosmétique — sans impact fonctionnel"

    # ─── Environnement ────────────────────────────────────
    "env:prod|5319e7|Constatée en production"
    "env:staging|8b6fd6|Constatée en recette"
    "env:dev|d4c5f9|Constatée en développement local"

    # ─── Canal de détection ───────────────────────────────
    "source:monitoring|1d76db|Détectée par la supervision automatique"
    "source:client|0052cc|Remontée par un utilisateur via le support"
    "source:ci|006b75|Détectée par la chaîne d'intégration continue"
    "source:qa|0366d6|Détectée en recette interne ou en revue de code"

    # ─── Cycle de vie ─────────────────────────────────────
    "status:triage|ededed|En attente de qualification"
    "status:confirmed|f9d0c4|Reproduite et qualifiée"
    "status:in-progress|fef2c0|Correction en cours"
    "status:fixed|c2e0c6|Correctif fusionné, en attente de déploiement"
    "status:verified|0e8a16|Vérifiée en production après déploiement"
    "status:wontfix|ffffff|Ne sera pas corrigée — motif documenté dans le ticket"

    # ─── Composant ────────────────────────────────────────
    "area:api|1d76db|Backend Express"
    "area:front|bfd4f2|Application React"
    "area:database|5319e7|Schéma PostgreSQL, RLS, triggers"
    "area:storage|006b75|Stockage objet et URL signées"
    "area:cicd|444444|Build, tests, déploiement"
    "area:monitoring|0e8a16|Sondes, logs, alertes"

    # ─── Maintenance ──────────────────────────────────────
    "dependencies|0366d6|Mise à jour de dépendances"
    "security|b60205|Vulnérabilité ou durcissement"
)

created=0
updated=0

for entry in "${LABELS[@]}"; do
    IFS='|' read -r name color description <<< "$entry"

    if gh label create "$name" --color "$color" --description "$description" "${REPO_ARG[@]}" 2>/dev/null; then
        echo "  ✅ créé   : $name"
        created=$((created + 1))
    else
        # Le label existe déjà : on aligne couleur et description pour que les
        # deux dépôts (API et front) restent cohérents.
        gh label edit "$name" --color "$color" --description "$description" "${REPO_ARG[@]}" >/dev/null
        echo "  ♻️  mis à jour : $name"
        updated=$((updated + 1))
    fi
done

echo
echo "Terminé — ${created} label(s) créé(s), ${updated} mis à jour."
echo "Pensez à appliquer le même jeu à l'autre dépôt :"
echo "  ./scripts/setup-github-labels.sh flavienderoy/myvisuals-client"
