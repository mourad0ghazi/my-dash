# LifeOS

LifeOS est un dashboard personnel complet pour piloter son quotidien, sa productivité et ses finances dans une seule interface. Il est disponible comme site/PWA et comme véritable application Android autonome au format APK. Les données restent dans le stockage local de la version utilisée et **toutes les fonctionnalités sont accessibles gratuitement**, sans abonnement ni écran de paiement.

## Fonctionnalités

### Dashboard personnalisable
- Grille de 16 widgets déplaçables, redimensionnables et réordonnables
- Mode édition, affichage/masquage, commandes Monter/Descendre sur mobile et réinitialisation du layout
- Quatre suggestions applicables en un clic : Essentiel, Finance, Productivité et Bien-être
- Recherche globale et actions rapides
- Navigation desktop, tablette et mobile
- Persistance locale robuste dans IndexedDB (avec migration automatique depuis `localStorage`)

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
- Import local exhaustif de classeurs Excel `.xlsx`, `.xlsm` et anciens `.xls`, avec détection automatique des feuilles et colonnes FR/EN
- Web Worker dédié : toutes les feuilles et lignes utiles sont parcourues sans plafond artificiel, tandis que l’interface reste réactive
- Progression par étape/feuille et bilan vérifiable (lignes, cellules, feuilles reconnues ou ignorées, zéro troncature)
- Bouton Excel principal dans Paramètres, prévisualisation, fusion intelligente ou remplacement ciblé des données reconnues
- Application des transactions, budgets, tâches, objectifs, épargne, investissements, événements, notes, habitudes, profil et préférences détectés
- Personnalisation automatique des widgets et de leur ordre selon le contenu du classeur
- Thèmes clair, sombre et système
- Choix d’accent, densité, animations, fumée et parallaxe
- Formats configurables de devise, séparateur décimal, date, heure et fuseau horaire, avec aperçu en direct
- Interface principale bilingue français/anglais
- Notifications configurables
- Import/export/sauvegarde locale, suppression des données et protection par code d’accès
- Catalogue de 10 outils avancés, tous ouverts et gratuits
- Raccourcis clavier et socle PWA

### Application mobile
- APK Android autonome avec l’interface LifeOS embarquée pour un usage hors connexion
- Installation PWA toujours disponible depuis le navigateur et ajout à l’écran d’accueil
- Interface responsive optimisée pour téléphone
- Code d’accès fixe `7536` demandé à chaque nouvelle ouverture ou retour dans l’application
- Aucun compte, aucun paiement, aucun tracker et aucune donnée personnelle préremplie
- Stockages séparés entre l’APK et la PWA, avec transfert volontaire par export/import JSON

**Télécharger :** [LifeOS Android v2.1.0](https://mourad0ghazi.github.io/my-dash/docs/downloads/LifeOS-Android-v2.1.0.apk) · [métadonnées et empreintes](https://mourad0ghazi.github.io/my-dash/docs/downloads/lifeos-android.json)

Sur Android, téléchargez l’APK, autorisez si nécessaire l’installation provenant du navigateur, puis ouvrez le fichier. À la première ouverture comme aux suivantes, saisissez `7536`. Android vérifiera la même signature LifeOS lors des futures mises à jour.

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
- @e965/xlsx (décodage local complet des classeurs `.xlsx`, `.xlsm` et `.xls`)
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

Pour produire et vérifier la version Android signée :

```bash
npm run build:android
npm run verify:android
```

La procédure de signature, la sauvegarde indispensable de la clé privée et les détails du pipeline sans Java/Gradle sont documentés dans [`android/README.md`](android/README.md). `npm run build:release` reconstruit successivement l’APK et le site GitHub Pages.

## Données

LifeOS démarre avec un espace volontairement vierge : aucun profil, montant, transaction, tâche, note ou autre exemple personnel n’est prérempli. Les données saisies restent dans IndexedDB sur l’appareil, ce qui évite le faible quota de `localStorage` pour les imports Excel volumineux. La migration retire uniquement les anciens exemples restés strictement intacts et préserve les contenus réellement modifiés. La page Paramètres permet d’exporter ou restaurer une sauvegarde JSON, ainsi que d’exporter les transactions en CSV.

Le bouton **Importer Excel**, disponible directement sur le dashboard et dans la section principale `Paramètres > Excel`, lit les classeurs `.xlsx`, `.xlsm` et `.xls` dans un Web Worker local. Il n’existe plus de limite arbitraire de 25 Mo ou de 10 000 lignes : le moteur parcourt chaque feuille jusqu’à sa dernière ligne utile, dans la limite de la mémoire réellement disponible dans le navigateur. LifeOS reconnaît les feuilles de transactions, budgets, tâches, objectifs, épargne, investissements, événements, notes, habitudes, profil et préférences à partir de noms de colonnes usuels en français ou en anglais. Pendant l’analyse, la progression indique l’étape, la feuille et le nombre de lignes parcourues. Avant application, un bilan certifie l’absence de troncature et récapitule les feuilles, lignes, cellules, entités et formats détectés, puis permet de fusionner ou de remplacer uniquement les catégories concernées. Les montants, dates, devise, profil et préférences reconnues sont propagés dans l’interface. L’option de personnalisation automatique affiche et remonte ensuite les widgets les plus pertinents sans supprimer les autres modules.

## Vie privée

L’assistant est local et aucune donnée personnelle n’est envoyée à un service distant par l’application. Le verrouillage PIN est une protection d’interface locale, et non un mécanisme d’authentification serveur.
