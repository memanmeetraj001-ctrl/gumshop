import {
  Product,
  Category,
  Collection,
  Bundle,
  HomepageSection,
  NavigationItem,
  FooterColumn,
  ThemeSettings,
  PaymentIntegration,
  Promotion,
  Testimonial,
  Tenant,
  Order,
  BlogPost,
  SiteSettings,
  User,
  MediaItem,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('gumshop_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Storefront Public Endpoints
  getProducts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Product[]>(`/products${qs}`);
  },
  getProductBySlug: (slug: string) => request<Product>(`/products/${slug}`),
  getCategories: () => request<Category[]>('/categories'),
  getCollections: () => request<Collection[]>('/collections'),
  getCollectionBySlug: (slug: string) => request<{ collection: Collection; products: Product[] }>(`/collections/${slug}`),
  getBundles: () => request<Bundle[]>('/bundles'),
  getBundleBySlug: (slug: string) => request<{ bundle: Bundle; products: Product[] }>(`/bundles/${slug}`),
  getHomepageSections: () => request<HomepageSection[]>('/homepage'),
  getNavigation: () => request<NavigationItem[]>('/navigation'),
  getFooter: () => request<FooterColumn[]>('/footer'),
  getTheme: () => request<ThemeSettings>('/appearance'),
  getPayments: () => request<PaymentIntegration[]>('/payments'),
  getPromotions: () => request<Promotion[]>('/promotions'),
  getTestimonials: () => request<Testimonial[]>('/testimonials'),
  getBlogPosts: () => request<BlogPost[]>('/blog'),
  getBlogPostBySlug: (slug: string) => request<BlogPost>(`/blog/${slug}`),
  getSettings: () => request<SiteSettings>('/settings'),
  subscribeNewsletter: (email: string) => request<{ success: boolean; message: string }>('/settings/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  trackEvent: (data: {
    eventType: string;
    provider?: string;
    productId?: string;
    productTitle?: string;
    metadata?: Record<string, any>;
  }) => request<{ success: boolean; eventId: string }>('/analytics/track', {
    method: 'POST',
    body: JSON.stringify({ ...data, url: window.location.href, referrer: document.referrer }),
  }),

  // Admin Product CRUD
  createProduct: (data: Partial<Product>) => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Product>) => request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),

  // Category CRUD
  createCategory: (data: Partial<Category>) => request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Partial<Category>) => request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' }),

  // Collection CRUD
  createCollection: (data: Partial<Collection>) => request<Collection>('/collections', { method: 'POST', body: JSON.stringify(data) }),
  updateCollection: (id: string, data: Partial<Collection>) => request<Collection>(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCollection: (id: string) => request<{ success: boolean }>(`/collections/${id}`, { method: 'DELETE' }),

  // Bundle CRUD
  createBundle: (data: Partial<Bundle>) => request<Bundle>('/bundles', { method: 'POST', body: JSON.stringify(data) }),
  updateBundle: (id: string, data: Partial<Bundle>) => request<Bundle>(`/bundles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBundle: (id: string) => request<{ success: boolean }>(`/bundles/${id}`, { method: 'DELETE' }),

  // Homepage Section CRUD & Reorder
  reorderHomepageSections: (sectionIds: string[]) => request<HomepageSection[]>('/homepage/reorder', { method: 'POST', body: JSON.stringify({ sectionIds }) }),
  createHomepageSection: (data: Partial<HomepageSection>) => request<HomepageSection>('/homepage', { method: 'POST', body: JSON.stringify(data) }),
  updateHomepageSection: (id: string, data: Partial<HomepageSection>) => request<HomepageSection>(`/homepage/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHomepageSection: (id: string) => request<{ success: boolean }>(`/homepage/${id}`, { method: 'DELETE' }),

  // Navigation CRUD
  createNavItem: (data: Partial<NavigationItem>) => request<NavigationItem>('/navigation', { method: 'POST', body: JSON.stringify(data) }),
  updateNavItem: (id: string, data: Partial<NavigationItem>) => request<NavigationItem>(`/navigation/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNavItem: (id: string) => request<{ success: boolean }>(`/navigation/${id}`, { method: 'DELETE' }),

  // Footer CRUD
  updateFooter: (columns: FooterColumn[]) => request<FooterColumn[]>('/footer', { method: 'PUT', body: JSON.stringify({ columns }) }),

  // Appearance & Theme
  updateTheme: (data: Partial<ThemeSettings>) => request<ThemeSettings>('/appearance', { method: 'PUT', body: JSON.stringify(data) }),

  // Payments
  updatePayment: (id: string, data: Partial<PaymentIntegration>) => request<PaymentIntegration>(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Promotions
  createPromotion: (data: Partial<Promotion>) => request<Promotion>('/promotions', { method: 'POST', body: JSON.stringify(data) }),
  updatePromotion: (id: string, data: Partial<Promotion>) => request<Promotion>(`/promotions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePromotion: (id: string) => request<{ success: boolean }>(`/promotions/${id}`, { method: 'DELETE' }),

  // Testimonials
  createTestimonial: (data: Partial<Testimonial>) => request<Testimonial>('/testimonials', { method: 'POST', body: JSON.stringify(data) }),
  updateTestimonial: (id: string, data: Partial<Testimonial>) => request<Testimonial>(`/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTestimonial: (id: string) => request<{ success: boolean }>(`/testimonials/${id}`, { method: 'DELETE' }),

  // Blog
  createBlogPost: (data: Partial<BlogPost>) => request<BlogPost>('/blog', { method: 'POST', body: JSON.stringify(data) }),
  updateBlogPost: (id: string, data: Partial<BlogPost>) => request<BlogPost>(`/blog/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBlogPost: (id: string) => request<{ success: boolean }>(`/blog/${id}`, { method: 'DELETE' }),

  // Media
  getMedia: () => request<MediaItem[]>('/media'),
  uploadMedia: (data: Partial<MediaItem>) => request<MediaItem>('/media', { method: 'POST', body: JSON.stringify(data) }),
  deleteMedia: (id: string) => request<{ success: boolean }>(`/media/${id}`, { method: 'DELETE' }),

  // Settings
  updateSettings: (data: Partial<SiteSettings>) => request<SiteSettings>('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Orders & Shipping Leads
  createOrder: (data: any) => request<{ success: boolean; order: Order; redirectUrl: string }>('/orders/create', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Order[]>(`/orders${qs}`);
  },
  getOrderById: (id: string) => request<Order>(`/orders/${id}`),
  updateOrderStatus: (id: string, data: Partial<Order>) => request<Order>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteOrder: (id: string) => request<{ success: boolean }>(`/orders/${id}`, { method: 'DELETE' }),

  // Gumroad API Sync Engine
  testGumroadToken: (accessToken: string) => request<{ success: boolean; user?: any; error?: string }>('/payments/gumroad/test', { method: 'POST', body: JSON.stringify({ accessToken }) }),
  syncGumroadCatalog: (accessToken: string, storeUrl?: string) => request<{ success: boolean; totalProducts: number; syncedCount: number; results: any[] }>('/payments/gumroad/sync', { method: 'POST', body: JSON.stringify({ accessToken, storeUrl }) }),

  // SaaS Billing & Plan (Gumroad Subscriptions)
  getBillingPlan: () => request<{
    plan: 'free' | 'pro' | 'scale';
    productLimit: number;
    storeName: string;
    subscriptionStatus?: string;
    billingCycle?: 'monthly' | 'annual';
    planExpiresAt?: string;
    lsSubscriptionId?: string;
  }>('/billing/plan'),
  getCheckoutUrl: (plan: 'pro' | 'scale', cycle: 'monthly' | 'annual') => request<{ checkoutUrl: string }>('/billing/checkout-url', {
    method: 'POST',
    body: JSON.stringify({ plan, cycle }),
  }),
  getSubscription: () => request<{
    plan: 'free' | 'pro' | 'scale';
    productLimit: number;
    lsSubscriptionId?: string;
    subscriptionStatus?: string;
    billingCycle?: 'monthly' | 'annual';
    planExpiresAt?: string;
  }>('/billing/subscription'),
  cancelSubscription: () => request<{ success: boolean; message: string }>('/billing/cancel', {
    method: 'POST',
  }),
  claimLicense: (email: string, licenseKey: string) => request<{ success: boolean; message: string; plan: string; limit: number }>('/billing/claim', { method: 'POST', body: JSON.stringify({ email, licenseKey }) }),

  // Auth & Analytics & Utility
  login: (data: { email: string; password: string }) => request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) => request<{ success: boolean; message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<{ user: User }>('/auth/me'),
  getAnalyticsSummary: () => request<any>('/analytics/summary'),
  duplicateProduct: (id: string) => request<Product>(`/products/${id}/duplicate`, { method: 'POST' }),

  // SaaS Auth & Stores
  register: (data: { storeName: string; email: string; password: string; ownerName?: string }) => request<{ token: string; user: User; tenant: Tenant }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getStoreBySlug: (slug: string) => request<{ store: Tenant; productsCount: number; categories: Category[]; bundles: Bundle[]; theme: ThemeSettings; siteSettings: SiteSettings }>(`/stores/${slug}`),
  getStoreProducts: (slug: string) => request<Product[]>(`/stores/${slug}/products`),
  getSuperAdminStats: () => request<{ totalStores: number; totalProducts: number; totalOrders: number; stores: any[] }>('/stores/super/all'),

  // Product Importer & Scraper
  detectPlatform: (url: string) => request<{ platform: 'shopify' | 'woocommerce' | 'html'; detected: boolean; message: string; baseUrl: string }>('/scraper/detect', { method: 'POST', body: JSON.stringify({ url }) }),
  scrapeShopify: (url: string, limit = 50) => request<{ success: boolean; count: number; platform: string; products: any[] }>('/scraper/shopify', { method: 'POST', body: JSON.stringify({ url, limit }) }),
  scrapeWooCommerce: (url: string, consumerKey?: string, consumerSecret?: string, limit = 50) => request<{ success: boolean; count: number; platform: string; products: any[] }>('/scraper/woocommerce', { method: 'POST', body: JSON.stringify({ url, consumerKey, consumerSecret, limit }) }),
  scrapeHtml: (url: string) => request<{ success: boolean; count: number; platform: string; products: any[] }>('/scraper/html', { method: 'POST', body: JSON.stringify({ url }) }),
  importScrapedProducts: (data: { products: any[]; categoryId?: string; discountPercent?: number; status?: 'published' | 'draft' }) => request<{ success: boolean; importedCount: number; skippedCount: number; limit: number; totalNow: number; products: Product[] }>('/scraper/import', { method: 'POST', body: JSON.stringify(data) }),

  // Shopify-Grade Features: Discounts, Tracking, Reviews, Recovery, Fulfillment
  validateDiscount: (code: string, subtotal: number) => request<{ valid: boolean; code: string; title?: string; discountType: string; discountValue: number; discountAmount: number; newTotal: number; message: string }>('/promotions/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),
  trackOrder: (query: string) => request<{ success: boolean; order: any }>(`/orders/track/${encodeURIComponent(query)}`),
  recoverOrderLead: (id: string, recoveryDiscount?: number) => request<{ success: boolean; recoveryLink: string; message: string }>(`/orders/${id}/recover`, { method: 'POST', body: JSON.stringify({ recoveryDiscount }) }),
  fulfillOrder: (id: string, data: { carrier?: string; trackingNumber?: string; trackingUrl?: string; status?: string }) => request<{ success: boolean; order: any }>(`/orders/${id}/fulfillment`, { method: 'PATCH', body: JSON.stringify(data) }),
  submitProductReview: (id: string, data: { name: string; rating: number; title?: string; review: string }) => request<{ success: boolean; review: any; averageRating: number; reviewCount: number }>(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
};
