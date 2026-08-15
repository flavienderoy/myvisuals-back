# Journal de version — Visuals.co API (`visuals-api`)

Toutes les évolutions notables du backend sont consignées ici.

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).
Versionnage : [Semantic Versioning](https://semver.org/lang/fr/) —
`MAJEUR.MINEUR.CORRECTIF`.

> Le front-end est versionné séparément dans son propre dépôt
> ([`myvisuals-client`](https://github.com/flavienderoy/myvisuals-client/blob/main/CHANGELOG.md)) :
> les deux applications ont des chaînes de déploiement distinctes (Cloud Run
> d'un côté, Vercel de l'autre) et peuvent être publiées indépendamment. Les
> versions qui doivent être déployées ensemble sont signalées explicitement.
>
> **Vérifier la version en production** : `curl https://<api>/health` renvoie
> les champs `version` et `revision`. La valeur est lue depuis `package.json`
> — elle ne peut donc pas diverger de ce journal.

---

## [Non publié]

_Rien pour le moment._

---

## [1.6.0] — 2026-08-14

### Ajouté

- **Sonde d'aptitude `GET /health/ready`** — interroge réellement PostgreSQL et
  le stockage objet, mesure la latence de chacun et agrège leur état
  (`ok` / `degraded` / `down`, avec un HTTP 503 sur défaillance critique).
  Sépare la vivacité de l'aptitude : une dégradation de dépendance ne provoque
  plus le redémarrage du conteneur.
- **Journalisation JSON structurée** hors développement, compatible Google
  Cloud Logging (`severity`, `requestId`, `statusCode`, `latencyMs`). Rend
  possibles les métriques dérivées des logs et les politiques d'alerte.
- **Identifiant de corrélation** `X-Request-Id` sur toute requête, injecté dans
  chaque ligne de log et présent dans les réponses d'erreur.
- **Suivi d'erreurs applicatives** (Sentry), activé par la seule présence de
  `SENTRY_DSN`. Capture les 5xx, `unhandledRejection` et `uncaughtException`.
  Sans DSN : no-op complet.
- **Arrêt propre** sur `SIGTERM` / `SIGINT` — les requêtes en vol se terminent
  avant le retrait de l'instance, supprimant les erreurs réseau à chaque
  déploiement Cloud Run.
- **Processus de traitement des anomalies** : formulaires d'issue `[ANO]` et
  `[SUP]`, gabarit de pull request, jeu de labels
  (`./scripts/setup-github-labels.sh`), trois fiches d'anomalies documentées.
- **Documentation** : [`docs/SUPERVISION.md`](docs/SUPERVISION.md) et
  [`docs/PROCESSUS_ANOMALIES.md`](docs/PROCESSUS_ANOMALIES.md).
- Scripts `npm run audit:ci` et `npm run audit:report`.
- 19 tests supplémentaires (sondes de supervision, attribution du rôle à
  l'inscription) — 90 tests au total.

### Modifié

- `GET /health` expose désormais `version`, `revision` et `uptimeSeconds`, et
  n'effectue plus aucune entrée/sortie.
- La gestion des erreurs est extraite dans
  [`middlewares/errorHandler.js`](server/middlewares/errorHandler.js) : les 404
  sont journalisés en `WARNING` et non `ERROR`, ce qui évite de polluer
  l'indicateur de taux d'erreurs serveur avec des erreurs d'appelant.

### Sécurité

- **14 vulnérabilités de dépendances corrigées** (10 *high*, 3 *moderate*,
  1 *low*) — dont `ws` (divulgation de mémoire non initialisée), `multer`
  (dépendance directe), `path-to-regexp`, `postcss`, `js-yaml`, `nanoid`.
  Toutes résolues par des montées de version compatibles ; aucun changement
  incompatible. Résultat : `npm audit` → 0 vulnérabilité.
- **Garde-fou permanent** — `npm audit --audit-level=high` est désormais
  bloquant dans la chaîne d'intégration continue : une vulnérabilité de ce
  niveau ne peut plus atteindre la production sans décision explicite.
- **Dependabot** ([`.github/dependabot.yml`](.github/dependabot.yml)) — suivi
  hebdomadaire des dépendances npm (pull requests groupées par nature et par
  risque), et mensuel des actions GitHub et de l'image Docker de base, dont la
  compromission exposerait les secrets de déploiement. Les montées majeures de
  dépendances de production sont exclues des pull requests automatiques.
- **Processus documenté** :
  [`docs/PROCESSUS_DEPENDANCES.md`](docs/PROCESSUS_DEPENDANCES.md) — politique
  d'arbitrage par type de montée, évaluation d'impact, procédure de retour
  arrière Cloud Run et Vercel, dette de mise à jour connue.

### Corrigé

- **Dérive de version** — `GET /health` annonçait `1.0.0` en dur, valeur figée
  depuis la première version et divergente de la réalité déployée depuis six
  publications. La version est désormais lue depuis `package.json`, et un test
  de non-régression verrouille cette propriété.
- **Contrôle automatisé du journal de version** —
  [`scripts/check-changelog.cjs`](scripts/check-changelog.cjs) vérifie à chaque
  exécution de la CI que `package.json` et `CHANGELOG.md` annoncent la même
  version, et que les versions y sont ordonnées. Bloquant avant déploiement.

---

## [1.5.2] — 2026-07-24

### Corrigé

- **Chaîne de déploiement Cloud Run** — conflit de type entre les secrets
  Google Secret Manager et les variables d'environnement du service, qui
  faisait échouer le déploiement. Les identifiants Supabase sont passés en
  variables d'environnement, et les anciens secrets sont explicitement purgés
  dans une étape distincte avant le déploiement (`14f394e`, `9ee2d83`,
  `a78a8bd`).

  > Trois itérations ont été nécessaires faute d'avoir posé le diagnostic avant
  > d'agir. C'est l'un des cas qui a motivé la formalisation du
  > [processus de traitement des anomalies](docs/PROCESSUS_ANOMALIES.md).

### Modifié

- Nettoyage de la documentation, README unifié (`6bcff22`).

---

## [1.5.1] — 2026-07-23

### Corrigé

- **[ANO-2026-003](docs/anomalies/ANO-2026-003.md) — Inscription Studio créant
  un compte Client** (S2, signalée par le support client). La contrainte
  `CHECK` sur `profiles.role` ne connaissait pas la valeur `studio` : le
  trigger repliait silencieusement sur `client` et l'erreur d'`upsert` était
  avalée par un `try/catch`. Migration `013` (contrainte + trigger idempotent),
  erreur d'écriture désormais explicitement journalisée, nom et champs
  facultatifs normalisés (`d20e4d3`, `be52bf5`, `faa9a27`).

  > ⚠️ Nécessite l'application de la migration
  > [`013_fix_profiles_role_check.sql`](server/scripts/migrations/013_fix_profiles_role_check.sql)
  > et le déploiement conjoint du front `1.7.0`.

- Le message d'erreur de robustesse du mot de passe précise quel critère
  manque, au lieu de les énumérer tous.

---

## [1.5.0] — 2026-07-22

### Ajouté

- Réinitialisation de mot de passe : `POST /api/auth/forgot-password` et
  `POST /api/auth/reset-password` (`261fde3`).

### Corrigé

- **[ANO-2026-001](docs/anomalies/ANO-2026-001.md) — Conteneur en échec au
  démarrage après déploiement** (S1, indisponibilité totale ~15 min).
  Le `Dockerfile` de production omettait `utils/` et `swaggerOptions.js` ;
  `docker build` réussissait sans jamais exécuter l'application. Correctif des
  instructions de copie **et** ajout d'un smoke test en CI qui démarre
  réellement le conteneur et interroge `/health` (`a942974`).
- `trust proxy` activé — l'adresse IP réelle du client était masquée derrière le
  proxy Cloud Run, ce qui faussait le limiteur de débit (`7876edd`).
- Jointures et repli sur le propriétaire dans le contrôleur d'équipe (`3a97719`).

---

## [1.4.0] — 2026-07-20

### Ajouté

- Modèle de conversations : canaux de projet, groupes et messages directs
  (`c52eba7`).
- Accusés de lecture et journalisation des événements de projet et de tâche
  (`8ec01e5`).
- Arborescence de dossiers imbriqués pour les visuels d'un projet (`6cf2637`).
- Journal d'activité alimenté par les événements réels, avec résolution de
  l'acteur (`69a1677`).

### Corrigé

- **[ANO-2026-002](docs/anomalies/ANO-2026-002.md) — Saturation du limiteur de
  débit** (S3). Le tableau de bord déclenche ~12 appels parallèles à son
  montage ; le seuil, calibré sur une version antérieure, était atteint en
  usage normal. Seuil de production porté de 500 à 1000 par fenêtre de 15 min,
  limitation neutralisée sur `localhost` **en développement uniquement**
  (`2497a8f`). Correctif complété côté front en `1.5.0`.

---

## [1.3.0] — 2026-07-18

### Ajouté

- Fils de discussion sur les annotations (`parent_id`) (`4e613c3`).
- Système de tickets sur les annotations : résolution, réouverture, endpoint
  dédié (`19f7560`).
- Annotations rattachées à leur version d'asset (`d17564d`).
- Notifications applicatives et messagerie de projet enrichie (`95573bf`),
  avec acteur et lien profond vers le commentaire visé (`8496395`).
- Membres d'équipe côté studio et cloisonnement des données par studio
  (`559ae53`).
- Contrôle d'accès par rôle : les endpoints réservés au studio rejettent les
  comptes client (`936c5c6`).
- Liens de partage public en lecture seule (`adfb4d2`).
- Colonne `assets.tags` — migration `010` (`d0d67f8`).
- Profils des expéditeurs joints aux fils de messages (`11ac94f`).

### Corrigé

- Erreur 500 au téléversement d'une nouvelle version : la table
  `asset_versions` ne possède pas de colonne `comment` (`fc9fbc8`).

---

## [1.2.0] — 2026-07-15

### Ajouté

- Pipeline de traitement sécurisé des visuels : aperçus filigranés en dur et
  URL signées à durée de vie limitée (`d56dbd2`).
- Téléchargement en flux d'une archive ZIP des fichiers originaux d'un projet
  (`eecdcb7`).

### Corrigé

- Passe d'audit générale : réconciliation de l'ensemble des contrôleurs avec le
  schéma réel de la base (`54a0926`, `05a253e`, `7d7d46d`).
- Visibilité des projets déduite des données et non des métadonnées de rôle
  (`441509e`).
- `getMyInvitations` ne renvoie plus 500 sur une indication de clé étrangère
  erronée (`f4409a2`).

---

## [1.1.0] — 2026-07-14

### Ajouté

- Compression WebP à la volée et génération de miniatures (Sharp).
- Effacement des données personnelles (droit à l'effacement, RGPD).
- Pagination normalisée sur les endpoints de liste.
- Invitation d'un client par e-mail depuis un studio, avec données de portail
  liées (`ac3bfe2`).

### Modifié

- Chaîne CI/CD migrée d'AWS ECR/ECS vers Google Cloud Run (`b06fa23`).

### Supprimé

- API de devis et de facturation — hors périmètre fonctionnel (`2687e98`,
  `42ce543`).

---

## [1.0.0] — 2026-07-08

### Ajouté

- Première version du backend Express : 20 groupes de routes, 20 contrôleurs.
- Schéma PostgreSQL complet (23 tables) avec politiques *Row Level Security*.
- Authentification Supabase, middlewares d'authentification et de rôle.
- Sécurisation : Helmet, CORS strict, limitation de débit, requêtes
  paramétrées, filtrage MIME strict des téléversements.
- Documentation Swagger sur `/api-docs`.
- Chaîne CI/CD GitHub Actions : lint → tests → build Docker → déploiement.
- Suite de tests (Vitest + Supertest).

---

[Non publié]: https://github.com/flavienderoy/myvisuals-back/compare/v1.6.0...HEAD
[1.6.0]: https://github.com/flavienderoy/myvisuals-back/compare/v1.5.2...v1.6.0
[1.5.2]: https://github.com/flavienderoy/myvisuals-back/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/flavienderoy/myvisuals-back/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/flavienderoy/myvisuals-back/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/flavienderoy/myvisuals-back/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/flavienderoy/myvisuals-back/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/flavienderoy/myvisuals-back/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/flavienderoy/myvisuals-back/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/flavienderoy/myvisuals-back/releases/tag/v1.0.0
