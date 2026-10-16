import { NextResponse } from 'next/server';
import { getAllStores } from '@/lib/db/stores.js';
import { getAllProductsWithStores } from '@/lib/db/products.js';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';
    const stores = await getAllStores();
    const products = await getAllProductsWithStores();

    const catalog = {
        success: true,
        site: {
            name: 'GumShop.online',
            url: baseUrl,
            description: 'Curated creator marketplace with verified direct merchant checkout powered by Gumroad.',
            guarantee: '30-day risk-free money-back guarantee, SSL encrypted direct merchant checkout.',
            shipping: {
                freeThreshold: 50,
                standardFee: 4.99,
                expressFee: 9.99
            }
        },
        stores: stores.map(s => ({
            id: s.id,
            name: s.name,
            slug: s.username || s.slug,
            description: s.description,
            shopUrl: `${baseUrl}/shop/${s.username || s.slug}`,
            creatorUrl: `${baseUrl}/creator/${s.username || s.slug}`,
            themeColor: s.themeColor
        })),
        totalProducts: products.length,
        products: products.map(p => ({
            id: p.id,
            name: p.name || p.title,
            price: Number(p.price || 52.99),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
            currency: 'USD',
            category: p.category || 'General',
            inStock: p.inStock !== false,
            productUrl: `${baseUrl}/product/${p.id}`,
            storeName: p.storeName || p.storeSlug,
            storeSlug: p.storeSlug,
            image: p.image || (Array.isArray(p.images) && p.images[0]) || '',
            features: Array.isArray(p.bulletPoints) ? p.bulletPoints : (Array.isArray(p.bullets) ? p.bullets : []),
            bundles: Array.isArray(p.customBundles) ? p.customBundles.map(b => ({
                quantity: b.qty,
                totalPrice: Number(b.totalPrice),
                pricePerUnit: Number(b.pricePerUnit),
                label: b.label,
                badge: b.badge
            })) : []
        }))
    };

    return NextResponse.json(catalog, {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
