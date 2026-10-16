import { getAllStores } from '@/lib/db/stores.js';
import { getAllProductsWithStores } from '@/lib/db/products.js';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';
    const now = new Date().toISOString();

    // 1. Static Core Landing Pages & AI Spec Endpoints
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
        },
        {
            url: `${baseUrl}/llms.txt`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/llms-full.txt`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.7,
        }
    ];

    // 2. Dynamic Public Stores (Stan Store / Creator Bio and Merchant Catalog)
    let storeRoutes = [];
    try {
        const stores = await getAllStores();
        if (Array.isArray(stores)) {
            stores.forEach(s => {
                const slug = s.username || s.slug;
                if (!slug || slug.startsWith('_') || slug.includes('test')) return;
                const lastMod = s.updatedAt || s.createdAt || now;

                // Dedicated Stan Store / Creator Bio
                storeRoutes.push({
                    url: `${baseUrl}/creator/${slug}`,
                    lastModified: lastMod,
                    changeFrequency: 'daily',
                    priority: 0.85,
                });

                // Dedicated Storefront Catalog
                storeRoutes.push({
                    url: `${baseUrl}/shop/${slug}`,
                    lastModified: lastMod,
                    changeFrequency: 'daily',
                    priority: 0.85,
                });
            });
        }
    } catch (e) {
        console.warn('[sitemap] Failed to fetch dynamic stores for sitemap:', e.message);
    }

    // 3. Dynamic Public Products (All 175+ products with stores)
    let productRoutes = [];
    try {
        const products = await getAllProductsWithStores();
        if (Array.isArray(products)) {
            products.forEach(p => {
                if (!p.id || String(p.id).startsWith('_') || p.id?.includes('test')) return;
                const lastMod = p.updatedAt || p.createdAt || now;
                productRoutes.push({
                    url: `${baseUrl}/product/${p.id}`,
                    lastModified: lastMod,
                    changeFrequency: 'weekly',
                    priority: 0.8,
                });
            });
        }
    } catch (e) {
        console.warn('[sitemap] Failed to fetch dynamic products for sitemap:', e.message);
    }

    return [...staticRoutes, ...storeRoutes, ...productRoutes];
}
