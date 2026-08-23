# LifeOS

LifeOS est un dashboard personnel complet pour piloter son quotidien, sa productivité et ses finances dans une seule interface. L’application fonctionne entièrement dans le navigateur, conserve les données en local et rend **toutes les fonctionnalités accessibles gratuitement**, sans abonnement ni écran de paiement.

## Fonctionnalités

### Dashboard personnalisable
- Grille de widgets déplaçables et redimensionnables
- Mode édition, affichage/masquage et réinitialisation du layout
- Recherche globale et actions rapides
- Navigation desktop, tablette et mobile
- Préférences et layouts persistés dans `localStorage`

### Vie personnelle
- Horloge et météo locale
- Minuteur Pomodoro
- Tâches CRUD avec priorités et échéances
- Notes, habitudes et suivi de séries
- Journal avec humeur
- Objectifs SMART et progression
- Calendrier et événements

### Finances
- Résumé mensuel, flux de trésorerie et répartition des dépenses
- Transactions complètes : création, édition, suppression, recherche et export CSV
- Budgets par catégorie avec alertes et réconciliation automatique
- Objectifs d’épargne
- Simulateur d’intérêts composés
- Portefeuille d’investissements
- Calculateur et tableau d’amortissement de prêt

### Assistant LifeOS
- Chatbot local contextuel
- Historique et suggestions
- Conseils de productivité, finances et motivation
- Mode coach

### Personnalisation et données
- Thèmes clair, sombre et système
- Choix d’accent, densité, animations, fumée et parallaxe
- Interface principale bilingue français/anglais
- Notifications configurables
- Import/export/sauvegarde locale, suppression des données et verrouillage PIN
- Catalogue de 10 outils avancés, tous ouverts et gratuits
- Raccourcis clavier et socle PWA

## Stack

- React 18.3 et TypeScript strict
- Vite 5.4
- Tailwind CSS 3.4
- Zustand
- Framer Motion
- Recharts
- react-grid-layout
- Lucide React
- date-fns
- clsx et tailwind-merge

## Démarrage

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:5173`.

## Validation de production

```bash
npm run build
npm run preview
```

Le build optimisé est généré dans `dist/` avec des chunks séparés pour React, les graphiques, les animations, les dates et la grille.

## Données

LifeOS démarre avec un jeu de données réaliste afin que tous les écrans soient immédiatement utilisables. Les données utilisateur restent dans le stockage local du navigateur. La page Paramètres permet d’exporter ou restaurer une sauvegarde JSON, ainsi que d’exporter les transactions en CSV.

Aucun fichier Excel ou CSV source n’étant inclus dans ce dépôt, aucune donnée externe n’est importée automatiquement au premier démarrage.

## Vie privée

L’assistant est local et aucune donnée personnelle n’est envoyée à un service distant par l’application. Le verrouillage PIN est une protection d’interface locale, et non un mécanisme d’authentification serveur.
