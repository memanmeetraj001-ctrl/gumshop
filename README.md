# GumShop  -  - Gumroad Store Builder & SaaS Platform

> **Launch your online store in 5 minutes. Import products from anywhere. Get paid through Gumroad. No Stripe or PayPal needed.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue-logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB-logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF-logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5.x-000000-logo=express)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38BDF8-logo=tailwindcss)](https://tailwindcss.com/)

---

## - - SaaS Pricing Tiers

| Feature / Limit | **Starter Free** | **Pro Creator** *(Recommended)* | **Unlimited Scale** |
|---|---|---|---|
| **Monthly Price** | **$0** / forever | **$12** / mo *(or $9/mo billed annually)* | **$29** / mo *(or $24/mo billed annually)* |
| **Active Products** | **10 Products** | **50 Products** | **Unlimited Products** |
| **1-Click Importer** |  - Included (10 cap) |  - Included (50 cap) |  - Unlimited Imports |
| **Gumroad Sync** |  - 1-Click Sync |  - 1-Click Sync |  - 1-Click Sync + Webhooks |
| **Shipping Address Capture** |  - Full Modal |  - Full Modal |  - Full Modal + Batch CSV Export |
| **Store URL** | `gumshop.online/store/[slug]` |  - **Custom Domain** (`yourbrand.com`) |  - **Custom Domain** + SSL |
| **GumShop Badge** | Shown in footer |  - Removed (100% White-label) |  - Removed (100% White-label) |
| **Support** | Community / Guides | Priority Email Support | VIP 1-on-1 Onboarding |

---

## - - Key Features

### - - SaaS & Multi-Tenant Architecture
- **Marketing Landing Page** (`/`): High-converting SaaS landing page with feature cards, live preview, pricing table, and FAQ.
- **Store Owner Registration** (`/signup`): Instant self-serve store creation with live URL preview (`gumshop.online/store/[slug]`).
- **5-Step Onboarding Wizard** (`/admin/onboarding`): Guides new sellers through store identity, color accents, inventory setup, and Gumroad connectivity.
- **Multi-Tenant Storefronts** (`/store/:slug`): Isolated public storefront for each seller.
- **Super-Admin Overview** (`/super-admin`): Platform-wide metrics, active tenant stores, and total catalog stats.

###  - Gumroad Integration & Pre-Checkout Capture
- **One-Click Gumroad Sync** (`/admin/gumroad`): Automatically publish catalog to Gumroad and sync live checkout URLs.
- **Pre-Checkout Shipping Modal**: Captures customer name, email, and full physical delivery address on-site before payment.
- **Orders & Leads Dashboard** (`/admin/orders`): View customer leads, update fulfillment status, copy shipping labels, and export CSVs.

### - - One-Click Product Importer (`/admin/import`)
- **Multi-Platform Scraping**: Extract products from **Shopify** (`/products.json`), **WooCommerce** REST API, or **any web page** HTML heuristics.
- **Batch Processing**: Select/deselect items, set 50% flash sale or custom discount pricing, and assign categories.
- **10-Product Free Tier**: Automatically enforces the 10-product limit for free accounts.
- **Legal Compliance**: Built-in mandatory terms of use disclaimer modal.

### - - Headless CMS Admin (18+ Modules)
- Products, Categories, Collections, Bundles & Kits
- Homepage Builder, Navigation, Footer Builder
- Appearance & Theme Color Customizer
- Blog, Testimonials, Media Library, SEO, Clicks & Analytics

---

## - - Quickstart

### 1. Prerequisites
- Node.js 18+
- npm 9+

### 2. Setup Backend & Frontend

```bash
# Terminal 1: Backend API (Port 5000)
cd backend
npm install
npm run build
node dist/index.js

# Terminal 2: Frontend Storefront (Port 5173)
cd frontend
npm install
npm run dev
```

### 3. Open in Browser
- **SaaS Marketing Landing Page**: http://localhost:5173
- **Store Signup**: http://localhost:5173/signup
- **Live Demo Store**: http://localhost:5173/store/demo
- **Admin Panel**: http://localhost:5173/admin/login
  - Default Admin: `admin@gumshop.online` / `admin123`
- **One-Click Product Importer**: http://localhost:5173/admin/import
- **Gumroad Sync**: http://localhost:5173/admin/gumroad
- **Super-Admin Dashboard**: http://localhost:5173/super-admin

---

## - - Project Structure

```
gumshop/
- - backend/                       # Node.js + Express 5 + TypeScript
 -   - - src/
 -    -   - - db/                    # Self-seeding JSON engine (or PostgreSQL)
 -    -   - - middleware/            # JWT auth & tenant isolation
 -    -   - - routes/                # Auth, Scraper, Stores, Orders, Products, etc.
 -    -   - - server.ts              # Express route mounting
 -   - - data/                      # Persistent database JSON
-
- - frontend/                      # React 19 + Vite 8 + Tailwind CSS 4
 -   - - src/
 -    -   - - components/            # Admin Layout, Storefront components, CheckoutModal
 -    -   - - context/               # Auth, Cart, Theme contexts
 -    -   - - pages/                 # Marketing Landing, Signup, Storefront, Admin pages
 -    -   - - api/client.ts          # Typed REST API client
 -   - - vite.config.ts
-
- - INSTALL.md                     # Deployment & Buyer setup guide
- - CHANGELOG.md                   # Version history
- - README.md
```

---

## 🔒 Security Notice & Secret Rotation

> [!WARNING]
> **Important Security Practice**: All production secrets, API tokens, database connection strings, and webhook signing keys **must** be stored exclusively in environment variables (via `.env` or your hosting dashboard like Render/Vercel) and **never** committed to version control.
>
> If any API key, webhook secret, or database credential was ever committed into git history in earlier versions, **rotate those secrets immediately**:
> 1. **Lemon Squeezy API Keys**: Generate a new API key in *Lemon Squeezy Dashboard > Settings > API Keys* and revoke the old key.
> 2. **Lemon Squeezy Webhooks**: Update your webhook signing secret in *Lemon Squeezy Dashboard > Settings > Webhooks* and configure `LEMONSQUEEZY_WEBHOOK_SECRET` in your server environment.
> 3. **Admin Passwords**: Update the default admin password from the `/admin/settings` panel or your hosting environment variables.
> 4. **JWT Signing Secret**: Ensure `JWT_SECRET` is set to a secure, random 64-character secret in production.

---

## 📄 License
Commercial License — Built for SaaS deployment and CodeCanyon distribution.
