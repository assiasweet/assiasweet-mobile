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
