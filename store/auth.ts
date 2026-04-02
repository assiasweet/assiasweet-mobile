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
const CACHED_CUSTOMER_KEY = "cached_customer";
const CACHED_STAFF_KEY = "cached_staff";

export const useAuthStore = create<AuthStore>((set, get) => ({
  auth: { status: "idle" },

  initialize: async () => {
    set({ auth: { status: "loading" } });
    try {
      // --- Try customer token ---
      const customerToken = await getCustomerToken();
      if (customerToken) {
        try {
          const customer = await getCustomerProfile();
          // Cache for offline
          await SecureStore.setItemAsync(CACHED_CUSTOMER_KEY, JSON.stringify(customer));
          if (customer.status === "PENDING") {
            set({ auth: { status: "pending", customer } });
          } else if (customer.status === "APPROVED") {
            set({ auth: { status: "customer", customer } });
          } else {
            await SecureStore.deleteItemAsync(CUSTOMER_TOKEN_KEY);
            await SecureStore.deleteItemAsync(CACHED_CUSTOMER_KEY);
          }
          return;
        } catch {
          // API failed — try cached customer
          const cached = await SecureStore.getItemAsync(CACHED_CUSTOMER_KEY);
          if (cached) {
            try {
              const customer: Customer = JSON.parse(cached);
              if (customer.status === "APPROVED") {
                set({ auth: { status: "customer", customer } });
                return;
              }
            } catch {
              // ignore
            }
          }
          await SecureStore.deleteItemAsync(CUSTOMER_TOKEN_KEY);
          await SecureStore.deleteItemAsync(CACHED_CUSTOMER_KEY);
        }
      }

      // --- Try staff token ---
      const staffToken = await getStaffToken();
      if (staffToken) {
        try {
          const user = await getStaffProfile();
          await SecureStore.setItemAsync(CACHED_STAFF_KEY, JSON.stringify(user));
          set({ auth: { status: "staff", user } });
          return;
        } catch {
          // API failed — try cached staff
          const cached = await SecureStore.getItemAsync(CACHED_STAFF_KEY);
          if (cached) {
            try {
              const user: StaffUser = JSON.parse(cached);
              set({ auth: { status: "staff", user } });
              return;
            } catch {
              // ignore
            }
          }
          await SecureStore.deleteItemAsync(STAFF_TOKEN_KEY);
          await SecureStore.deleteItemAsync(CACHED_STAFF_KEY);
        }
      }

      set({ auth: { status: "unauthenticated" } });
    } catch {
      set({ auth: { status: "unauthenticated" } });
    }
  },

  loginAsCustomer: async (email: string, password: string) => {
    const result = await loginCustomer(email, password);
    const customer = result.customer;
    // Cache customer data
    await SecureStore.setItemAsync(CACHED_CUSTOMER_KEY, JSON.stringify(customer));
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
      await SecureStore.setItemAsync(CACHED_STAFF_KEY, JSON.stringify(result.user));
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
    // Clear all cached data
    await SecureStore.deleteItemAsync(CUSTOMER_TOKEN_KEY);
    await SecureStore.deleteItemAsync(STAFF_TOKEN_KEY);
    await SecureStore.deleteItemAsync(CACHED_CUSTOMER_KEY);
    await SecureStore.deleteItemAsync(CACHED_STAFF_KEY);
    set({ auth: { status: "unauthenticated" } });
  },

  refreshCustomer: async () => {
    try {
      const customer = await getCustomerProfile();
      await SecureStore.setItemAsync(CACHED_CUSTOMER_KEY, JSON.stringify(customer));
      if (customer.status === "APPROVED") {
        set({ auth: { status: "customer", customer } });
      }
    } catch {
      // ignore
    }
  },
}));
