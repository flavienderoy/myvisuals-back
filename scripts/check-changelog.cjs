#!/usr/bin/env node
/**
 * Garde-fou du journal de version.
 *
 * Vérifie que la version de `package.json` correspond à la dernière version
 * publiée dans `CHANGELOG.md`.
 *
 * Pourquoi ce contrôle existe : la réponse de `GET /health` annonçait `1.0.0`
 * en dur, valeur figée depuis la première mise en production et divergente de
 * la réalité déployée depuis six publications. Rien ne signalait l'écart —
 * ni test, ni revue. Un journal de version qui ne correspond pas à ce qui
 * tourne réellement est pire qu'une absence de journal : il inspire une
 * confiance injustifiée au moment d'un diagnostic.
 *
 * Exécuté par la chaîne d'intégration continue sur chaque push et chaque
 * pull request. Sortie non nulle = échec du job.
 *
 * Usage :
 *   node scripts/check-changelog.js [chemin/du/paquet]
 *
 * @see CHANGELOG.md
 * @see docs/SUPERVISION.md
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '.');
const pkgPath = path.join(root, 'package.json');

// Le journal peut vivre à la racine du dépôt (cas de l'API, dont le paquet est
// dans server/) ou à côté du package.json (cas du front).
const changelogCandidates = [
    path.join(root, 'CHANGELOG.md'),
    path.join(root, '..', 'CHANGELOG.md'),
];

function fail(message) {
    console.error(`\n❌ ${message}\n`);
    process.exit(1);
}

if (!fs.existsSync(pkgPath)) fail(`package.json introuvable dans ${root}`);

const changelogPath = changelogCandidates.find((p) => fs.existsSync(p));
if (!changelogPath) {
    fail(`CHANGELOG.md introuvable (cherché dans ${changelogCandidates.join(', ')})`);
}

const pkgVersion = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
const changelog = fs.readFileSync(changelogPath, 'utf8');

// Entrées publiées : « ## [1.6.0] — 2026-08-14 ». La section « [Non publié] »
// est délibérément ignorée : elle accumule les changements en attente de
// publication et ne correspond à aucune version déployée.
const released = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map((m) => m[1]);

if (released.length === 0) {
    fail(`Aucune version publiée trouvée dans ${path.basename(changelogPath)}`);
}

const latest = released[0];

console.log(`package.json  : ${pkgVersion}`);
console.log(`CHANGELOG.md  : ${latest}   (${released.length} version(s) publiée(s))`);

if (pkgVersion !== latest) {
    fail(
        `Divergence de version.\n` +
            `   package.json annonce ${pkgVersion}, le journal publie ${latest}.\n\n` +
            `   Corriger l'un des deux :\n` +
            `     • publier la version : ajouter une section « ## [${pkgVersion}] — AAAA-MM-JJ » dans ${path.basename(changelogPath)}\n` +
            `     • ou aligner le paquet : porter package.json à ${latest}`
    );
}

// Ordre décroissant : un journal désordonné se lit mal et fausse la lecture de
// « quelle est la dernière version ».
const toNum = (v) => v.split('.').map(Number);
for (let i = 0; i < released.length - 1; i++) {
    const [a, b] = [toNum(released[i]), toNum(released[i + 1])];
    const isDescending = a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] > b[2];
    if (!isDescending) {
        fail(
            `Versions non ordonnées dans le journal : ` +
                `[${released[i]}] précède [${released[i + 1]}]. ` +
                `Les versions doivent apparaître de la plus récente à la plus ancienne.`
        );
    }
}

console.log('\n✅ Journal de version cohérent avec le paquet.');
