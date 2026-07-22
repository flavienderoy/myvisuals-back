# 🎤 BLOC 2 — Contenu Exact des Slides de Présentation (Soutenance RNCP)
## Visuals.co | Soutenance RNCP 39583 — Bloc 2 : Concevoir et développer des applications logicielles
### Durée totale : 20 min d'exposé + 10 min de questions

> [!IMPORTANT]
> **Comment utiliser ce document** :
> - 🖥️ = Ce qui doit être écrit sur la diapositive (concis, percutant, visuel).
> - 🗣️ = Le script exact de ce que tu **DIS** à l'oral au jury.
> - 🎨 = Conseils de mise en page, schémas et captures à intégrer dans Canva ou PowerPoint.
> - ⏱️ = Gestion du temps par diapositive (respect strict des 20 minutes).

---

## SOMMAIRE DES SLIDES

| Slide | Titre | Timing | Focus Principal |
|:---:|:---|:---:|:---|
| **1** | Titre & Présentation | 0:30 | Introduction |
| **2** | Contexte & Problématique Technique | 1:00 | Objectifs de développement |
| **3** | Architecture 3-Tiers & Stack Technologique | 1:30 | Choix techniques |
| **4** | Frontend : React 19 & Vite 7 | 1:30 | Interface & UI |
| **5** | Backend : Express.js 5 & REST API | 1:30 | Couche métier |
| **6** | Base de Données : Supabase (PostgreSQL) | 1:30 | Modélisation & RLS |
| **7** | Sécurité, Authentification (JWT & RBAC) | 1:30 | Conformité & Protection |
| **8** | Traitement des Médias (Sharp, Storage, ZIP) | 1:30 | Performance & Assets |
| **9** | Fonctionnalités Clés & Ergonomie Studio | 2:00 | Démonstration visuelle |
| **10** | Démonstration Live / Parcours Utilisateur | 3:00 | Workflow end-to-end |
| **11** | Stratégie de Tests (Vitest, Supertest, Playwright) | 1:30 | Assurance qualité |
| **12** | Accessibilité (RGAA) & Optimisation Web | 1:00 | Inclusivité |
| **13** | CI/CD, Docker & Hébergement (GCloud Run / Vercel) | 1:30 | DevOps & Déploiement |
| **14** | Documentation API (Swagger / OpenAPI) | 1:00 | Maintenabilité |
| **15** | Bilan Technique & Perspectives | 1:00 | Conclusion |

---

## SLIDE 1 — Page de Titre

⏱️ **Timing : 0:30**

### 🖥️ Contenu de la slide
```text
VISUALS.CO

Plateforme SaaS de Gestion & Livraison de Contenus Visuels
Conception & Développement Full-Stack

Flavien DEROY
Titre RNCP 39583 — Expert en Développement Logiciel (Niveau 7)
Bloc 2 : Concevoir et développer des applications logicielles
Juillet 2026
```

### 🗣️ Script Oral
> *"Bonjour à toutes et à tous. Je suis Flavien DEROY, et je suis ravi de vous présenter aujourd'hui le bilan technique du développement de Visuals.co dans le cadre de la validation du Bloc 2 du titre RNCP d'Expert en Développement Logiciel. Visuals.co est une solution SaaS full-stack conçue sur mesure pour les studios de création et les professionnels de l'image."*

### 🎨 Design & Visuels
- Logo Visuals.co au centre avec accent doré / dark mode.
- Typographie haut de gamme (sans-serif moderne).
- Arrière-plan sombre élégant.

---

## SLIDE 2 — Contexte & Problématique Technique

⏱️ **Timing : 1:00**

### 🖥️ Contenu de la slide
```text
LE DÉFI TECHNIQUE & FONCTIONNEL

Problématique :
Comment développer une application web full-stack réactive, sécurisée 
et hautement disponible pour unifier le cycle de vie des médias numériques ?

Objectifs de développement :
1. Centraliser les flux de travail (Upload, Validation, Facturation, Livraison)
2. Garantir des temps de réponse ultra-rapides (< 100ms) pour les gros volumes de médias
3. Isoler strictement les données entre Studios et Clients (Sécurité multi-tenant)
4. Assurer une accessibilité universelle (RGAA / WCAG)
```

### 🗣️ Script Oral
> *"Les créateurs de contenu visuel souffrent aujourd'hui d'une fragmentation de leurs outils : stockage sur Google Drive, livraison via WeTransfer, retours clients par email et facturation sur tableur. La problématique technique de ce projet a été de concevoir une architecture logicielle capable de centraliser ces flux au sein d'une plateforme unique, garantissant une réactivité optimale malgré le poids des médias, et une isolation stricte des données clients."*

### 🎨 Design & Visuels
- Schéma "Avant / Après" ou icône montrant la fragmentation vs la centralisation.
- Accents dorés pour mettre en avant la problématique.

---

## SLIDE 3 — Architecture 3-Tiers & Stack Technologique

⏱️ **Timing : 1:30**

### 🖥️ Contenu de la slide
```text
ARCHITECTURE 3-TIERS DÉCOUPLÉE

┌─────────────────────────────────────────────────────────────┐
│ 1. PRÉSENTATION : React 19 + Vite 7 + Tailwind CSS 4        │
│    -> SPA hébergée sur Vercel (CDN mondial)                │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API / JWT
┌──────────────────────────────▼──────────────────────────────┐
│ 2. MÉTIER (API) : Express.js 5 + Node.js 20                 │
│    -> Conteneur Docker sur Google Cloud Run                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Supabase SDK
┌──────────────────────────────▼──────────────────────────────┐
│ 3. DONNÉES : Supabase (PostgreSQL 15)                       │
│    -> BDD Relationnelle + Auth JWT + Realtime + Storage     │
└─────────────────────────────────────────────────────────────┘
```

### <ctrl94> Script Oral
> *"Pour répondre aux exigences de scalabilité et de maintenabilité, j'ai sélectionné une architecture 3-tiers moderne et totalement découplée. Côté client, une application React 19 propulsée par Vite. Côté serveur, un microservice REST sous Express.js 5 conteneurisé avec Docker. Et pour la couche de données, PostgreSQL managé par Supabase avec gestion native du temps réel et du stockage sécurisé. Cette séparation garantit une indépendance totale du déploiement et des évolutions de chaque composant."*

### 🎨 Design & Visuels
- Schéma d'architecture coloré en 3 blocs avec logos des technologies (React, Express, Docker, Supabase, Vercel, Google Cloud).

---

## SLIDE 4 — Frontend : React 19 & Vite 7

⏱️ **Timing : 1:30**

### 🖥️ Contenu de la slide
```text
DÉVELOPPEMENT FRONTEND & PERFORMANCES UI

• React 19 & React Router v7 :
  - Single Page Application (SPA) ultra-fluide
  - State management optimisé via Context API (AuthContext, DataContext)
  - Layouts imbriqués et protection des routes par rôle (Studio / Client)

• Vite 7 :
  - Hot Module Replacement (HMR) instantané
  - Temps de build optimisé par ESBuild

• Design System & Design UX :
  - Tailwind CSS v4 & micro-animations (Framer Motion / GSAP)
  - Composants réutilisables et fenêtres modales aérées (Spring Animations)
```

### 🗣️ Script Oral
> *"Sur le frontend, le choix de React 19 combiné avec Vite 7 offre une expérience utilisateur extrêmement réactive. L'état global est orchestré proprement via le Context API de React, évitant ainsi la complexité inutile de Redux. L'interface utilise Tailwind CSS v4 avec un Design System propriétaire personnalisé en dark mode luxury. Les transitions sont sublimées par Framer Motion avec des animations de type ressort pour un ressenti fluide et premium."*

### 🎨 Design & Visuels
- Capture d'écran du Dashboard Studio montrant l'élégance de l'interface.
- Badges technologiques (React, Vite, Tailwind).

---

## SLIDE 5 — Backend : Express.js 5 & REST API

⏱️ **Timing : 1:30**

### 🖥️ Contenu de la slide
```text
ARCHITECTURE BACKEND & SERVICES REST API

• Express.js 5 :
  - Découpage modulaire : 19 Routes & 19 Contrôleurs dédiés
  - Standardisation des réponses HTTP & gestion globale des erreurs

• Middlewares & Robustesse :
  - AuthMiddleware : Vérification systématique des jetons JWT Supabase
  - Rate Limiter : Protection anti-DDoS / Brute force (express-rate-limit)
  - Helmet & CORS : Sécurisation des en-têtes HTTP et filtrage strict d'origine

• Gestion Asynchrone :
  - Traitement non bloquant des entrées/sorties (I/O)
  - Téléchargement et stream de fichiers volumineux
```

### 🗣️ Script Oral
> *"Le backend a été conçu avec Express.js 5 pour sa légèreté et sa robustesse. La logique applicative est découpée en 19 contrôleurs modulaires couvrant la gestion des projets, des clients, du versioning et de la facturation. L'ensemble des endpoints est protégé par un middleware d'authentification JWT ainsi qu'un rate limiter configuré à 1000 requêtes par 15 minutes pour prémunir l'API contre les attaques par déni de service."*

### 🎨 Design & Visuels
- Extrait d'arborescence des contrôleurs/routes backend.
- Icônes Sécurité & API REST.

---

## SLIDE 6 — Modélisation de la Base de Données (Supabase / PostgreSQL)

⏱️ **Timing : 1:30**

### 🖥️ Contenu de la slide
```text
BASE DE DONNÉES RELATIONNELLE & MODÉLISATION

• Schéma PostgreSQL (23 Tables) :
  - profiles, clients, projects, looks, assets, team_members, 
    conversations, messages, annotations, tasks...

• Intégrité Référentielle :
  - Clés étrangères fortement typées (UUID) avec ON DELETE CASCADE / SET NULL

• Automatisation par Triggers Pl/pgSQL :
  - Trigger 'on_auth_user_created' : Création automatique du profil lors de l'inscription

• Performance :
  - Indexation stratégique sur les colonnes de filtrage (project_id, owner_id)
```

### 🗣️ Script Oral
> *"La base de données s'appuie sur PostgreSQL 15 hébergé sur Supabase. La modélisation compte désormais 23 tables relationnelles nettoyées et normalisées. L'intégrité des données est garantie par des contraintes de clés étrangères explicites en UUID. De plus, j'ai mis en place des déclencheurs Pl/pgSQL automatiques : dès qu'un utilisateur s'inscrit, son profil métier est immédiatement provisionné en base sans intervention du code applicatif."*

### 🎨 Design & Visuels
- Diagramme Entité-Association (MCD / MLD) de la base de données mettant en évidence les tables `projects`, `assets` et `profiles`.

---

## SLIDE 7 — Sécurité & Authentification (JWT, RLS, RBAC)

⏱️ **Timing : 1:30**

### 🖥️ Contenu de la slide
```text
STRATÉGIE DE SÉCURITÉ DE BOUT EN BOUT

1. Authentification Double Rôle (RBAC) :
   - Rôle STUDIO : Gestion complète des espaces et membres
   - Rôle CLIENT : Accès restreint à ses projets assignés

2. Row Level Security (RLS) :
   - Politiques de sécurité au niveau de chaque ligne de la base PostgreSQL
   - Garantie d'isolation des données entre studios concurrents

3. Protection des Clés & CORS :
   - Clé 'Service Role' isolée sur le serveur backend uniquement
   - CORS restreint à l'origine du Frontend Vercel
```

### 🗣️ Script Oral
> *"La sécurité est un pôle fondamental du projet. L'authentification utilise les jetons JWT. J'ai configuré un contrôle d'accès basé sur les rôles (RBAC) isolant les prérogatives des créatifs et de leurs clients. Pour renforcer la sécurité en profondeur, des règles Row Level Security (RLS) sont appliquées directement dans PostgreSQL. Ainsi, même en cas de tentative d'injection, un client ne peut physiquement accéder aux enregistrements d'un autre projet."*

### 🎨 Design & Visuels
- Schéma explicatif du flux de validation du Token JWT entre le Client, l'API et la BDD avec les règles RLS.

---

## SLIDE 8 — Traitement des Médias & Stockage

⏱️ **Timing : 1:30**

### 🖥️ Contenu de la slide
```text
GESTION DES MEDIAS & ENGINE TECHNIQUE

• Traitement d'Images Ultra-rapide :
  - Intégration de Sharp (binaire C++) pour le redimensionnement et l'optimisation
  - Tatouage numérique (Watermark) dynamique sur les aperçus livrés

• Génération d'Archives ZIP à la Volée :
  - Module Archiver pour compresser et streamer les lots de visuels HD

• Supabase Storage :
  - Buckets sécurisés pour les assets originaux et les avatars
  - URLs d'accès signées temporaires
```

### 🗣️ Script Oral
> *"Visuals.co manipulant de nombreux médias lourds, j'ai intégré la librairie Sharp exécutée en binaire C++ côté backend pour traiter les images et apposer dynamiquement des filigranes de protection (watermarks). Pour la livraison globale d'un projet, l'API génère et streame à la volée une archive ZIP compressée grâce au module Archiver, sans surcharger la mémoire du serveur."*

### 🎨 Design & Visuels
- Schéma du pipeline de traitement d'une image (Upload ➡️ Traitement Sharp / Watermark ➡️ Supabase Storage ➡️ Stream ZIP).

---

## SLIDE 9 — Fonctionnalités Clés & Ergonomie Studio

⏱️ **Timing : 2:00**

### 🖥️ Contenu de la slide
```text
FONCTIONNALITÉS MÉTIER AVANCÉES

• Annotations Collaboratives Point & Click :
  - Placement d'ancres (coordonnées X/Y) sur les visuels avec commentaires

• SmartInvoice & Export PDF :
  - Moteur de génération automatique de factures PDF (jsPDF / AutoTable)

• Smart Folders & Filtres Avancés :
  - Filtrage dynamique par statut, client ou projet avec sauvegarde de vues

• Versioning des Assets :
  - Historique complet des retouches et révisions par fichier
```

### 🗣️ Script Oral
> *"Parmi les fonctionnalités clés développées, l'outil d'annotation collaborative permet aux clients de cliquer précisément sur une zone d'un visuel pour y déposer une remarque. La plateforme intègre également SmartInvoice, un générateur autonome de factures PDF professionnelles, ainsi qu'un système complet de versioning des fichiers permettant de suivre chaque aller-retour de retouche."*

### 🎨 Design & Visuels
- Captures d'écran montrant l'outil d'annotation d'image, le générateur de factures PDF et le versioning.

---

## SLIDE 10 — Démonstration Live / Parcours Utilisateur

⏱️ **Timing : 3:00**

### 🖥️ Contenu de la slide
```text
DÉMONSTRATION EN DIRECT

Parcours de démonstration :
1. Connexion au Dashboard Studio (Auth JWT)
2. Création d'un projet & Upload d'assets avec Watermark
3. Interaction d'annotation par le Client
4. Validation & Génération de la livraison ZIP
5. Émission d'une facture SmartInvoice
```

### 🗣️ Script Oral
> *"Je vous propose maintenant une démonstration en direct du flux complet. Nous allons nous connecter en tant que Studio, créer un nouveau dossier de production avec notre modale aérée, uploader une série de visuels, voir l'effet du filigrane, puis basculer côté Client pour simuler la validation et le téléchargement du lot."*

### 🎨 Design & Visuels
- Écran de transition pour la démo live ou vidéo de démonstration de 3 minutes si le live n'est pas possible.

---

## SLIDE 11 — Stratégie de Tests & Assurance Qualité

⏱️ **Timing : 1:30**

### 🖥️ Contenu de la slide
```text
ASSURANCE QUALITÉ & PYRAMIDE DES TESTS

• Tests Unitaires & Composants (Vitest + React Testing Library) :
  - Validation du comportement des composants React et du Context

• Tests d'Intégration API (Vitest + Supertest) :
  - Validation des endpoints HTTP, des codes de retour et des jetons

• Tests End-to-End (Playwright) :
  - Automatisation du parcours complet utilisateur sur navigateurs Chromium/Webkit

• Linters & Formateurs :
  - Husky + lint-staged (ESLint & Prettier avant chaque commit)
```

### 🗣️ Script Oral
> *"Pour garantir la fiabilité de l'application, j'ai mis en place une pyramide de tests automatisés. Les tests unitaires et composants sont exécutés par Vitest. L'API est testée en intégration grâce à Supertest qui vérifie la conformité de chaque route. Enfin, des tests End-to-End avec Playwright simulent le parcours réel dans le navigateur. Des hooks Git Husky bloquent tout commit ne respectant pas les normes ESLint."*

### 🎨 Design & Visuels
- Pyramide des tests (Unitaires ➡️ Intégration ➡️ E2E) avec logos Vitest et Playwright.

---

## SLIDE 12 — Accessibilité (RGAA / WCAG) & Performance

⏱️ **Timing : 1:00**

### 🖥️ Contenu de la slide
```text
ACCESSIBILITÉ UNIVERSELLE & PERFORMANCES

• Conformité RGAA / WCAG 2.1 :
  - Attributs ARIA complets (aria-expanded, aria-haspopup, role="dialog")
  - Navigation 100% au clavier (focus-visible, gestion de la touche Echap)
  - Contrastes de couleurs validés (WCAG AAA pour le texte)

• Performance Web :
  - Score Lighthouse > 90/100
  - Chargement différé des images (Lazy loading) & Code-splitting Vite
```

### 🗣️ Script Oral
> *"L'accessibilité numérique a été intégrée dès la phase de conception. L'ensemble de l'interface respecte les directives du RGAA : tous les composants interactifs possèdent leurs attributs ARIA dédiés et sont entièrement naviguables au clavier. Côté performances, le Lazy Loading des images et le découpage du code par Vite garantissent un score Lighthouse supérieur à 90."*

### 🎨 Design & Visuels
- Score Lighthouse ou captures des outils d'accessibilité ARIA (Lighthouse 100%).

---

## SLIDE 13 — CI/CD, Conteneurisation & Hébergement Cloud

⏱️ **Timing : 1:30**

### 🖥️ Contenu de la slide
```text
DEVOPS & PIPELINE DE DÉPLOIEMENT CONTINU

• Conteneurisation Docker :
  - Multi-stage build (Image Alpine ultra-légère < 150MB)

• Pipeline CI/CD GitHub Actions :
  - Exécution automatique des linter, tests Vitest à chaque Push / PR

• Infrastructure Cloud Production :
  - Frontend : Vercel (CDN mondial, réécritures SPA vercel.json)
  - Backend : Google Cloud Run (Auto-scaling 0 -> N instances)
```

### 🗣️ Script Oral
> *"Le déploiement s'appuie sur une démarche DevOps complète. Le backend est encapsulé dans une image Docker multi-stage optimisée de moins de 150 Mo. Chaque push sur GitHub déclenche une pipeline GitHub Actions qui exécute la suite de tests. Une fois validé, le frontend est déployé automatiquement sur Vercel et le backend conteneurisé sur Google Cloud Run avec auto-scaling de 0 à N instances."*

### 🎨 Design & Visuels
- Diagramme de la chaîne CI/CD GitHub Actions ➡️ Docker ➡️ Vercel & Google Cloud Run.

---

## SLIDE 14 — Documentation API (Swagger / OpenAPI 3.0)

⏱️ **Timing : 1:00**

### 🖥️ Contenu de la slide
```text
DOCUMENTATION & MAINTENABILITÉ API

• Standard OpenAPI 3.0 :
  - Auto-documentation des 17 routes de l'API via swagger-jsdoc

• Interface Interactive Swagger UI :
  - Accessible directement sur /api-docs
  - Exécution et test des requêtes en direct avec authentification JWT

• Maintenabilité :
  - Facilite l'intégration de nouveaux développeurs ou d'applications mobiles
```

### 🗣️ Script Oral
> *"Dans une optique de maintenabilité et de transmission du code, l'intégralité de l'API REST est documentée selon la norme OpenAPI 3.0 avec Swagger UI. Accessible directement sur la route `/api-docs`, cette interface permet à tout développeur de consulter la structure des requêtes, les schémas de données et de tester les requêtes en direct."*

### 🎨 Design & Visuels
- Capture d'écran de l'interface Swagger UI (`/api-docs`).

---

## SLIDE 15 — Bilan Technique & Perspectives

⏱️ **Timing : 1:00**

### 🖥️ Contenu de la slide
```text
BILAN & PERSPECTIVES DU PROJET

• Bilan Technique :
  - Application full-stack 100% fonctionnelle & déployée en production
  - Architecture découplée, sécurisée, accessible et testée

• Perspectives d'Évolution :
  - Application Mobile native (React Native)
  - Intégration de l'IA (génération automatique de tags et d'alt-texts)
  - Mode hors-ligne avec synchronisation PWA

MERCI POUR VOTRE ATTENTION
Questions & Échanges
```

### 🗣️ Script Oral
> *"En conclusion, Visuals.co est aujourd'hui une plateforme SaaS full-stack complète, déployée et fonctionnelle en production. Ce projet m'a permis de mettre en œuvre l'ensemble des compétences de conception, développement, sécurité et déploiement requises pour le Bloc 2. Les évolutions futures porteront sur une déclinaison mobile et l'intégration de modules d'IA pour le tatouage automatique. Je vous remercie pour votre attention et je suis à votre disposition pour vos questions."*

### 🎨 Design & Visuels
- Logo Visuals.co final avec lien vers l'application en prod et coordonnées.

---

## 💡 CONSEILS POUR L'ORAL DU JURY

1. **Garde un rythme régulier** : Ne dépasse pas 1 min 30 s par slide pour garder 3 minutes dédiées à la démo live.
2. **Pointe du doigt ton architecture** : Lorsque tu parles du backend, mentionne explicitement la séparation entre Vercel et Google Cloud Run.
3. **Aie les liens ouverts dans ton navigateur** :
   - Frontend Prod : `https://myvisuals-client.vercel.app`
   - Backend Health Check : `https://myvisuals-back-645756273525.europe-west1.run.app/health`
   - Swagger API : `https://myvisuals-back-645756273525.europe-west1.run.app/api-docs`
