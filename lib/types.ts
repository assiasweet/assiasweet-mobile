// ============================================================
// Types partagés AssiaSweet Mobile
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
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
  permissions?: string[];
  isActive: boolean;
}

export type AuthUser =
  | { type: "customer"; data: Customer }
  | { type: "staff"; data: StaffUser };

// --- Products ---
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  sortOrder?: number;
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  tva: number;
  stock: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  isHalal: boolean;
  isVegan: boolean;
  isSugarFree: boolean;
  isNew: boolean;
  isPromo: boolean;
  images: string[];
  category?: Category;
  brand?: Brand;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  vendor?: string;
  trackStock: boolean;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
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
export interface ShippingOption {
  method: string;
  label: string;
  price: number;
  delay: string;
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
export interface DashboardKPIs {
  revenueToday: number;
  ordersToday: number;
  pendingOrders: number;
  preparingOrders: number;
  lowStockCount: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

// --- Settings ---
export interface SiteSettings {
  logoUrl?: string;
  siteName?: string;
  [key: string]: unknown;
}
