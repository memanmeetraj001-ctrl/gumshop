
export interface Tenant {
  id: string;
  slug: string;
  storeName: string;
  tagline?: string;
  ownerEmail: string;
  ownerName: string;
  plan: 'free' | 'pro' | 'scale' | 'starter';
  productLimit: number;
  gumroadStoreUrl?: string;
  gumroadAccessToken?: string;
  primaryColor?: string;
  logoUrl?: string;
  currency: string;
  lsSubscriptionId?: string;
  lsCustomerId?: string;
  lsVariantId?: string;
  billingCycle?: 'monthly' | 'annual';
  planExpiresAt?: string;
  subscriptionStatus?: 'active' | 'cancelled' | 'expired' | 'paused' | 'past_due';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface User {
  tenantId?: string;
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'superadmin' | 'editor' | 'marketing' | 'viewer';
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Specification {
  key: string;
  value: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ProductOption {
  name: string;
  values: string[];
  isColor?: boolean;
  colorHexes?: Record<string, string>;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  options: Record<string, string>;
  stock?: number;
  gumroadUrl?: string;
}

export interface ProductReview {
  id: string;
  name: string;
  rating: number;
  title?: string;
  review: string;
  verified: boolean;
  createdAt: string;
  photos?: string[];
}

export interface Product {
  tenantId?: string;
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  sku: string;
  categoryId: string;
  collectionIds: string[];
  tags: string[];
  status: 'published' | 'draft';
  featured: boolean;
  bestseller: boolean;
  newProduct: boolean;
  sale: boolean;
  images: string[];
  thumbnail: string;
  video?: string;
  specifications: Specification[];
  faq: FaqItem[];
  options?: ProductOption[];
  variants?: ProductVariant[];
  reviews?: ProductReview[];
  averageRating?: number;
  reviewCount?: number;
  stock?: number;
  gumroadUrl?: string;
  primaryCheckout: 'gumroad' | 'cart';
  directCheckout: boolean;
  buttonText: string;
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  tenantId?: string;
  id: string;
  slug: string;
  name: string;
  description: string;
  image?: string;
  icon?: string;
  sortOrder: number;
  status: 'active' | 'inactive';
}

export interface Collection {
  tenantId?: string;
  id: string;
  slug: string;
  title: string;
  description: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  productIds: string[];
  sortOrder: number;
  status: 'published' | 'draft';
}

export interface Bundle {
  tenantId?: string;
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  productIds: string[];
  price: number;
  compareAtPrice: number;
  currency?: string;
  badge?: string;
  ctaText: string;
  gumroadUrl?: string;
  status: 'published' | 'draft';
  sortOrder: number;
}

export interface HomepageSection {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  content?: string;
  image?: string;
  secondaryImage?: string;
  videoUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  enabled: boolean;
  sortOrder: number;
  settingsJson?: Record<string, any>;
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  parentId?: string | null;
  openNewTab: boolean;
  visible: boolean;
  sortOrder: number;
  badge?: string;
}

export interface FooterLink {
  id: string;
  label: string;
  url: string;
  openNewTab?: boolean;
}

export interface FooterColumn {
  id: string;
  title: string;
  sortOrder: number;
  links: FooterLink[];
}

export interface SocialLinks {
  instagram?: string;
  youtube?: string;
  facebook?: string;
  tiktok?: string;
  x?: string;
  discord?: string;
}

export interface ThemeSettings {
  brandName: string;
  tagline: string;
  logoUrl: string;
  logoDarkUrl?: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  buttonColor: string;
  buttonTextColor: string;
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
  bodyWeight: string;
  maxWidth: string;
  borderRadius: string;
  cardRadius: string;
  buttonRadius: string;
  sectionSpacing: string;
  gridGap: string;
  stickyHeader: boolean;
  transparentHeader: boolean;
  logoPosition: 'left' | 'center';
  navigationPosition: 'left' | 'center' | 'right';
  announcementEnabled: boolean;
  announcementText: string;
  announcementLink?: string;
  announcementBg: string;
  announcementColor: string;
  footerColumnsCount: number;
  footerBg: string;
  footerTextColor: string;
  copyrightText: string;
  socialLinks: SocialLinks;
}

export interface PaymentIntegration {
  id: string;
  provider: 'gumroad' | 'external';
  label: string;
  enabled: boolean;
  storeUrl?: string;
  defaultProductUrl?: string;
  buttonText: string;
  checkoutMode: 'direct' | 'overlay' | 'new_tab';
  openNewTab: boolean;
  widgetPosition?: 'bottom-right' | 'bottom-left' | 'inline';
  settingsJson?: Record<string, any>;
}

export interface Promotion {
  id: string;
  type: 'announcement' | 'sale_badge' | 'banner' | 'countdown' | 'popup' | 'exit_intent' | 'discount_code';
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
  startDate?: string;
  endDate?: string;
  enabled: boolean;
  discountCode?: string;
  discountType?: 'percentage' | 'fixed_amount' | 'free_shipping';
  discountValue?: number;
  minSpend?: number;
  settingsJson?: Record<string, any>;
}

export interface Testimonial {
  id: string;
  name: string;
  title?: string;
  avatar?: string;
  rating: number;
  review: string;
  productName?: string;
  productId?: string;
  verified: boolean;
  published: boolean;
  sortOrder: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: string;
  authorAvatar?: string;
  categories: string[];
  tags: string[];
  readTime: string;
  status: 'published' | 'draft';
  publishedAt: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video' | 'document';
  size: number;
  folder: string;
  altText?: string;
  caption?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AnalyticsEvent {
  id: string;
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_click' | 'gumroad_click' | 'newsletter_signup' | 'search';
  provider?: string;
  productId?: string;
  productTitle?: string;
  url?: string;
  referrer?: string;
  ipHash?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface SiteSettings {
  currency: string;
  currencySymbol: string;
  maintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  newsletterProvider: 'mailchimp' | 'convertkit' | 'resend' | 'custom';
  newsletterHeadline: string;
  newsletterDescription: string;
  newsletterSuccessMsg: string;
  contactEmail: string;
  supportPhone?: string;
  address?: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  twitterCard: string;
  canonicalUrl: string;
  googleAnalyticsId?: string;
  metaPixelId?: string;
}

export interface AdminActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  timestamp: string;
}

export interface ShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  thumbnail: string;
  sku?: string;
  selectedOptions?: Record<string, string>;
}

export interface Order {
  tenantId?: string;
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  totalAmount: number;
  subtotalAmount?: number;
  discountAmount?: number;
  discountCode?: string;
  currency: string;
  status: 'pending_payment' | 'completed' | 'fulfilled' | 'cancelled';
  gumroadRedirectUrl?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  recoveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
