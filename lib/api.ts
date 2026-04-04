import * as SecureStore from "expo-secure-store";
import type {
  ProductsResponse,
  Product,
  ProductFilters,
  Category,
  Slider,
  Customer,
  StaffUser,
  Order,
  OrdersResponse,
  Address,
  Invoice,
  ShippingResponse,
  CheckoutOrderBody,
  Notification,
  DashboardKPIs,
  SiteSettings,
} from "./types";

// ============================================================
// Configuration
// ============================================================
const BASE_URL = "https://assiasweet.vercel.app/api";

const CUSTOMER_TOKEN_KEY = "customer_token";
const STAFF_TOKEN_KEY = "staff_token";
const STAFF_COOKIE_KEY = "staff_cookie";

// ============================================================
// Token helpers — Customer
// ============================================================
export async function getCustomerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CUSTOMER_TOKEN_KEY);
}

export async function setCustomerToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(CUSTOMER_TOKEN_KEY, token);
}

export async function removeCustomerToken(): Promise<void> {
  await SecureStore.deleteItemAsync(CUSTOMER_TOKEN_KEY);
}

// ============================================================
// Token helpers — Staff
// ============================================================
export async function getStaffCookie(): Promise<string | null> {
  return SecureStore.getItemAsync(STAFF_COOKIE_KEY);
}

export async function setStaffCookie(cookie: string): Promise<void> {
  await SecureStore.setItemAsync(STAFF_COOKIE_KEY, cookie);
}

export async function removeStaffCookie(): Promise<void> {
  await SecureStore.deleteItemAsync(STAFF_COOKIE_KEY);
}

export async function getStaffToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(STAFF_TOKEN_KEY);
  if (token) return token;
  return SecureStore.getItemAsync(STAFF_COOKIE_KEY);
}

export async function setStaffToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(STAFF_TOKEN_KEY, token);
}

export async function removeStaffToken(): Promise<void> {
  await SecureStore.deleteItemAsync(STAFF_TOKEN_KEY);
  await SecureStore.deleteItemAsync(STAFF_COOKIE_KEY);
}

// ============================================================
// HTTP client
// ============================================================
async function request<T>(
  path: string,
  options: RequestInit = {},
  authType?: "customer" | "staff"
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authType === "customer") {
    const token = await getCustomerToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } else if (authType === "staff") {
    // Try JWT token first, then cookie
    const staffToken = await SecureStore.getItemAsync(STAFF_TOKEN_KEY);
    if (staffToken) {
      headers["Authorization"] = `Bearer ${staffToken}`;
    } else {
      const cookie = await getStaffCookie();
      if (cookie) {
        headers["Cookie"] = cookie;
      }
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// ============================================================
// Auth — Client B2B
// ============================================================
export async function loginCustomer(
  email: string,
  password: string
): Promise<{ success: boolean; customer: Customer; token?: string }> {
  const data = await request<{
    success: boolean;
    customer: Customer;
    token?: string;
  }>("/auth/customer-login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (data.token) {
    await setCustomerToken(data.token);
  }

  return data;
}

export async function registerCustomer(payload: {
  email: string;
  password: string;
  companyName: string;
  siret: string;
  phone: string;
  firstName: string;
  lastName: string;
  activityType?: string;
  billingAddress?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
}): Promise<{ success: boolean; message?: string }> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutCustomer(): Promise<void> {
  try {
    await request("/auth/customer-logout", { method: "POST" }, "customer");
  } catch {
    // ignore
  }
  await removeCustomerToken();
}

export async function getCustomerProfile(): Promise<Customer> {
  return request<Customer>("/auth/customer-profile", {}, "customer");
}

export async function updateCustomerProfile(data: Partial<Customer>): Promise<Customer> {
  return request<Customer>("/auth/customer-profile", {
    method: "PUT",
    body: JSON.stringify(data),
  }, "customer");
}

export async function resetPassword(payload: {
  email?: string;
  token?: string;
  password?: string;
}): Promise<{ success: boolean; message?: string }> {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ============================================================
// Auth - Staff
// ============================================================
export async function loginStaff(
  email: string,
  password: string
): Promise<{ user: StaffUser; token?: string }> {
  // Utiliser l'endpoint JWT dédié /api/auth/staff-login
  const data = await request<{ user: StaffUser; token: string; success: boolean }>(
    "/staff/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
  if (!data.success || !data.user) {
    throw new Error("Identifiants incorrects ou accès refusé");
  }
  if (data.token) {
    await setStaffToken(data.token);
  }
  return { user: data.user, token: data.token };
}

export async function getStaffProfile(): Promise<StaffUser> {
  return request<StaffUser>("/admin/me", {}, "staff");
}

export async function logoutStaff(): Promise<void> {
  try {
    await request("/auth/signout", { method: "POST" }, "staff");
  } catch {
    // ignore
  }
  await removeStaffToken();
  await removeStaffCookie();
}

// ============================================================
// Catalogue
// ============================================================
export async function getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.halal) params.set("halal", "true");
  if (filters.vegan) params.set("vegan", "true");
  if (filters.sugarFree) params.set("sugarFree", "true");
  if (filters.new) params.set("new", "true");
  if (filters.promo) params.set("promo", "true");
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.sort) params.set("sort", filters.sort);

  const query = params.toString();
  // Route correcte : /api/produits (pas /api/products)
  return request<ProductsResponse>(`/produits${query ? `?${query}` : ""}`);
}

export async function getProduct(idOrSlug: string): Promise<Product> {
  // Route : /api/produits/{slug} — retourne { product: {...} }
  const data = await request<{ product: Product } | Product>(`/produits/${idOrSlug}`);
  // L'API retourne { product: {...} } — on dépaquette si nécessaire
  if (data && typeof data === 'object' && 'product' in data && data.product) {
    return (data as { product: Product }).product;
  }
  return data as Product;
}

export async function getCategories(): Promise<{ categories: Category[] }> {
  // L'API retourne { categories: [...] }
  return request<{ categories: Category[] }>("/categories");
}

export async function searchProducts(q: string): Promise<Product[]> {
  return request<Product[]>(`/search?q=${encodeURIComponent(q)}`);
}

export async function getSliders(): Promise<{ sliders: Slider[] }> {
  // L'API retourne { sliders: [...], source: '...' }
  return request<{ sliders: Slider[] }>("/sliders/generate");
}

export async function getSettings(): Promise<SiteSettings> {
  return request<SiteSettings>("/settings");
}

export async function registerPushToken(
  token: string,
  userType: "customer" | "staff" = "customer"
): Promise<void> {
  const authType = userType === "staff" ? "staff" : "customer";
  await request("/push-token", {
    method: "POST",
    body: JSON.stringify({ token, platform: "expo" }),
  }, authType);
}

// ============================================================
// Panier / Checkout
// ============================================================
export async function calculateShipping(payload: {
  cartTotal: number;
  country: string;
  postalCode: string;
}): Promise<ShippingResponse> {
  return request<ShippingResponse>("/checkout/shipping", {
    method: "POST",
    body: JSON.stringify(payload),
  }, "customer");
}

export async function createOrder(payload: CheckoutOrderBody): Promise<Order> {
  return request<Order>("/checkout/order", {
    method: "POST",
    body: JSON.stringify(payload),
  }, "customer");
}

// ============================================================
// Commandes client
// ============================================================
export async function getCustomerOrders(): Promise<Order[]> {
  return request<Order[]>("/auth/customer-orders", {}, "customer");
}

export async function getOrder(id: string): Promise<Order> {
  return request<Order>(`/auth/customer-orders/${id}`, {}, "customer");
}

// ============================================================
// Adresses client
// ============================================================
export async function getAddresses(): Promise<Address[]> {
  return request<Address[]>("/compte/adresses", {}, "customer");
}

export async function createAddress(data: Omit<Address, "id" | "customerId">): Promise<Address> {
  return request<Address>("/compte/adresses", {
    method: "POST",
    body: JSON.stringify(data),
  }, "customer");
}

export async function updateAddress(id: string, data: Partial<Address>): Promise<Address> {
  return request<Address>(`/compte/adresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, "customer");
}

export async function deleteAddress(id: string): Promise<void> {
  await request(`/compte/adresses/${id}`, { method: "DELETE" }, "customer");
}

// ============================================================
// Factures client
// ============================================================
export async function getInvoices(): Promise<Invoice[]> {
  return request<Invoice[]>("/compte/factures", {}, "customer");
}

export async function downloadInvoice(orderId: string): Promise<void> {
  const token = await getCustomerToken();
  const url = `${BASE_URL}/compte/factures/${orderId}/pdf`;
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) throw new Error("Impossible de télécharger la facture");
  const { Linking } = await import("react-native");
  await Linking.openURL(url);
}

// ============================================================
// Admin — Dashboard
// ============================================================
export async function getDashboard(): Promise<DashboardKPIs> {
  return request<DashboardKPIs>("/dashboard", {}, "staff");
}

// ============================================================
// Admin — Commandes
// ============================================================
export async function getAdminOrders(filters?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<OrdersResponse> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return request<OrdersResponse>(`/admin/commandes${query ? `?${query}` : ""}`, {}, "staff");
}

export async function getAdminOrder(id: string): Promise<Order> {
  return request<Order>(`/admin/commandes/${id}`, {}, "staff");
}

export async function updateOrderStatus(
  id: string,
  status: string,
  trackingNumber?: string
): Promise<Order> {
  return request<Order>(`/admin/commandes/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status, trackingNumber }),
  }, "staff");
}

// ============================================================
// Admin — Produits
// ============================================================
export async function getAdminProducts(filters?: {
  search?: string;
  page?: number;
}): Promise<ProductsResponse> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.page) params.set("page", String(filters.page));
  const query = params.toString();
  return request<ProductsResponse>(`/admin/produits${query ? `?${query}` : ""}`, {}, "staff");
}

export async function updateProductStock(
  id: string,
  stock: number
): Promise<Product> {
  return request<Product>(`/admin/produits/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ stock }),
  }, "staff");
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const result = await request<ProductsResponse>(
      `/admin/produits?search=${encodeURIComponent(barcode)}&limit=1`,
      {},
      "staff"
    );
    return result.products?.[0] ?? null;
  } catch {
    return null;
  }
}

// ============================================================
// Admin — Clients
// ============================================================
export async function getAdminClients(filters?: {
  search?: string;
  status?: string;
  page?: number;
}): Promise<{ clients: Customer[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.page) params.set("page", String(filters.page));
  const query = params.toString();
  return request<{ clients: Customer[]; total: number }>(
    `/admin/clients${query ? `?${query}` : ""}`,
    {},
    "staff"
  );
}

export async function getAdminClient(id: string): Promise<Customer> {
  return request<Customer>(`/admin/clients/${id}`, {}, "staff");
}

export async function confirmCustomer(customerId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>("/admin/confirm-customer", {
    method: "POST",
    body: JSON.stringify({ customerId }),
  }, "staff");
}

// ============================================================
// Admin — Notifications
// ============================================================
export async function getAdminNotifications(): Promise<Notification[]> {
  return request<Notification[]>("/admin/notifications", {}, "staff");
}

export async function markNotificationRead(id: string): Promise<void> {
  await request(`/admin/notifications/${id}`, {
    method: "PUT",
    body: JSON.stringify({ isRead: true }),
  }, "staff");
}

// ============================================================
// Admin — Inventaire
// ============================================================
export async function getInventory(): Promise<Product[]> {
  return request<Product[]>("/inventory", {}, "staff");
}

export async function updateInventory(
  productId: string,
  stock: number
): Promise<Product> {
  return request<Product>("/inventory", {
    method: "PUT",
    body: JSON.stringify({ productId, stock }),
  }, "staff");
}
