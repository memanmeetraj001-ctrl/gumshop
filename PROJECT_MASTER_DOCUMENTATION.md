# GumShop — The Complete Master Project Documentation (All-in-One)

> **Version**: 2.0 / 3.0 Ready  
> **Repository**: `gumshop-v2` / `gumshop-v3`  
> **Architecture**: Next.js 16 (App Router + Turbopack) + React 19 + Tailwind CSS v4 + Supabase PostgreSQL  
> **Core Concept**: Multi-tenant digital creator platform merging **Gumroad** (digital products, dynamic checkout, developer APIs) with **Stan Store** (high-converting link-in-bio, interactive bundle cards, email lead magnets, live proof) and **Single-Product Landers**.

---

## Table of Contents
1. [Executive Overview & Feature Matrix](#1-executive-overview--feature-matrix)
2. [Complete Directory & File Structure](#2-complete-directory--file-structure)
3. [Database Schema & Data Models](#3-database-schema--data-models)
4. [Universal Pricing & Volume Bundle Mathematics](#4-universal-pricing--volume-bundle-mathematics)
5. [Public Storefront Routes & Flow](#5-public-storefront-routes--flow)
6. [Creator Stan Store (Link-in-Bio) Specification](#6-creator-stan-store-link-in-bio-specification)
7. [Cart Drawer, Checkout & Payment Infrastructure](#7-cart-drawer-checkout--payment-infrastructure)
8. [Merchant Dashboard & Fleet Management](#8-merchant-dashboard--fleet-management)
9. [Complete API Route Directory & Specifications](#9-complete-api-route-directory--specifications)
10. [High-Performance & Reliability Rules](#10-high-performance--reliability-rules)
11. [Automated Verification & Test Harness](#11-automated-verification--test-harness)
12. [Environment Setup & Deployment](#12-environment-setup--deployment)

---

## 1. Executive Overview & Feature Matrix

GumShop is an end-to-end e-commerce and creator monetization engine engineered to solve high drop-off rates on mobile creator traffic.

```
                                  ┌─────────────────────────────┐
                                  │      GUMSHOP PLATFORM       │
                                  └──────────────┬──────────────┘
                    ┌────────────────────────────┼───────────────────────────┐
                    ▼                            ▼                           ▼
        ┌───────────────────────┐   ┌────────────────────────┐  ┌────────────────────────┐
        │  STAN STORE LINK-IN-  │   │  SINGLE-PRODUCT HIGH-  │  │  MULTI-STORE FLEET     │
        │  BIO (/creator/[slug])│   │  CONVERSION LANDERS    │  │  DASHBOARD (/dashboard)│
        ├───────────────────────┤   ├────────────────────────┤  ├────────────────────────┤
        │ • Interactive Bundles │   │ • Dynamic Media Gallery│  │ • Multi-store switcher │
        │ • 1-Click Instant Buy │   │ • Volume Pricing Tiers │  │ • Bio layout editor    │
        │ • In-bio Lead Magnet  │   │ • Urgency Stock Badges │  │ • Store Cloner & Impor │
        │ • Auto Review Carousel│   │ • Mobile Sticky Buy Bar│  │ • Real-time Analytics │
        │ • Live Sales Toaster  │   │ • Full Customer Reviews│  │ • Order Tracking       │
        └───────────────────────┘   └────────────────────────┘  └────────────────────────┘
```

### Key Pillars:
1. **Multi-Store Isolation**: Multiple independent storefronts can exist in one deployment (e.g., `puplounge`, `highgeartoys`, `demo`). Editing store A never affects store B.
2. **Designated Homepage Store**: The root path (`/`) dynamically resolves to the user-selected flagship store without redirect penalty.
3. **Authoritative Price Synchronization**: The database price is canonical ($52.99 baseline). All public pages, JSON APIs, cart calculators, and checkout modals stay 100% in sync.
4. **Zero-Lag Front-End**: Scroll events are throttled with `requestAnimationFrame`, images are lazy-loaded with async decoding, and background intervals pause when the browser tab is hidden.

---

## 2. Complete Directory & File Structure

```
gumshop-v2/
├── app/                                # Next.js 16 App Router
│   ├── (public)/                       # Public-facing customer routes
│   │   ├── page.jsx                    # Root Homepage (renders designated store)
│   │   ├── layout.jsx                  # Public shell (Navbar, Footer, Cart, Toaster)
│   │   ├── creator/[username]/page.jsx # Stan Store Link-in-Bio page
│   │   ├── product/[productId]/page.jsx# High-conversion product details page
│   │   ├── shop/[username]/page.jsx    # Storefront catalog view
│   │   ├── cart/page.jsx               # Dedicated full cart page
│   │   ├── orders/page.jsx             # Customer orders history
│   │   ├── track/page.jsx              # Order tracking lookup
│   │   ├── thank-you/page.jsx          # Post-checkout confirmation
│   │   └── policies/                   # Legal: privacy, refund, shipping, terms
│   ├── dashboard/                      # Master Fleet Dashboard
│   │   ├── page.jsx                    # Fleet overview, store manager, cloner
│   │   └── error.jsx                   # Error boundary
│   ├── store/                          # Store-scoped Merchant Dashboard
│   │   ├── page.jsx                    # Store analytics, metrics, quick actions
│   │   ├── bio-editor/page.jsx         # Visual Stan Store link-in-bio designer
│   │   ├── manage-product/page.jsx     # Product inventory & bundle tier editor
│   │   ├── add-product/page.jsx        # Product creation workflow
│   │   ├── edit-product/[id]/page.jsx  # Product modification
│   │   ├── orders/page.jsx             # Store-specific order fulfillment
│   │   ├── settings/page.jsx           # Single-product toggle, Gumroad auth
│   │   ├── import/page.jsx             # Import from Gumroad/Shopify/CSV
│   │   ├── cloner/page.jsx             # 1-click store duplicator
│   │   ├── customers/page.jsx          # Lead magnet email contacts
│   │   └── coupons/page.jsx            # Discount code management
│   ├── api/                            # Server Route Handlers
│   │   ├── gumroad/
│   │   │   ├── dynamic-checkout/route.js # Validates bundle pricing & signs session
│   │   │   ├── connect/route.js        # OAuth token connection
│   │   │   ├── sync/route.js           # Remote catalog synchronization
│   │   │   ├── verify-order/route.js   # Order validation endpoint
│   │   │   └── webhook/route.js        # Asynchronous fulfillment webhook
│   │   ├── store/
│   │   │   ├── data/route.js           # Get/Update scoped store payload
│   │   │   ├── config/route.js         # Store layout & theme settings
│   │   │   ├── duplicate/route.js      # Clone store & products
│   │   │   ├── homepage/route.js       # Designate root homepage store
│   │   │   └── orders/route.js         # Order creation & list
│   │   ├── products/route.js           # Authoritative product catalog
│   │   ├── stores/route.js             # List all active fleet stores
│   │   ├── sync/route.js               # Cross-page cache revalidation
│   │   ├── reset/route.js              # Factory reset to clean baseline
│   │   └── cloner/import/route.js      # Scrape & import external stores
├── components/                         # Modular UI Components
│   ├── CartDrawer.jsx                  # Slide-out cart with bundle math & shipping bar
│   ├── GumroadIframeModal.jsx          # Seamless in-frame payment overlay
│   ├── LiveSalesToaster.jsx            # Social proof purchase popup
│   ├── ProductDetails.jsx              # Product gallery, bundle picker, sticky ATC
│   ├── ProductCard.jsx                 # Catalog product card with quick buy
│   ├── StorefrontNavbar.jsx            # Public navigation bar with cart badge
│   ├── StoreHeroBanner.jsx             # High-conversion hero banner
│   ├── WishlistDrawer.jsx              # Saved items drawer
│   ├── ExitIntentModal.jsx             # Cart abandonment capture popup
│   └── store/                          # Merchant navigation
│       ├── StoreNavbar.jsx             # Scoped dashboard header
│       └── StoreSidebar.jsx            # Scoped dashboard sidebar
├── lib/                                # Core Engine Libraries
│   ├── supabase.js                     # Authoritative Supabase PostgreSQL client
│   ├── serverDb.js                     # In-memory self-healing cache & backup
│   ├── storePresets.js                 # Default starter catalogs & bundle specs
│   ├── activeStore.js                  # Store resolution helper
│   ├── cloner.js                       # Store cloning engine
│   └── imageUtils.js                   # Safe fallback image handler
└── scripts/                            # 20+ Automated Verification Test Suites
    ├── verify_m1_price_sync.js         # Price sync verification ($52.99)
    ├── verify_m2_cart_images.js        # Cart drawer thumbnail verification
    ├── verify_m3_dynamic_checkout.js   # Dynamic checkout mathematical test
    └── comprehensive_test_suite.js     # Full test suite runner
```

---

## 3. Database Schema & Data Models

### 3.1 Tables Overview (PostgreSQL / Supabase)

#### Table: `stores`
Stores the configuration, metadata, branding, and link-in-bio settings for each independent store.
```sql
CREATE TABLE stores (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tagline TEXT,
    bio TEXT,
    logo_url TEXT,
    banner_url TEXT,
    theme_color TEXT DEFAULT '#000000',
    is_homepage BOOLEAN DEFAULT FALSE,
    is_single_product BOOLEAN DEFAULT FALSE,
    hero_product_id TEXT,
    lead_magnet_title TEXT,
    lead_magnet_file TEXT,
    gumroad_username TEXT,
    gumroad_token TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    reviews JSONB DEFAULT '[]'::jsonb,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Table: `products`
The authoritative catalog table holding individual products, pricing, and volume bundle configurations.
```sql
CREATE TABLE products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    title TEXT,
    description TEXT DEFAULT '',
    price NUMERIC(10, 2) NOT NULL,
    compare_at_price NUMERIC(10, 2),
    currency TEXT DEFAULT 'USD',
    image TEXT,
    images TEXT[] DEFAULT '{}',
    stock INTEGER DEFAULT 999,
    bundle_tiers JSONB DEFAULT '[]'::jsonb,
    features TEXT[] DEFAULT '{}',
    gumroad_id TEXT,
    gumroad_url TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, slug)
);
```

#### Table: `orders`
Holds completed and pending customer orders with snapshot pricing.
```sql
CREATE TABLE orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    subtotal NUMERIC(10, 2) NOT NULL,
    shipping_fee NUMERIC(10, 2) DEFAULT 0.00,
    discount NUMERIC(10, 2) DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL,
    items JSONB NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    payment_rail TEXT DEFAULT 'gumroad',
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. Universal Pricing & Volume Bundle Mathematics

To prevent customer confusion, cart drop-off, and payment gateway rejections, GumShop enforces a strict **Universal Pricing Contract**:

```
                         UNIVERSAL BUNDLE PRICING MODEL
┌─────────────────┬──────────┬─────────────┬──────────────┬───────────────────┐
│ Bundle Tier     │ Quantity │ Total Price │ Unit Price   │ Discount Offered  │
├─────────────────┼──────────┼─────────────┼──────────────┼───────────────────┤
│ 1-Pack (Single) │    1     │   $52.99    │    $52.99    │ Retail Price      │
│ 2-Pack (Duo)    │    2     │   $74.62    │    $37.31    │ ~30% OFF per item │
│ 3-Pack (Family) │    3     │   $96.24    │    $32.08    │ ~40% OFF per item │
└─────────────────┴──────────┴─────────────┴──────────────┴───────────────────┘
```

### The Checkout Math Invariant
In dynamic checkout, line items are calculated as:
$$\text{Line Total} = \text{Bundle Total Price} = \text{Unit Price} \times \text{Quantity}$$

- **Single item**: `unitPrice: 52.99`, `quantity: 1` $\rightarrow$ Total = **$52.99**
- **2-Pack bundle**: `unitPrice: 37.31`, `quantity: 2` $\rightarrow$ Total = **$74.62**
- **3-Pack bundle**: `unitPrice: 32.08`, `quantity: 3` $\rightarrow$ Total = **$96.24**

> **Crucial Rule**: The checkout endpoint must **never** receive both the full bundle total *and* the quantity to multiply again (e.g. `$74.62 \times 2 = $149.24` was an old bug that is now strictly forbidden).

---

## 5. Public Storefront Routes & Flow

### 5.1 Root Homepage (`/`)
1. Fetches all stores via `dbGetStores()`.
2. Locates the designated store where `isHomepage === true` (falls back to `puplounge` or first available store).
3. If the designated store has `isSingleProduct === true`, it seamlessly renders the high-conversion single product lander.
4. Otherwise, it renders the creator's full Stan Store layout.

### 5.2 Product Details Page (`/product/[productId]`)
- Multi-angle image gallery with interactive thumbnail selector.
- Live volume bundle pills showing real-time price changes.
- Direct **Add to Cart** and **Instant Buy (1-Click)** actions.
- Urgency elements: countdown timer, remaining stock badge, real customer review list.
- Throttled floating sticky buy bar for mobile screens.

---

## 6. Creator Stan Store (Link-in-Bio) Specification

Located at `/creator/[username]`, this page serves as a high-conversion mobile link-in-bio:

```
┌────────────────────────────────────────────────────────┐
│ [Banner Image]                                         │
│                      ( Avatar )                        │
│                 @puplounge (Verified)                  │
│       "Premium Ergonomic Costumes for Happy Pets"      │
│            [Instagram] [TikTok] [YouTube]              │
├────────────────────────────────────────────────────────┤
│ 🎁 FREE DOWNLOAD: "Ultimate Pet Sizing Guide"          │
│    [Enter your email]  [Get Instant Access]            │
├────────────────────────────────────────────────────────┤
│ ★ FEATURED HERO BUNDLE (BEST VALUE)                   │
│   [ 1 Costume $52.99 ] [ 2 Costumes $74.62 ] [ 3 Pack ]│
│   Total: $74.62 (Save $31.36)                          │
│   [ ⚡ INSTANT BUY NOW ]      [ 🛒 ADD TO CART ]       │
├────────────────────────────────────────────────────────┤
│ ★ ALL PRODUCTS (GRID)                                  │
│   [ Product Card 1 ]       [ Product Card 2 ]          │
├────────────────────────────────────────────────────────┤
│ ★ REAL CUSTOMER REVIEWS (AUTO-SCROLLING CAROUSEL)      │
│   "Best purchase ever! My frenchie loves it." - Maria  │
└────────────────────────────────────────────────────────┘
```

---

## 7. Cart Drawer, Checkout & Payment Infrastructure

### 7.1 Cart Drawer (`components/CartDrawer.jsx`)
- Opens smoothly from right without freezing the main thread.
- Resolves product thumbnail, title, and bundle pricing instantly.
- **Free Shipping Calculator**:
  - Threshold: **$50.00**
  - If `subtotal >= $50.00` $\rightarrow$ Shipping = **$0.00** ("You unlocked Free Shipping! 🎉")
  - If `subtotal < $50.00` $\rightarrow$ Shipping = **$4.99** ("Add $X.XX more for Free Shipping")
- **Coupon Code Engine**: Supports percentage discounts (e.g. `SAVE20`) and flat discounts (e.g. `10OFF`).

### 7.2 Dynamic Checkout Pipeline (`/api/gumroad/dynamic-checkout`)
1. Client submits cart payload: `{ storeSlug, items, customerEmail, discountCode }`.
2. Server queries PostgreSQL database to verify real item prices.
3. Server calculates exact subtotal, shipping, and discount.
4. Generates an encrypted/signed checkout URL.
5. Injects URL into `GumroadIframeModal.jsx`, allowing customer to pay via credit card, Apple Pay, or PayPal without leaving the website.

---

## 8. Merchant Dashboard & Fleet Management

### 8.1 Master Dashboard (`/dashboard`)
- **Fleet Control**: Lists all created stores with active status, revenue, and product count.
- **Designate Root Homepage**: 1-click toggle switches which store serves the root `/` domain.
- **Store Cloner & Importer**: Clone any existing store or import from external URLs.

### 8.2 Store Dashboard (`/store?store=[slug]`)
- **Strict Store Isolation**: URL parameter `?store=[slug]` scopes all operations.
- **Bio Editor (`/store/bio-editor`)**: Real-time visual editor for tagline, avatar, banner, colors, lead magnets, and bundle display.
- **Product Manager (`/store/manage-product`)**: Add, edit, delete products, manage image galleries, and configure volume discount tiers.
- **Order Fulfillment (`/store/orders`)**: View customer orders, addresses, tracking numbers, and fulfillment status.

---

## 9. Complete API Route Directory & Specifications

| Endpoint | Method | Description | Key Parameters |
| :--- | :--- | :--- | :--- |
| `/api/products` | GET | Returns authoritative active products | `?store=[slug]` |
| `/api/stores` | GET | Returns list of all fleet stores | None |
| `/api/store/data` | GET/POST | Fetch or update scoped store profile | `slug`, `data` |
| `/api/store/homepage` | POST | Set flagship store for root `/` | `{ slug: "puplounge" }` |
| `/api/store/duplicate` | POST | 1-Click clone store and catalog | `{ sourceSlug, newSlug, newName }` |
| `/api/store/orders` | GET/POST | List store orders or record new order | `storeSlug`, order payload |
| `/api/gumroad/dynamic-checkout` | POST | Validates bundle math and signs session | `{ items, storeSlug, customerEmail }` |
| `/api/gumroad/webhook` | POST | Handles payment gateway callbacks | Signed payload from Gumroad/Stripe |
| `/api/sync` | POST | Triggers Next.js cache revalidation | `{ path: "/creator/[username]" }` |
| `/api/reset` | POST | Restores clean factory database state | `{ confirmation: "CONFIRM_RESET" }` |

---

## 10. High-Performance & Reliability Rules

1. **60 FPS RAF Scroll Throttling**:
   ```javascript
   // Never call setState directly inside onScroll!
   useEffect(() => {
       let ticking = false;
       let lastState = false;
       const handleScroll = () => {
           if (!ticking) {
               window.requestAnimationFrame(() => {
                   const shouldShow = window.scrollY > 240;
                   if (shouldShow !== lastState) {
                       lastState = shouldShow;
                       setShowStickyBar(shouldShow);
                   }
                   ticking = false;
               });
               ticking = true;
           }
       };
       window.addEventListener('scroll', handleScroll, { passive: true });
       return () => window.removeEventListener('scroll', handleScroll);
   }, []);
   ```

2. **Zero Memory Leaks on Background Intervals**:
   - Live sales toast and carousel timers must track timer IDs and cleanly call `clearTimeout`/`clearInterval` on unmount.
   - Timers must pause when `document.hidden` is true.

3. **No Synchronous Storage Scans in Render Body**:
   - Never iterate over `localStorage.length` inside React components. Use memoized selectors or React Server Component props.

4. **Image Attributes**:
   - All `<img>` tags must include `loading="lazy"` and `decoding="async"` to prevent mobile main-thread jank.

---

## 11. Automated Verification & Test Harness

The codebase includes an extensive suite of automated verification scripts located in `/scripts`:

```bash
# Run full automated test suite (114+ assertions)
npm run test

# Run individual verification suites
node scripts/verify_m1_price_sync.js          # Confirms $52.99 baseline across DB and routes
node scripts/verify_m2_cart_images.js         # Tests cart drawer thumbnail rendering
node scripts/verify_m3_dynamic_checkout.js    # Tests dynamic checkout volume pricing
node scripts/challenge_m1_isolation.js        # Proves complete multi-store data isolation
```

---

## 12. Environment Setup & Deployment

### Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GUMROAD_APP_ID=your-gumroad-app-id
GUMROAD_APP_SECRET=your-gumroad-app-secret
```

### Installation & Launch Commands
```bash
# 1. Install dependencies
npm install

# 2. Run local Turbopack development server
npm run dev

# 3. Compile production build
npm run build

# 4. Start production server
npm start
```

---
*Created with the Ponytail Pragmatic Senior Developer Mindset — maintainable, minimalistic, and 100% synchronized.*
