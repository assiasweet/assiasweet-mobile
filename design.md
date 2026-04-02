# AssiaSweet Mobile — Design System

## Identité visuelle
- **Couleur primaire** : #E91E7B (Rose vif AssiaSweet)
- **Couleur secondaire** : #1E1E1E (Gris très foncé)
- **Fond** : #FFFFFF (Blanc)
- **Texte principal** : #1E1E1E
- **Texte secondaire** : #6B7280 (Gris)
- **Surface / Cartes** : #F9FAFB
- **Bordures** : #E5E7EB
- **Succès** : #22C55E
- **Erreur** : #EF4444
- **Police** : Inter (system font)

## Screens List

### Auth Flow
1. **SplashScreen** — Logo AssiaSweet centré, fond blanc, chargement
2. **LoginScreen** — Email + mot de passe, bouton connexion rose, lien inscription/reset
3. **RegisterScreen** — Formulaire multi-étapes (infos entreprise, SIRET, adresses)
4. **ResetPasswordScreen** — Email pour réinitialisation
5. **PendingApprovalScreen** — Message "Compte en cours de validation"

### Mode Client B2B (Tab Bar)
6. **HomeScreen** — Slider hero, carrousels (best-sellers, nouveautés, promos), grille catégories
7. **CatalogScreen** — FlatList produits, filtres (catégorie, marque, halal, prix), recherche
8. **ProductDetailScreen** — Galerie images swipe, infos produit, sélecteur qté, produits similaires
9. **CartScreen** — Liste articles modifiables, totaux HT/TTC, bouton commander
10. **CheckoutScreen** — Sélection adresse, mode livraison, récapitulatif, confirmation + RIB
11. **AccountScreen** — Menu compte (commandes, factures, adresses, profil)
12. **OrdersScreen** — Liste commandes avec statut coloré
13. **OrderDetailScreen** — Détail commande, statut, numéro suivi, bouton recommander
14. **InvoicesScreen** — Liste factures téléchargeables
15. **AddressesScreen** — Gestion adresses livraison
16. **ProfileScreen** — Modifier coordonnées, SIRET

### Mode Staff (Tab Bar différente)
17. **StaffDashboardScreen** — KPIs (CA jour, commandes en attente, à préparer), alertes stock
18. **StaffOrdersScreen** — Liste commandes filtrables, actions rapides
19. **StaffOrderDetailScreen** — Détail commande, changer statut, ajouter suivi, bon livraison
20. **StaffProductsScreen** — Catalogue avec stock, scanner code-barres
21. **StaffClientsScreen** — Liste clients B2B, validation comptes
22. **StaffClientDetailScreen** — Fiche client, historique commandes
23. **StaffNotificationsScreen** — Historique alertes, paramétrage

## Navigation Structure

### Client B2B Tab Bar (5 onglets)
- 🏠 Accueil → HomeScreen
- 🛍️ Catalogue → CatalogScreen
- 🛒 Panier → CartScreen (badge compteur)
- 📦 Commandes → OrdersScreen
- 👤 Compte → AccountScreen

### Staff Tab Bar (4 onglets)
- 📊 Dashboard → StaffDashboardScreen
- 📋 Commandes → StaffOrdersScreen
- 📦 Produits → StaffProductsScreen
- 👥 Clients → StaffClientsScreen

## Key User Flows

### Flow 1 — Commande client
Login → Accueil → Catalogue → Fiche Produit → Panier → Checkout (adresse + livraison) → Confirmation + RIB

### Flow 2 — Suivi commande
Compte → Mes Commandes → Détail Commande → Voir statut/suivi

### Flow 3 — Recommander une commande
Compte → Mes Commandes → Ancienne commande → Bouton "Recommander" → Panier pré-rempli

### Flow 4 — Staff traitement commande
Dashboard → Commandes → Détail → Changer statut → Ajouter numéro suivi → Générer bon livraison

### Flow 5 — Staff validation client
Clients → Nouveau client PENDING → Valider le compte

## Component Design Patterns

### ProductCard
- Image produit (ratio 1:1, arrondi 12px)
- Badge HALAL (vert), NOUVEAU (bleu), PROMO (orange)
- Nom produit (bold, 2 lignes max)
- Marque (gris, petit)
- Prix HT (rose, bold)
- Bouton "+" arrondi rose

### OrderStatusBadge
- EN_ATTENTE → gris
- EN_PREPARATION → orange
- EXPEDIEE → bleu
- LIVREE → vert
- ANNULEE → rouge

### CartItem
- Image miniature
- Nom + marque
- Sélecteur quantité (- / n / +)
- Prix ligne HT
- Bouton supprimer

### KPICard (Staff)
- Icône colorée
- Valeur numérique large
- Label descriptif
- Variation (flèche haut/bas)
