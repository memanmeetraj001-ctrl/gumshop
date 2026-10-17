import { cache } from 'react';
import { getStoreBySlug } from '@/lib/db/stores.js';
import { getProductsByStore } from '@/lib/db/products.js';
import CreatorClient from './CreatorClient';

export const revalidate = 300;

const getCachedStore = cache(async (slug) => {
    return await getStoreBySlug(slug);
});

const getCachedProducts = cache(async (slug) => {
    return await getProductsByStore(slug);
});

export async function generateMetadata({ params }) {
    const { username } = await params;
    const store = await getCachedStore(username);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';

    if (!store) {
        return {
            title: 'Creator Not Found | GumShop.online',
            description: 'The requested creator bio page could not be found.'
        };
    }

    const title = `${store.name} — Creator Bio & Stan Store | GumShop`;
    const description = store.description 
        ? `${store.description.slice(0, 150)}... Browse verified links, digital downloads, and viral products with direct checkout.`
        : `Official creator bio and verified product showcase for ${store.name}.`;

    const imageUrl = store.logo_url || store.avatar || `${baseUrl}/favicon.svg`;
    const canonical = `${baseUrl}/creator/${encodeURIComponent(username)}`;

    return {
        title,
        description,
        alternates: {
            canonical
        },
        openGraph: {
            title,
            description,
            url: canonical,
            siteName: 'GumShop.online',
            images: [
                {
                    url: imageUrl,
                    width: 600,
                    height: 600,
                    alt: store.name
                }
            ],
            type: 'profile'
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl]
        }
    };
}

export default async function CreatorBioPage({ params }) {
    let username = '';
    let store = null;
    let products = [];

    try {
        const resolvedParams = await params;
        username = resolvedParams?.username || '';
        store = await getCachedStore(username);
        products = store ? await getCachedProducts(username) : [];
    } catch (err) {
        console.error('[CreatorBioPage] Resolution notice:', err.message);
    }

    // De-duplicate products payload: initialProducts is the authoritative array,
    // so omit store.products from initialStore to keep React Server Component Flight stream ultra-lean (<150KB)
    const leanStore = store ? { ...store, products: [] } : null;

    return (
        <CreatorClient 
            initialStore={leanStore} 
            initialProducts={products} 
            username={username} 
        />
    );
}
