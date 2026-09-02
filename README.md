# ⚡ GumShop — The 60-Second Headless E-Commerce & Storefront Builder

> **Launch high-converting creator storefronts in under 60 seconds. Import products from any URL. Collect international payments worldwide with zero gateway paperwork.**

[![Live Production](https://img.shields.io/badge/Live%20Platform-gumshop.online-6366F1?style=for-the-badge&logo=google-chrome&logoColor=white)](https://gumshop.online)
[![Live Demo Store](https://img.shields.io/badge/Demo%20Store-gumshop.online%2Fstore%2Fdemo-10B981?style=for-the-badge&logo=shopify&logoColor=white)](https://gumshop.online/store/demo)
[![LinkedIn](https://img.shields.io/badge/Founder-Manmeet%20Raj-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/manmeetraj967)

[![React 19](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite 8](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS 4](https://img.shields.io/badge/TailwindCSS-4.x-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Gumroad](https://img.shields.io/badge/Billing-Gumroad%20Subscriptions-FF90E8?logo=gumroad&logoColor=black)](https://gumroad.com)

---

> [!CAUTION]
> **Security & Secret Rotation Notice**:
> If any API key, personal access token, webhook secret, or database connection string was previously committed to git history during local experimentation, that credential **must be rotated / revoked immediately** in your third-party provider dashboards (Gumroad, Lemon Squeezy, Neon Postgres, etc.). Never commit `.env` files to git. All production secrets must be configured via environment variables.

---

## 🚀 Live Links & Portals

| Portal | URL | Description |
|---|---|---|
| **Marketing Homepage** | [gumshop.online](https://gumshop.online) | SaaS landing page with real interactive showcase carousel. |
| **Merchant Signup (60s)** | [gumshop.online/signup](https://gumshop.online/signup) | Self-serve seller store provisioning wizard. |
| **Interactive Showcase Store** | [gumshop.online/store/demo](https://gumshop.online/store/demo) | Live customer-facing audio & minimalist EDC store. |
| **Merchant Admin CMS** | [gumshop.online/admin/login](https://gumshop.online/admin/login) | Full-featured headless store management dashboard. |
| **Plan Upgrades** | [gumshop.online/admin/upgrade](https://gumshop.online/admin/upgrade) | Automated Gumroad recurring subscription checkout. |
| **About Platform & Founder** | [gumshop.online/about](https://gumshop.online/about) | Platform architecture and founder profile (Manmeet Raj). |
| **Contact & Help Desk** | [gumshop.online/contact](https://gumshop.online/contact) | 24/7 direct ticket submission & merchant support. |

---

## 💰 SaaS Pricing Tiers

| Feature / Limit | **Starter Free** | **Pro Creator** *(Most Popular)* | **Unlimited Scale** *(Agency & High Volume)* |
|---|---|---|---|
| **Monthly Price** | **$0** / forever | **$12** / month | **$29** / month |
| **Annual Price** | **$0** / forever | **$9** / month *($108/yr · Save 25%)* | **$24** / month *($288/yr · Save 25%)* |
| **Active Catalog Slots** | **10 Products** | **50 Products** | **Unlimited Products** (9,999+) |
| **1-Click Universal Importer** | Included (10 cap) | Included (50 cap) | Unlimited Batch Scraping |
| **Gumroad SaaS Billing** | — | Automatic Webhook Upgrades | Automatic Webhook Upgrades |
| **8 Category Theme Presets** | Included | Included | Included + Custom CSS |
| **Pre-Checkout Address Capture** | Full Modal | Full Modal | Full Modal + CSV Export |
| **Storefront URL** | `gumshop.online/store/:slug` | **Custom Apex Domain** (`brand.com`) | **Custom Apex Domain** + Auto SSL |
| **Platform Branding** | Powered by GumShop | 100% White-Label (Removable) | 100% White-Label (Removable) |
| **Support** | Guides & Community | Priority Email Support | VIP 1-on-1 Support Desk |

---

## 🎨 8 Prebuilt Category-Specific Theme Presets

Store owners can switch their entire storefront aesthetic with **1-click** from the Theme Studio (`/admin/appearance`):

1. **⚡ Cyber Tech & Minimal EDC**: Stealth `#0A0C0F`, Neon Indigo `#6366F1`, Violet accents *(Keyboards, Studio Audio, Everyday Carry)*
2. **✨ Luxury Fashion & Haute Apparel**: Onyx `#080808`, Warm Champagne Gold `#D4AF37`, Sharp 4px borders *(Streetwear, Fine Jewelry, Watches)*
3. **🌿 Organic, Botanical & Wellness**: Deep Forest `#0B1411`, Sage `#10B981`, Soft 24px pill radii *(Skincare, Herbal Teas, Essential Oils)*
4. **🚀 Digital Creator & SaaS Assets**: Deep Space Navy `#090D16`, Electric Cyan `#06B6D4`, Glassmorphic *(Notion Packs, UI Kits, 3D Assets)*
5. **🎮 Anime, Gaming & Esports**: Midnight Void `#0D0B18`, Neon Pink `#EC4899`, Cyber Yellow *(Gaming Hardware, Keycaps, Collectibles)*
6. **☕ Specialty Coffee & Gourmet Goods**: Roasted Espresso `#120D0A`, Amber Honey `#F59E0B` *(Artisanal Roasters, Hot Sauce, Craft Food)*
7. **🛋️ Nordic Minimal & Home Living**: Soft Charcoal `#111317`, Warm Terracotta `#F97316` *(Ceramics, Desk Lamps, Scandinavian Decor)*
8. **🔥 Bold Streetwear & Sneaker Drops**: Pitch Black `#050505`, Hyper Volt Lime `#84CC16`, Sharp 2px radii *(Limited Drops, Sneaker Resale)*

---

## 🛠️ Core Platform Architecture & Features

### 1. 📊 Store CMS Dashboard & Live Device Simulator
- Real-time GMV and revenue tracking with growth curves.
- Interactive **Live Store Preview** modal with **Desktop (100% Full)** and **Mobile (390px iPhone)** frame toggles.
- In-app **Admin Account Security & Password Change** with bcrypt hashing.

### 2. 📥 1-Click Universal Product Importer (`/admin/import`)
- Automated platform detection for **Shopify** (`/products.json`), **WooCommerce** REST API, or **any webpage** HTML scraping.
- Batch item selection, 50% discount price modifiers, and instant category mapping.

### 3. 💳 Multi-Gateway Global Checkout
- **Lemon Squeezy Integration**: Recurring monthly and annual subscriptions with automated HMAC webhook upgrades (`subscription_created`, `subscription_cancelled`, `subscription_expired`).
- **Gumroad Direct Integration**: 1-Click catalog publishing with automated payment redirect.
- Supports Visa, MasterCard, American Express, PayPal, Apple Pay, and Google Pay worldwide.

### 4. 📬 Pre-Checkout Customer Shipping Capture (`/admin/orders`)
- Captures full physical delivery addresses (Street, Suite, City, State, Zip, Country) on-site before checkout.
- Order management with fulfillment statuses (*Fulfilled, In Transit, Processing, Pending*), shipping label generation, and batch CSV export.

---

## 🔑 Default Credentials

| Role | Email | Password | Access URL |
|---|---|---|---|
| **Master Super-Admin** | `admin@gumshop.online` | `admin123` | [/admin/login](https://gumshop.online/admin/login) |
| **Alternate Admin** | `superadmin@gumshop.online` | `admin123` | [/admin/login](https://gumshop.online/admin/login) |

*Note: You can change the admin password at any time inside the dashboard at `/admin/settings`.*

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js 18+
- npm 9+

### 2. Installation & Run

```bash
# Clone the repository
git clone https://github.com/memanmeetraj001-ctrl/gumshop.git
cd gumshop

# Install dependencies for both frontend and backend
npm install --prefix frontend
npm install --prefix backend

# Start Backend API (Port 5000)
cd backend
npm run build
npm start

# In a separate terminal: Start Frontend (Port 5173)
cd frontend
npm run dev
```

---

## 🔒 Security Notice & Secret Configuration

> [!WARNING]
> **Production Security**: All sensitive keys (JWT signing secret, Lemon Squeezy API keys, webhook secrets, database connection strings) are strictly loaded via environment variables and **never** hardcoded into version control.

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

Key environment variables:
- `JWT_SECRET`: Secure 64-character random string.
- `LEMONSQUEEZY_API_KEY`: Lemon Squeezy API JWT Token.
- `LEMONSQUEEZY_WEBHOOK_SECRET`: Lemon Squeezy Webhook HMAC signing secret.
- `ADMIN_EMAIL` & `ADMIN_PASSWORD`: Default credentials for initial boot.

---

## 👨‍💻 Founder & Creator

**GumShop** was built and architected by **[Manmeet Raj](https://www.linkedin.com/in/manmeetraj967)**.

- **LinkedIn**: [linkedin.com/in/manmeetraj967](https://www.linkedin.com/in/manmeetraj967)
- **Live Platform**: [gumshop.online](https://gumshop.online)
- **Support**: `support@gumshop.online`

---

## 📄 License
Commercial License — Built for SaaS deployment and CodeCanyon distribution.
