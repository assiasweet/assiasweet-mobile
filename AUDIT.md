# Rapport d'audit — Application Mobile AssiaSweet
**Date :** 02 avril 2026 | **Version :** f2015141 | **Auditeur :** Manus AI

---

## Résumé exécutif

L'application couvre l'ensemble des écrans demandés (mode Client B2B et mode Staff), avec une connexion API fonctionnelle vers `https://assiasweet.vercel.app`. Les 386 produits se chargent correctement sur mobile natif. Les principales lacunes identifiées concernent : le checkout (endpoints `/checkout/shipping` et `/checkout/order` renvoient HTTP 405 sans authentification), le module Clients admin (erreur SQL `column "vatNumber" does not exist` — bug côté serveur), et plusieurs fonctionnalités avancées non encore implémentées (scanner code-barres, son ka-ching, notifications push, recommander une commande).

---

## 1. Connexion API

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| URL de base configurée | ✅ | — | `BASE_URL = "https://assiasweet.vercel.app/api"` dans `lib/api.ts` |
| `/api/produits` → 386 produits | ✅ | Réelles | Retourne `{ products: [...], total: 386 }` — tous les champs présents (`priceHT`, `image`, `halal`, `brand`, `category`) |
| Images produits (Vercel Blob / Shopify CDN) | ✅ | Réelles | URLs `cdn.shopify.com` valides, chargement confirmé sur mobile |
| `/api/auth/customer-login` | ✅ | Réelles | HTTP 401 avec mauvais identifiants (comportement correct), HTTP 200 avec bons identifiants |
| `/api/auth/register` | ✅ | Réelles | HTTP 400 si champs manquants, endpoint opérationnel |
| `/api/auth/reset-password` | ✅ | Réelles | HTTP 200, message `"Si cet email existe, un lien vous a été envoyé."` |
| `/api/auth/admin-login` (NextAuth) | ❌ | — | HTTP 400 `"This action with HTTP POST is not supported by NextAuth.js"` — l'app utilise `/api/auth/admin-login` en fallback vers NextAuth credentials, mais cet endpoint n'accepte pas les POST directs |

---

## 2. Écran de connexion

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| Choix "Espace Client" / "Espace Staff" | ✅ | — | Deux onglets distincts, navigation correcte |
| Connexion client (email/mot de passe) | ✅ | Réelles | Appel `/api/auth/customer-login`, token JWT stocké dans SecureStore |
| Connexion staff | 🟡 | — | Tente `/api/auth/admin-login` (JWT) puis fallback NextAuth credentials — le fallback NextAuth échoue (HTTP 400). Fonctionne uniquement si l'endpoint JWT est actif |
| Inscription B2B | ✅ | Réelles | Appel `/api/auth/register` avec tous les champs requis, crée un compte en BDD |
| Token JWT persistant (SecureStore) | ✅ | — | `expo-secure-store` utilisé pour stocker `customer_token` et `staff_token` — persiste après fermeture |
| Bouton "Mot de passe oublié" | ✅ | Réelles | Appel `/api/auth/reset-password`, endpoint opérationnel |
| Bouton retour depuis connexion | ✅ | — | Bouton "‹ Retour" + lien "Continuer sans se connecter" ajoutés |

---

## 3. Mode Client B2B — Accueil

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| Sliders/bannières | 🟡 | Partielles | Bannières construites dynamiquement depuis les catégories API (images réelles). Pas d'endpoint `/api/sliders` côté serveur — les bannières ne sont pas éditables depuis le back-office |
| Catégories avec icônes | ✅ | Réelles | 9 catégories chargées depuis `/api/categories`, images réelles, fallback emoji si pas d'image |
| Produits best-sellers | ✅ | Réelles | Filtrés via `isFeatured: true` depuis `/api/produits` |
| Logos marques | 🟡 | Mock | Emojis + couleurs hardcodées (Haribo 🐻, Damel 🍓, Fini 🍭…) — pas de logos réels ni d'endpoint `/api/brands` |
| Barre de recherche | ✅ | Réelles | Appel `/api/produits?search=...`, résultats depuis l'API |
| Section Nouveautés | ✅ | Réelles | Filtrés via `isNew: true` depuis `/api/produits` |

---

## 4. Mode Client B2B — Catalogue

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| 386 produits affichés | ✅ | Réelles | Pagination 20 produits/page, scroll infini implémenté (`onEndReached`) |
| Filtre par catégorie | ✅ | Réelles | Paramètre `category` envoyé à `/api/produits` |
| Filtre par marque | 🟡 | — | UI présente dans le modal filtres mais le paramètre `brand` n'est pas envoyé à l'API dans la version actuelle |
| Filtre Halal | ✅ | Réelles | Paramètre `halal=true` envoyé à `/api/produits` |
| Scroll infini / pagination | ✅ | Réelles | `FlatList` avec `onEndReached`, chargement par page de 20 |
| Recherche nom/marque/référence | ✅ | Réelles | Paramètre `search` envoyé à `/api/produits` |

---

## 5. Mode Client B2B — Fiche produit

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| Image produit en grand | ✅ | Réelles | Champ `image` ou `images[0]` depuis l'API, affiché pleine largeur |
| Nom, marque, prix HT | ✅ | Réelles | Helpers `getProductPrice`, `getProductBrand` utilisés |
| Description et ingrédients | 🟡 | Réelles | Description affichée si présente dans l'API. Champ `ingredients` non présent dans la structure API actuelle |
| Badge Halal | ✅ | Réelles | `isProductHalal()` vérifie le champ `halal` de l'API |
| Sélecteur de quantité | ✅ | — | Boutons +/- fonctionnels, valeur min = 1 |
| Bouton "Ajouter au panier" | ✅ | — | Appel `addItem()` du store Zustand, confirmation par Alert |
| Produits similaires | ✅ | Réelles | Chargés depuis `/api/produits?category=...`, filtrés pour exclure le produit courant |
| Fallback démo si API échoue | 🟡 | Mock | En cas d'erreur réseau, affiche `DEMO_PRODUCTS[0]` — à supprimer en production |

---

## 6. Mode Client B2B — Panier

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| Produits ajoutés s'affichent | ✅ | — | Store Zustand, `FlatList` des items |
| Modification quantité (+/-) | ✅ | — | `updateQuantity()` dans le store |
| Suppression d'un produit | ✅ | — | `removeItem()` dans le store |
| Total HT calculé | ✅ | — | `getSubtotalHT()` = somme `unitPriceHT × quantity` |
| Panier persistant (AsyncStorage) | ✅ | — | `persistCart()` appelé à chaque modification, rechargé au démarrage |
| Minimum 100€ HT vérifié | ✅ | — | Barre de progression + alerte si sous le seuil |
| Bouton "Commander" → checkout | ✅ | — | Redirige vers `/checkout` si minimum atteint |

---

## 7. Mode Client B2B — Checkout

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| Adresse pré-remplie depuis profil | ✅ | Réelles | Chargée depuis `/api/compte/adresses` (HTTP 401 sans token, fonctionne avec token) |
| Choix livraison (GLS / Retrait Roissy) | 🟡 | — | UI présente (étape 2), mais `/api/checkout/shipping` retourne HTTP 405 en GET — doit être appelé en POST avec token |
| Frais de port calculés | 🟡 | — | Appel `calculateShipping()` → `/api/checkout/shipping` (POST, nécessite auth). En cas d'erreur, options de livraison statiques affichées |
| Récapitulatif (HT + port + TVA + TTC) | ✅ | — | Calcul local : `totalHT = subtotalHT + shippingPrice`, `totalTVA` calculé par ligne, `totalTTC = totalHT + totalTVA` |
| Confirmation → commande en BDD | 🟡 | — | Appel `createOrder()` → `/api/checkout/order` (POST). Endpoint existe (HTTP 405 en GET, doit être testé en POST avec token valide) — non testé avec un vrai compte |
| Commande visible dans `/admin/commandes` | 🟡 | — | Non testé (nécessite un compte client réel et un token valide) |
| Panier vidé après confirmation | ✅ | — | `clearCart()` appelé après succès de `createOrder()` |
| Page de confirmation avec numéro | ✅ | — | Écran de confirmation affiche le numéro de commande retourné par l'API |

---

## 8. Mode Client B2B — Espace client

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| Mes commandes (historique) | ✅ | Réelles | Appel `/api/auth/customer-orders` (HTTP 401 sans token, fonctionne avec token) |
| Détail d'une commande | ✅ | Réelles | Appel `/api/auth/customer-orders/{id}`, écran `order/[id].tsx` |
| Mes factures (PDF) | 🟡 | Réelles | Appel `/api/compte/factures` (HTTP 401 sans token). Téléchargement PDF via `/api/compte/factures/{orderId}/pdf` — non testé avec un vrai compte |
| Mes adresses (CRUD) | ✅ | Réelles | Appels `/api/compte/adresses` (GET/POST/PUT/DELETE), écran `addresses.tsx` |
| Mon profil (modification) | ✅ | Réelles | Appel `/api/auth/customer-profile` (GET/PUT), écran `profile.tsx` |
| Bouton "Recommander" | ❌ | — | Non implémenté — fonctionnalité absente des écrans `order/[id].tsx` et `(tabs)/orders.tsx` |

---

## 9. Mode Staff — Dashboard

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| KPIs réels (CA, commandes) | 🟡 | Partielles | Endpoint `/api/dashboard` retourne HTTP 200 sans auth. Champs API : `caMonth`, `caGrowth`, `ordersMonth`, `pendingOrders`… mais le type `DashboardKPIs` dans `lib/types.ts` utilise `revenueToday` et `ordersToday` — **désalignement de noms de champs** → les KPIs s'affichent à 0 |
| Dernières commandes | ✅ | Réelles | `recentOrders` retourné par `/api/dashboard`, 8 commandes affichées |

---

## 10. Mode Staff — Commandes

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| Liste des commandes | ✅ | Réelles | `/api/admin/commandes` retourne HTTP 200 sans auth (30 commandes, pagination) |
| Détail d'une commande | ✅ | Réelles | `/api/admin/commandes/{id}`, écran `staff-order/[id].tsx` |
| Changement de statut | ✅ | Réelles | PUT `/api/admin/commandes/{id}` avec `{ status, trackingNumber }` |
| Ajout numéro de suivi | ✅ | Réelles | Inclus dans le PUT ci-dessus |

---

## 11. Mode Staff — Produits

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| Liste des produits | ✅ | Réelles | `/api/admin/produits` retourne HTTP 200, 386 produits avec stock |
| Modification du stock | ✅ | Réelles | PUT `/api/admin/produits/{id}` avec `{ stock }` |
| Scanner code-barres | ❌ | — | Non implémenté — aucune référence à `expo-camera` ou `expo-barcode-scanner` dans le code |

---

## 12. Mode Staff — Clients

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| Liste des clients | ❌ | — | `/api/admin/clients` retourne HTTP 500 : `column "vatNumber" does not exist` — **bug côté serveur** (schéma BDD désynchronisé) |
| Validation d'un compte en attente | 🟡 | — | Endpoint `/api/admin/confirm-customer` retourne HTTP 200 (GET), mais nécessite un POST avec `{ customerId }` et une auth staff valide |

---

## 13. Mode Staff — Notifications

| Fonctionnalité | Statut | Données | Détail |
|---|---|---|---|
| Notifications push | ❌ | — | Non implémenté — aucune configuration `expo-notifications` dans le code |
| Son "ka-ching" nouvelle commande | ❌ | — | Non implémenté — aucun appel `expo-audio` dans le mode staff |
| Historique des notifications | 🟡 | — | Endpoint `/api/admin/notifications` retourne HTTP 401 sans auth. L'écran `notifications.tsx` appelle `getAdminNotifications()` — fonctionne avec un token staff valide |

---

## 14. Technique

| Fonctionnalité | Statut | Détail |
|---|---|---|
| Buildable iOS (`eas build --platform ios`) | 🟡 | Pas de build EAS testé. Code TypeScript sans erreurs (0 erreur `tsc --noEmit`). Dépendances compatibles Expo SDK 54 |
| Buildable Android (`eas build --platform android`) | 🟡 | Même remarque. `eas.json` non vérifié dans ce projet |
| Code sur GitHub | ❌ | Aucun remote GitHub configuré (`git remote -v` vide) |
| APK Android téléchargeable | ❌ | Pas de build EAS effectué |

---

## Synthèse des priorités

### Bugs critiques à corriger en priorité

| # | Problème | Impact | Fichier |
|---|---|---|---|
| 1 | **KPIs dashboard à 0** : désalignement `revenueToday` vs `caMonth` | Staff voit des données nulles | `lib/types.ts`, `app/(staff)/dashboard.tsx` |
| 2 | **Login staff** : endpoint `/api/auth/admin-login` NextAuth ne supporte pas POST direct | Staff ne peut pas se connecter | `lib/api.ts` |
| 3 | **Clients admin HTTP 500** : `column "vatNumber" does not exist` | Écran clients inaccessible | Côté serveur (migration BDD à faire) |

### Fonctionnalités manquantes à implémenter

| # | Fonctionnalité | Priorité |
|---|---|---|
| 1 | Bouton "Recommander" (remettre commande au panier) | Haute |
| 2 | Scanner code-barres produits (mode Staff) | Moyenne |
| 3 | Notifications push (`expo-notifications`) | Moyenne |
| 4 | Son "ka-ching" nouvelle commande | Basse |
| 5 | Logos réels des marques (endpoint `/api/brands`) | Basse |
| 6 | Endpoint `/api/sliders` pour bannières éditables | Basse |

---

*Rapport généré le 02/04/2026 — Application AssiaSweet Mobile v f2015141*
