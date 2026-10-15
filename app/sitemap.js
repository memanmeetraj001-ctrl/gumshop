import { serverGetAllStores } from '../lib/serverDb.js';
import { dbGetProducts } from '../lib/supabase.js';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';
    const now = new Date().toISOString();

    // 1. Static Core Landing Pages
    const staticRoutes = [
        {
            url: baseUrl,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/shop`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.9,
        }
    ];

    // 2. Dynamic Public Stores (Stan Store / Creator Bio and Merchant Catalog)
    let storeRoutes = [];
    try {
        const stores = await serverGetAllStores();
        if (Array.isArray(stores)) {
            stores.forEach(s => {
                const slug = s.username || s.slug;
                if (!slug || slug.startsWith('_')) return;
                const lastMod = s.updatedAt || s.createdAt || now;

                // Dedicated Stan Store / Creator Bio
                storeRoutes.push({
                    url: `${baseUrl}/creator/${slug}`,
                    lastModified: lastMod,
                    changeFrequency: 'daily',
                    priority: 0.85,
                });

                // Dedicated White-labeled Storefront
                storeRoutes.push({
                    url: `${baseUrl}/shop/${slug}`,
                    lastModified: lastMod,
                    changeFrequency: 'daily',
                    priority: 0.8,
                });
            });
        }
    } catch (e) {
        console.warn('[sitemap] Failed to fetch dynamic stores for sitemap:', e.message);
    }

    // 3. Dynamic Public Products
    let productRoutes = [];
    try {
        const products = await dbGetProducts();
        if (Array.isArray(products)) {
            products.forEach(p => {
                if (!p.id || String(p.id).startsWith('_')) return;
                const lastMod = p.updatedAt || p.createdAt || now;
                productRoutes.push({
                    url: `${baseUrl}/product/${p.id}`,
                    lastModified: lastMod,
                    changeFrequency: 'weekly',
                    priority: 0.75,
                });
            });
        }
    } catch (e) {
        console.warn('[sitemap] Failed to fetch dynamic products for sitemap:', e.message);
    }

    return [...staticRoutes, ...storeRoutes, ...productRoutes];
}
