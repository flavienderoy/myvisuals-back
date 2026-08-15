#!/usr/bin/env bash
#
# Crée une Release GitHub pour chaque tag de version du dépôt courant.
#
# Le corps de chaque release reprend le message du tag annoté, déjà rédigé au
# moment du versionnage. Rien à recopier à la main.
#
# Prérequis : GitHub CLI authentifié (`brew install gh && gh auth login`).
#
# Usage :
#   ./scripts/create-github-releases.sh            # crée les releases
#   ./scripts/create-github-releases.sh --dry-run  # affiche sans rien créer
#
# @see CHANGELOG.md

set -euo pipefail

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

if ! command -v gh >/dev/null 2>&1; then
    echo "❌ GitHub CLI (gh) introuvable." >&2
    echo "   Installation : brew install gh && gh auth login" >&2
    exit 1
fi

# Les tags doivent être sur le dépôt distant, sinon la release n'a rien à cibler.
echo "→ Synchronisation des tags…"
git push --tags --quiet 2>/dev/null || true

TAGS=$(git tag --sort=v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' || true)

if [[ -z "$TAGS" ]]; then
    echo "❌ Aucun tag de version (vX.Y.Z) trouvé dans ce dépôt." >&2
    exit 1
fi

echo "→ $(echo "$TAGS" | wc -l | tr -d ' ') tag(s) trouvé(s)"
echo

created=0
skipped=0

for tag in $TAGS; do
    # Message du tag annoté, sans l'en-tête ni la signature.
    body=$(git tag -l --format='%(contents)' "$tag" | sed '/^-----BEGIN/,$d')
    [[ -z "$body" ]] && body="Version $tag — voir CHANGELOG.md"

    # Le titre reprend la première ligne du message.
    title=$(echo "$body" | head -1)

    if gh release view "$tag" >/dev/null 2>&1; then
        echo "  ⏭️  $tag — release déjà existante"
        skipped=$((skipped + 1))
        continue
    fi

    if $DRY_RUN; then
        echo "  [dry-run] $tag → « $title »"
        continue
    fi

    gh release create "$tag" \
        --title "$title" \
        --notes "$body

---
📓 Détail complet des changements : [CHANGELOG.md](../blob/main/CHANGELOG.md)" \
        --verify-tag >/dev/null

    echo "  ✅ $tag — release créée"
    created=$((created + 1))
done

echo
if $DRY_RUN; then
    echo "Simulation terminée — rien n'a été créé."
else
    echo "Terminé — ${created} release(s) créée(s), ${skipped} déjà présente(s)."
    echo "À vérifier : $(gh repo view --json url -q .url)/releases"
fi
