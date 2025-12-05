#  Nexus Portal - Formulaire Augmenté

## 2. Description du Projet

Nexus Portal est une application web moderne et sécurisée qui propose des formulaires dynamiques et intelligents pour différentes missions (dons, bénévolat, contact, informations). Le projet intègre :

-  Reconnaissance d'intention par IA : Analyse automatique des messages utilisateurs pour déterminer leur intention
-  Formulaires dynamiques : Champs qui s'adaptent selon la mission sélectionnée
-  Personnalisation NIRD 2025 : Thème Numérique, Inclusif, Responsable et Durable
-  Sécurité renforcée : Protection anti-spam, validation des données, détection de code malveillant (PHP, Python, HTML, JavaScript)
-  Interface moderne : Design avec animations, thème turquoise/teal, composants interactifs
-  Chiffrement HTTPS : Protection des données en transit
-  Alertes stylisées : Notifications utilisateur avec SweetAlert personnalisé

## 3. Technologies Utilisées

### Frontend
- Next.js 16.0.6 - Framework React avec App Router
- React 19.2.0 - Bibliothèque UI
- TypeScript 5 - Typage statique
- Tailwind CSS 3.4.18 - Framework CSS utilitaire
- PostCSS - Traitement CSS

### Backend / API
- Next.js API Routes - Routes API intégrées
- Groq SDK 0.37.0 - Intégration IA (LLM)
- Node.js - Runtime JavaScript

### Sécurité
- Middleware Next.js - Protection globale (HTTPS, headers de sécurité)
- Rate Limiting - Limitation des requêtes par IP
- Honeypot - Détection anti-spam
- Validation stricte - Détection de code malveillant (PHP, Python, HTML, JS)

### Outils de Développement
- ESLint - Linter JavaScript/TypeScript
- Autoprefixer - Préfixes CSS automatiques

## 4. Structure du Projet

```
FormulaireAugmenter/
├── app/                          # App Router Next.js
│   ├── api/                      # Routes API
│   │   ├── improve/              # Amélioration de texte par IA
│   │   ├── intent/               # Reconnaissance d'intention
│   │   ├── summary/              # Génération de messages personnalisés
│   │   └── validate/             # Validation des données
│   ├── confirmation/             # Page de confirmation
│   │   └── page.tsx
│   ├── form/                     # Page de formulaire dynamique
│   │   └── page.tsx
│   ├── globals.css               # Styles globaux
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Page d'accueil
├── components/                   # Composants React
│   ├── AIThinking.tsx           # Animation de réflexion IA
│   ├── AxolotlOrb.tsx           # Mascotte animée
│   ├── IntentRecognizer.tsx     # Reconnaissance d'intention
│   └── SweetAlert.tsx           # Alertes stylisées
├── lib/                          # Utilitaires
│   └── security.ts              # Fonctions de sécurité
├── public/                       # Assets statiques
├── config/                       # Configuration
├── middleware.ts                 # Middleware de sécurité
├── next.config.ts                # Configuration Next.js
├── tailwind.config.js            # Configuration Tailwind
├── tsconfig.json                 # Configuration TypeScript
├── package.json                  # Dépendances
└── README.md                     # Documentation
```

### Composants Principaux

- IntentRecognizer : Analyse les messages utilisateurs pour déterminer l'intention
- FormPage : Formulaire dynamique qui s'adapte selon la mission
- ConfirmationPage : Page de confirmation avec message personnalisé
- SweetAlert : Système d'alertes stylisées
- AxolotlOrb : Mascotte animée du projet

### API Routes

- `/api/intent`: Analyse l'intention de l'utilisateur
- `/api/summary` : Génère un message personnalisé avec IA
- `/api/improve` : Améliore le texte saisi par l'utilisateur

## 5. Méthode pour Exécuter le Projet

### Prérequis

- Node.js 20+ (recommandé)
- npm ou yarn ou pnpm
- Clé API Groq (optionnelle, pour les fonctionnalités IA)

### Installation

1. Cloner le projet (si applicable)
   ```bash
   git clone <repository-url>
   cd FormulaireAugmenter
   ```

2. Installer les dépendances
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. Configurer les variables d'environnement (optionnel)
   
   Créer un fichier `.env.local` à la racine :
   ```env
   # Clé API Groq (optionnelle)
   GROQ_API_KEY=your_groq_api_key_here
   
   # Environnement
   NODE_ENV=development
   ```

### Exécution en Mode Développement

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```


### Exécution en Mode Production

1. Construire le projet
   ```bash
   npm run build
   ```

2. Démarrer le serveur de production
   ```bash
   npm start
   ```

### Scripts Disponibles

- `npm run dev` - Démarre le serveur de développement
- `npm run build` - Construit l'application pour la production
- `npm start` - Démarre le serveur de production
- `npm run lint` - Vérifie le code avec ESLint

### Utilisation

1. Accéder à l'application 
2. Choisir une mission : Don, Bénévolat, Contact, ou Information
3. Remplir le formulaire : Les champs s'adaptent automatiquement
4. Utiliser l'IA* (optionnel) : Cliquer sur le bouton "IA" pour améliorer le texte
5.   Soumettre   : Le formulaire est validé et sécurisé avant envoi
6.   Confirmation   : Recevoir un message personnalisé généré par IA

### Fonctionnalités de Sécurité

-  Protection anti-spam (honeypot)
-  Détection de code malveillant (PHP, Python, HTML, JavaScript)
-  Rate limiting (10 requêtes / 15 minutes par IP)
-  Validation stricte des données
-  Chiffrement HTTPS (en production)
-  Headers de sécurité (CSP, XSS Protection, etc.)


### Déploiement en Ligne

L'application est déployée et accessible en ligne :

 [https://trois-dimensions-dkny.vercel.app/](https://trois-dimensions-dkny.vercel.app/)

Application web déployée sur Vercel, proposant des formulaires dynamiques et intelligents avec reconnaissance d'intention par IA, protection anti-spam avancée, et personnalisation NIRD 2025.

