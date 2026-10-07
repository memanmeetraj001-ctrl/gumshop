# GumShop Super Store — V2 Architecture

High-performance, pure Next.js 16 + Supabase autonomous multi-store ecommerce platform.

## Architecture & Integration
- **Framework**: Next.js 16 (App Router & Turbopack)
- **Database & Sync**: Pure Supabase PostgreSQL database + REST endpoints
- **Hosting & CI/CD**: Vercel (Auto-deployed from GitHub `main` branch)
- **Domain**: [https://www.gumshop.online](https://www.gumshop.online)
- **Repo**: [memanmeetraj001-ctrl/gumshop](https://github.com/memanmeetraj001-ctrl/gumshop)

## Key Features
- **Multi-Store Isolation**: Independent stores with isolated products, categories, branding, and themes.
- **Dynamic Homepage Selection**: Any store can be designated as the official root homepage (`/`).
- **Quick Store Switcher**: Instant context toggling across Dashboard and Store Navbar.
- **Store Cloner & 1-Click Sync**: Clones and syncs external stores with one workflow.
- **Gumroad In-Frame Checkout**: Embedded overlay checkout experience.
- **Zero Phantom Products**: Strict product isolation and tombstone deletion system.

## Continuous Deployment Pipeline
Every commit pushed to the `main` branch triggers an automated build and production deployment to Vercel.
