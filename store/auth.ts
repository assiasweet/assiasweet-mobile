import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { Customer, StaffUser } from "@/lib/types";
import {
  loginCustomer,
  loginStaff,
  logoutCustomer,
  logoutStaff,
  getCustomerProfile,
  getStaffProfile,
  getCustomerToken,
  getStaffToken,
} from "@/lib/api";

type AuthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "customer"; customer: Customer }
  | { status: "staff"; user: StaffUser }
  | { status: "pending"; customer: Customer }
  | { status: "unauthenticated" };

interface AuthStore {
  auth: AuthState;
  initialize: () => Promise<void>;
  loginAsCustomer: (email: string, password: string) => Promise<void>;
  loginAsStaff: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const CUSTOMER_TOKEN_KEY = "customer_token";
const STAFF_TOKEN_KEY = "staff_token";
const STAFF_COOKIE_KEY = "staff_cookie"; // clé legacy — doit aussi être effacée au logout
const CACHED_CUSTOMER_KEY = "cached_customer";
const CACHED_STAFF_KEY = "cached_staff";

export const useAuthStore = create<AuthStore>((set, get) => ({
  auth: { status: "idle" },

  initialize: async () => {
    // Stratégie CACHE-FIRST :
    // 1. Lire le cache local immédiatement (SecureStore, synchrone-ish)
    // 2. Afficher l'app avec les données en cache
    // 3. Vérifier le token en arrière-plan (sans bloquer l'UI)
    // Cela évite les crashs causés par des requêtes réseau lentes au démarrage

    set({ auth: { status: "loading" } });

    try {
      // ─── Étape 1 : Lire le cache immédiatement ───────────────────────────
      const [cachedCustomerStr, cachedStaffStr, customerToken, staffToken] = await Promise.all([
        SecureStore.getItemAsync(CACHED_CUSTOMER_KEY).catch(() => null),
        SecureStore.getItemAsync(CACHED_STAFF_KEY).catch(() => null),
        getCustomerToken().catch(() => null),
        getStaffToken().catch(() => null),
      ]);

      // ─── Étape 2 : Restaurer depuis le cache si token présent ────────────
      if (staffToken && cachedStaffStr) {
        try {
          const user: StaffUser = JSON.parse(cachedStaffStr);
          // Afficher immédiatement avec les données en cache
          set({ auth: { status: "staff", user } });
          // Vérifier le token en arrière-plan (sans bloquer)
          getStaffProfile()
            .then((freshUser) => {
              SecureStore.setItemAsync(CACHED_STAFF_KEY, JSON.stringify(freshUser)).catch(() => {});
              set({ auth: { status: "staff", user: freshUser } });
            })
            .catch(() => {
              // Token expiré → déconnecter proprement (effacer aussi le cookie legacy)
              SecureStore.deleteItemAsync(STAFF_TOKEN_KEY).catch(() => {});
              SecureStore.deleteItemAsync(STAFF_COOKIE_KEY).catch(() => {});
              SecureStore.deleteItemAsync(CACHED_STAFF_KEY).catch(() => {});
              set({ auth: { status: "unauthenticated" } });
            });
          return;
        } catch {
          // JSON corrompu, continuer
        }
      }

      if (customerToken && cachedCustomerStr) {
        try {
          const customer: Customer = JSON.parse(cachedCustomerStr);
          if (customer.status === "APPROVED") {
            set({ auth: { status: "customer", customer } });
          } else if (customer.status === "PENDING") {
            set({ auth: { status: "pending", customer } });
          } else {
            set({ auth: { status: "unauthenticated" } });
            return;
          }
          // Vérifier en arrière-plan
          getCustomerProfile()
            .then((freshCustomer) => {
              SecureStore.setItemAsync(CACHED_CUSTOMER_KEY, JSON.stringify(freshCustomer)).catch(() => {});
              if (freshCustomer.status === "APPROVED") {
                set({ auth: { status: "customer", customer: freshCustomer } });
              } else if (freshCustomer.status === "PENDING") {
                set({ auth: { status: "pending", customer: freshCustomer } });
              }
            })
            .catch(() => {
              // Token expiré → déconnecter
              SecureStore.deleteItemAsync(CUSTOMER_TOKEN_KEY).catch(() => {});
              SecureStore.deleteItemAsync(CACHED_CUSTOMER_KEY).catch(() => {});
              set({ auth: { status: "unauthenticated" } });
            });
          return;
        } catch {
          // JSON corrompu, continuer
        }
      }

      // ─── Étape 3 : Pas de cache → essayer l'API directement ─────────────
      if (staffToken) {
        try {
          const user = await getStaffProfile();
          await SecureStore.setItemAsync(CACHED_STAFF_KEY, JSON.stringify(user)).catch(() => {});
          set({ auth: { status: "staff", user } });
          return;
        } catch {
          // Token invalide → tout effacer
          await SecureStore.deleteItemAsync(STAFF_TOKEN_KEY).catch(() => {});
          await SecureStore.deleteItemAsync(STAFF_COOKIE_KEY).catch(() => {});
          await SecureStore.deleteItemAsync(CACHED_STAFF_KEY).catch(() => {});
        }
      }

      if (customerToken) {
        try {
          const customer = await getCustomerProfile();
          await SecureStore.setItemAsync(CACHED_CUSTOMER_KEY, JSON.stringify(customer)).catch(() => {});
          if (customer.status === "APPROVED") {
            set({ auth: { status: "customer", customer } });
          } else if (customer.status === "PENDING") {
            set({ auth: { status: "pending", customer } });
          } else {
            set({ auth: { status: "unauthenticated" } });
          }
          return;
        } catch {
          await SecureStore.deleteItemAsync(CUSTOMER_TOKEN_KEY).catch(() => {});
        }
      }

      // Aucun token valide
      set({ auth: { status: "unauthenticated" } });
    } catch {
      // Erreur inattendue → ne pas crasher
      set({ auth: { status: "unauthenticated" } });
    }
  },

  loginAsCustomer: async (email: string, password: string) => {
    const result = await loginCustomer(email, password);
    const customer = result.customer;
    await SecureStore.setItemAsync(CACHED_CUSTOMER_KEY, JSON.stringify(customer)).catch(() => {});
    if (customer.status === "PENDING") {
      set({ auth: { status: "pending", customer } });
    } else if (customer.status === "APPROVED") {
      set({ auth: { status: "customer", customer } });
    } else {
      throw new Error("Votre compte n'est pas actif. Contactez-nous.");
    }
  },

  loginAsStaff: async (email: string, password: string) => {
    const result = await loginStaff(email, password);
    if (result.user) {
      await SecureStore.setItemAsync(CACHED_STAFF_KEY, JSON.stringify(result.user)).catch(() => {});
      set({ auth: { status: "staff", user: result.user } });
    } else {
      throw new Error("Identifiants incorrects ou accès refusé");
    }
  },

  logout: async () => {
    const { auth } = get();
    try {
      if (auth.status === "customer" || auth.status === "pending") {
        await logoutCustomer();
      } else if (auth.status === "staff") {
        await logoutStaff();
      }
    } catch {
      // ignore logout errors
    }
    // Effacer TOUTES les données en cache (y compris le cookie legacy staff_cookie)
    await Promise.all([
      SecureStore.deleteItemAsync(CUSTOMER_TOKEN_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(STAFF_TOKEN_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(STAFF_COOKIE_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(CACHED_CUSTOMER_KEY).catch(() => {}),
      SecureStore.deleteItemAsync(CACHED_STAFF_KEY).catch(() => {}),
    ]);
    set({ auth: { status: "unauthenticated" } });
  },

  refreshCustomer: async () => {
    try {
      const customer = await getCustomerProfile();
      await SecureStore.setItemAsync(CACHED_CUSTOMER_KEY, JSON.stringify(customer)).catch(() => {});
      if (customer.status === "APPROVED") {
        set({ auth: { status: "customer", customer } });
      }
    } catch {
      // ignore
    }
  },
}));
