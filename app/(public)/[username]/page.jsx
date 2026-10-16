import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/lib/db/stores.js';
import { getProductsByStore } from '@/lib/db/products.js';
import ShopClient from '@/app/(public)/shop/[username]/ShopClient';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

const RESERVED_ROUTES = new Set([
    'admin', 
    'api', 
    'cart', 
    'checkout', 
    'contact', 
    'create-store', 
    'creator', 
    'dashboard', 
    'login', 
    'orders', 
    'policies', 
    'product', 
    'settings', 
    'shop', 
    'store', 
    'thank-you', 
    'track', 
    'favicon.ico',
    'robots.txt',
    'sitemap.xml',
    'llms.txt',
    'llms-full.txt'
]);

export async function generateMetadata({ params }) {
    const { username } = await params;
    const cleanSlug = (username || '').toLowerCase().trim();
    if (RESERVED_ROUTES.has(cleanSlug)) return {};

    const store = await getStoreBySlug(cleanSlug);
    if (!store) return {};

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';
    const title = `${store.name} — Official Store | GumShop`;
    const description = store.description || `Shop official products from ${store.name}.`;
    const imageUrl = store.logo_url || store.avatar || `${baseUrl}/favicon.svg`;

    return {
        title,
        description,
        alternates: { canonical: `${baseUrl}/${cleanSlug}` },
        openGraph: {
            title,
            description,
            url: `${baseUrl}/${cleanSlug}`,
            images: [{ url: imageUrl, alt: store.name }]
        }
    };
}

export default async function DirectStorePageRoute({ params }) {
    const { username } = await params;
    const cleanSlug = (username || '').toLowerCase().trim();

    if (RESERVED_ROUTES.has(cleanSlug)) {
        notFound();
    }

    const store = await getStoreBySlug(cleanSlug);
    if (!store) {
        notFound();
    }
    const products = await getProductsByStore(cleanSlug);

    return <ShopClient initialStore={store} initialProducts={products} username={cleanSlug} />;
}
