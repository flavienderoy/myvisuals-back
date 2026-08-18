# Prompt de génération — Dossier Bloc 4 (RNCP 39583)

> À fournir tel quel à un générateur de document (ou à reprendre section par
> section). Tout le contenu rédactionnel doit être **sourcé** depuis les fichiers
> listés au § 2 : ce dossier documente un travail réel, rien ne doit être inventé.

---

## 1. Mission

Produire un dossier PDF de **20 pages maximum**, en français, présentant la
gestion du **monitoring**, du **traitement des anomalies** et de la
**maintenance** de l'application **Visuals.co**, dans le cadre du titre RNCP
39583 « Expert en Développement Logiciel » (niveau 7), **Bloc 4 — Maintenir
l'application logicielle en condition opérationnelle**.

Auteur : Flavien Deroy. Évaluateurs : 2 professionnels externes.

### Les 8 livrables imposés (aucun ne peut manquer)

1. Description du processus de mise à jour des dépendances
2. Description du système de supervision
3. Description du processus de collecte et de consignation des anomalies
4. Présentation d'une fiche de consignation d'une anomalie rencontrée
5. Présentation du traitement d'une anomalie détectée
6. Présentation des recommandations argumentées d'amélioration
7. Présentation d'un exemplaire du journal de version
8. Un exemple de problème résolu en collaboration avec le support client

### Les 3 compétences éliminatoires (à couvrir explicitement)

| Code | Intitulé | Section porteuse |
|---|---|---|
| **C4.1.2** | Concevoir un système de supervision et d'alerte : périmètre, indicateurs de suivi pertinents, sondes, modalité des signalements | § 3 (4 pages) |
| **C4.2.1** | Consigner les anomalies : processus de collecte et consignation, outils, informations pertinentes | § 4 (3 pages) |
| **C4.3.2** | Établir un journal des versions déployées intégrant la documentation des correctifs | § 8 (2 pages) |

Chacune doit répondre **mot par mot** aux termes de son intitulé. Pour C4.1.2 :
une sous-partie « périmètre », une « indicateurs », une « sondes », une
« modalité des signalements ». Le jury coche sur ces mots.

---

## 2. Sources du contenu — ne rien inventer

Dépôt : `github.com/flavienderoy/myvisuals-back` (public)

| Fichier | Alimente |
|---|---|
| `docs/SUPERVISION.md` (409 l.) | § 3 |
| `docs/PROCESSUS_ANOMALIES.md` (228 l.) | § 4 |
| `docs/PROCESSUS_DEPENDANCES.md` (325 l.) | § 2 |
| `docs/anomalies/ANO-2026-001.md` (257 l.) | § 5 et § 6 |
| `docs/anomalies/ANO-2026-003.md` (291 l.) | § 7 (support client) |
| `docs/anomalies/ANO-2026-004.md` (233 l.) | § 3 et § 6 |
| `CHANGELOG.md` (298 l.) | § 8 |
| `README.md` | § 1 |

**Le travail est un travail de sélection et de condensation, pas de rédaction
originale.** Les sources totalisent ~2 340 lignes pour un rendu de 20 pages :
il faut couper environ 70 %. Garder les décisions et leurs justifications,
supprimer les détails d'implémentation.

---

## 3. Format

| Paramètre | Valeur |
|---|---|
| Format | A4 portrait (210 × 297 mm) |
| Marges | 20 mm partout |
| **Zone de contenu** | **170 × 250 mm** |
| Corps de texte | 10,5 pt, interligne 1,35 |
| Titres de section | 16 pt gras, filet de séparation |
| Sous-titres | 12 pt gras |
| Légendes d'image | 8,5 pt italique gris, **sous** l'image, numérotées `Figure N —` |
| Tableaux | 9 pt, en-tête sur fond gris clair, filets fins |
| Code en ligne | police à chasse fixe, 9,5 pt, fond gris très clair |
| Pied de page | `Flavien Deroy — RNCP 39583 Bloc 4 — page N/20` |
| Numérotation | dès la page 2 (page de garde non numérotée) |

**Densité cible : 480 mots par page pleine de prose.** Une page comportant une
image demi-page tombe à ~240 mots. Respecter ces budgets, sinon le dossier
dépasse 20 pages.

---

## 4. Emplacements d'images — dimensions réelles

### Règle fondamentale

Zone de contenu = **170 mm de large**. Une capture de 1440 × 2400 px placée sur
170 mm mesurerait **283 mm de haut**, soit plus d'une page entière.

> **Toute image doit être recadrée à un ratio compris entre 1,5:1 et 4:1.**
> Une capture verticale non recadrée est inexploitable.

### Gabarits normalisés

| Gabarit | Dimensions | Ratio requis | Usage |
|---|---|---|---|
| **A — Bandeau** | 170 × 42 mm | ~4:1 | sortie terminal de 3 à 6 lignes |
| **B — Demi-page** | 170 × 100 mm | ~1,7:1 | capture d'interface recadrée, extrait de code court |
| **C — Encart** | 120 × 80 mm | 1,5:1 | illustration secondaire, centrée |
| **D — Grande** | 170 × 130 mm | ~1,3:1 | schéma, ou fiche d'anomalie |
| **E — Schéma large** | 170 × 110 mm | ~1,55:1 | diagrammes vectoriels (§ 3, § 4) |

### Les 15 emplacements retenus

Total : **1 296 mm de hauteur d'image ≈ 5,2 pages**. Le reste (≈ 14,8 pages)
est du texte, des tableaux et les pages de garde/sommaire.

| Réf. | Page | Gabarit | Contenu | Fichier source | Recadrage à faire |
|---|---|---|---|---|---|
| **F01** | 3 | E (170×110) | Schéma de l'architecture déployée : Vercel → Cloud Run → Supabase, avec les frontières de responsabilité | **à créer (vectoriel)** | — |
| **F02** | 5 | A (170×42) | Job CI « Journal de version & audit » : contrôle de cohérence + `found 0 vulnerabilities` | `09-job-governance.png` | déjà au bon ratio |
| **F03** | 5 | B (170×100) | Première PR Dependabot, avec ses labels | `21-dependabot-pr.png` *(à produire)* | recadrer sur la liste des PR |
| **F04** | 6 | E (170×110) | Schéma des **4 couches de supervision** + la sonde externe hors infrastructure | **à créer (vectoriel)** | — |
| **F05** | 7 | B (170×100) | Code de la sonde d'aptitude : distinction `ok`/`degraded`/`down`, choix 200 vs 503 | `S2-sonde-readiness.png` | garder les lignes 109-133 |
| **F06** | 8 | B (170×95) | Réponse réelle de `/health/ready` **en production** : `status: ok`, latences base et stockage | `15-health-ready-prod.png` | déjà au bon ratio |
| **F07** | 8 | A (170×42) | Vérification d'aptitude après déploiement, dans la CI | `13b-deploy-readiness.png` | déjà au bon ratio |
| **F08** | 9 | C (120×80) | Moniteur externe UptimeRobot avec son historique | `19-uptime.png` *(à produire)* | recadrer sur le moniteur |
| **F09** | 9 | C (120×80) | Politiques d'alerte Cloud Monitoring + canal de notification | `20-alertes.png` *(à produire)* | recadrer sur la liste |
| **F10** | 10 | E (170×110) | Diagramme du **cycle de vie d'une anomalie** (6 états, transitions, sortie `wontfix`) | **à créer (vectoriel)** | — |
| **F11** | 11 | B (170×100) | Formulaire GitHub `[ANO]` rendu, champs obligatoires visibles | `03-formulaire-ano.png` | recadrer sur les listes déroulantes |
| **F12** | 13 | D (170×130) | Fiche de consignation ANO-2026-001 : titre, 6 labels, statut fermé | `04-issue-remplie.png` | recadrer sur en-tête + labels + début du corps |
| **F13** | 14 | B (170×70) | Diff du `Dockerfile` : les 2 lignes `COPY` manquantes | `T2-dockerfile.png` | garder les lignes 27-38 |
| **F14** | 15 | A (170×35) | Smoke test en CI : `✅ /health responded — container boots correctly` | `10-smoke-test.png` | déjà au bon ratio |
| **F15** | 17 | B (170×105) | Les 10 releases GitHub, versions et dates | `05-releases.png` | recadrer sur la liste latérale + 2 releases |

Les captures sont dans `~/Documents/RNCP-Bloc4/captures/`.

**Trois figures restent à créer en vectoriel** (F01, F04, F10) : ce sont des
schémas, pas des captures. Ils existent en ASCII dans `SUPERVISION.md § 2`,
`PROCESSUS_ANOMALIES.md § 3` et le `README`.

**Quatre captures restent à produire** (F03, F08, F09 + Sentry) : elles
dépendent de la création des comptes Sentry, UptimeRobot et Cloud Monitoring.
**Réserver leur emplacement avec un cadre gris légendé** en attendant.

---

## 5. Plan page par page

### Page 1 — Page de garde *(non numérotée)*

Titre : **Maintien en condition opérationnelle d'une application SaaS**
Sous-titre : *Supervision, traitement des anomalies et maintenance de Visuals.co*
Puis : Flavien Deroy · RNCP 39583 — Expert en Développement Logiciel (niveau 7) ·
Bloc 4 · date · dépôts `myvisuals-back` et `myvisuals-client`.

Sobre. Pas d'image de fond.

### Page 2 — Sommaire + couverture des compétences

Deux blocs :
1. **Sommaire** des 8 sections avec numéros de page.
2. **Tableau de correspondance** — une ligne par compétence du bloc
   (C4.1.1 → C4.3.2), colonnes : code · intitulé abrégé · section · page.
   Les 3 éliminatoires en gras.

Ce tableau permet au jury de trouver chaque compétence sans lire le dossier en
entier. C'est la page la plus rentable du dossier.

### Page 3 — Contexte *(≈ 240 mots + F01)*

Ce qu'est Visuals.co : plateforme SaaS B2B pour studios photo/vidéo — le studio
dépose les visuels d'une campagne, le client valide, puis récupère les
livrables. Stack SERN (Supabase, Express, React, Node), 23 tables PostgreSQL.

**Ce qui doit ressortir** : l'application est répartie sur **quatre
fournisseurs indépendants** (Vercel, Cloud Run, Supabase PostgreSQL, Supabase
Storage). C'est cette découpe qui détermine le périmètre de supervision au § 3.
Second point : les visuels d'une campagne non publiée sont **sous embargo** —
d'où les contraintes de confidentialité de la télémétrie.

→ **F01** : schéma de l'architecture déployée.

### Pages 4-5 — § 1. Processus de mise à jour des dépendances *(livrable 1)*

Source : `PROCESSUS_DEPENDANCES.md`

- **Enjeu chiffré** : 456 paquets côté API, 393 côté front, ~20 dépendances
  directes. Les trois dépendances sensibles (`multer`, `sharp`,
  `@supabase/supabase-js`) et pourquoi. Ne pas oublier les actions GitHub et
  l'image Docker : une action compromise s'exécute avec la clé de service GCP.
- **État initial** : tableau 14 vulnérabilités (API) / 19 (front) → **0 des deux
  côtés**. Détailler `ws`, `multer`, `path-to-regexp`, `qs`.
  ⚠️ Ce tableau remplace les captures `npm audit` — deux images pour six mots
  serait du gâchis.
- **Dispositif à trois échelles** : audit bloquant à chaque push · Dependabot
  hebdomadaire · actions et image Docker mensuels.
- **Politique d'arbitrage** : tableau correctif / mineure / majeure / sécurité,
  avec la décision associée. Justifier le seuil `high` (un seuil trop bas est
  contourné, et un garde-fou contourné ne protège rien).
- **Procédure de retour arrière** : `update-traffic` Cloud Run (immédiat),
  promotion d'un déploiement antérieur sur Vercel.
- **Dette assumée** : `archiver 7→8`, `framer-motion 12→13`, décalage
  `eslint 10`/`eslint 9` entre les deux dépôts.

→ **F02** (bandeau, p. 5) · **F03** (demi-page, p. 5)

### Pages 6-9 — § 2. Système de supervision *(livrable 2 — C4.1.2 ÉLIMINATOIRE)*

Source : `SUPERVISION.md`. **Section la plus importante du dossier.**

Structurer en quatre sous-parties calquées sur l'intitulé de la compétence :

**2.1 Périmètre de supervision** *(p. 6)*
Les 4 couches + la sonde externe. L'argument décisif : Sentry, les logs et les
métriques Cloud Run sont **à l'intérieur** du système supervisé — si Cloud Run
tombe, ils se taisent, et un silence ressemble à un fonctionnement normal. La
sonde externe existe pour transformer ce silence en alerte.
Inclure le **hors-périmètre justifié** (traçage distribué, supervision système,
astreinte 24/7) : un périmètre délimité vaut mieux qu'un périmètre implicite.
→ **F04**

**2.2 Les sondes** *(p. 7-8)*
- `/health` — vivacité, **sans aucune entrée/sortie**. Justifier : si `/health`
  interrogeait PostgreSQL, une latence de Supabase déclencherait un redémarrage
  en boucle. Une dégradation de dépendance deviendrait une panne totale,
  **causée par la supervision elle-même**.
- `/health/ready` — aptitude. Tableau `ok`/`degraded`/`down` → 200/200/503.
  Justifier la distinction : sans stockage les projets restent consultables
  (dégradation) ; sans base, rien ne fonctionne (panne).
- Logs JSON structurés. Justifier : `morgan('dev')` produit du texte, ingéré
  avec une `severity` à `DEFAULT` — **aucune métrique ni alerte ne peut en être
  dérivée**. Montrer une ligne JSON réelle **dans le texte** (pas en image).
- Identifiant de corrélation `X-Request-Id` / `INC-…`. Le signalement « ça a
  planté vers 14 h » devient une requête Cloud Logging unique.
- Sentry front **et** back. Justifier la non-redondance : une exception React ou
  un bundle qui échoue à charger ne produisent **aucune trace serveur**.
- Arrêt propre sur `SIGTERM` : sans lui, chaque déploiement coupe les requêtes
  en vol et fait monter artificiellement l'indicateur de 5xx.
→ **F05**, **F06**, **F07**

**2.3 Indicateurs de suivi** *(p. 8-9)*
Le **tableau des 12 indicateurs** : indicateur · sonde · seuil · sévérité ·
canal · délai de prise en charge. C'est la pièce que les jurys lisent en premier.
Puis **justifier 4 seuils** — c'est ce qui les rend révisables :
- 2 échecs consécutifs et non 1 (démarrage à froid, micro-coupure du point de
  mesure) : alerter au premier échec désensibilise ;
- 2 % de 5xx et non 0 % (jetons expirés, requêtes annulées, robots) ;
- p95 à 1,5 s (p95 observée ~800 ms sur le téléversement avec conversion WebP) ;
- les 429 comme signal et non comme incident.
Ajouter les **3 indicateurs de pilotage du dispositif** : part des anomalies
détectées avant signalement client (> 60 %), délai de détection (< 15 min), taux
de fausses alertes (< 10 %).

**2.4 Modalité des signalements** *(p. 9)*
Tableau S1→S4 : canal, délai de prise en charge, correctif visé. Escalade
automatique (S1 non acquittée sous 30 min réémise ; S2 ouverte > 48 h reclassée
S1). Regroupement des S3 en envoi quotidien — une alerte par occurrence sur un
indicateur bruyant serait ignorée en quelques jours.
Terminer par la **confidentialité de la télémétrie** : en-têtes filtrés, URL
tronquées (une URL signée Supabase donne un accès direct au fichier),
`sendDefaultPii: false`.
→ **F08**, **F09** *(côte à côte, gabarit C)*

### Pages 10-12 — § 3. Collecte et consignation des anomalies *(livrable 3 — C4.2.1 ÉLIMINATOIRE)*

Source : `PROCESSUS_ANOMALIES.md`

**3.1 Le constat de départ** *(p. 10)*
Ouvrir sur le coût mesuré de l'absence de processus, **sur ce projet même** :
trois commits successifs (`14f394e`, `9ee2d83`, `a78a8bd`) pour un même problème
de déploiement, faute d'avoir posé le diagnostic avant d'agir. La cause racine
n'était pas écrite, la récidive non empêchée, rien n'était mesurable.
La règle qui en découle : **toute anomalie confirmée donne lieu à une fiche, et
tout correctif à un test qui échoue si le correctif est retiré.**

**3.2 Les 4 canaux de détection** *(p. 10)*
Tableau par ordre décroissant de préférence (CI → supervision → recette →
support). Le canal support est le plus coûteux : l'anomalie a déjà produit son
effet et le diagnostic dépend du récit d'un tiers.

**3.3 Cycle de vie** *(p. 11)*
Les 6 états. Insister : **le ticket ne se ferme pas au déploiement du correctif,
mais à sa vérification** — un correctif fusionné n'est qu'une hypothèse tant
qu'il n'a pas été confronté à l'environnement réel.
→ **F10**

**3.4 Grille de sévérité** *(p. 11)*
S1→S4 avec un **exemple vécu par ligne** (ANO-001, ANO-003, ANO-002, ruptures
de mise en page). Règle : la sévérité mesure l'**impact utilisateur**, jamais la
difficulté technique.

**3.5 Outils de collecte** *(p. 12)*
Tableau des 7 outils et de ce que chacun apporte à la fiche. Les formulaires
sont **bloquants** (`blank_issues_enabled: false`). Développer la **clé de
corrélation** : c'est le mécanisme le plus déterminant et le moins visible.
→ **F11**

**3.6 Contenu obligatoire d'une fiche** *(p. 12)*
Les 6 questions (quoi, où, quand, comment, combien, preuves) et pourquoi chacune
est obligatoire.

### Page 13 — § 4. Fiche de consignation *(livrable 4)*

Source : `ANO-2026-001.md`

Une **page unique, dense**, présentant la fiche ANO-2026-001 sous forme de
tableau à deux colonnes : identification (référence, sévérité, statut, canal,
environnement, composant, versions affectée/corrigée, dates), puis description,
comportement attendu/observé, étapes de reproduction, preuves (la trace
`MODULE_NOT_FOUND`), impact.

Ne pas traiter ici le diagnostic ni le correctif : c'est l'objet du § 5. Cette
page démontre la **capacité à consigner**, pas à corriger.
→ **F12**

### Pages 14-15 — § 5. Traitement d'une anomalie *(livrable 5)*

Source : `ANO-2026-001.md`. **Le récit complet, dans l'ordre chronologique.**

- **Détection** : échec du health check Cloud Run après déploiement, alors que
  **toute la chaîne d'intégration était verte**.
- **Diagnostic** : le tableau des 3 hypothèses avec leur vérification et leur
  conclusion — dépendance npm manquante (écartée), fichier absent du dépôt
  (écartée), fichier absent de **l'image** (confirmée). Montrer le cheminement,
  y compris les hypothèses écartées.
- **Cause racine, à deux niveaux** :
  1. le `Dockerfile` énumérait les dossiers à copier un par un — une liste
     manuelle qui dérive à mesure que le projet grandit ;
  2. surtout : **`docker build` n'exécute jamais l'application**. Une image à
     laquelle il manque un fichier requis au démarrage se construit sans erreur.
     Le premier moment de vérité était la production.
- **Correctif** : les 2 `COPY`. Souligner qu'il est **volontairement minimal** —
  pas de refonte du `Dockerfile` pendant une indisponibilité.
- **Pourquoi aucun test unitaire ne pouvait l'attraper** : les tests
  s'exécutent sur l'arborescence du dépôt, où `utils/` est présent. Le défaut
  n'existe que dans l'artefact déployé.
- **Action préventive** : le smoke test qui démarre réellement le conteneur.
  Portée : il ne corrige pas un fichier oublié, il rend **structurellement
  impossible** le déploiement d'une image qui ne démarre pas.
- **Contre-épreuve** : le mécanisme rejoué en reconstituant l'arborescence
  fautive → `MODULE_NOT_FOUND` avant toute écoute sur le port. Montrer qu'un
  garde-fou laisse passer une image saine ne prouve rien ; il faut vérifier
  qu'il **rejette** une image défectueuse.
- **Analyse post-incident** : les 3 questions (pourquoi introduit, pourquoi non
  détecté, qu'est-ce qui empêche la récidive).
- **Enseignement** : *un artefact doit être testé sous la forme exacte dans
  laquelle il sera déployé.*

→ **F13**, **F14**

### Page 16 — § 6. Problème résolu avec le support client *(livrable 8)*

Source : `ANO-2026-003.md`

Le cas : un utilisateur s'inscrit en tant que **Studio** et se retrouve dans
l'espace **Client**.

Dérouler la **collaboration**, c'est le cœur du livrable :
1. réception du signalement, verbatim de l'utilisateur ;
2. accusé de réception dans le délai d'engagement (S2 → 4 h ouvrées) ;
3. **qualification avec l'utilisateur** — obtention de l'e-mail du compte, de
   l'heure d'inscription, du rôle sélectionné ;
4. reproduction sur un compte de test ;
5. diagnostic : contrainte `CHECK` sur `profiles.role` n'autorisant pas
   `'studio'` → le trigger `handle_new_user` échouait, repli sur `'client'` ;
6. correctif : migration 013 (contrainte + trigger avec `ON CONFLICT`) et
   upsert explicite côté contrôleur ;
7. **validation par l'utilisateur** — le ticket se ferme sur sa confirmation,
   pas sur le déploiement ;
8. délais tenus comparés à l'engagement.

Terminer par la **limite assumée** : le canal support n'est aujourd'hui qu'une
boîte e-mail et un formulaire. Le bouton « Signaler un problème » dans
l'application, attachant automatiquement le contexte de diagnostic
(`X-Request-Id`, version, navigateur, rôle), est porté en recommandation R4.

### Pages 17-18 — § 7. Journal de version *(livrable 7 — C4.3.2 ÉLIMINATOIRE)*

Source : `CHANGELOG.md`

- **Convention** : *Keep a Changelog* + versionnage sémantique. Justifier le
  choix : l'historique du projet utilisait déjà des commits conventionnels
  (`feat:`, `fix:`), ce qui rend le journal dérivable de l'historique réel.
- **Extrait réel** : reproduire **intégralement** une entrée de version dans le
  corps du texte, avec ses rubriques `Ajouté` / `Corrigé` / `Sécurité`. Choisir
  **v1.5.0** (elle documente le correctif d'ANO-2026-001) ou **v1.6.1**.
- **Documentation des correctifs** — c'est le terme exact de la compétence :
  chaque correctif publié référence son anomalie (`Corrige ANO-2026-001`), son
  commit et sa version.
- **Chaîne de traçabilité complète**, à présenter comme une suite vérifiable :
  `CHANGELOG.md` → tag git → Release GitHub → révision Cloud Run →
  `GET /health` qui **annonce la version réellement en service**.
- **Le garde-fou anti-dérive** : la version était auparavant codée en dur dans
  `/health`. Un contrôle en intégration continue interdit désormais toute
  divergence entre `package.json` et le journal. Expliquer pourquoi ça compte :
  un journal qui ne correspond pas à la production ne trace rien.
- **Chiffres** : 10 versions publiées, 10 tags, 10 Releases, sur les deux
  dépôts.

→ **F15**

### Pages 19-20 — § 8. Recommandations argumentées *(livrable 6)*

**6 recommandations**, chacune sur le même gabarit à 5 entrées :
*constat → solution → effort → bénéfice mesurable → priorité*

Les tirer des limites déjà identifiées dans les sources — ce sont de vraies
limites, pas des recommandations de principe :

| Réf. | Recommandation | Priorité |
|---|---|---|
| R1 | Environnement de recette isolé (`visuals-api-staging` + projet Supabase dédié) — aujourd'hui certaines régressions ne sont détectables qu'en production | Haute |
| R2 | Test de parcours réel exécuté périodiquement contre la production (Playwright) — les sondes actuelles sont synthétiques : un bouton inopérant sans erreur technique passe inaperçu | Haute |
| R3 | Remplacer l'énumération des `COPY` du `Dockerfile` par `COPY . ./` + `.dockerignore` exhaustif — supprime la cause première d'ANO-2026-001 | Moyenne |
| R4 | Bouton « Signaler un problème » dans l'application, avec contexte de diagnostic attaché automatiquement — supprime la dépendance au récit de l'utilisateur | Moyenne |
| R5 | Analyse d'image Docker (Trivy) et génération d'un SBOM — `npm audit` ne couvre pas les dépendances système de l'image Alpine | Moyenne |
| R6 | Test automatisé de la temporisation exponentielle côté front (lacune reconnue d'ANO-2026-002) et rotation d'astreinte dès qu'une seconde personne rejoint le projet | Basse |

**Assumer explicitement les limites qui subsistent** : pas d'astreinte hors
heures ouvrées, offres gratuites avec quotas, projet porté par une seule
personne. Un jury valorise un candidat lucide sur sa dette bien plus qu'un
dossier prétendant que tout est parfait.

---

## 6. Règles de rédaction

**À faire**

- Une affirmation, puis sa justification. « Le seuil est à 2 % » ne vaut rien
  sans « parce que le bruit de fond mesuré est de 0,3 % ».
- Des chiffres réels partout : 14 → 0 vulnérabilités, 165 tests, 10 versions,
  latence base 655 ms, 15 min d'indisponibilité.
- Citer commits (`a942974`), fichiers (`server/utils/logger.js`) et références
  d'anomalies (ANO-2026-001) — c'est ce qui rend le dossier vérifiable.
- Voix active, phrases courtes, présent de l'indicatif.
- Nommer les arbitrages : « choix assumé », « limite connue », « non retenu à ce
  stade parce que… ».

**À éviter**

- Le conditionnel de façade (« il serait possible de… ») : soit c'est fait, soit
  c'est en recommandation.
- Les captures d'écran décoratives. Chaque figure doit être citée dans le texte
  (« voir figure 6 ») et apporter une preuve ou un raisonnement.
- Les longs extraits de code. Maximum **2 extraits** dans tout le dossier
  (F05 et F13) ; partout ailleurs, une ligne en police à chasse fixe dans le
  texte suffit.
- Le vocabulaire promotionnel (« robuste », « performant », « state of the
  art ») sans mesure associée.
- Dépasser 20 pages. Si le contenu déborde, couper dans § 1 et § 8, jamais dans
  § 2, § 3 ou § 7 (les trois éliminatoires).

---

## 7. Contrôle avant remise

- [ ] 20 pages ou moins, page de garde incluse
- [ ] Les 8 livrables imposés sont présents et identifiables au sommaire
- [ ] C4.1.2 : les 4 sous-parties (périmètre, indicateurs, sondes, signalements) existent nommément
- [ ] C4.2.1 : processus, outils et informations obligatoires sont décrits
- [ ] C4.3.2 : un extrait réel du journal figure dans le corps, avec la documentation des correctifs
- [ ] Le tableau de correspondance compétences ↔ pages est en page 2
- [ ] Les 15 figures sont légendées, numérotées et citées dans le texte
- [ ] Aucune image ne dépasse son gabarit ni ne déborde de la zone de contenu
- [ ] Les emplacements en attente (F03, F08, F09) sont des cadres gris légendés, pas des blancs
- [ ] Chaque seuil chiffré est justifié
- [ ] Aucune donnée sensible visible (clé de service, jeton, URL signée)
