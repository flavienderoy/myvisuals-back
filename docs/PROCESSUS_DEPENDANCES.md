# Processus de mise à jour des dépendances — Visuals.co

> Compétence RNCP visée : **C4.3.1** — *Mettre à jour les dépendances du
> logiciel en surveillant les versions disponibles et les failles de sécurité,
> en évaluant l'impact des mises à jour et en les intégrant de manière
> maîtrisée.*

---

## 1. Ce que le projet met en jeu

Visuals.co repose sur **456 paquets** côté API et **393** côté front, dont une
vingtaine de dépendances directes seulement. L'essentiel du code exécuté en
production n'a donc pas été écrit ici — et c'est précisément ce qui rend le
sujet critique.

Trois dépendances concentrent le risque :

| Dépendance | Pourquoi elle est sensible |
|---|---|
| `multer` | Traite les fichiers téléversés par des utilisateurs — première surface d'attaque du produit |
| `sharp` | Décode des images fournies par des tiers ; les bibliothèques de décodage sont un vecteur classique d'exécution de code |
| `@supabase/supabase-js` | Porte l'authentification et les accès base ; une faille y compromet le cloisonnement entre studios |

Une quatrième catégorie est souvent négligée : les **actions GitHub** et
l'**image Docker de base**. Une action compromise s'exécute avec les secrets du
dépôt — dont la clé de compte de service Google Cloud et le jeton Vercel. Elles
sont donc suivies au même titre que les dépendances applicatives.

---

## 2. État initial et point de départ

Avant la mise en place de ce processus, le projet n'avait **aucun suivi** : ni
Dependabot, ni audit en intégration continue, ni revue périodique. L'audit
réalisé le 2026-08-14 a donné :

| Dépôt | Critiques | Élevées | Moyennes | Faibles | **Total** |
|---|---|---|---|---|---|
| `visuals-api` | 0 | 10 | 3 | 1 | **14** |
| `myvisuals-client` | 1 | 14 | 3 | 1 | **19** |

Parmi les plus significatives :

| Paquet | Vulnérabilité | Sévérité |
|---|---|---|
| `ws` | Divulgation de mémoire non initialisée ; épuisement mémoire par fragments | Élevée |
| `multer` | **Dépendance directe** — traitement des téléversements | Élevée |
| `path-to-regexp` | Expression régulière à complexité exponentielle (déni de service) | Élevée |
| `qs` | Déni de service déclenchable à distance sur `qs.stringify` | Moyenne |

**Toutes ont été corrigées** par des montées de version compatibles
(`npm audit fix`), sans aucun changement incompatible. Résultat après
correction, vérifié sur les deux dépôts :

```console
$ npm audit
found 0 vulnerabilities
```

La suite de tests (90 côté API, 75 côté front), le lint et la construction de
production passent à l'identique après ces montées.

Ce point de départ illustre le problème que le processus résout : **sans
mécanisme, la dette de sécurité s'accumule silencieusement**. Aucune de ces
14 + 19 vulnérabilités n'avait été introduite volontairement ; elles sont
apparues au fil des publications d'avis de sécurité, sans que rien ne le
signale.

---

## 3. Dispositif mis en place

Trois mécanismes complémentaires, à trois échelles de temps.

```
┌───────────────────────────────────────────────────────────────────┐
│  À CHAQUE PUSH — Chaîne d'intégration continue                    │
│  npm audit --audit-level=high        → BLOQUANT                   │
│  npm outdated                        → informatif                 │
│  Empêche toute régression de sécurité d'atteindre la production   │
├───────────────────────────────────────────────────────────────────┤
│  HEBDOMADAIRE (lundi 7 h) — Dependabot npm                        │
│  PR groupées : correctifs/mineures prod · outillage dev · sécurité│
│  Traite la dette avant qu'elle ne devienne un incident            │
├───────────────────────────────────────────────────────────────────┤
│  MENSUEL — Dependabot actions GitHub + image Docker               │
│  Surface d'attaque de la chaîne de livraison                      │
└───────────────────────────────────────────────────────────────────┘
```

### 3.1 Audit bloquant en intégration continue

Job `governance` des deux chaînes
([API](../.github/workflows/ci.yml) ·
[front](https://github.com/flavienderoy/myvisuals-client/blob/main/.github/workflows/ci.yml)) :

```yaml
- name: Audit de sécurité des dépendances
  run: npm audit --audit-level=high      # bloquant

- name: Dépendances en retard (informatif)
  run: npm outdated || true              # non bloquant
```

**Pourquoi le seuil est à `high` et non à `low`.** Un seuil trop bas bloque la
livraison sur des avis mineurs affectant souvent l'outillage de développement,
sans exposition réelle en production. L'équipe finit alors par contourner le
garde-fou — et un garde-fou contourné ne protège plus rien. Le seuil `high`
correspond au niveau à partir duquel une exploitation est plausible sur ce
produit.

**Pourquoi `npm outdated` reste informatif.** Un retard de version n'est pas
une vulnérabilité. Bloquer dessus reviendrait à imposer une mise à jour à
chaque publication amont, y compris au milieu d'une correction d'anomalie
urgente. Le rapport donne la visibilité sans imposer le calendrier.

Le job est **bloquant avant déploiement** (`needs: [docker, governance]`) : une
vulnérabilité élevée ne peut pas atteindre la production sans décision
explicite.

### 3.2 Dependabot

Configuration : [`.github/dependabot.yml`](../.github/dependabot.yml) (API) et
[son équivalent côté front](https://github.com/flavienderoy/myvisuals-client/blob/main/.github/dependabot.yml).

| Écosystème | Répertoire | Fréquence | Regroupement |
|---|---|---|---|
| npm | `/server`, `/` | Hebdomadaire (lundi 7 h) | prod mineur/correctif · outillage dev · sécurité |
| github-actions | `/` | Mensuelle | toutes ensemble |
| docker | `/server` | Mensuelle | image de base |

Trois choix de configuration méritent d'être justifiés :

**Lundi matin, pas vendredi soir.** Une montée de dépendance qui dégrade la
production doit pouvoir être suivie pendant des heures ouvrées. Programmer les
mises à jour en fin de semaine, c'est accepter de découvrir le problème le
lundi suivant.

**Plafond de 5 pull requests.** Au-delà, les PR s'accumulent sans être lues :
l'automatisation produit alors du bruit plutôt que de la sécurité. Un plafond
bas force à traiter avant d'accumuler.

**Les montées majeures de production sont exclues.** Elles ne partent jamais en
PR automatique : elles impliquent des changements incompatibles à évaluer, et
passent par le circuit du § 4.3. React et React DOM sont explicitement exclus —
une montée majeure y impose une campagne de test complète.

---

## 4. Politique d'arbitrage

| Type | Exemple | Traitement | Décision |
|---|---|---|---|
| **Correctif** (`1.2.3 → 1.2.4`) | `pg 8.22.0 → 8.23.0` | PR groupée hebdomadaire | Fusion si la CI est verte |
| **Mineure** (`1.2.0 → 1.3.0`) | `helmet 8.2.0 → 8.3.0` | PR groupée hebdomadaire | Fusion après lecture des notes de version |
| **Majeure** (`1.x → 2.x`) | `archiver 7 → 8` | Issue dédiée + branche | Arbitrage explicite, plan de test |
| **Sécurité** | avis CVE | **Hors cycle**, immédiat | Selon la sévérité (§ 4.4) |

### 4.1 Correctifs

Fusionnés dès que la chaîne est verte. Le risque de régression est faible par
construction (SemVer), et la couverture de tests — 165 tests au total, plus le
smoke test qui démarre réellement le conteneur — constitue le filet.

### 4.2 Versions mineures

Même circuit, avec **lecture des notes de version**. Une version mineure ajoute
des fonctionnalités sans casser l'existant *en théorie* ; en pratique, elle peut
modifier des comportements par défaut. Points d'attention systématiques :
changement de valeur par défaut, dépréciation annoncée, nouvelle exigence
d'environnement (version de Node).

### 4.3 Versions majeures

Circuit distinct, en quatre étapes :

1. **Issue dédiée** — motif de la montée, changements incompatibles relevés
   dans les notes de version, périmètre d'impact estimé.
2. **Branche dédiée** (`chore/upgrade-<paquet>-<version>`), jamais mêlée à un
   correctif ou à une fonctionnalité — pour que le retour arrière reste net.
3. **Plan de test explicite**, adapté au paquet. Exemple pour `archiver 7 → 8` :
   export ZIP d'un projet volumineux, vérification de l'intégrité de l'archive
   produite, comportement en flux sous charge.
4. **Déploiement isolé**, sans autre changement dans la même publication. Si la
   production se dégrade, la cause est immédiatement identifiée.

### 4.4 Correctifs de sécurité

Traités **hors du cycle hebdomadaire**, avec des délais alignés sur la grille de
sévérité du [processus de traitement des anomalies](./PROCESSUS_ANOMALIES.md) :

| Sévérité de l'avis | Prise en charge | Correctif |
|---|---|---|
| Critique, exploitable à distance | Immédiate | 24 h |
| Élevée | 1 j ouvré | 7 j |
| Moyenne | Cycle hebdomadaire | Sprint courant |
| Faible | Cycle hebdomadaire | Backlog |

Une vulnérabilité **critique et exploitable** justifie de contourner le cycle
normal, y compris de déployer une montée majeure en urgence. Ce cas est
documenté dans une issue `security` avec le raisonnement d'arbitrage.

---

## 5. Évaluation de l'impact avant fusion

Une PR de dépendance n'est pas fusionnée sur la seule foi d'une CI verte. Trois
vérifications s'ajoutent :

| Vérification | Ce qu'elle couvre | Comment |
|---|---|---|
| **Chaîne d'intégration** | Régression fonctionnelle | Lint, 165 tests, build Docker, smoke test, E2E Playwright |
| **Portée réelle** | Le paquet est-il exécuté en production ? | `npm ls <paquet>` — une dépendance de développement n'a pas le même poids |
| **Notes de version** | Changement de comportement non couvert par les tests | Lecture du changelog amont entre les deux versions |

Le **smoke test** joue un rôle particulier ici. Une montée de dépendance peut
produire une image qui se construit mais ne démarre pas — exactement le mode de
défaillance de [ANO-2026-001](./anomalies/ANO-2026-001.md). Le fait que la CI
démarre réellement le conteneur et interroge `/health` couvre cette classe de
régression pour toutes les mises à jour à venir.

---

## 6. Procédure de retour arrière

Une mise à jour peut dégrader la production malgré les vérifications. La
procédure doit être connue **avant** d'en avoir besoin.

### API (Cloud Run)

```bash
# 1. Rétablir immédiatement le service sur la révision précédente
gcloud run services update-traffic visuals-api \
  --region europe-west1 --to-revisions <révision-précédente>=100

# 2. Annuler la montée dans le dépôt
git revert <sha-de-la-pr-dependabot>
git push
```

Le basculement de trafic est **immédiat** et ne dépend pas d'une reconstruction :
c'est ce qui permet de rétablir le service en moins d'une minute, puis de
traiter la cause à froid.

### Front (Vercel)

Le tableau de bord Vercel conserve chaque déploiement : *Deployments →
déploiement précédent → Promote to Production*. Puis `git revert` du commit.

### Après tout retour arrière

Le paquet en cause est ajouté à `ignore` dans `dependabot.yml` avec un
commentaire expliquant le motif, et une issue est ouverte pour instruire le
problème. Sans cela, Dependabot rouvrira la même PR la semaine suivante.

---

## 7. Dette de mise à jour connue

Relevé du 2026-08-14, après correction des vulnérabilités. Aucune de ces
montées n'est une vulnérabilité — ce sont des retards assumés, documentés ici
pour rester visibles.

### API — `visuals-api`

| Paquet | Actuelle | Dernière | Nature | Arbitrage |
|---|---|---|---|---|
| `@supabase/supabase-js` | 2.98.0 | 2.112.3 | Mineure, production | Prochain cycle hebdomadaire |
| `archiver` | 7.0.1 | 8.0.0 | **Majeure**, production | Issue dédiée — plan de test sur l'export ZIP |
| `uuid` | 13.0.2 | 14.0.1 | **Majeure**, production | Issue dédiée |
| `vitest`, `@vitest/coverage-v8` | 3.2.7 | 4.1.10 | **Majeure**, développement | Groupe `development` — sans impact production |
| `eslint`, `prettier`, `globals` | — | — | Mineures, développement | Cycle hebdomadaire |

### Front — `myvisuals-client`

| Paquet | Actuelle | Dernière | Nature | Arbitrage |
|---|---|---|---|---|
| `framer-motion` | 12.29.3 | 13.1.0 | **Majeure**, production | Issue dédiée — animations à vérifier visuellement |
| `lucide-react` | 0.563.0 | 1.31.0 | **Majeure**, production | Issue dédiée — bibliothèque d'icônes, impact visuel large |
| `@tailwindcss/postcss` | 4.1.18 | 4.3.3 | Mineure, production | Cycle hebdomadaire |
| `eslint` | 9.39.2 | 10.8.1 | **Majeure**, développement | Groupe `development` |
| `jsdom` | 26.1.0 | 29.1.1 | **Majeure**, développement | Groupe `development` |

**Décalage assumé entre les deux dépôts** : l'API est sur `eslint 10`, le front
sur `eslint 9`. Aligner les deux impose de reprendre la configuration front
(format plat, règles renommées). Ce n'est pas une dette de sécurité, et le
travail sera fait au prochain cycle d'outillage.

---

## 8. Indicateurs de suivi

Relevés mensuellement, en même temps que les indicateurs de supervision.

| Indicateur | Cible | Ce qu'il révèle |
|---|---|---|
| Vulnérabilités de sévérité ≥ élevée | **0** | Garanti par le job bloquant en CI |
| Délai de traitement d'un avis critique | < 24 h | Réactivité réelle face à une CVE |
| PR Dependabot ouvertes depuis > 14 j | < 3 | Au-delà, l'automatisation n'est plus suivie et devient décorative |
| Dépendances de production en retard majeur | < 5 | Mesure la dette structurelle |

Le troisième est le plus révélateur : un dispositif automatisé dont les PR
s'empilent sans être traitées donne l'**illusion** d'un suivi. Le nombre de PR
en attente mesure ce que l'audit ne voit pas.

---

## 9. Limites connues

| Limite | Conséquence | Piste |
|---|---|---|
| Aucun environnement de recette | Une montée est validée par les tests, jamais sur un environnement réel avant la production | Service Cloud Run `visuals-api-staging` |
| `npm audit` ne couvre pas les dépendances système de l'image | Une faille dans une bibliothèque Alpine reste invisible | Analyse d'image (Trivy, Scout) dans la CI |
| Pas d'inventaire logiciel (SBOM) | Impossible de répondre vite à « suis-je exposé à cette CVE ? » | Génération d'un SBOM CycloneDX à chaque publication |
| Fusion manuelle des PR de correctifs | Dépend de la disponibilité d'une seule personne | Fusion automatique des correctifs si la CI est verte, une fois la confiance établie dans la couverture de tests |

---

## Références

- [Système de supervision et d'alerte](./SUPERVISION.md)
- [Processus de traitement des anomalies](./PROCESSUS_ANOMALIES.md)
- [Journal de version](../CHANGELOG.md)
- Configuration : [`.github/dependabot.yml`](../.github/dependabot.yml) · [`ci.yml`](../.github/workflows/ci.yml)
