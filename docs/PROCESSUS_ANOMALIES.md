# Processus de collecte et de consignation des anomalies — Visuals.co

> Compétences RNCP visées :
> **C4.2.1** — *Consigner les anomalies détectées en élaborant un processus de
> collecte et consignation, en utilisant des outils de collecte et en y intégrant
> toutes les informations pertinentes, afin de déterminer le correctif à mettre
> en place.*
> **C4.2.2** — *Traiter les anomalies détectées.*

---

## 1. Principe directeur

Une anomalie non consignée est une anomalie qui reviendra.

Le projet a d'abord fonctionné sans processus formel : les défauts étaient
corrigés directement, au fil de l'eau, et la seule trace subsistante était le
message de commit. Cette pratique a un coût mesurable, observé sur ce projet
même :

- **la cause racine n'est pas écrite** — trois commits successifs
  (`14f394e`, `9ee2d83`, `a78a8bd`) ont été nécessaires pour corriger un même
  problème de déploiement, faute d'avoir posé le diagnostic avant d'agir ;
- **la récidive n'est pas empêchée** — rien ne garantit qu'un correctif est
  accompagné du test qui l'aurait détecté ;
- **rien n'est mesurable** — sans consignation, impossible de savoir combien
  d'anomalies sont détectées par la supervision plutôt que subies par les
  utilisateurs.

Le processus décrit ici corrige ces trois points. Il tient en une règle :
**toute anomalie confirmée donne lieu à une fiche, et tout correctif à un test
qui échoue si le correctif est retiré.**

---

## 2. Canaux de détection

Quatre canaux, par ordre décroissant de préférence — plus une anomalie est
détectée tôt, moins elle coûte.

| # | Canal | Outil | Délai typique | Qui la voit en premier |
|---|---|---|---|---|
| 1 | **Intégration continue** | GitHub Actions (lint, tests, smoke test, audit) | minutes | Personne — bloquée avant fusion |
| 2 | **Supervision automatique** | Uptime check, Cloud Monitoring, Sentry | 5–15 min | L'équipe |
| 3 | **Recette interne** | Tests manuels, revue de code | heures | L'équipe |
| 4 | **Support client** | Signalement utilisateur | variable | **L'utilisateur** |

Le canal 4 est le plus coûteux : l'anomalie a déjà produit son effet, la
confiance est déjà entamée, et le diagnostic dépend du récit d'un tiers.
L'indicateur *part des anomalies détectées avant signalement client*
(cible > 60 %, voir [SUPERVISION.md § 4](./SUPERVISION.md#4-indicateurs-de-suivi))
mesure précisément le déplacement du canal 4 vers les canaux 1 à 3.

Chaque fiche porte un label `source:*` — c'est de là que vient la mesure.

---

## 3. Cycle de vie d'une anomalie

```
   Détection (canal 1 à 4)
        │
        ▼
   ┌─────────────┐   non reproductible / hors périmètre
   │ QUALIFIER   │──────────────────────────────────────► status:wontfix
   │ status:     │                                        (motif documenté)
   │ triage      │
   └─────┬───────┘
         │ reproduite → sévérité S1..S4 attribuée
         ▼
   ┌─────────────┐
   │ CONSIGNER   │  Issue GitHub via formulaire [ANO]
   │ status:     │  labels : severity · env · source · area
   │ confirmed   │
   └─────┬───────┘
         │
         ▼
   ┌─────────────┐   branche fix/<issue>-<slug>
   │ CORRIGER    │   1. test de non-régression qui ÉCHOUE
   │ status:     │   2. correctif minimal qui le fait PASSER
   │ in-progress │   3. action préventive si la classe de défaut peut se répéter
   └─────┬───────┘
         │ Pull Request (CI verte + revue) → fusion
         ▼
   ┌─────────────┐
   │ PUBLIER     │  entrée CHANGELOG · version · déploiement automatique
   │ status:     │
   │ fixed       │
   └─────┬───────┘
         │
         ▼
   ┌─────────────┐  vérification en production sur l'environnement réel
   │ VÉRIFIER    │  si origine support : confirmation par l'utilisateur
   │ status:     │  si S1 ou S2 : analyse post-incident
   │ verified    │
   └─────────────┘
```

**Le ticket ne se ferme pas au déploiement du correctif, mais à sa
vérification.** Un correctif fusionné n'est qu'une hypothèse tant qu'il n'a pas
été confronté à l'environnement réel — plusieurs anomalies de ce projet
(ANO-2026-001 en particulier) ne se manifestaient qu'en production.

---

## 4. Grille de sévérité et délais d'engagement

| Sév. | Définition | Exemple vécu sur le projet | Prise en charge | Correctif visé |
|---|---|---|---|---|
| **S1** | Service indisponible, perte ou fuite de données | [ANO-2026-001](./anomalies/ANO-2026-001.md) — API en échec au démarrage après déploiement | 1 h ouvrée | 4 h ouvrées |
| **S2** | Fonction clé inutilisable, sans contournement | [ANO-2026-003](./anomalies/ANO-2026-003.md) — inscription Studio créant un compte Client | 4 h ouvrées | 2 j ouvrés |
| **S3** | Fonction dégradée, contournement possible | [ANO-2026-002](./anomalies/ANO-2026-002.md) — 429 sur le tableau de bord | 1 j ouvré | Sprint courant |
| **S4** | Défaut cosmétique, sans impact fonctionnel | Ruptures de mise en page sous 768 px | 5 j ouvrés | Backlog |

**La sévérité mesure l'impact utilisateur, jamais la difficulté technique.** Une
faute de frappe dans une condition d'autorisation est triviale à corriger et
reste une S1 : c'est l'effet qui détermine la priorité, pas l'effort.

**Escalade.** Une S2 ouverte depuis plus de 48 h est reclassée S1 — une anomalie
majeure qui s'installe finit par produire les mêmes effets qu'une panne.

---

## 5. Outils de collecte

| Outil | Rôle | Ce qu'il apporte à la fiche |
|---|---|---|
| **Formulaire GitHub `[ANO]`** | Consignation | Champs obligatoires : sévérité, environnement, version, étapes de reproduction, impact |
| **Formulaire GitHub `[SUP]`** | Réception des signalements | Verbatim utilisateur, contexte, engagement de réponse |
| **Sentry** | Détection + diagnostic | Pile d'appels, version concernée, nombre d'utilisateurs touchés, rejeu de session |
| **Cloud Logging** | Diagnostic | Ligne de log exacte, filtrable sur le `requestId` |
| **`X-Request-Id` / `INC-…`** | Corrélation | Relie signalement, log serveur et événement Sentry |
| **Labels GitHub** | Pilotage | `severity` · `env` · `source` · `area` · `status` |
| **`CHANGELOG.md`** | Traçabilité | Relie chaque correctif publié à sa version déployée |

Les formulaires sont volontairement **bloquants** : les issues libres sont
désactivées (`blank_issues_enabled: false`). Une fiche incomplète repart en
demande d'information, ce qui coûte plus cher que de la remplir correctement.

Le jeu de labels s'installe par `./scripts/setup-github-labels.sh`.

### La clé de corrélation

C'est le mécanisme le plus déterminant du dispositif, et le moins visible.

```
Utilisateur : « ça a planté, référence INC-260720-A4T2X »
      │
      ├─► Sentry : recherche sur incidentRef → pile d'appels + version + rejeu
      │
      └─► Cloud Logging : jsonPayload.requestId="…" → requête exacte, statut, latence
```

Sans elle, le diagnostic part d'un horodatage approximatif et d'une
reconstitution. Avec elle, une seule requête suffit. Mise en œuvre :
[`middlewares/requestId.js`](../server/middlewares/requestId.js) côté API,
[`ErrorBoundary.jsx`](../client/src/components/common/ErrorBoundary.jsx) côté
navigateur.

---

## 6. Contenu obligatoire d'une fiche

Une fiche exploitable répond à six questions. Si l'une reste sans réponse, la
qualification n'est pas terminée.

| Question | Pourquoi elle est obligatoire |
|---|---|
| **Quoi** — comportement observé vs attendu | Sans l'écart, il n'y a pas d'anomalie mais une insatisfaction |
| **Où** — environnement, composant, **version déployée** | Un correctif ne peut pas être validé si l'on ignore quelle version présentait le défaut |
| **Quand** — date, `requestId`, première occurrence | Détermine si c'est une régression et permet d'identifier le déploiement en cause |
| **Comment** — étapes de reproduction | Une anomalie non reproductible ne peut pas être corrigée avec certitude, seulement contournée |
| **Combien** — utilisateurs touchés, contournement | Détermine la sévérité, donc la priorité |
| **Preuves** — logs, captures, lien Sentry | Évite de rejouer le diagnostic à chaque reprise du ticket |

---

## 7. Règles de correction

**Le test avant le correctif.** On écrit d'abord le test qui reproduit le
défaut et qui échoue. Sans cette étape, rien ne prouve que le correctif traite
la cause réelle plutôt qu'un symptôme voisin — et rien n'empêche la récidive.

**Correctif minimal.** Une correction ne doit pas embarquer de refactorisation
opportuniste : en cas de retour arrière, on doit pouvoir annuler le correctif
sans annuler autre chose. Les améliorations repérées en chemin partent dans une
issue distincte.

**Action préventive quand la classe de défaut peut se répéter.** C'est ce qui
distingue une correction d'une simple réparation. ANO-2026-001 en est
l'illustration : au-delà du correctif, un smoke test démarre désormais
réellement le conteneur en CI et interroge `/health`, ce qui rend
**structurellement impossible** de déployer une image qui ne démarre pas.

**Analyse post-incident pour toute S1 ou S2.** Trois questions, sans recherche
de responsabilité : pourquoi le défaut a-t-il été introduit ? pourquoi n'a-t-il
pas été détecté plus tôt ? qu'est-ce qui empêchera sa récidive ?

---

## 8. Fiches d'anomalies du projet

| Référence | Titre | Sév. | Canal | Statut |
|---|---|---|---|---|
| [ANO-2026-001](./anomalies/ANO-2026-001.md) | Conteneur en échec au démarrage après déploiement | S1 | Supervision | ✅ Vérifiée |
| [ANO-2026-002](./anomalies/ANO-2026-002.md) | Saturation du limiteur de débit sur le tableau de bord | S3 | Recette interne | ✅ Vérifiée |
| [ANO-2026-003](./anomalies/ANO-2026-003.md) | Inscription Studio créant un compte Client | S2 | Support client | ✅ Vérifiée |
| [ANO-2026-004](./anomalies/ANO-2026-004.md) | Les déploiements n'atteignaient pas le service de production | S1 | Supervision | 🟠 Correctif fusionné |

Modèle vierge : [`_TEMPLATE.md`](./anomalies/_TEMPLATE.md).

---

## 9. Limites du processus

| Limite | Conséquence | Piste |
|---|---|---|
| Une seule personne qualifie et corrige | Pas de regard extérieur sur la qualification ; risque de sous-évaluer une sévérité | Revue croisée dès qu'une seconde personne rejoint le projet |
| Pas d'outil de support dédié | Les échanges utilisateurs vivent hors du dépôt, seul le résumé y est consigné | Bouton « Signaler un problème » dans l'application, alimentant une table `support_tickets` avec le contexte de diagnostic attaché automatiquement |
| Indicateurs de pilotage relevés manuellement | Revue mensuelle facile à omettre | Requête GitHub API agrégeant les labels `source:*` |

---

## Références

- [Système de supervision et d'alerte](./SUPERVISION.md)
- [Journal de version](../CHANGELOG.md)
- Formulaires : [`bug_report.yml`](../.github/ISSUE_TEMPLATE/bug_report.yml) · [`support_client.yml`](../.github/ISSUE_TEMPLATE/support_client.yml)
