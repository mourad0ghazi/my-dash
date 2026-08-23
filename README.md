# LifeOS

LifeOS est un dashboard personnel complet pour piloter son quotidien, sa productivité et ses finances dans une seule interface. L’application fonctionne entièrement dans le navigateur, conserve les données en local et rend **toutes les fonctionnalités accessibles gratuitement**, sans abonnement ni écran de paiement.

## Fonctionnalités

### Dashboard personnalisable
- Grille de 16 widgets déplaçables, redimensionnables et réordonnables
- Mode édition, affichage/masquage, commandes Monter/Descendre sur mobile et réinitialisation du layout
- Quatre suggestions applicables en un clic : Essentiel, Finance, Productivité et Bien-être
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
- Import local de classeurs Excel `.xlsx`, `.xlsm` et anciens `.xls`, avec détection automatique des feuilles et colonnes FR/EN
- Bouton Excel principal dans Paramètres, prévisualisation, fusion intelligente ou remplacement ciblé des données reconnues
- Application des transactions, budgets, tâches, objectifs, épargne, investissements, événements, notes, habitudes, profil et préférences détectés
- Personnalisation automatique des widgets et de leur ordre selon le contenu du classeur
- Thèmes clair, sombre et système
- Choix d’accent, densité, animations, fumée et parallaxe
- Formats configurables de devise, séparateur décimal, date, heure et fuseau horaire, avec aperçu en direct
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
- read-excel-file (lecture locale des classeurs `.xlsx` et `.xlsm`)
- @e965/xlsx (compatibilité locale avec les anciens classeurs `.xls`)
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

Le bouton **Importer Excel**, disponible directement sur le dashboard et dans la section principale `Paramètres > Excel`, lit les classeurs `.xlsx`, `.xlsm` et `.xls` dans le navigateur. LifeOS reconnaît les feuilles de transactions, budgets, tâches, objectifs, épargne, investissements, événements, notes, habitudes, profil et préférences à partir de noms de colonnes usuels en français ou en anglais. Avant application, un écran récapitule les feuilles, lignes, entités et formats détectés, puis permet de fusionner ou de remplacer uniquement les catégories concernées. Les montants, dates, devise, profil et préférences reconnues sont propagés dans l’interface. L’option de personnalisation automatique affiche et remonte ensuite les widgets les plus pertinents sans supprimer les autres modules.

## Vie privée

L’assistant est local et aucune donnée personnelle n’est envoyée à un service distant par l’application. Le verrouillage PIN est une protection d’interface locale, et non un mécanisme d’authentification serveur.
