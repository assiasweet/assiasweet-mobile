import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartItem, Product } from "@/lib/types";

const CART_STORAGE_KEY = "assiasweet_cart";

interface CartStore {
  items: CartItem[];
  isLoaded: boolean;
  loadCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotalHT: () => number;
  getTotalTVA: () => number;
  getTotalTTC: () => number;
  reorderItems: (items: CartItem[]) => void;
}

async function persistCart(items: CartItem[]) {
  try {
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isLoaded: false,

  loadCart: async () => {
    try {
      const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const items = JSON.parse(raw) as CartItem[];
        set({ items, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  addItem: (product: Product, quantity = 1) => {
    const { items } = get();
    const existing = items.find((i) => i.productId === product.id);
    let newItems: CartItem[];

    if (existing) {
      newItems = items.map((i) =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + quantity }
          : i
      );
    } else {
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0],
        quantity,
        unitPriceHT: product.price,
        tvaRate: product.tva,
        brand: product.brand?.name,
        sku: product.sku,
      };
      newItems = [...items, newItem];
    }

    set({ items: newItems });
    persistCart(newItems);
  },

  removeItem: (productId: string) => {
    const newItems = get().items.filter((i) => i.productId !== productId);
    set({ items: newItems });
    persistCart(newItems);
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const newItems = get().items.map((i) =>
      i.productId === productId ? { ...i, quantity } : i
    );
    set({ items: newItems });
    persistCart(newItems);
  },

  clearCart: () => {
    set({ items: [] });
    AsyncStorage.removeItem(CART_STORAGE_KEY);
  },

  getItemCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },

  getSubtotalHT: () => {
    return get().items.reduce(
      (sum, i) => sum + i.unitPriceHT * i.quantity,
      0
    );
  },

  getTotalTVA: () => {
    return get().items.reduce(
      (sum, i) => sum + i.unitPriceHT * i.quantity * (i.tvaRate / 100),
      0
    );
  },

  getTotalTTC: () => {
    const { getSubtotalHT, getTotalTVA } = get();
    return getSubtotalHT() + getTotalTVA();
  },

  reorderItems: (items: CartItem[]) => {
    set({ items });
    persistCart(items);
  },
}));
