# LifeOS pour Android

Ce dossier contient les sources de l’enveloppe Android native de LifeOS. Le build produit un véritable fichier APK autonome sous `public/downloads/` tout en conservant le site et la PWA.

## Construire

```bash
npm ci
npm run build:android
npm run verify:android
```

Le pipeline ne requiert ni Java, ni Gradle, ni SDK Android installé globalement. Il utilise :

- AAPT2 fourni par `aaptjs3` pour compiler le manifeste et les ressources ;
- le framework de ressources fourni par `apktool-jar` ;
- le petit runtime WebView Nitron épinglé sous `android/runtime/nitron-base.apk` ;
- `apk_sign_ts` pour l’alignement et les signatures v1, v2 et v3 ;
- OpenSSL pour créer et contrôler le certificat de publication.

Le runtime Nitron et sa licence MIT sont conservés dans `android/runtime/` afin que le DEX utilisé soit immuable et que le build n’installe pas les dépendances facultatives de la CLI Nitron. Le SHA-256 attendu de `nitron-base.apk` est `584d55e04487b30898dd63b0ff70ec076ea2ebeddd33974fa4c9b18d15fb652b`.

Le correctif versionné dans `patches/` force une clé publique X.509 SPKI conforme aux schémas APK v2/v3 et une signature JAR v1 PKCS#7 détachée.

## Clé de publication

Au premier build, une clé RSA 4096 bits et son certificat sont créés dans `.android-signing/`. Ce répertoire est ignoré par Git et la clé privée ne doit jamais être publiée. Le certificat **public** est conservé dans `android/release-certificate.pem` pour vérifier l’identité des prochaines versions.

Sauvegardez `.android-signing/lifeos-release-key.pem` dans un emplacement privé et sûr. Android n’acceptera une mise à jour de `ma.lifeos.app` que si elle est signée avec la même clé. Sur une nouvelle machine, fournissez les chemins avec :

```bash
LIFEOS_ANDROID_PRIVATE_KEY=/chemin/prive/cle.pem \
LIFEOS_ANDROID_CERTIFICATE=/chemin/certificat.pem \
npm run build:android
```

Le script refuse de générer silencieusement une nouvelle identité lorsque le certificat de publication existe déjà.

## Contenu et sécurité

- package : `ma.lifeos.app` ;
- Android minimal : API 21 (Android 5.0) ;
- cible déclarée : API 34 ;
- activité : `com.nicron.webview.MainActivity` ;
- fichiers React intégrés sous `assets/www/` et servis par l’origine HTTPS locale d’Android WebView ;
- aucun serveur personnel, aucun tracker, aucun paiement et aucune donnée d’exemple ;
- accès Internet autorisé uniquement pour les fonctions web choisies par l’utilisateur ;
- trafic HTTP non chiffré interdit ;
- sauvegarde Android désactivée ;
- cache WebView conservé pour l’usage hors connexion ;
- code d’accès LifeOS demandé à chaque ouverture comme sur le site.

Les données de l’APK restent dans le stockage local de l’application Android. Elles ne sont pas automatiquement partagées avec la PWA du navigateur : utilisez l’export/import JSON de LifeOS pour les transférer volontairement.

## Vérification

`npm run verify:android` contrôle indépendamment :

- la structure ZIP et l’alignement de `resources.arsc` ;
- le package, les SDK, l’activité et les ressources via AAPT2 ;
- tous les condensats du manifeste JAR et la signature PKCS#7 v1 via OpenSSL ;
- les structures, certificats, clés SPKI, condensats de contenu et signatures RSA des schémas v2 et v3 ;
- la présence du DEX et du build web embarqué.

Le SHA-256 de chaque version et l’empreinte du certificat sont publiés dans `public/downloads/lifeos-android.json`.
