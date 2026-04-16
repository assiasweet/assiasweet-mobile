// ============================================================
// Types partagés AssiaSweet Mobile
// Structure basée sur l'API réelle de www.assiasweet.pro
// ============================================================

// --- Auth ---
export interface Customer {
  id: string;
  email: string;
  companyName: string;
  firstName: string;
  lastName: string;
  phone?: string;
  siret?: string;
  tvaIntra?: string;
  activityType?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";
  priceList?: string;
  billingAddress?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingCountry?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "COMMERCIAL" | "PREPARATEUR" | "COMPTABLE";
  permissions?: string[];
  isActive: boolean;
}

export type AuthUser =
  | { type: "customer"; data: Customer }
  | { type: "staff"; data: StaffUser };

// --- Products ---
// L'API /api/categories retourne : { id, name, slug, imageUrl, isActive, description }
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string;   // champ réel de l'API
  image?: string;      // alias pour compatibilité
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  isActive: boolean;
}

// L'API /api/produits retourne :
// { id, slug, name, brand (string), category (string slug), description,
//   priceHT, priceTTC, tva, halal, isNew, isFeatured, inStock, discount,
//   images (array vide), image (string URL), stock, minOrder, rating, reviews, variants }
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;

  // Prix — l'API retourne priceHT et priceTTC
  priceHT: number;
  priceTTC?: number;
  price?: number;       // alias pour compatibilité avec données démo
  tva: number;

  // Stock
  stock: number;
  inStock?: boolean;
  minOrder?: number;

  // Identifiants
  sku?: string;
  barcode?: string;
  weight?: number;

  // Flags — l'API retourne halal (pas isHalal), isNew, isFeatured
  halal?: boolean;
  isHalal?: boolean;    // alias pour données démo
  isVegan?: boolean;
  isSugarFree?: boolean;
  isNew?: boolean;
  isPromo?: boolean;
  isFeatured?: boolean;
  discount?: number;

  // Images — l'API retourne image (string) et images (array souvent vide)
  image?: string;       // champ principal de l'API réelle
  images?: string[];    // array (souvent vide dans l'API réelle)

  // Relations — l'API retourne brand et category comme strings (slug/nom)
  category?: Category | string | null;
  brand?: Brand | string | null;

  status?: "ACTIVE" | "INACTIVE" | "DRAFT";
  vendor?: string;
  trackStock?: boolean;
  rating?: number;
  reviews?: number;
}

// Helper pour obtenir l'image principale d'un produit
export function getProductImage(product: Product): string | undefined {
  if (product.image) return product.image;
  if (product.images && product.images.length > 0) return product.images[0];
  return undefined;
}

// Helper pour obtenir le prix HT d'un produit
export function getProductPrice(product: Product): number {
  return product.priceHT ?? product.price ?? 0;
}

// Helper pour obtenir le nom de la marque
export function getProductBrand(product: Product): string | undefined {
  if (!product.brand) return undefined;
  if (typeof product.brand === "string") return product.brand;
  return product.brand.name;
}

// Helper pour obtenir le nom de la catégorie
export function getProductCategory(product: Product): string | undefined {
  if (!product.category) return undefined;
  if (typeof product.category === "string") return product.category;
  return product.category.name;
}

// Helper pour savoir si un produit est halal
export function isProductHalal(product: Product): boolean {
  return product.halal === true || product.isHalal === true;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page?: number;
  totalPages?: number;
}

// --- Filters ---
export interface ProductFilters {
  category?: string;
  brand?: string;
  halal?: boolean;
  vegan?: boolean;
  sugarFree?: boolean;
  new?: boolean;
  promo?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "price_asc" | "price_desc" | "name_asc";
}

// --- Cart ---
export interface CartItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPriceHT: number;
  tvaRate: number;
  brand?: string;
  sku?: string;
}

// --- Orders ---
export type OrderStatus =
  | "EN_ATTENTE"
  | "EN_PREPARATION"
  | "EXPEDIEE"
  | "LIVREE"
  | "ANNULEE";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceHT: number | string;
  tvaRate: number;
  totalHT: number;
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customer?: Customer;
  status: OrderStatus;
  subtotalHT: number;
  shippingHT: number;
  shippingCost: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  shippingMethod: string;
  paymentMethod?: string;
  trackingNumber?: string;
  shippingAddress?: { street: string; postalCode: string; city: string; country?: string } | string;
  billingAddress?: string;
  invoiceId?: string;
  deliveryNoteUrl?: string;
  notes?: string;
  createdAt: string;
  items?: OrderItem[];
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
}

// --- Addresses ---
export interface Address {
  id: string;
  customerId: string;
  type: "shipping" | "billing";
  company?: string;
  firstName: string;
  lastName: string;
  street: string;
  complement?: string;
  city: string;
  postalCode: string;
  country: string;
}

// --- Invoices ---
export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerId: string;
  status: "EN_ATTENTE" | "PAYEE";
  pdfUrl?: string;
  subtotalHT: number;
  totalTVA: number;
  totalTTC: number;
  issuedAt: string;
  dueAt?: string;
  paidAt?: string;
}

// --- Sliders ---
export interface Slider {
  id: string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  image_url: string;
  gradient?: string;
  sort_order: number;
  is_active: boolean;
}

// --- Shipping ---
// L'API /api/checkout/shipping retourne ces champs réels
export interface ShippingOption {
  id: string;                // "standard" | "relais" | "retrait"
  label: string;
  description?: string;
  shippingCostHT: number;
  shippingTVA: number;
  shippingTTC: number;
  isFree: boolean;
  note?: string | null;
  // Champs legacy pour compatibilité
  method?: string;
  price?: number;
  delay?: string;
}

export interface ShippingResponse {
  options: ShippingOption[];
}

// --- Checkout ---
export interface CheckoutOrderBody {
  items: { productId: string; quantity: number }[];
  addressId: string;
  shippingMethod: string;
  paymentMethod?: string;
  notes?: string;
}

// --- PayPal ---
export interface PayPalCreateOrderResponse {
  id: string;          // PayPal order ID (ex: "79E9992057325554X")
  status: string;      // "PAYER_ACTION_REQUIRED" | "CREATED"
  error?: string;
}

export interface PayPalCaptureResponse {
  status: string;      // "COMPLETED" | "DECLINED"
  captureId?: string;
  paypalOrderId: string;
  orderNumber?: string;
  error?: string;
}

// --- Notifications ---
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// --- Dashboard KPIs ---
// Champs réels retournés par /api/dashboard
export interface DashboardKPIs {
  // KPIs du mois
  caMonth: number;
  caGrowth: number;
  ordersMonth: number;
  pendingOrders: number;
  preparingOrders: number;
  avgCart: number;
  newCustomers: number;
  totalCustomers: number;
  outOfStock: number;
  lowStock: number;
  unpaidInvoicesCount: number;
  unpaidInvoicesTotal: number;
  // Données détaillées
  salesEvolution?: { date: string; ca: number; orders: number }[];
  topProducts?: { id: string; name: string; totalQty: number; totalCA: number }[];
  recentOrders: Order[];
  // Aliases pour compatibilité
  revenueToday?: number;
  ordersToday?: number;
  lowStockCount?: number;
  lowStockProducts?: Product[];
}

// --- Settings ---
export interface SiteSettings {
  logoUrl?: string;
  siteName?: string;
  [key: string]: unknown;
}
