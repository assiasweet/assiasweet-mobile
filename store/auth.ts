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
  getStaffCookie,
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

export const useAuthStore = create<AuthStore>((set, get) => ({
  auth: { status: "idle" },

  initialize: async () => {
    set({ auth: { status: "loading" } });
    try {
      // Try customer token first
      const customerToken = await getCustomerToken();
      if (customerToken) {
        try {
          const customer = await getCustomerProfile();
          if (customer.status === "PENDING") {
            set({ auth: { status: "pending", customer } });
          } else if (customer.status === "APPROVED") {
            set({ auth: { status: "customer", customer } });
          } else {
            set({ auth: { status: "unauthenticated" } });
          }
          return;
        } catch {
          // Token invalid, clear it
          await SecureStore.deleteItemAsync("customer_token");
        }
      }

      // Try staff cookie
      const staffCookie = await getStaffCookie();
      if (staffCookie) {
        try {
          const user = await getStaffProfile();
          set({ auth: { status: "staff", user } });
          return;
        } catch {
          await SecureStore.deleteItemAsync("staff_cookie");
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
      set({ auth: { status: "staff", user: result.user } });
    } else {
      throw new Error("Identifiants incorrects");
    }
  },

  logout: async () => {
    const { auth } = get();
    if (auth.status === "customer" || auth.status === "pending") {
      await logoutCustomer();
    } else if (auth.status === "staff") {
      await logoutStaff();
    }
    set({ auth: { status: "unauthenticated" } });
  },

  refreshCustomer: async () => {
    try {
      const customer = await getCustomerProfile();
      if (customer.status === "APPROVED") {
        set({ auth: { status: "customer", customer } });
      }
    } catch {
      // ignore
    }
  },
}));
