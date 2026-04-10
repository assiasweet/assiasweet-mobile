# AssiaSweet Mobile — TODO

## Configuration & Design System
- [x] Configurer le thème rose #E91E7B et la charte graphique
- [x] Configurer les icônes de navigation (Accueil, Catalogue, Panier, Commandes, Compte)
- [x] Créer le service API (fetch, JWT, SecureStore)
- [x] Créer les types TypeScript partagés (Product, Order, Customer, etc.)
- [x] Créer les stores Zustand (auth, panier)

## Authentification
- [x] Écran Login (email + mot de passe)
- [x] Écran Register (inscription client B2B avec SIRET, adresses)
- [x] Écran Reset Password
- [x] Gestion JWT dans SecureStore
- [x] Redirection selon rôle (client B2B vs staff)
- [x] Écran "Compte en attente de validation"

## Mode Client B2B
- [x] Écran Accueil (sliders, carrousels best-sellers/nouveautés/promos, grille catégories)
- [x] Écran Catalogue (liste produits, filtres, recherche)
- [x] Écran Fiche Produit (images swipe, détails, sélecteur quantité, produits similaires)
- [x] Écran Panier (liste articles, totaux HT/TTC, bouton commander min 100€ HT)
- [x] Écran Checkout (adresse, mode livraison, récapitulatif, paiement virement/RIB)
- [x] Écran Mon Compte (commandes, factures, adresses, profil)
- [x] Écran Détail Commande (statut, suivi, articles)
- [x] Écran Mes Adresses (ajouter, modifier, supprimer)
- [x] Écran Mon Profil (modifier coordonnées, SIRET)
- [x] Écran Mes Factures (liste, téléchargement PDF)

## Mode Staff
- [x] Écran Dashboard (KPIs, dernières commandes, alertes stock)
- [x] Écran Commandes Staff (liste filtres, détail, changer statut, numéro suivi)
- [x] Écran Produits Staff (liste, modifier stock)
- [x] Écran Clients Staff (liste, fiche client, valider compte)
- [x] Écran Notifications Staff (historique, marquer lu)

## Notifications Push
- [x] Configuration Expo Notifications (hook usePushNotifications)
- [x] Canal Android configuré
- [ ] Notifications client (commande confirmée, expédiée, facture, promos) — côté serveur
- [ ] Notifications staff (nouvelle commande, nouveau client, stock bas) — côté serveur

## Assets & Build
- [x] Générer le logo AssiaSweet (icône app 2048x2048)
- [x] Configurer splash screen
- [x] Configurer app.config.ts (nom "AssiaSweet", bundle ID, icônes)
- [x] Couleur adaptive icon Android (#E91E7B)

## Bugs à corriger (signalés par l'utilisateur)
- [x] Parcours Client B2B non fonctionnel : après login client, l'app affiche l'interface staff
- [x] Navigation tabs client B2B (Accueil/Catalogue/Panier/Commandes/Compte) non visible
- [x] Redirection post-login incorrecte selon le rôle (customer → tabs, staff → staff)
- [x] Écran index.tsx ne redirige pas correctement vers /(tabs) pour les clients
- [x] Vérifier tous les écrans client B2B (accueil, catalogue, panier, checkout)

## Amélioration demandée (02/04/2026)
- [x] Mode démo boutique : accéder directement à la boutique client sans connexion obligatoire
- [x] Données de démo pour l'accueil (produits, catégories, sliders)
- [x] Données de démo pour catalogue, fiche produit, panier

## Corrections API (02/04/2026)
- [ ] Corriger /api/products → /api/produits dans api.ts et tous les écrans
- [ ] Corriger la structure de réponse sliders (d.sliders au lieu de d[])
- [ ] Corriger la structure de réponse categories (d.categories au lieu de d[])
- [ ] Corriger les types TypeScript (priceHT, image, isNew, isFeatured, inStock)
- [ ] Résoudre le problème Unmatched Route sur le web

## Reconstruction simple (02/04/2026)
- [ ] Rollback node_modules propres (sans patches)
- [ ] Écran produits basique avec FlatList + API réelle /api/produits
- [ ] Vérifier que les 386 produits s'affichent
- [ ] Ajouter les autres écrans un par un

## Corrections prioritaires (02/04/2026 — Audit)
- [ ] Bug 1 : Login staff — adapter l'appel API pour JWT dédié (pas NextAuth)
- [ ] Bug 2 : KPIs dashboard — aligner DashboardKPIs types avec champs API réels (caMonth, ordersMonth…)
- [ ] Bug 3 : Clients admin HTTP 500 — colonne vatNumber manquante (migration BDD + fix côté app)
- [ ] Checkout : tester et corriger /api/checkout/shipping et /api/checkout/order
- [ ] Bouton "Recommander" sur les anciennes commandes (order/[id].tsx)
- [ ] Notifications push : expo-notifications + endpoint /api/push-token
- [ ] Son ka-ching staff : expo-audio, polling nouvelles commandes
- [ ] Supprimer tous les fallbacks mock (DEMO_PRODUCTS, DEMO_CATEGORIES)
- [ ] Remplacer emojis marques par vrais logos depuis le site web
- [ ] Pousser le code sur GitHub (assiasweet/assiasweet-mobile)
- [ ] Générer APK de test via EAS Build

## Audit technique complet (03/04/2026)
- [x] P0 — Bug fiche produit : API retourne { product: {...} } mais getProduct() attend Product directement → unwrap le wrapper
- [x] P0 — Bug navigation fiche produit : navigation utilise product.id (UUID) mais l'API n'accepte que les slugs → utiliser product.slug
- [x] P0 — Corriger getProduct() dans api.ts pour dépaqueter { product: ... }
- [x] P0 — Corriger tous les onPress produit pour utiliser slug au lieu de id
- [ ] P1 — Vérifier que les images produits s'affichent (Shopify CDN)
- [ ] P1 — Vérifier le checkout complet (adresses, shipping, order)
- [ ] P2 — Écran compte : historique commandes, profil, adresses

## Corrections UI/UX (03/04/2026 — Audit visuel)
- [x] Correction 1 — Slider banner : LinearGradient opacité max 0.65 gauche (A6), 0.1 droite (1A)
- [x] Correction 2 — Catégories : pills rectangulaires borderRadius 12, labels raccourcis
- [x] Correction 3 — Bug texte panier : deux Text séparés (déjà fait)
- [x] Correction 4 — Bouton désactivé : fond #f3f4f6, texte #9ca3af, bordure légère (déjà fait)

## Corrections backend Vercel (03/04/2026)
- [x] Bug 1 — ProductStatus 'active' → 'ACTIF' dans checkout/order/route.ts
- [x] Bug 2 — Route /compte/adresses : sessionToken → jwtVerify
- [x] Bug 3 — Token JWT retourné dans JSON body de /auth/customer-login
- [x] Bug 4 — OrderStatus 'confirmed' → 'EN_ATTENTE' et PaymentStatus 'pending' → 'EN_ATTENTE'
- [x] Tests validation : login ✅, adresses ✅, création commande CMD-2026-9217 ✅, synchro admin ✅

## Bug filtres catalogue (04/04/2026)
- [x] Bug : produits mal classés par catégorie — corrigé : API filtre par c.slug, app envoie cat=slug
- [x] Bug : produits mal classés par marque — corrigé : API filtre par UPPER(brand), app envoie brand=nom
- [x] Vérifier la structure de réponse API /api/produits avec filtres actifs — OK (total, page, totalPages)

## Scanner Stock — Interface Staff (04/04/2026)
- [x] Lire doc expo-camera pour le scanner de codes-barres EAN
- [x] Créer l'écran app/staff/scanner.tsx avec caméra + scan EAN (intégré dans products.tsx)
- [x] Afficher le produit trouvé par EAN (nom, stock actuel, image)
- [x] Formulaire de mise à jour du stock (quantité + type : ajout/correction)
- [x] Ajouter la route API PATCH /api/admin/produits/{id}/stock côté Vercel
- [x] Intégrer l'écran scanner dans la navigation staff existante (bouton dans onglet Produits)
- [x] Ajouter l'icône scanner dans icon-symbol.tsx (icône ⬛ dans le bouton)

## Flux de picking — Préparation commandes (04/04/2026)

- [ ] Analyser orders.tsx staff et la structure des données commande API
- [ ] Créer app/(staff)/picking/[id].tsx — écran de picking avec liste articles
- [ ] Intégrer le scanner BarcodeScanner pour cocher les articles un par un
- [ ] Ajouter statut PRETE_A_L_ENVOI dans l'enum OrderStatus côté Vercel
- [ ] Ajouter route PATCH /api/admin/commandes/[id]/status côté Vercel
- [ ] Décrémentation automatique du stock à la validation de la préparation
- [ ] Bouton "Commencer la préparation" dans orders.tsx → statut EN_PREPARATION
- [ ] Bouton "Valider la préparation" → statut PRETE_A_L_ENVOI + décrémentation stock
- [ ] Ajouter les fonctions API dans lib/api.ts (startPicking, validatePicking)
- [ ] Ajouter la navigation vers l'écran picking depuis orders.tsx

## Préparation production (07/04/2026)
- [ ] P0 — Supprimer DEMO_PRODUCTS et DEMO_CATEGORIES de tous les écrans
- [ ] P0 — Remplacer les fallbacks mock par des états de chargement / erreur propres
- [ ] P0 — Vérifier affichage images produits (Shopify CDN) sur vrai appareil
- [ ] P0 — Corriger les images manquantes ou cassées (fallback image)
- [ ] P1 — Tester checkout complet de bout en bout (adresse → livraison → commande → email)
- [ ] P1 — Intégrer Revolut Merchant API (paiement en ligne réel)
- [ ] P1 — Tester notifications push sur vrai appareil
- [ ] P2 — Remplacer emojis marques par vrais logos
- [ ] P2 — Son ka-ching staff (expo-audio, polling nouvelles commandes)
- [ ] Build — Lancer production-client et production-staff finaux

## Fix écran blanc au redémarrage — Flux d'initialisation (10/04/2026)
- [x] Lire et analyser _layout.tsx, store/auth.ts, AnimatedSplash.tsx, app/index.tsx
- [x] Corriger le flux : token lu depuis SecureStore AVANT toute navigation
- [x] Ajouter ActivityIndicator fiable pendant la vérification auth
- [x] Fiabiliser SplashScreen.hideAsync (SplashScreen.preventAutoHideAsync + hideAsync dans onLayout)
- [x] Remplacer AnimatedSplash custom par splash natif Expo (plus fiable)
- [x] Backend Vercel : accepter Bearer token sur customer-profile, adresses, factures, orders, checkout/order
- [x] App mobile : getCustomerProfile() dépaquette {customer:...} et normalise isApproved→status
- [ ] Tester le flux : cold start, restart, retour foreground (sur appareil réel)

## Intégration PayPal (10/04/2026)
- [x] Audit backend PayPal (routes create-order + capture déjà prêtes, clés configurées sur Vercel)
- [x] Types PayPalCreateOrderResponse + PayPalCaptureResponse dans lib/types.ts
- [x] Fonctions createPayPalOrder() + capturePayPalOrder() dans lib/api.ts
- [x] Écran paypal-payment.tsx : WebView PayPal avec détection return_url/cancel_url
- [x] checkout.tsx : choix de paiement PayPal ou virement bancaire
- [x] Bouton PayPal bleu marine + flux : créer commande → créer ordre PayPal → WebView → capture → confirmation
- [ ] Tester le flux PayPal complet sur appareil réel (compte sandbox PayPal)
