# 📌 BLOC 1 — Cadrer un Projet de Développement
## Guide Complet pour Visuals.co | RNCP 39583

> [!IMPORTANT]
> **Format** : Oral de 20 min + 10 min de questions | **Livrable** : Support de présentation (slides)
> **Date** : 12 juin 2026
> **Projet** : Visuals.co — Plateforme SaaS de gestion et livraison de projets visuels pour professionnels de l'image (photographes, graphistes, 3D artists, architectes, directeurs artistiques)

---

## 📋 TABLE DES MATIÈRES

1. [Analyse de la demande](#1-analyse-de-la-demande)
2. [Analyse d'opportunité, contraintes & risques](#2-analyse-dopportunité-contraintes--risques)
3. [Veille technique](#3-veille-technique)
4. [Comparaison des solutions techniques](#4-comparaison-des-solutions-techniques)
5. [Chiffrage et budget](#5-chiffrage-et-budget)
6. [Architecture logicielle](#6-architecture-logicielle)
7. [Argumentaire client](#7-argumentaire-client-oral)
8. [Structure des slides](#8-structure-recommandée-des-slides)
9. [Checklist finale](#9-checklist-finale-avant-le-jour-j)

---

## 1. Analyse de la Demande

### 1.1 Cartographie des Parties Prenantes

Tu dois créer un **schéma visuel** (type diagramme) identifiant tous les acteurs. Voici ce que tu dois documenter pour Visuals.co :

| Partie prenante | Rôle | Type | Niveau d'implication |
|---|---|---|---|
| **Toi (développeur fullstack)** | Conception, développement, déploiement | Interne | 🔴 Élevé — décisionnaire technique |
| **Le client commanditaire** | Demandeur du projet, validation des livrables | Externe | 🔴 Élevé — décisionnaire métier |
| **Professionnels du visuel (utilisateurs primaires)** | Photographes, graphistes, infographistes 3D, architectes, directeurs artistiques — utilisateurs du Studio (gestion projets, assets, devis) | Externe — Utilisateur final | 🔴 Élevé — utilisation quotidienne |
| **Clients des créatifs (utilisateurs secondaires)** | Commanditaires de projets visuels (marques, agences, particuliers) — utilisateurs du Portail Client (validation, téléchargement, messages) | Externe — Utilisateur final | 🟡 Moyen — utilisation ponctuelle |
| **Hébergeur (Supabase / Vercel)** | Infrastructure cloud, BDD, stockage, auth | Externe — Fournisseur | 🟡 Moyen — support technique |
| **CNIL / Autorités RGPD** | Conformité réglementaire | Externe — Réglementaire | 🟢 Faible — conformité passive |

> [!TIP]
> Utilise un **diagramme en cercles concentriques** (onion diagram) pour hiérarchiser les acteurs par niveau d'implication. C'est très visuel et apprécié des jurys.

### 1.2 Analyse des Besoins / Attentes / Enjeux

Rédige un tableau structuré :

| Partie prenante | Besoins | Attentes | Enjeux |
|---|---|---|---|
| **Photographe** | Centraliser shootings, retouches, livraisons, devis | Interface intuitive, gain de temps, image pro | Productivité, fidélisation clients |
| **Graphiste / DA** | Gérer les itérations créatives, versions de maquettes, validations | Suivi des allers-retours, historique des versions | Qualité des livrables, satisfaction client |
| **Infographiste 3D / Architecte** | Partager des rendus lourds (images HD, panoramas), obtenir des retours | Upload de fichiers volumineux, annotations précises | Réduction des cycles de validation, gain de temps |
| **Client du créatif** | Voir ses visuels (photos, rendus 3D, maquettes), valider, télécharger, communiquer | Expérience fluide, portail simple, sans installation | Satisfaction, rapidité de validation |
| **Commanditaire** | Solution complète et déployable | Qualité du code, maintenabilité | ROI, scalabilité |

### 1.3 Identification des Utilisateurs

Tu dois créer des **personas** détaillés. En voici 4 à préparer (présente les 2 plus pertinents dans tes slides, garde les autres en backup) :

#### Persona 1 — Le Photographe Freelance (cœur de cible)
```
Nom : Marie Dupont, 32 ans
Métier : Photographe de mariage & événementiel
Compétences techniques : Faibles (utilise Lightroom, pas de code)
Frustrations : Perd du temps avec les emails de validation,
               pas de suivi centralisé, devis faits sur Excel
Objectif : Gérer ses projets, envoyer des galeries pro aux clients,
           suivre les validations en temps réel
Fréquence d'utilisation : Quotidienne
Devices : MacBook + iPhone
```

#### Persona 2 — Le Graphiste / Directeur Artistique en Agence
```
Nom : Lucas Bernard, 28 ans
Métier : Directeur artistique junior en agence de communication
Compétences techniques : Moyennes (maîtrise Adobe Suite, notions web)
Frustrations : Multiplie les versions de maquettes sans suivi clair,
               les retours clients arrivent par email, Slack, WhatsApp
               → perte de traçabilité, pas de workflow de validation formel
Objectif : Centraliser les itérations créatives, faire valider
           les maquettes et visuels via un portail unique
Fréquence d'utilisation : Quotidienne
Devices : iMac (bureau) + iPad Pro (déplacements)
```

#### Persona 3 — L'Infographiste 3D / Architecte
```
Nom : Sophie Morel, 35 ans
Métier : Architecte d'intérieur, produit des rendus 3D pour ses clients
Compétences techniques : Moyennes (3ds Max, SketchUp, pas de code)
Frustrations : Rendus finaux très lourds (4K+), impossible de les
               envoyer par email. Utilise WeTransfer + Google Drive
               → pas de système d'annotation, pas de validation formelle
Objectif : Partager ses rendus 3D HD, recevoir des annotations
           précises sur les visuels, gérer les allers-retours
Fréquence d'utilisation : Hebdomadaire (par projet)
Devices : PC Windows + Smartphone Android
```

#### Persona 4 — Le Client Final
```
Nom : Thomas Martin, 40 ans
Rôle : Directeur marketing, commande des visuels (shooting corporate,
       rendus 3D pour catalogue, maquettes graphiques)
Compétences techniques : Basiques (navigateur web)
Frustrations : Reçoit 200 fichiers par WeTransfer, galère à choisir,
               doit répondre par email pour chaque retour
Objectif : Voir ses visuels (photos, rendus, maquettes), annoter,
           valider ses favoris, télécharger les fichiers finaux
Fréquence d'utilisation : Ponctuelle (2-3 fois par projet)
Devices : PC Windows + Smartphone
```

### 1.4 Problématique du Client

Rédige clairement la problématique :

> **Problématique** : Les professionnels de l'image — photographes, graphistes, infographistes 3D, architectes, directeurs artistiques — n'ont pas d'outil unifié pour gérer le cycle de vie complet de leurs projets visuels. Qu'il s'agisse de livrer un shooting photo, un rendu 3D d'architecture, ou une série de maquettes graphiques, le processus reste le même : upload de fichiers lourds, échanges de retours, validation, livraison finale. Les solutions existantes sont soit trop généralistes (Trello, Notion, Google Drive), soit trop spécialisées sur un seul métier (Pixieset pour la photo, Frame.io pour la vidéo), ce qui force les créatifs à jongler entre 5 à 8 outils différents, engendrant une perte de productivité estimée à 30% de leur temps et une expérience client fragmentée.

### 1.5 Pistes de Solutions Techniques

Présente **3 pistes** puis justifie celle retenue :

| Piste | Description | Avantages | Inconvénients |
|---|---|---|---|
| **A — CMS personnalisé (WordPress + plugins)** | Solution basée sur WordPress avec plugins de gestion | Rapide à mettre en place, écosystème riche | Peu performant, pas SaaS, sécurité fragile |
| **B — Application monolithique (Ruby on Rails)** | Tout-en-un côté serveur | Convention over configuration, mature | Scalabilité limitée, écosystème JS ignoré |
| **C — SPA React + API Node.js + BaaS Supabase** ✅ | Architecture découplée, frontend React, backend Express, BaaS Supabase | Scalable, moderne, temps réel natif, séparation des responsabilités | Complexité initiale plus élevée |

**Solution retenue : Piste C** — car elle permet une architecture modulaire, performante, avec temps réel natif (Supabase Realtime) et une scalabilité horizontale.

---

## 2. Analyse d'Opportunité, Contraintes & Risques

### 2.1 Analyse SWOT

Tu dois présenter un **tableau SWOT** complet :

```
┌─────────────────────────────────────┬─────────────────────────────────────┐
│          FORCES (S)                 │         FAIBLESSES (W)              │
│                                     │                                     │
│ • Stack moderne (React + Node)      │ • Un seul développeur               │
│ • Supabase = BaaS complet           │ • Pas de designer UI/UX dédié       │
│   (auth, DB, storage, realtime)     │ • Dépendance forte à Supabase       │
│ • Architecture découplée            │ • Budget limité                     │
│ • Portail client intégré            │                                     │
│ • Multi-métier (photo, 3D, graphisme│                                     │
│   archi) = cible large              │                                     │
│ • 17 controllers API déjà en place  │                                     │
│ • 33+ composants fonctionnels       │                                     │
│ • CI/CD prévu (GitHub Actions)      │                                     │
│ • Tests auto prévus (Vitest +       │                                     │
│   Playwright)                       │                                     │
├─────────────────────────────────────┼─────────────────────────────────────┤
│        OPPORTUNITÉS (O)             │          MENACES (T)                │
│                                     │                                     │
│ • Marché en forte croissance        │ • Concurrents établis par niche     │
│   (économie créative +15%/an)       │   Photo : Pixieset, ShootProof     │
│ • Tendance SaaS / abonnement       │   Vidéo : Frame.io                 │
│ • API Supabase extensible           │   Design : Figma                   │
│ • IA générative pour trier/taguer   │ • Évolution rapide des frameworks   │
│   les visuels automatiquement       │ • Risque de vendor lock-in Supabase │
│ • Aucun outil multi-métier unifié   │ • Cybersécurité (données sensibles) │
│ • Besoin croissant d'outils no-code │ • Réglementation RGPD stricte      │
│ • Rendus 3D / archi en plein boom   │                                     │
└─────────────────────────────────────┴─────────────────────────────────────┘
```

### 2.2 Audit Technique et Fonctionnel

Document à produire (dans tes slides) — voici le contenu à couvrir :

#### Technologies existantes / État de l'art du projet
| Couche | Technologie | Version | État |
|---|---|---|---|
| Frontend | React + Vite | React 18 / Vite 6 | ✅ Fonctionnel |
| Routing | React Router | v6 | ✅ Fonctionnel |
| State Management | Context API | — | ✅ En place |
| Notifications UI | react-hot-toast | v2 | ✅ En place |
| Backend | Express.js | v5 | ✅ Fonctionnel |
| Base de données | Supabase (PostgreSQL) | v2 | ✅ En place |
| Authentification | Supabase Auth (JWT) | v2 | ✅ Fonctionnel |
| Stockage fichiers | Supabase Storage | v2 | ⚠️ Partiellement intégré |
| Upload fichiers | Multer | v2 | ✅ En place |
| Temps réel | Supabase Realtime | v2 | 🔲 À implémenter |
| Logging serveur | Morgan | v1 | ✅ En place |
| **Tests unitaires** | **Vitest** | v2 | 🔲 Prévu — framework de test natif Vite, compatible Jest |
| **Tests composants** | **React Testing Library** | v16 | 🔲 Prévu — tests des composants React |
| **Tests E2E** | **Playwright** | v1 | 🔲 Prévu — tests navigateur cross-browser (Chrome, Firefox, Safari) |
| **Tests API** | **Supertest** | v7 | 🔲 Prévu — tests des endpoints Express |
| **Linting** | **ESLint** | v9 | ⚠️ Partiel — à configurer avec règles strictes |
| **Formatting** | **Prettier** | v3 | 🔲 Prévu — formatage automatique du code |
| **CI/CD** | **GitHub Actions** | — | 🔲 Prévu — pipeline d'intégration et déploiement continu |
| **Conteneurisation** | **Docker + Docker Compose** | — | 🔲 Prévu — environnements reproductibles |

#### Infrastructure cible (production)
| Couche | Service | Hébergement | Région |
|---|---|---|---|
| **Frontend** | Vercel | Vercel Edge Network | Auto (CDN global, nœuds EU) |
| **Backend API** | Google Cloud Run | Google Cloud Platform | `europe-west1` (Belgique) |
| **Base de données** | Supabase (PostgreSQL) | Supabase Cloud | `eu-central-1` (Frankfurt) |
| **Stockage fichiers** | Supabase Storage | Supabase Cloud | `eu-central-1` (Frankfurt) |
| **Auth** | Supabase Auth (JWT) | Supabase Cloud | `eu-central-1` (Frankfurt) |
| **Temps réel** | Supabase Realtime | Supabase Cloud | `eu-central-1` (Frankfurt) |
| **CI/CD** | GitHub Actions + Cloud Build | GitHub / GCP | — |
| **Versioning** | Git + GitHub | GitHub | — |

#### Infrastructure de développement
- **Frontend** : Vite dev server (port 5173)
- **Backend** : Node.js/Express via Nodemon (port 3001)
- **BDD** : Supabase Cloud (même instance qu'en prod, projet dédié dev)
- **Conteneurs** : Docker + Docker Compose pour env local reproductible

#### Stack CI/CD prévue (détail)

| Composant | Outil | Rôle |
|---|---|---|
| **Pipeline CI** | GitHub Actions | Exécution automatique des tests à chaque push/PR |
| **Linting** | ESLint + Prettier | Qualité et cohérence du code (pré-commit via Husky) |
| **Tests unitaires** | Vitest | Tests des fonctions utilitaires, services, hooks |
| **Tests composants** | React Testing Library | Tests de rendu et interaction des composants React |
| **Tests API** | Supertest + Vitest | Tests des routes Express (status codes, payloads) |
| **Tests E2E** | Playwright | Scénarios utilisateur complets dans un vrai navigateur |
| **Couverture de code** | Vitest coverage (v8) | Rapport de couverture minimum visé : 70% |
| **Build** | Vite build | Compilation et optimisation du bundle de production |
| **Deploy frontend** | Vercel (auto-deploy) | Déploiement automatique sur push branche `main` |
| **Deploy backend** | Google Cloud Run + Cloud Build | Build de l'image Docker et déploiement du conteneur sur Cloud Run (region `europe-west1`) |
| **Conteneurs** | Docker + Docker Compose | `Dockerfile` pour Cloud Run + `docker-compose.yml` pour env local reproductible |
| **Pre-commit hooks** | Husky + lint-staged | Lint + format automatique avant chaque commit |
| **Monitoring prod** | Google Cloud Logging + Cloud Monitoring | Logs centralisés, alertes, métriques de latence/erreurs |

```yaml
# Exemple de pipeline GitHub Actions prévu
name: CI Pipeline
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run test:unit      # Vitest
      - run: npm run test:api       # Supertest
  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e       # Playwright
  deploy-frontend:
    runs-on: ubuntu-latest
    needs: e2e
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy Frontend to Vercel
        uses: amondnet/vercel-action@v25
  deploy-backend:
    runs-on: ubuntu-latest
    needs: e2e
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/setup-gcloud@v2
      - name: Build & Deploy to Cloud Run
        run: |
          gcloud run deploy visuals-api \
            --source ./server \
            --region europe-west1 \
            --allow-unauthenticated \
            --set-env-vars "NODE_ENV=production"
```

### 2.3 Analyse de Conformité RGPD (PIA)

Tu dois présenter une **Analyse d'Impact sur la Protection des Données (PIA)** :

#### Données personnelles traitées
| Donnée | Catégorie | Sensibilité | Base légale |
|---|---|---|---|
| Email, nom, prénom | Identité | Moyenne | Contractuelle |
| Photos, rendus 3D, maquettes graphiques | Contenu créatif | Haute (droit à l'image, propriété intellectuelle) | Consentement |
| Adresse IP, logs de connexion | Données techniques | Faible | Intérêt légitime |
| Données de facturation | Données financières | Haute | Obligation légale |
| Messages/annotations | Correspondance | Moyenne | Contractuelle |
| Métadonnées fichiers (EXIF, géoloc) | Données techniques sensibles | Moyenne (géolocalisation) | Intérêt légitime + info utilisateur |

#### Mesures PIA
| Risque RGPD | Impact | Mesure mise en place |
|---|---|---|
| Fuite de données personnelles | 🔴 Critique | Chiffrement en transit (HTTPS/TLS), auth JWT, RLS Supabase |
| Conservation excessive | 🟡 Moyen | Politique de rétention : suppression après fin de contrat + 3 ans |
| Accès non autorisé aux photos | 🔴 Critique | Row Level Security (RLS) Supabase, middleware d'auth |
| Transfert hors UE | 🟡 Moyen | Supabase hébergé en UE (Frankfurt), backend GCP en UE (Belgique `europe-west1`), Vercel CDN avec nœuds EU |
| Absence de consentement | 🟡 Moyen | Bandeau cookies, CGU avec consentement explicite |
| Droit à l'effacement non respecté | 🟡 Moyen | Endpoint de suppression de compte + cascade sur les données |

### 2.4 Contraintes du Projet

| Type de contrainte | Détail |
|---|---|
| **Technique** | Stack imposée React/Node, hébergement cloud, responsive obligatoire |
| **Fonctionnelle** | Multi-rôles (créatif/client), gestion de fichiers lourds (photos HD, rendus 3D 4K+, maquettes) |
| **Réglementaire** | RGPD, droit à l'image, accessibilité RGAA, mentions légales |
| **Budget** | Limité — utilisation de services freemium (Supabase free tier) |
| **Temps** | Projet sur ~6 mois (février — septembre 2026) |
| **Humaine** | Développeur solo — toutes les compétences doivent être couvertes |

### 2.5 Carte des Risques

Tu dois créer une **matrice de risques** (impact × probabilité) :

| # | Risque | Probabilité | Impact | Criticité | Mesure d'atténuation |
|---|---|---|---|---|---|
| R1 | Perte de données (crash DB) | Faible | 🔴 Critique | 🔴 | Backups automatiques Supabase, exports réguliers |
| R2 | Dépassement de planning | Élevée | 🟡 Moyen | 🔴 | Méthodologie agile, priorisation MoSCoW |
| R3 | Faille de sécurité (injection SQL) | Moyenne | 🔴 Critique | 🔴 | ORM Supabase, requêtes paramétrées, OWASP Top 10 |
| R4 | Vendor lock-in Supabase | Moyenne | 🟡 Moyen | 🟡 | Architecture découplée, abstraction couche data |
| R5 | Performance avec fichiers HD | Élevée | 🟡 Moyen | 🟡 | Lazy loading, compression, CDN, pagination |
| R6 | Non-conformité RGPD | Faible | 🔴 Critique | 🟡 | PIA réalisée, DPO consulté, audit conformité |
| R7 | Problèmes d'accessibilité | Moyenne | 🟡 Moyen | 🟡 | Audit RGAA, tests avec lecteurs d'écran |
| R8 | Scope creep (explosion périmètre) | Élevée | 🟡 Moyen | 🟡 | Cahier des charges figé, backlog priorisé |

#### Référentiel de risques — Indicateurs de contrôle
| Risque | KPI de contrôle | Seuil d'alerte | Fréquence de vérification |
|---|---|---|---|
| R1 | Dernière backup < 24h | > 48h sans backup | Quotidien |
| R2 | % avancement vs planning | Retard > 1 semaine | Hebdomadaire (sprint review) |
| R3 | Scan de vulnérabilités | ≥ 1 critique non corrigée | Bi-mensuel |
| R5 | Temps de chargement page | > 3 secondes | À chaque déploiement |

> [!TIP]
> Présente la carte des risques sous forme de **matrice 2D** (grille 3×3 ou 5×5) avec les risques placés visuellement. C'est un attendu fort du jury.

---

## 3. Veille Technique

### 3.1 Méthodologie de Veille

Tu dois expliquer **comment** tu fais ta veille :

| Élément | Détail |
|---|---|
| **Outils** | Feedly (agrégateur RSS), GitHub Trending, Twitter/X (#webdev), Dev.to, Reddit r/reactjs |
| **Sources** | MDN Web Docs, Supabase Blog, React Blog, Node.js Release Notes, OWASP, W3C |
| **Fréquence** | Quotidienne (5-10 min/jour) + veille approfondie hebdomadaire |
| **Organisation** | Catégorisation par thème (sécurité, performance, frameworks, accessibilité, éco-conception) |
| **Archivage** | Bookmarks organisés + notes Notion/Obsidian |
| **Partage** | — (projet solo, mais dans un contexte d'équipe : Slack channel #veille) |

### 3.2 Synthèse des Tendances

| Tendance | Impact métier | Impact environnemental | Classement |
|---|---|---|---|
| **React Server Components (RSC)** | Meilleure performance, moins de JS côté client | ✅ Réduit la consommation CPU client | 🟡 À surveiller |
| **Supabase Edge Functions** | Logique serveur au plus proche de l'utilisateur | ✅ Réduit la latence, moins de transferts | 🟢 Applicable |
| **WebP / AVIF pour les images** | Réduction de 30-50% de la taille des images | ✅ Moins de bande passante | 🟢 Implémenté |
| **Passkeys (WebAuthn)** | Auth sans mot de passe, meilleure UX sécurité | ⬜ Neutre | 🟡 À surveiller |
| **RGAA 4.1 (accessibilité)** | Conformité légale obligatoire en France | ⬜ Neutre | 🔴 Obligatoire |
| **Green IT / éco-index** | Image de marque, réduction coûts infra | ✅ Direct | 🟢 Applicable |

### 3.3 Lien Veille → Choix Techniques

Tu dois justifier **concrètement** le lien entre ta veille et tes décisions :

| Découverte en veille | Choix technique impacté | Justification |
|---|---|---|
| Supabase passe en GA (stable) → confiance accrue | Choix de Supabase comme BaaS | BaaS mature, PostgreSQL, RLS, auth, storage intégrés |
| React 18 : Concurrent mode + Suspense | Choix de React 18 + Vite | Meilleure UX avec chargements progressifs |
| OWASP Top 10 2021 mis à jour | Mesures de sécurité appliquées | Protection XSS, CSRF, injection, auth broken |
| RGAA 4.1 obligatoire depuis 2024 | Référentiel d'accessibilité choisi | Conformité légale française, critères clairs |
| Format WebP supporté par >95% navigateurs | Compression des assets uploadés | Gain de performance + éco-conception |
| Express 5 en release stable | Migration vers Express 5 | Meilleur support async/await, sécurité renforcée |

### 3.4 Impacts sur les 4 axes

| Axe | Apport de la veille |
|---|---|
| **Sécurité** | OWASP Top 10 → application des protections, Supabase RLS, JWT refresh tokens |
| **Performance** | Lazy loading React, compression images, pagination API, Vite pour bundling rapide |
| **Accessibilité** | RGAA 4.1 → contraste, navigation clavier, ARIA labels, responsive |
| **Impact environnemental** | WebP, lazy loading, limitation requêtes inutiles, sobriété fonctionnelle |

---

## 4. Comparaison des Solutions Techniques

### 4.1 Étude Comparative

Tu dois montrer que tu as **comparé plusieurs architectures** :

#### Frontend

| Critère | React + Vite ✅ | Vue.js + Nuxt | Angular | Next.js |
|---|---|---|---|---|
| Courbe d'apprentissage | Moyenne | Facile | Difficile | Moyenne |
| Écosystème | Très riche | Riche | Riche | Très riche |
| Performance (bundle) | ⭐⭐⭐⭐⭐ (Vite) | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Communauté / emploi | #1 mondial | #3 | #2 | En croissance |
| SEO natif | ❌ (SPA) | ✅ (SSR Nuxt) | ❌ (SPA) | ✅ (SSR) |
| Accessibilité | Plugins dispo | Plugins dispo | Intégré | Plugins dispo |
| Éco-conception | ✅ (Vite = léger) | ✅ | ❌ (lourd) | ⚠️ (SSR = + serveur) |

#### Backend / BaaS

| Critère | Express + Supabase ✅ | Django + PostgreSQL | Firebase | Strapi (Headless CMS) |
|---|---|---|---|---|
| Langage | JavaScript (Node) | Python | JavaScript | JavaScript |
| Base de données | PostgreSQL (Supabase) | PostgreSQL | NoSQL (Firestore) | PostgreSQL / SQLite |
| Auth intégrée | ✅ Supabase Auth | ❌ (Django-allauth) | ✅ Firebase Auth | ❌ (plugin) |
| Stockage fichiers | ✅ Supabase Storage | ❌ (S3 à configurer) | ✅ Firebase Storage | ❌ (S3 à configurer) |
| Temps réel | ✅ Supabase Realtime | ❌ (WebSocket à dev) | ✅ Firestore Realtime | ❌ |
| Row Level Security | ✅ Natif PostgreSQL | ❌ (permissions manuelles) | ✅ (Rules Firebase) | ❌ |
| Open Source | ✅ | ✅ | ❌ | ✅ |
| Hébergement UE (RGPD) | ✅ (Frankfurt) | ✅ (au choix) | ⚠️ (serveurs US Google) | ✅ (au choix) |
| Coût (projet petit) | Gratuit (free tier) | Gratuit (self-host) | Gratuit (free tier) | Gratuit (self-host) |

### 4.2 Justification de l'Architecture Retenue

> **Architecture retenue : React + Vite (Vercel) | Express.js + Docker (Google Cloud Run) | Supabase (BaaS/BDD)**

**Pourquoi :**
1. **Sécurité** : Supabase offre RLS natif (Row Level Security) au niveau PostgreSQL, auth JWT, chiffrement TLS. Express permet d'ajouter des middlewares de sécurité (helmet, cors, rate-limiting). Google Cloud Run bénéficie de l'infrastructure de sécurité de Google (chiffrement au repos et en transit, IAM).
2. **Accessibilité** : React permet l'utilisation de composants accessibles (ARIA), les librairies comme react-aria sont disponibles.
3. **Impact environnemental** : Vite produit des bundles très légers. Cloud Run scale-to-zero : zéro consommation quand l'app n'est pas utilisée. Supabase mutualise l'infrastructure (cloud partagé = plus efficient qu'un serveur dédié).
4. **Scalabilité** : Architecture découplée → le frontend (Vercel CDN), le backend (Cloud Run auto-scaling) et la BDD (Supabase) scalent indépendamment.
5. **Coût** : Free tiers généreux (Supabase, Vercel, Cloud Run) couvrent les besoins du MVP.
6. **Valeur professionnelle** : Google Cloud sur le CV + Docker en production = compétences recherchées sur le marché.

### 4.3 Ressources Matérielles / Techniques Nécessaires

| Ressource | Type | Détail | Coût |
|---|---|---|---|
| MacBook Pro | Matérielle | Développement, tests | Déjà possédé |
| VS Code + extensions | Logicielle | IDE principal — extensions : ESLint, Prettier, GitLens, Thunder Client | Gratuit |
| Node.js v20 LTS | Runtime | Exécution du backend Express + outils de build | Gratuit |
| Git | Logicielle | Versioning du code source | Gratuit |
| GitHub | SaaS | Hébergement repo + CI/CD (GitHub Actions — 2000 min/mois free) | 0 € (free tier) |
| Supabase (free tier) | SaaS | BDD PostgreSQL, auth JWT, storage fichiers, realtime | 0 € (évol. vers 25$/mois) |
| Vercel | SaaS | Hébergement et déploiement frontend (auto-deploy sur push, CDN global) | 0 € (free tier) |
| Google Cloud Run | SaaS (GCP) | Hébergement backend Express en conteneur Docker (region `europe-west1`) | 0 € (free tier : 2M req/mois, 360K vCPU-sec) |
| Google Cloud Build | SaaS (GCP) | Build et déploiement automatique des images Docker | 0 € (120 min/jour free) |
| Google Cloud Logging | SaaS (GCP) | Logs centralisés, monitoring, alertes | 0 € (50 Go/mois free) |
| Docker + Docker Compose | Logicielle | Conteneurisation (Dockerfile prod Cloud Run + docker-compose dev local) | Gratuit |
| gcloud CLI | Logicielle | Interface CLI Google Cloud pour déploiement et gestion | Gratuit |
| Vitest | Logicielle | Framework de tests unitaires (natif Vite, compatible Jest) | Gratuit |
| React Testing Library | Logicielle | Tests de composants React (interactions, rendu) | Gratuit |
| Playwright | Logicielle | Tests E2E cross-browser (Chrome, Firefox, WebKit/Safari) | Gratuit |
| Supertest | Logicielle | Tests des endpoints API Express | Gratuit |
| ESLint v9 + Prettier v3 | Logicielle | Linting et formatage automatique du code | Gratuit |
| Husky + lint-staged | Logicielle | Pre-commit hooks (lint + format avant chaque commit) | Gratuit |
| Figma | SaaS | Maquettes UI/UX | 0 € (free tier) |
| Domaine visuals.co | Service | Nom de domaine | ~15 €/an |
| Navigateurs (Chrome, Firefox, Safari) | Logicielle | Tests manuels + Playwright cross-browser | Gratuit |

---

## 5. Chiffrage et Budget

### 5.1 Diagramme de Fonctionnalités (Functional Breakdown)

Présente une **WBS (Work Breakdown Structure)** ou un diagramme arborescent :

```
Visuals.co
├── 🔐 Authentification & Accès
│   ├── Inscription / Connexion (email + social)
│   ├── Gestion des rôles (créatif / client / admin)
│   ├── Portail client sécurisé
│   └── Middleware d'authentification JWT
│
├── 📁 Gestion de Projets
│   ├── CRUD projets (+ catégorie : photo, 3D, graphisme, archi…)
│   ├── Statuts et workflows de validation
│   ├── Smart Folders (classement intelligent par tags/métadonnées)
│   ├── Filtrage avancé (type de visuel, statut, date, client)
│   └── Calendrier / intégration planning
│
├── 🖼️ Gestion des Assets (tout type de visuel)
│   ├── Upload (drag & drop, multi-fichiers, fichiers lourds HD/4K)
│   ├── Galerie avec vues (grille, liste, moodboard, présentation)
│   ├── Annotations / commentaires sur les visuels
│   ├── Comparaison de versions (Diff Comparator)
│   ├── Historique des versions (Asset History)
│   ├── Watermark automatique configurable
│   ├── Sélection groupée (Bulk Selector)
│   └── Téléchargement sélectif / par lot
│
├── 👤 Portail Client
│   ├── Dashboard client personnalisé
│   ├── Visualisation des projets et assets
│   ├── Workflow d'approbation (approuver / rejeter / commenter)
│   ├── Messagerie intégrée
│   └── Téléchargement des fichiers validés
│
├── 💰 Facturation & Devis
│   ├── Générateur de devis (Quote Builder)
│   ├── Factures automatiques (Smart Invoice)
│   ├── Suivi des paiements
│   └── Prévision de revenus (Revenue Forecasting)
│
├── 📊 Dashboard & Analytics
│   ├── KPI Widgets (CA, projets en cours, taux de validation)
│   ├── Activity Feed (journal d'activités)
│   ├── Audit Logs (traçabilité complète)
│   └── Time Tracker (suivi du temps par projet)
│
├── ⚙️ Administration
│   ├── Gestion des permissions (RBAC)
│   ├── System Status / Monitoring / Health checks
│   └── Profil utilisateur (paramètres, préférences)
│
├── 🧪 Tests & Qualité
│   ├── Tests unitaires (Vitest)
│   ├── Tests composants (React Testing Library)
│   ├── Tests API (Supertest)
│   ├── Tests E2E (Playwright — Chrome, Firefox, Safari)
│   ├── Couverture de code (objectif ≥ 70%)
│   └── Linting & formatting (ESLint + Prettier + Husky)
│
├── 🚀 CI/CD & DevOps
│   ├── Pipeline GitHub Actions (lint → test → build → deploy)
│   ├── Conteneurisation Docker (Dockerfile + docker-compose)
│   ├── Deploy auto frontend (Vercel)
│   ├── Deploy auto backend (Google Cloud Run via Cloud Build)
│   ├── Monitoring post-déploiement (Google Cloud Logging / Monitoring)
│   └── Conteneurisation Docker (Dockerfile + docker-compose)
│
└── 🔧 Transverse
    ├── Notifications (temps réel via Supabase Realtime)
    ├── Responsive design (mobile-first)
    ├── Accessibilité RGAA 4.1
    ├── Sécurité OWASP Top 10
    └── Éco-conception (compression, lazy loading, sobriété)
```

### 5.2 Estimation de la Charge de Travail (Jours-Homme)

| Module | Tâches principales | Outils / Langages | Estimation (j/h) |
|---|---|---|---|
| **Authentification** | Auth Supabase, rôles, middleware, JWT, protected routes | Supabase Auth, Express, JWT | 5 j/h |
| **Gestion de projets** | CRUD, filtres, statuts, smart folders, calendrier | React, Express, PostgreSQL | 8 j/h |
| **Gestion des assets** | Upload multi-fichiers HD/4K, galerie, annotations, watermark, versions, bulk | React, Multer, Supabase Storage | 15 j/h |
| **Portail client** | Dashboard, approbations, messages, téléchargements | React, Express, Supabase | 12 j/h |
| **Facturation** | Devis (Quote Builder), factures, suivi paiements, prévisions | React, Express, PostgreSQL | 8 j/h |
| **Dashboard & Analytics** | KPIs, graphiques, activity feed, audit logs, time tracker | React, recharts (ou chart.js) | 6 j/h |
| **Administration** | Permissions RBAC, monitoring, system status, profil | React, Express, Supabase RLS | 4 j/h |
| **Design UI/UX** | Maquettes Figma, design system, responsive, dark mode | Figma, CSS, React | 8 j/h |
| **Backend API** | 17 controllers, routes, middlewares (auth, CORS, rate-limit) | Node.js, Express 5, Morgan | 10 j/h |
| **Tests unitaires & composants** | Tests fonctions, hooks, services, composants React | **Vitest**, **React Testing Library** | 4 j/h |
| **Tests API** | Tests endpoints Express (status, payloads, auth) | **Supertest** + Vitest | 2 j/h |
| **Tests E2E** | Parcours utilisateur complets (login, upload, validation) | **Playwright** (Chrome, Firefox, Safari) | 3 j/h |
| **CI/CD & DevOps** | Pipeline GitHub Actions, Docker, Cloud Run deploy, Cloud Build | **GitHub Actions**, **Docker**, **Google Cloud Run**, **gcloud CLI** | 4 j/h |
| **Linting & Qualité** | Configuration ESLint, Prettier, lint-staged | **ESLint v9**, **Prettier v3** | 1 j/h |
| **Documentation** | Technique, utilisateur, déploiement, API (Swagger) | Markdown, Swagger/OpenAPI | 5 j/h |
| **Accessibilité & Sécurité** | Audit RGAA 4.1, OWASP Top 10, corrections | axe-core, Lighthouse, helmet | 5 j/h |
| **Intégration & recette** | Tests globaux, cahier de recettes, corrections bugs | Tous les outils ci-dessus | 5 j/h |
| | | | |
| **TOTAL** | | | **105 j/h** |

> [!NOTE]
> 105 jours-homme ≈ 5,25 mois à temps plein (20 j/mois). Cela correspond bien à ton planning février → septembre 2026 (avec marge).

### 5.3 Estimation Financière — Budget Prévisionnel

| Poste de coût | Détail | Coût mensuel | Coût total (6 mois) |
|---|---|---|---|
| **Développeur fullstack** | 1 ETP × TJM 350€ × 105 j | — | **36 750 €** |
| **Supabase** | Free tier → Pro (25$/mois après MVP) | 0 → 25 € | **75 €** |
| **Vercel** | Hébergement frontend (free → pro) | 0 → 20 € | **60 €** |
| **Google Cloud Run** | Hébergement backend (free tier très généreux, puis pay-per-use) | 0 → ~5 € | **15 €** |
| **Google Cloud Build** | Build images Docker (120 min/jour gratuit) | 0 € | **0 €** |
| **Google Cloud Logging** | Logs et monitoring (50 Go/mois gratuit) | 0 € | **0 €** |
| **Nom de domaine** | visuals.co | — | **15 €** |
| **GitHub Pro** | CI/CD minutes (GitHub Actions, 2000 min/mois free), repos privés | 4 € | **24 €** |
| **Artifact Registry (GCP)** | Stockage images Docker (free tier : 500 Mo) | 0 € | **0 €** |
| **Figma** | Design (free tier) | 0 € | **0 €** |
| **Licences / outils** | VS Code, ESLint, Prettier, Vitest, Playwright (tout gratuit/open-source) | 0 € | **0 €** |
| **Formation / veille** | Cours en ligne, conférences | ~20 € | **120 €** |
| **Marge imprévus (10%)** | Buffer pour risques | — | **3 694 €** |
| | | | |
| **TOTAL** | | | **≈ 40 633 €** |

> [!IMPORTANT]
> Le jury attend que tu identifies **les principaux postes de coûts**. Le poste principal ici est le coût de main-d'œuvre (90% du budget). Souligne que grâce aux outils open-source et freemium, les coûts d'infrastructure sont très faibles.

---

## 6. Architecture Logicielle

### 6.1 Schémas d'Architecture

Tu dois produire **minimum 3 schémas** :

#### A — Architecture globale (schéma d'infrastructure)

```
┌──────────────────────────────────────────────────────────────────┐
│                        UTILISATEURS                              │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │  Créatif    │  │ Client Final     │  │ Admin            │    │
│  │  (Studio)   │  │ (Portail Client) │  │ (System Status)  │    │
│  │ Photo/3D/DA │  │                  │  │                  │    │
│  └──────┬──────┘  └────────┬─────────┘  └────────┬─────────┘    │
└─────────┼──────────────────┼──────────────────────┼──────────────┘
          │ HTTPS            │ HTTPS                │ HTTPS
          ▼                  ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                        │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐            │
│  │ Pages  │ │Components│ │ Services │ │  Context   │            │
│  │ (3+)   │ │ (33+)    │ │ (18 API) │ │ (Auth/Data)│            │
│  └────────┘ └──────────┘ └──────────┘ └────────────┘            │
│                        Hébergé sur Vercel                        │
└────────────────────────────┬─────────────────────────────────────┘
                             │ API REST (JSON)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│           BACKEND (Node.js + Express 5 — Docker)                 │
│  ┌────────────┐ ┌──────────────┐ ┌─────────────────┐            │
│  │ Routes     │ │ Controllers  │ │ Middlewares      │            │
│  │ (17)       │ │ (17)         │ │ (auth, CORS,     │            │
│  └────────────┘ └──────────────┘ │  rate-limiting)  │            │
│                                  └─────────────────┘            │
│          Google Cloud Run (EU — europe-west1, Belgique)           │
│          ┌──────────────────────────────────────┐                │
│          │ Cloud Build │ Cloud Logging │ IAM    │                │
│          └──────────────────────────────────────┘                │
└────────────────────────────┬─────────────────────────────────────┘
                             │ Supabase JS Client
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SUPABASE (BaaS)                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │PostgreSQL│ │  Auth    │ │ Storage  │ │ Realtime │           │
│  │  (RLS)   │ │  (JWT)   │ │ (Buckets)│ │(WebSocket│           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│              Hébergé sur Supabase Cloud (EU — Frankfurt)          │
└──────────────────────────────────────────────────────────────────┘
```

#### B — Diagramme de cas d'utilisation (UML Use Case)

Tu dois faire un **diagramme UML** montrant les acteurs et leurs actions. Voici ce qu'il doit contenir :

```
Acteur "Créatif" (Photographe, Graphiste, 3D Artist, Architecte, DA) :
  - Se connecter / s'inscrire
  - Créer / gérer des projets (catégorisés par type : photo, 3D, graphisme, archi)
  - Uploader des assets (photos, rendus 3D, maquettes, vidéos)
  - Créer des moodboards
  - Annoter des visuels
  - Comparer des versions (Diff Comparator)
  - Générer des devis / factures
  - Gérer les permissions (RBAC)
  - Voir le dashboard / KPIs / Time Tracker
  - Configurer le watermark
  - Suivre les tâches (Task Assignment)
  - Envoyer des messages
  - Mode présentation client (Presentation Mode)

Acteur "Client" :
  - Se connecter au portail client
  - Voir ses projets et assets
  - Approuver / rejeter des visuels (workflow d'approbation)
  - Télécharger les assets validés (par lot ou individuellement)
  - Envoyer des messages
  - Annoter des visuels

Acteur "Système" :
  - Envoyer des notifications (temps réel via Supabase Realtime)
  - Logger les activités (Audit Logs)
  - Surveiller la disponibilité (System Status / Monitoring)
  - Exécuter le pipeline CI/CD (GitHub Actions)
  - Appliquer les règles de sécurité (RLS, rate-limiting)
```

#### C — Diagramme de classes simplifié (ou MCD/MLD)

Montre les **entités principales** et leurs relations :

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│    User     │────→│   Project    │────→│    Asset     │
│             │ 1:N │              │ 1:N │              │
│ - id        │     │ - id         │     │ - id         │
│ - email     │     │ - title      │     │ - filename   │
│ - role      │     │ - status     │     │ - url        │
│ - name      │     │ - user_id    │     │ - project_id │
└─────────────┘     └──────────────┘     └──────────────┘
       │                   │                    │
       │ 1:N               │ 1:N               │ 1:N
       ▼                   ▼                    ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client    │     │    Quote     │     │  Annotation  │
│             │     │              │     │              │
│ - id        │     │ - id         │     │ - id         │
│ - name      │     │ - amount     │     │ - content    │
│ - company   │     │ - project_id │     │ - asset_id   │
│ - user_id   │     │ - client_id  │     │ - user_id    │
└─────────────┘     └──────────────┘     └──────────────┘
```

### 6.2 Choix Architecturaux Expliqués

| Choix | Justification |
|---|---|
| **Architecture 3-tiers** | Séparation présentation / logique / données = maintenabilité |
| **API REST** | Standard, interopérable, documentable (Swagger possible) |
| **SPA (Single Page App)** | UX fluide pour un outil professionnel utilisé quotidiennement |
| **BaaS (Supabase)** | Réduit le code serveur, auth/storage/realtime clé en main |
| **RLS PostgreSQL** | Sécurité au niveau de la base de données = dernière ligne de défense |
| **Google Cloud Run** | Backend conteneurisé, scale-to-zero (éco-conception), infra Google (sécurité, fiabilité) |
| **Vercel CDN** | Frontend distribué globalement, HTTPS auto, preview deployments par PR |
| **Context API (pas Redux)** | Suffisant pour l'échelle du projet, moins de boilerplate |

### 6.3 Éco-Conception & Sobriété Numérique

| Mesure | Détail | Impact |
|---|---|---|
| **Lazy loading** des composants et images | Les ressources sont chargées uniquement quand nécessaires | ↓ bande passante, ↓ CPU |
| **Compression images** (WebP) | Conversion automatique au format WebP (30-50% plus léger) | ↓ stockage, ↓ transfert |
| **Pagination API** | Pas de chargement de toutes les données en une fois | ↓ RAM serveur, ↓ transfert |
| **Vite** (bundler) | Build optimisé, tree-shaking, code-splitting | ↓ taille bundle JS |
| **Cloud Run scale-to-zero** | Le backend ne consomme **aucune ressource** quand il n'y a pas de requêtes | ↓↓ consommation énergie serveur |
| **Hébergement cloud mutualisé** | Supabase/Vercel/GCP = infra partagée et optimisée | ↓ empreinte carbone vs serveur dédié |
| **Dark mode** | Économie OLED sur mobile | ↓ consommation batterie |
| **Suppression code mort** | Tree-shaking Vite élimine le code non utilisé | ↓ taille du livrable |
| **Image Docker Alpine** | Image minimale `node:20-alpine` (~50 Mo vs ~350 Mo node:20) | ↓ stockage, ↓ temps de build, ↓ transfert |

---

## 7. Argumentaire Client (Oral)

### 7.1 Vocabulaire professionnel mais vulgarisé

Prépare des reformulations pour le jury qui jouera le rôle du client :

| Terme technique | Explication vulgarisée |
|---|---|
| SaaS | "Un service en ligne accessible depuis n'importe quel navigateur, sans installation" |
| API REST | "Un système de communication entre notre application et la base de données" |
| RLS | "Une protection qui garantit que chaque utilisateur ne voit que SES données" |
| CI/CD | "Un processus automatique qui teste et déploie les mises à jour sans interruption" |
| Responsive | "L'application s'adapte à tous les écrans : ordinateur, tablette, téléphone" |
| BaaS | "Un service cloud qui gère les parties complexes (stockage, connexion, base de données)" |

### 7.2 Axes de Solutions Retenus

Tu dois présenter **3 axes majeurs** :

1. **Centralisation** : Un seul outil pour toute la gestion de projets visuels — photos, rendus 3D, maquettes graphiques — (vs 5-8 outils actuels)
2. **Collaboration** : Portail client intégré avec workflows de validation, annotations, messagerie (vs emails interminables et WeTransfer)
3. **Professionnalisation** : Devis, factures, KPIs, time tracking intégrés (vs Excel et outils séparés)
4. **Multi-métier** : Adapté à tous les créatifs visuels (photographes, graphistes, 3D, archi, DA) grâce à une gestion d'assets agnostique du format

### 7.3 Réponse au Besoin

> "Visuals.co répond au besoin des professionnels de l'image — photographes, graphistes, infographistes 3D, architectes — en centralisant 100% du cycle de vie d'un projet visuel : de l'upload des fichiers (photos HD, rendus 3D, maquettes) à la livraison client, en passant par la validation et la facturation. Le portail client dédié élimine les allers-retours par email et réduit le temps de validation de 60%. L'architecture cloud garantit l'accès partout, tout le temps, sur tous les devices."

### 7.4 Traitement des Objections

| Objection probable | Réponse préparée |
|---|---|
| "Pourquoi pas un outil existant comme Pixieset ?" | "Pixieset est limité à la photo. Visuals.co est multi-métier (photo, 3D, graphisme, archi) et tout-en-un : gestion d'assets, validation, facturation, portail client. Conçu pour les créatifs français (RGPD natif, hébergement UE)." |
| "C'est sécurisé ?" | "Oui : authentification JWT, chiffrement TLS, Row Level Security au niveau base de données, conformité OWASP Top 10. Le backend est hébergé sur Google Cloud (infrastructure de sécurité Google, chiffrement au repos et en transit). Toutes les données restent en UE (Frankfurt + Belgique)." |
| "Et si Supabase ferme ?" | "Supabase est open source. En cas de problème, on peut migrer vers un PostgreSQL auto-hébergé sans perte de données. Le backend étant conteneurisé (Docker), il peut tourner sur n'importe quel cloud. L'architecture est conçue pour être portable." |
| "C'est accessible aux personnes handicapées ?" | "Oui, nous suivons le référentiel RGAA 4.1 : navigation clavier, contraste suffisant, textes alternatifs, structure sémantique HTML" |
| "Quel est le coût de maintenance ?" | "Environ 30-55€/mois en production (Supabase Pro 25$ + Vercel ~20$ + Cloud Run ~5$). Les mises à jour sont déployées automatiquement via GitHub Actions + Cloud Build." |

---

## 8. Structure Recommandée des Slides

> [!IMPORTANT]
> 20 minutes = environ **15-20 slides maximum** (1 à 1,5 min par slide). Sois concis et visuel.

| # | Slide | Contenu | Durée |
|---|---|---|---|
| 1 | **Page de titre** | Titre, nom, date, logo | 30s |
| 2 | **Contexte & problématique** | Le problème des créatifs visuels, chiffres clés du marché | 1 min |
| 3 | **Parties prenantes** | Diagramme onion + tableau rôles | 1 min |
| 4 | **Personas utilisateurs** | 2 personas visuels | 1 min |
| 5 | **Analyse SWOT** | Matrice 4 cases | 1 min |
| 6 | **Audit technique** | État des lieux techno | 1 min |
| 7 | **Conformité RGPD (PIA)** | Données, risques, mesures | 1 min |
| 8 | **Contraintes du projet** | Tableau des contraintes | 30s |
| 9 | **Carte des risques** | Matrice risques + mesures | 1 min |
| 10 | **Veille technique** | Méthodologie + tendances | 1,5 min |
| 11 | **Comparaison solutions** | Tableaux comparatifs (2 slides) | 2 min |
| 12 | **Solution retenue** | Architecture choisie + justification | 1 min |
| 13 | **Ressources nécessaires** | Tableau matériel/logiciel | 30s |
| 14 | **WBS / Fonctionnalités** | Arborescence fonctionnelle | 1 min |
| 15 | **Chiffrage** | Jours-homme + budget | 1 min |
| 16 | **Architecture logicielle** | Schéma 3-tiers + diagramme de classes | 1,5 min |
| 17 | **Éco-conception** | Mesures de sobriété numérique | 1 min |
| 18 | **Argumentaire** | Pourquoi Visuals.co est la bonne solution | 1 min |
| 19 | **Questions anticipées** | Slide de backup avec objections/réponses | — |
| 20 | **Merci** | Contact, questions | 30s |

---

## 9. Checklist Finale Avant le Jour J

### ❗ Compétences Éliminatoires Bloc 1

> [!CAUTION]
> Si UNE de ces compétences n'est pas démontrée, **le bloc est invalidé** :

- [ ] ✅ **Cartographie des acteurs du projet** → Diagramme + tableau des parties prenantes
- [ ] ✅ **Évaluation de faisabilité technique** → SWOT + audit + PIA + risques
- [ ] ✅ **Choix de l'architecture adaptée** → Comparaison + schémas d'architecture
- [ ] ✅ **Estimation de la charge de travail** → Jours-homme détaillés + budget
- [ ] ✅ **Argumentation et préconisation des solutions** → Oral + traitement objections

### Checklist de Préparation

- [ ] Slides créées (PowerPoint / Google Slides / Keynote)
- [ ] Tous les schémas sont **légendés**
- [ ] Les tableaux comparatifs ont des **critères mesurables**
- [ ] Tu as **répété au chrono** (20 min pile)
- [ ] Tu as préparé des **réponses aux objections**
- [ ] Tu maîtrises le **vocabulaire technique ET vulgarisé**
- [ ] Tu as des **slides de backup** pour les questions
- [ ] Le lien entre **veille → choix techniques** est explicite
- [ ] L'**éco-conception** est mentionnée (c'est un critère transversal évalué)
- [ ] L'**accessibilité** est mentionnée (RGAA / Opquast)
- [ ] Le **RGPD** est documenté (PIA)
- [ ] Les schémas d'architecture sont **complets et maintenables**

---

> [!TIP]
> **Conseil final** : Le jury évalue ta capacité à **cadrer un projet de manière professionnelle**. Ne récite pas un cours théorique. Parle de TON projet (Visuals.co), avec TES chiffres, TES choix, TES problématiques concrètes. Plus c'est spécifique à ton projet, mieux c'est.
