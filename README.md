# Visuals.co — Plateforme de Gestion de Contenus Visuels

Bienvenue sur le dépôt de **Visuals.co**, une plateforme SaaS B2B destinée aux studios photo et vidéo professionnels. Elle permet de gérer l'intégralité du cycle de production : de l'upload des médias bruts à la livraison finale au client, en passant par la collaboration, l'annotation et la facturation.

Ce projet a été réalisé par **Flavien Deroy** dans le cadre du **Titre RNCP 39583 — Expert en Développement Logiciel (Niveau 7)**.

---

## 📖 Sommaire

1. [Présentation du projet](#-présentation-du-projet)
2. [Fonctionnalités Principales](#-fonctionnalités-principales)
3. [Stack Technique (SERN)](#-stack-technique-sern)
4. [Architecture & Base de Données](#-architecture--base-de-données)
5. [Lancement du Projet en Local (Guide pour le Jury)](#-lancement-du-projet-en-local-guide-pour-le-jury)
6. [Qualité, Tests & Sécurité](#-qualité-tests--sécurité)
7. [Maintien en Condition Opérationnelle](#-maintien-en-condition-opérationnelle)

---

## 🚀 Présentation du projet

**Visuals.co** répond à un besoin métier spécifique : centraliser les échanges entre un créateur de contenu visuel (Studio) et son commanditaire (Client). 

Fini les multiples plateformes déconnectées (WeTransfer pour l'envoi, WhatsApp pour les retours, Excel pour le suivi, etc.). Visuals.co regroupe :
- Un **Dashboard Studio** complet pour le professionnel (projets, clients, assets, suivi du temps, kanban, facturation).
- Un **Espace Client** épuré pour la consultation, la validation, les retours (annotations sur image) et le téléchargement des livrables.

---

## ✨ Fonctionnalités Principales

### 👤 Côté Studio (Dashboard)
- **Gestion CRM** : Création et gestion des fiches clients.
- **Projets & Médias** : Création de projets, arborescence par "Looks" (dossiers intelligents), upload de fichiers lourds (conversion WebP à la volée, génération de miniatures).
- **Collaboration Visuelle** : Système d'annotation précis (coordonnées X/Y) sur les visuels, gestion des versions d'un même asset.
- **Productivité** : Suivi du temps passé (Time Tracker), gestion des tâches (Kanban).
- **Finances** : Génération de devis et factures PDF automatisée.

### 👥 Côté Client (Portail)
- **Accès Sécurisé** : Espace dédié au client pour retrouver tous ses projets.
- **Validation** : Interface fluide pour valider ou demander des retouches sur chaque média.
- **Annotations** : Possibilité de laisser des commentaires précis pointant directement sur une zone de l'image.
- **Téléchargement** : Récupération des livrables finaux une fois le projet clôturé.

---

## 🛠 Stack Technique (SERN)

Le projet repose sur la stack **SERN** (**S**upabase, **E**xpress, **R**eact, **N**ode).

| Couche | Technologie | Rôle / Justification |
|--------|-------------|----------------------|
| **Frontend** | React 19 + Vite 7 | Rendu ultra-rapide des galeries d'images, interface Single Page Application réactive. |
| **Styling** | Tailwind CSS 4 | Design system sur-mesure, "Dark Mode" exclusif pour un aspect premium, framer-motion pour les animations. |
| **Backend API** | Node.js 20 + Express 5 | API REST robuste, traitement des fichiers (Sharp) avant envoi sur le cloud. |
| **Base de Données** | PostgreSQL (via Supabase) | Modèle relationnel fiable (23 tables). Supabase fournit aussi l'Auth, les politiques de sécurité (RLS) et le stockage (S3). |

---

## 🏗 Architecture & Base de Données

Le projet est divisé en deux dépôts / dossiers principaux :
- `/client` : L'application front-end (React).
- `/server` : L'API back-end (Express).

### Base de données (PostgreSQL)
L'architecture de données repose sur un modèle relationnel fort avec **23 tables**.
Toutes les tables critiques sont protégées par des **Row Level Security (RLS)** natives. Même en cas de faille de l'API, un utilisateur ne peut extraire que les données qui lui appartiennent.
- Les identifiants sont tous des **UUID v4** pour empêcher l'énumération de données.
- Utilisation de Triggers SQL (ex: création automatique d'un profil public lors de l'inscription Auth).

---

## ⚙️ Lancement du Projet en Local (Guide pour le Jury)

Pour tester le projet sur votre machine, suivez ces étapes.

### 1. Prérequis
- **Node.js** (v18 ou supérieure)
- **npm** (v9 ou supérieure)

### 2. Configuration de l'environnement
Les variables d'environnement nécessaires pour le backend et le frontend se trouvent généralement dans des fichiers `.env` à la racine de `/client` et `/server`.
*(Veuillez vous référer aux instructions annexes fournies avec le code source pour obtenir les clés API Supabase si elles ne sont pas déjà présentes).*

### 3. Lancement de l'API Backend
Ouvrez un terminal et naviguez dans le dossier `server` :
```bash
cd server
npm install
npm run dev
```
Le serveur Express se lancera sur le port **5001**. L'API sera accessible et la documentation Swagger sera disponible sur `http://localhost:5001/api-docs`.

### 4. Lancement du Frontend React
Ouvrez un second terminal et naviguez dans le dossier `client` :
```bash
cd client
npm install
npm run dev
```
Vite lancera l'application sur le port **5173** (par défaut). Ouvrez votre navigateur sur `http://localhost:5173`.

### 5. Utilisation
Vous pouvez vous créer un compte depuis l'interface ou utiliser les identifiants de test qui vous ont été fournis lors de la soutenance. L'application supporte le double rôle : inscrivez-vous en tant que Studio pour découvrir le Dashboard, ou en tant que Client pour voir le portail de réception.

---

## 🛡 Qualité, Tests & Sécurité

### Sécurité (Défense en Profondeur)
- **Protection des données** : Politiques RLS PostgreSQL restrictives.
- **API** : Protection contre les attaques de type Brute Force via Rate Limiting, requêtes paramétrées contre l'injection SQL, CORS stricts et sécurisation via Helmet.
- **Fichiers** : Filtrage MIME stricte et traitement des images via Sharp pour éliminer tout payload malveillant caché dans un fichier image.

### Assurance Qualité
L'application est couverte par une **stratégie de tests complète** :
- Tests unitaires Frontend (Vitest + React Testing Library) — **75 tests**.
- Tests d'intégration API Backend (Supertest) — **90 tests**.
- Tests End-to-End (E2E) simulants les parcours utilisateurs clés via **Playwright**.

`npm audit` ne signale **aucune vulnérabilité** sur les deux dépôts, et le seuil
`high` est bloquant en intégration continue.

---

## 🩺 Maintien en Condition Opérationnelle

Le dispositif de supervision, de traitement des anomalies et de suivi des
versions est documenté séparément.

| Document | Objet |
|---|---|
| [`docs/SUPERVISION.md`](docs/SUPERVISION.md) | Périmètre supervisé, sondes, 12 indicateurs de suivi et leurs seuils, modalités d'alerte, mise en place opérationnelle |
| [`docs/PROCESSUS_ANOMALIES.md`](docs/PROCESSUS_ANOMALIES.md) | Canaux de détection, grille de sévérité et délais d'engagement, cycle de vie d'un ticket, règles de correction |
| [`docs/PROCESSUS_DEPENDANCES.md`](docs/PROCESSUS_DEPENDANCES.md) | Politique de mise à jour (correctif / mineure / majeure / sécurité), Dependabot, audit bloquant, procédure de retour arrière |
| [`CHANGELOG.md`](CHANGELOG.md) | Journal de version (Keep a Changelog + SemVer), 9 versions publiées |
| [`docs/anomalies/`](docs/anomalies/) | Fiches d'anomalies réelles traitées sur le projet |

### Vérifier l'état du service

```bash
# Vivacité — sans entrée/sortie, utilisée par Cloud Run et le smoke test CI
curl -s https://<api>/health | jq

# Aptitude — interroge réellement PostgreSQL et le stockage objet
curl -s https://<api>/health/ready | jq
```

Le champ `version` est lu depuis `package.json` : il indique avec certitude
quelle version tourne en production, et un contrôle d'intégration continue
(`scripts/check-changelog.cjs`) interdit toute divergence avec le journal.

### Activer les sondes externes

Le suivi d'erreurs est **conditionnel** : sans DSN configuré, l'application
fonctionne à l'identique, sondes désactivées.

| Variable | Portée | Effet |
|---|---|---|
| `SENTRY_DSN` | Cloud Run | Active la capture des 5xx et des exceptions non gérées côté API |
| `VITE_SENTRY_DSN` | Vercel (au **build**) | Active la capture des exceptions React côté navigateur |

### Anomalies documentées

| Référence | Anomalie | Sév. | Détection |
|---|---|---|---|
| [ANO-2026-001](docs/anomalies/ANO-2026-001.md) | Conteneur en échec au démarrage après déploiement | S1 | Supervision |
| [ANO-2026-002](docs/anomalies/ANO-2026-002.md) | Saturation du limiteur de débit sur le tableau de bord | S3 | Recette interne |
| [ANO-2026-003](docs/anomalies/ANO-2026-003.md) | Inscription Studio créant un compte Client | S2 | Support client |

---
*© 2026 Flavien Deroy — Projet RNCP Niveau 7*
