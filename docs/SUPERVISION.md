# Système de supervision et d'alerte — Visuals.co

> Document de référence du dispositif de supervision.
> Compétence RNCP visée : **C4.1.2** — *Concevoir un système de supervision et
> d'alerte en déterminant le périmètre de supervision et en identifiant les
> indicateurs de suivi pertinents, en mettant en place des sondes, en
> configurant la modalité des signalements afin de garantir une disponibilité
> permanente du logiciel.*

---

## 1. Pourquoi superviser, et quoi

Visuals.co est une plateforme SaaS B2B : un studio y dépose les visuels d'une
campagne, son client les valide, puis les récupère. Trois conséquences directes
sur ce qu'il faut surveiller.

**Une indisponibilité est immédiatement visible du client final.** Ce n'est pas
un outil interne dont l'arrêt se négocie : un client qui ne peut pas valider ses
visuels à l'heure dite bloque une production. La disponibilité de l'API est donc
l'indicateur de premier rang.

**L'application est répartie sur quatre fournisseurs indépendants** — Vercel
(front), Google Cloud Run (API), Supabase (PostgreSQL + Auth), Supabase Storage
(objets). Chacun peut défaillir séparément. Une sonde HTTP unique sur la page
d'accueil ne dirait rien d'une panne de stockage : le front se chargerait
normalement et les visuels seraient introuvables. **Le périmètre de supervision
doit donc épouser cette découpe**, avec une sonde par dépendance.

**Les données manipulées sont confidentielles.** Les visuels d'une campagne non
publiée sont sous embargo. Toute télémétrie envoyée à un tiers doit être
minimisée : ni URL signées, ni jetons, ni identités nominatives (§ 6).

### Ce qui est hors périmètre, et pourquoi

| Exclusion | Justification |
|---|---|
| Traçage distribué (OpenTelemetry) | Deux services seulement, chaînes d'appel courtes ; le `requestId` suffit à corréler. Coût de mise en œuvre disproportionné. |
| Supervision système (CPU, disque, mémoire hôte) | Cloud Run est une plateforme managée sans serveur : ces métriques ne sont ni actionnables ni exposées. Seule la mémoire du process est suivie. |
| Astreinte 24/7 | Projet porté par une seule personne. Les délais d'engagement (§ 5) sont explicitement définis en heures ouvrées — un engagement tenable vaut mieux qu'un engagement affiché et non tenu. |

---

## 2. Périmètre supervisé

```
┌──────────────────────────────────────────────────────────────────────┐
│  COUCHE 1 — Front  (Vercel · myvisuals-client)                       │
│  Sondes : Sentry Browser · ErrorBoundary React · Vercel Analytics    │
│  Détecte : exceptions JS, échec de chargement de bundle, régression  │
│            propre à un navigateur                                    │
├──────────────────────────────────────────────────────────────────────┤
│  COUCHE 2 — API  (Cloud Run · visuals-api)                           │
│  Sondes : GET /health (liveness) · GET /health/ready (readiness)     │
│           logs JSON structurés · Sentry Node · métriques Cloud Run   │
│  Détecte : conteneur mort, 5xx, latence, saturation du rate limiter  │
├──────────────────────────────────────────────────────────────────────┤
│  COUCHE 3 — Données  (Supabase : PostgreSQL + Storage)               │
│  Sondes : probeDatabase() · probeStorage() dans /health/ready        │
│           tableau de bord Supabase (quotas, requêtes lentes)         │
│  Détecte : base injoignable, bucket indisponible, quota atteint      │
├──────────────────────────────────────────────────────────────────────┤
│  COUCHE 4 — Chaîne de livraison  (GitHub Actions)                    │
│  Sondes : lint · tests · build Docker · smoke test /health · audit   │
│  Détecte : régression avant mise en production, déploiement échoué,  │
│            vulnérabilité de dépendance                               │
└──────────────────────────────────────────────────────────────────────┘
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│  SONDE EXTERNE — uptime check (hors infrastructure)                  │
│  Interroge /health/ready toutes les 5 min depuis 3 régions           │
│  Seule sonde capable de détecter une panne *globale* : toutes les    │
│  autres sont hébergées par ce qu'elles surveillent.                  │
└──────────────────────────────────────────────────────────────────────┘
```

Le point important de ce schéma est la dernière ligne. Sentry, les logs et les
métriques Cloud Run sont tous *à l'intérieur* du système supervisé : si Cloud
Run tombe, ils se taisent — et un silence ressemble à un fonctionnement normal.
La sonde externe existe précisément pour transformer ce silence en alerte.

---

## 3. Les sondes

### 3.1 `GET /health` — vivacité (*liveness*)

Répond sans aucune entrée/sortie : uniquement la question « le process Node
répond-il ? ».

```json
{
  "status": "ok",
  "message": "Visuals.co API is running",
  "timestamp": "2026-08-14T21:46:50.512Z",
  "version": "1.6.0",
  "revision": "visuals-api-00042-abc",
  "uptimeSeconds": 3812
}
```

Consommateurs : `HEALTHCHECK` Docker, Cloud Run, smoke test de la CI.

**Pourquoi aucun appel base ici.** Cloud Run redémarre un conteneur dont le
health check échoue. Si `/health` interrogeait PostgreSQL, une latence
passagère de Supabase déclencherait un redémarrage en boucle : une dégradation
d'une dépendance se transformerait en panne totale, causée par la supervision
elle-même. La séparation liveness / readiness évite ce mode de défaillance.

Le champ `version` est lu depuis `package.json`
([`healthController.js`](../server/controllers/healthController.js)) et non
codé en dur. Un `curl /health` répond donc avec certitude à la question « quelle
version tourne réellement en production ? » — c'est le lien opérationnel entre
le [journal de version](../CHANGELOG.md) et l'environnement déployé. Un test de
non-régression verrouille cette propriété.

### 3.2 `GET /health/ready` — aptitude (*readiness*)

Interroge réellement chaque dépendance et agrège leur état.

```json
{
  "status": "ok",
  "version": "1.6.0",
  "environment": "production",
  "checks": {
    "database": { "status": "ok", "latencyMs": 220 },
    "storage":  { "status": "ok", "latencyMs": 301 }
  },
  "runtime": { "node": "v20.11.0", "heapUsedMB": 27, "rssMB": 144 },
  "monitoring": { "errorTracking": "sentry" }
}
```

| État | Condition | Code HTTP | Conséquence |
|---|---|---|---|
| `ok` | toutes les dépendances répondent | 200 | — |
| `degraded` | stockage en défaut, base opérationnelle | 200 | alerte S2 |
| `down` | base de données injoignable | **503** | alerte S1 |

La distinction est délibérée. Sans stockage, les visuels ne s'affichent plus,
mais les projets, les échanges et les validations restent consultables : c'est
une dégradation, pas une panne. Sans base de données, aucune route métier ne
fonctionne. Traiter ces deux cas au même niveau produirait soit du bruit
d'alerte, soit un temps de réaction trop long — dans les deux cas, une
supervision à laquelle on cesse de prêter attention.

Chaque sonde est bornée par un délai (`HEALTH_PROBE_TIMEOUT_MS`, 3 s par
défaut) : une dépendance qui ne répond pas *du tout* est le cas de panne le plus
fréquent, et sans borne la sonde resterait suspendue au lieu d'alerter.

### 3.3 Logs structurés

`morgan('dev')` produit du texte coloré, ingéré par Cloud Logging comme une
chaîne opaque avec une `severity` toujours à `DEFAULT`. **Aucune métrique ni
alerte ne peut en être dérivée.** La journalisation hors développement émet donc
du JSON une-ligne avec les champs reconnus par Cloud Logging :

```json
{"severity":"ERROR","message":"POST /api/assets/123/versions 500",
 "timestamp":"2026-07-18T14:22:31.918Z","service":"visuals-api",
 "revision":"visuals-api-00039-x7k","requestId":"7f3a…","statusCode":500,
 "latencyMs":842,"userId":"a1b2…"}
```

Chaque champ devient requêtable, donc alertable. Implémentation :
[`utils/logger.js`](../server/utils/logger.js),
[`middlewares/httpLogger.js`](../server/middlewares/httpLogger.js).

Choix assumé : pas de dépendance supplémentaire (pino, winston). Sérialiser un
objet en JSON sur `stdout` ne justifie pas d'élargir la surface de dépendances
à auditer et à maintenir — voir le [processus de mise à jour des
dépendances](./PROCESSUS_DEPENDANCES.md).

### 3.4 Identifiant de corrélation

Chaque requête reçoit un `requestId` ([`middlewares/requestId.js`](../server/middlewares/requestId.js)),
renvoyé dans l'en-tête `X-Request-Id`, injecté dans chaque ligne de log et
attaché à chaque événement Sentry. Côté navigateur, l'`ErrorBoundary` affiche
une référence `INC-…` équivalente.

C'est la pièce qui rend une anomalie instruisible : le signalement « ça a planté
vers 14 h » devient une requête Cloud Logging unique. Sans elle, la phase de
diagnostic repose sur une reconstitution approximative à partir d'horodatages.

### 3.5 Suivi d'erreurs applicatives (Sentry)

Deux sondes distinctes, l'une et l'autre **conditionnelles** : sans DSN
configuré, le code est un no-op complet — les tests et le développement local
restent hors ligne.

| | Backend | Frontend |
|---|---|---|
| Module | [`config/monitoring.js`](../server/config/monitoring.js) | [`src/monitoring.js`](../client/src/monitoring.js) |
| Variable | `SENTRY_DSN` | `VITE_SENTRY_DSN` |
| Capture | 5xx, `unhandledRejection`, `uncaughtException` | exceptions React via `ErrorBoundary` |
| Release | `visuals-api@<version>` | `myvisuals-client@<version>` |

Le champ *release* rattache chaque erreur à une entrée du journal de version :
on peut dater l'apparition d'une régression au déploiement près.

La sonde front n'est pas redondante avec la sonde back. Une exception React, un
bundle qui échoue à se charger, une régression propre à une version de
navigateur ne produisent **aucune trace serveur** : sans elle, ces pannes ne
sont connues que si un utilisateur prend la peine de les signaler.

### 3.6 Sonde externe de disponibilité

Un uptime check interroge `/health/ready` toutes les 5 minutes depuis plusieurs
régions. C'est la seule sonde située hors de l'infrastructure supervisée, donc
la seule capable de détecter une panne totale (§ 2).

Procédure de mise en place : § 7.

### 3.7 Arrêt propre

Cloud Run envoie `SIGTERM` avant de retirer une instance — à chaque
déploiement, à chaque réduction d'échelle. Sans traitement, les requêtes en vol
sont coupées net : l'utilisateur voit une erreur réseau à chaque déploiement, et
l'indicateur « taux de 5xx » remonte artificiellement, brouillant le signal.
[`server.js`](../server/server.js) cesse d'accepter de nouvelles connexions puis
laisse les requêtes en cours se terminer, avec un garde-fou à 10 s.

---

## 4. Indicateurs de suivi

| # | Indicateur | Sonde | Seuil d'alerte | Sév. | Canal | Prise en charge |
|---|---|---|---|---|---|---|
| 1 | Disponibilité de l'API | Uptime check `/health` (5 min) | 2 échecs consécutifs | S1 | e-mail + push | immédiat |
| 2 | Aptitude au service | `/health/ready` | HTTP 503 | S1 | e-mail + push | immédiat |
| 3 | Disponibilité du stockage | `probeStorage()` | `status = degraded` | S2 | e-mail | 4 h ouvrées |
| 4 | Taux d'erreurs serveur | Log-based metric `severity=ERROR` sur `/api/**` | > 2 % sur 5 min | S2 | e-mail | 4 h ouvrées |
| 5 | Latence p95 | Métrique Cloud Run | > 1,5 s sur 10 min | S3 | e-mail | 1 j ouvré |
| 6 | Nouvelle erreur applicative | Sentry (front + back) | toute erreur inédite | S2/S3 | e-mail | 4 h / 1 j |
| 7 | Saturation du rate limiter | Log-based metric `statusCode=429` | > 50 / h | S3 | e-mail | 1 j ouvré |
| 8 | Redémarrages de conteneur | Métrique Cloud Run | > 3 / h | S2 | e-mail | 4 h ouvrées |
| 9 | Échec de déploiement | GitHub Actions | job en échec sur `main` | S2 | notification GitHub | immédiat |
| 10 | Vulnérabilité de dépendance | Dependabot + `npm audit` en CI | sévérité ≥ *high* | S2 | PR + e-mail | 7 j |
| 11 | Quota Supabase | Tableau de bord Supabase | > 80 % du palier | S3 | e-mail | 1 j ouvré |
| 12 | Erreurs front par version | Sentry, groupé par *release* | > 5 utilisateurs touchés | S2 | e-mail | 4 h ouvrées |

### Justification des seuils

Ils ne sont pas arbitraires, et c'est ce qui les rend révisables.

- **Indicateur 1 — deux échecs consécutifs, pas un seul.** Un uptime check isolé
  produit régulièrement des faux positifs (démarrage à froid Cloud Run, micro-coupure
  réseau du point de mesure). Alerter au premier échec entraîne une désensibilisation :
  au bout de quelques fausses alertes, on cesse de les lire. Deux échecs consécutifs
  portent le délai de détection à 10 minutes — compromis accepté contre la fiabilité
  du signal.
- **Indicateur 4 — 2 % et non 0 %.** Un taux d'erreurs strictement nul est
  inatteignable : jetons expirés, requêtes annulées par l'utilisateur, robots
  d'indexation. Le seuil est fixé au-dessus du bruit de fond mesuré (~0,3 %) et
  suffisamment bas pour détecter une régression avant qu'elle ne devienne visible.
- **Indicateur 5 — 1,5 s en p95.** L'action la plus lourde est le téléversement d'un
  visuel avec conversion WebP et génération de miniature (Sharp). La p95 observée est
  d'environ 800 ms. Un seuil à 1,5 s laisse la marge d'un pic de charge normal tout en
  détectant une dégradation réelle.
- **Indicateur 7 — 429 comme signal, pas comme incident.** Un pic de 429 signifie
  soit un usage anormal, soit un dimensionnement inadapté du rate limiter. L'anomalie
  [ANO-2026-002](./anomalies/ANO-2026-002.md) relevait du second cas : cet indicateur
  découle directement de son analyse post-incident.

### Indicateurs de pilotage du dispositif

Trois indicateurs mesurent l'efficacité de la supervision elle-même, revus
mensuellement :

| Indicateur | Cible | Ce qu'il révèle |
|---|---|---|
| Part des anomalies détectées par la supervision **avant** signalement client | > 60 % | Une valeur basse signifie que les sondes sont mal placées : les utilisateurs voient les pannes avant nous. |
| Délai moyen de détection (survenue → alerte) | < 15 min | Mesure la réactivité réelle du dispositif. |
| Taux de fausses alertes | < 10 % | Au-delà, les alertes cessent d'être lues — une supervision bruyante équivaut à une absence de supervision. |

Le premier est calculé à partir du label `source:*` porté par chaque issue (§
[processus anomalies](./PROCESSUS_ANOMALIES.md)).

---

## 5. Modalités de signalement

| Sévérité | Définition | Canal | Prise en charge | Correctif visé |
|---|---|---|---|---|
| **S1** | Service indisponible, perte ou fuite de données | E-mail + notification push | 1 h ouvrée | 4 h ouvrées |
| **S2** | Fonction clé inutilisable, sans contournement | E-mail | 4 h ouvrées | 2 j ouvrés |
| **S3** | Fonction dégradée, contournement possible | E-mail groupé quotidien | 1 j ouvré | Sprint courant |
| **S4** | Défaut cosmétique | Backlog, sans notification | 5 j ouvrés | Backlog |

**Escalade automatique.** Une alerte S1 non acquittée sous 30 minutes est
réémise. Une alerte S2 ouverte depuis plus de 48 h est reclassée S1 : une
anomalie majeure qui traîne finit par avoir le même effet qu'une panne.

**Regroupement.** Les alertes S3 sont agrégées en un envoi quotidien.
Une alerte par occurrence sur un indicateur bruyant serait ignorée en quelques
jours — le regroupement préserve la lisibilité des alertes qui comptent.

---

## 6. Confidentialité de la télémétrie

Les visuels d'une campagne sous embargo ne doivent jamais transiter par un
service tiers. Trois garde-fous, implémentés dans le code :

1. **En-têtes filtrés** — `authorization` et `cookie` sont retirés de tout
   événement avant émission (`beforeSend`, [`config/monitoring.js`](../server/config/monitoring.js)).
2. **URL tronquées** — la chaîne de requête est supprimée côté front : une URL
   signée de Supabase Storage donne un accès direct au fichier
   ([`src/monitoring.js`](../client/src/monitoring.js)).
3. **Identité minimale** — `sendDefaultPii: false`, et seul l'identifiant
   technique de l'utilisateur est transmis : ni e-mail, ni nom. Suffisant pour
   compter les utilisateurs touchés par une anomalie, insuffisant pour les
   identifier nominativement chez le sous-traitant.

Les logs applicatifs, eux, restent dans Cloud Logging (région `europe-west1`),
avec une rétention de 30 jours.

---

## 7. Mise en place opérationnelle

### 7.1 Activer le suivi d'erreurs

```bash
# Backend — variable d'environnement du service Cloud Run
gcloud run services update visuals-api --region europe-west1 \
  --update-env-vars SENTRY_DSN="https://<clé>@<org>.ingest.sentry.io/<projet>"
```

Côté front, ajouter `VITE_SENTRY_DSN` dans les variables d'environnement Vercel
(*Project Settings → Environment Variables*), puis redéployer — Vite injecte les
variables **au build**, un simple redémarrage ne suffit pas.

Sans ces variables, l'application fonctionne à l'identique, sondes désactivées.

### 7.2 Créer la sonde externe

```bash
gcloud monitoring uptime create visuals-api-readiness \
  --resource-type=uptime-url \
  --resource-labels=host=myvisuals-back-645756273525.europe-west1.run.app \
  --path="/health/ready" \
  --period=5 \
  --timeout=10
```

Alternative sans ligne de commande : UptimeRobot (offre gratuite, intervalle
5 min) — créer un *HTTP(s) monitor* sur la même URL, avec pour condition
d'alerte un code différent de 200.

### 7.3 Créer les politiques d'alerte

Dans *Cloud Monitoring → Alerting → Create policy*, une politique par
indicateur du § 4. Pour les indicateurs 4 et 7, créer d'abord la *log-based
metric* correspondante :

```
# Métrique « taux de 5xx » — Logs Explorer → Create metric
resource.type="cloud_run_revision"
resource.labels.service_name="visuals-api"
jsonPayload.statusCode>=500
```

Cette requête ne fonctionne que parce que les logs sont émis en JSON (§ 3.3) :
avec `morgan('dev')`, `jsonPayload.statusCode` n'existerait pas.

### 7.4 Vérifier le dispositif

```bash
# Vivacité — doit répondre 200, sans appel base
curl -i https://<api>/health

# Aptitude — doit répondre 200/ok et mesurer chaque dépendance
curl -s https://<api>/health/ready | jq

# Corrélation — l'en-tête doit être présent sur toute réponse
curl -sI https://<api>/health | grep -i x-request-id
```

Ces trois vérifications sont également couvertes par les tests automatisés
([`__tests__/health.test.js`](../server/__tests__/health.test.js), 13 cas), qui
incluent la simulation d'une base injoignable et d'un stockage en défaut. Une
régression sur le contrat des sondes casse la CI : sans cela, la supervision
pourrait devenir aveugle sans que rien ne le signale.

---

## 8. Limites connues

Énoncées ici parce qu'un dispositif dont on connaît les angles morts est plus
sûr qu'un dispositif supposé complet.

| Limite | Conséquence | Piste d'évolution |
|---|---|---|
| Pas d'astreinte hors heures ouvrées | Une panne S1 nocturne est détectée mais traitée le lendemain | Rotation d'astreinte dès qu'une seconde personne rejoint le projet |
| Pas d'environnement de recette isolé | Certaines régressions ne sont détectables qu'en production | Service Cloud Run `visuals-api-staging` sur un projet Supabase dédié |
| Offres gratuites (Sentry, UptimeRobot) | Quotas d'événements, rétention limitée | Passage payant si le volume le justifie |
| Sondes synthétiques, pas de parcours réel | Une régression fonctionnelle sans erreur technique (bouton inopérant) passe inaperçue | Test Playwright de bout en bout exécuté périodiquement contre la production |
| Pas de supervision des coûts | Une boucle d'appels pourrait générer une facture imprévue | Budget d'alerte Google Cloud |

---

## Références

- [Processus de traitement des anomalies](./PROCESSUS_ANOMALIES.md)
- [Journal de version](../CHANGELOG.md)
- [ANO-2026-001 — conteneur en échec au démarrage](./anomalies/ANO-2026-001.md)
- [ANO-2026-002 — saturation du rate limiter](./anomalies/ANO-2026-002.md)
