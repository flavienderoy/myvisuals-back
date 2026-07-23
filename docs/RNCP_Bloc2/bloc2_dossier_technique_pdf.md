<style>
  @media print {
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; line-height: 1.6; }
    h1 { page-break-before: always; color: #000; border-bottom: 2px solid #D4AF37; padding-bottom: 8px; }
    h1:first-of-type { page-break-before: avoid; }
    h2 { color: #222; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 24px; }
    h3 { color: #444; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; page-break-inside: avoid; }
    th, td { border: 1px solid #ccc; padding: 8px 12px; font-size: 13px; text-align: left; }
    th { bg-color: #f4f4f4; background: #f4f4f4; font-weight: bold; }
    pre, code { font-family: 'Courier New', monospace; font-size: 12px; background: #f8f8f8; border: 1px solid #eee; border-radius: 4px; }
    pre { padding: 12px; overflow-x: auto; page-break-inside: avoid; }
    blockquote { border-left: 4px solid #D4AF37; padding-left: 12px; color: #555; margin: 16px 0; font-style: italic; }
    .page-break { page-break-after: always; }
    .cover-page { height: 90vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
    .cover-title { font-size: 32px; font-weight: bold; margin-bottom: 12px; color: #000; }
    .cover-subtitle { font-size: 20px; color: #D4AF37; margin-bottom: 40px; }
    .cover-meta { font-size: 14px; color: #666; margin-top: 60px; line-height: 1.8; }
  }
</style>

<div class="cover-page">
  <br/><br/><br/>
  <h1 class="cover-title" style="border:none; text-align:center;">VISUALS.CO</h1>
  <div class="cover-subtitle">DOSSIER TECHNIQUE DE SYNTHÈSE (RNCP 39583)</div>
  <p style="font-size: 16px; color: #444;"><strong>Bloc 2 : Concevoir et développer des applications logicielles</strong></p>
  <br/><br/>
  <div style="width: 80px; height: 3px; background: #D4AF37; margin: 0 auto;"></div>
  <br/><br/>
  <div class="cover-meta">
    <p><strong>Candidat :</strong> Flavien DEROY</p>
    <p><strong>Certification :</strong> Expert en Développement Logiciel (Niveau 7)</p>
    <p><strong>Projet :</strong> Visuals.co — Plateforme SaaS de Gestion & Livraison de Médias</p>
    <p><strong>Date :</strong> Juillet 2026</p>
  </div>
</div>

<div class="page-break"></div>

# SOMMAIRE EXÉCUTIF

1. [Présentation du Projet & Périmètre Fonctionnel](#1-présentation-du-projet--périmètre-fonctionnel)
2. [Choix Architecturaux & Stack Technologique](#2-choix-architecturaux--stack-technologique)
3. [Architecture 3-Tiers & Diagrammes de Composants](#3-architecture-3-tiers--diagrammes-de-composants)
4. [Modélisation de la Base de Données (PostgreSQL)](#4-modélisation-de-la-base-de-données-postgresql)
5. [Sécurité & Authentification (JWT, RBAC, RLS)](#5-sécurité--authentification-jwt-rbac-rls)
6. [Développement Frontend (React 19 & Vite 7)](#6-développement-frontend-react-19--vite-7)
7. [Développement Backend (Express.js 5 API REST)](#7-développement-backend-expressjs-5-api-rest)
8. [Traitement des Médias & Moteur de Fichiers](#8-traitement-des-médias--moteur-de-fichiers)
9. [Assurance Qualité & Stratégie de Tests](#9-assurance-qualité--stratégie-de-tests)
10. [Conformité Accessibilité (RGAA / WCAG)](#10-conformité-accessibilité-rgaa--wcag)
11. [Infrastructure DevOps (Docker, CI/CD, GCloud Run, Vercel)](#11-infrastructure-devops-docker-cicd-gcloud-run-vercel)
12. [Documentation API (Swagger / OpenAPI 3.0)](#12-documentation-api-swagger--openapi-30)
13. [Bilan Technique & Annexes](#13-bilan-technique--annexes)

<div class="page-break"></div>

# 1. Présentation du Projet & Périmètre Fonctionnel

## 1.1 Présentation de Visuals.co
**Visuals.co** est une plateforme SaaS (Software as a Service) full-stack conçue pour unifier l'intégralité du cycle de production et de livraison des professionnels de l'image (photographes, vidéastes, directeurs artistiques).

## 1.2 Problématique Métier
Actuellement, les studios de création jonglent entre 5 et 8 outils différents (Google Drive pour le stockage, WeTransfer pour l'envoi, WhatsApp pour les retours, Excel pour les devis). Visuals.co centralise ces processus dans un environnement sécurisé et réactif.

## 1.3 Synthèse du Périmètre Fonctionnel

| Module | Fonctionnalités Clés | Technologies Associées |
|:---|:---|:---|
| **Dashboard Studio** | Gestion projets, clients, tâches, facturation SmartInvoice | React 19, Context API, jsPDF |
| **Espace Client** | Vue des projets attribués, téléchargements HD, messagerie | React Router v7, Supabase Realtime |

| **Engine Médias** | Processing images, filigrane dynamique, export ZIP | Sharp (C++), Archiver, Multer |
| **Sécurité & Auth** | Authentification double rôle, accès RLS, CORS, Rate Limit | JWT, Helmet, Express Rate Limit |

<div class="page-break"></div>

# 2. Choix Architecturaux & Stack Technologique

## 2.1 Tableau Récapitulatif de la Stack

| Couche | Technologie | Version | Rôle & Justification |
|:---|:---|:---:|:---|
| **Frontend** | React | 19.2 | Bibliothèque UI déclarative, architecture composants réutilisables |
| **Bundler** | Vite | 7.2 | Build ultra-rapide (ESBuild), HMR instantané |
| **CSS System** | Tailwind CSS | 4.1 | Utility-first, Design System personnalisé Dark Mode Luxury |
| **Animations** | Framer Motion / GSAP | 12.x / 3.14 | Micro-interactions fluides et animations de modales ressort |
| **Backend** | Express.js | 5.2 | Framework HTTP minimaliste, architecture 19 contrôleurs/routes découplée |
| **Base de Données** | Supabase (PostgreSQL) | 15.x | BaaS relationnel, authentification JWT intégrée, Row Level Security |
| **Storage** | Supabase Storage | — | Buckets d'objets sécurisés avec URLs signées temporaires |
| **Tests** | Vitest / Playwright | 3.2 / 1.x | Tests unitaires, d'intégration HTTP (Supertest) et E2E |
| **DevOps & Cloud** | Docker / GCloud Run / Vercel | — | Multi-stage build conteneurisé, auto-scaling et CDN mondial |

<div class="page-break"></div>

# 3. Architecture 3-Tiers & Diagrammes de Composants

```text
┌─────────────────────────────────────────────────────────────┐
│                 COUCHE 1 : PRÉSENTATION                     │
│                                                             │
│   React 19 + Vite 7 + Tailwind CSS 4                        │
│   - Single Page Application (SPA)                           │
│   - Hébergé sur Vercel (CDN Edge Network)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST / JWT Bearer Token
┌──────────────────────────────▼──────────────────────────────┐
│                    COUCHE 2 : MÉTIER                        │
│                                                             │
│   Express.js 5 + Node.js 20                                 │
│   - 19 Controllers & Routes REST                            │
│   - Sharp (Traitement images) + Archiver (Stream ZIP)       │
│   - Conteneur Docker déployé sur Google Cloud Run           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Supabase JS SDK (Service Role Key)
┌──────────────────────────────▼──────────────────────────────┐
│                   COUCHE 3 : DONNÉES                        │
│                                                             │
│   Supabase (PostgreSQL 15)                                  │
│   - 23 Tables relationnelles + Triggers Pl/pgSQL            │
│   - Row Level Security (RLS) + Supabase Realtime            │
└─────────────────────────────────────────────────────────────┘
```

<div class="page-break"></div>

# 4. Modélisation de la Base de Données (PostgreSQL)

## 4.1 Schéma Relationnel des Tables Clés

```sql
-- Profiles (Utilisateurs métier)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    organization TEXT,
    role TEXT DEFAULT 'client',
    siret TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Projects (Projets de production)
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    date DATE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assets (Fichiers médias)
CREATE TABLE public.assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    look_id UUID REFERENCES public.looks(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    url TEXT,
    type TEXT,
    file_path TEXT,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Team Members (Gestion d'équipe)
CREATE TABLE public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    studio_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

<div class="page-break"></div>

# 5. Sécurité & Authentification (JWT, RBAC, RLS)

## 5.1 Contrôle d'Accès basé sur les Rôles (RBAC)
- **Role `studio`** : Accès complet d'administration, création de projets, gestion d'équipe et facturation.
- **Role `client`** : Accès strictement restreint aux projets auxquels son compte est rattaché.

## 5.2 Sécurisation BDD via Row Level Security (RLS)
```sql
-- RLS Exemple : Seul le propriétaire ou le membre assigné peut lire le projet
CREATE POLICY "Acces projets studio" ON public.projects
    FOR SELECT USING (auth.uid() = owner_id OR auth.uid() IN (
        SELECT user_id FROM public.team_members WHERE studio_id = owner_id
    ));
```

<div class="page-break"></div>

# 6. Développement Frontend (React 19 & Vite 7)

## 6.1 State Management & Architecture Composants
L'application s'appuie sur le Context API de React (`AuthContext` et `DataContext`) pour propager l'état global utilisateur et les données des projets sans prop-drilling.

## 6.2 Ergonomie & Fenêtres Modales Aérées
- Modalités de création (Projets & Entreprises) configurées en `max-w-2xl` avec animation ressort (Spring).
- Design System Dark Mode Luxury (couleurs HSL Tailored `#0a0a0a` & `#D4AF37`).

<div class="page-break"></div>

# 7. Développement Backend (Express.js 5 API REST)

## 7.1 Architecture Modulaire
L'API est découpée en 19 modules indépendants (`projectRoutes`, `clientRoutes`, `assetRoutes`, `teamRoutes`, `annotationRoutes`, `conversationRoutes`, etc.).

## 7.2 Sécurisation & Middlewares
- `cors` : Origine autorisée filtrée strictement par `process.env.CLIENT_URL`.
- `helmet` : En-têtes HTTP de sécurité (CSP, XSS, HSTS).
- `express-rate-limit` : Limitation de débit à 1000 requêtes / 15 minutes en production.

<div class="page-break"></div>

# 8. Traitement des Médias & Moteur de Fichiers

## 8.1 Traitement d'Images avec Sharp (C++)
Les visuels téléversés passent par un pipeline d'optimisation exécuté par `sharp` (redimensionnement automatique, génération de vignettes WebP et application dynamique d'un filigrane de prévisualisation).

## 8.2 Génération de Lots ZIP
Le module `archiver` permet d'empaqueter à la volée des dizaines de visuels HD dans une archive ZIP compressée transmise sous forme de flux (stream HTTP) sans stockage temporaire sur disque.

<div class="page-break"></div>

# 9. Assurance Qualité & Stratégie de Tests

## 9.1 Pyramide des Tests

| Niveau | Outil | Couverture / Cible |
|:---|:---|:---|
| **Unitaires & Composants** | Vitest + React Testing Library | Valide le rendu des composants UI et des hooks personnalisés |
| **Intégration API** | Vitest + Supertest | Valide la réponse des endpoints REST, statuts HTTP et payloads |
| **End-to-End (E2E)** | Playwright | Simule le parcours complet (Connexion ➡️ Création ➡️ Validation) |

<div class="page-break"></div>

# 10. Conformité Accessibilité (RGAA / WCAG)

- **Structure sémantique** : Balises HTML5 (`<nav>`, `<header>`, `<main>`, `<section>`).
- **Attributs ARIA** : `aria-expanded`, `aria-haspopup`, `role="dialog"`, `aria-label`.
- **Navigation Clavier** : Gestion complète du focus et fermeture par touche `Échap`.
- **Contrastes** : Conformes aux exigences WCAG 2.1 AA/AAA sur fond sombre.

<div class="page-break"></div>

# 11. Infrastructure DevOps (Docker, CI/CD, GCloud Run, Vercel)

## 11.1 Pipeline CI/CD GitHub Actions
Chaque `push` ou `pull-request` déclenche l'exécution automatisée des linters (ESLint, Prettier) et de la suite de tests Vitest.

## 11.2 Déploiement Production

```text
               ┌──────────────────────────────────────┐
               │    GitHub Repository (Visuals.co)    │
               └──────────┬──────────────── shadow ───┘
                          │ Push main
             ┌────────────┴────────────┐
             ▼                         ▼
   ┌──────────────────┐      ┌──────────────────┐
   │  Frontend Vercel │      │ Google Cloud Run │
   │   (Vite Build)   │      │ (Docker Container│
   └──────────────────┘      └──────────────────┘
```

<div class="page-break"></div>

# 12. Documentation API (Swagger / OpenAPI 3.0)

L'API Express expose une documentation interactive OpenAPI 3.0 sur la route `/api-docs` générée par `swagger-jsdoc` et `swagger-ui-express`. Elle permet de consulter les schémas DTO et d'exécuter des tests d'endpoints en direct avec authentification JWT.

<div class="page-break"></div>

# 13. Bilan Technique & Annexes

## 13.1 Bilan
Le projet Visuals.co démontre l'implémentation complète des compétences requises pour le **Bloc 2 (RNCP 39583)** : conception logicielle 3-tiers, développement full-stack moderne, sécurité applicative, traitement média performant et déploiement continu conteneurisé.

## 13.2 URLs de Production
- **Frontend Vercel :** `https://myvisuals-client.vercel.app`
- **Backend Google Cloud Run :** `https://myvisuals-back-645756273525.europe-west1.run.app`
- **Swagger API Docs :** `https://myvisuals-back-645756273525.europe-west1.run.app/api-docs`
- **Health Check :** `https://myvisuals-back-645756273525.europe-west1.run.app/health`
