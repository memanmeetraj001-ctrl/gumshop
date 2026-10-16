import { getStoreBySlug } from '@/lib/db/stores.js';
import { getProductsByStore } from '@/lib/db/products.js';
import ShopClient from './ShopClient';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function generateMetadata({ params }) {
    const { username } = await params;
    const store = await getStoreBySlug(username);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';

    if (!store) {
        return {
            title: `Store Not Found | GumShop.online`,
            description: `The requested creator or merchant store could not be found.`
        };
    }

    const title = `${store.name} — Official Storefront | GumShop`;
    const description = store.description 
        ? `${store.description.slice(0, 150)}... Browse verified products with fast delivery, buyer protection, and direct Gumroad checkout.`
        : `Shop official products from ${store.name}. Verified authentic quality and secure checkout.`;

    const imageUrl = store.logo_url || store.avatar || `${baseUrl}/favicon.svg`;
    const canonical = `${baseUrl}/shop/${encodeURIComponent(username)}`;

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
            type: 'website'
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl]
        }
    };
}

export default async function StoreShopPage({ params }) {
    const { username } = await params;
    const store = await getStoreBySlug(username);
    const products = store ? await getProductsByStore(username) : [];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';

    let jsonLdSchemas = [];

    if (store) {
        const storeUrl = `${baseUrl}/shop/${encodeURIComponent(username)}`;
        
        // 1. schema.org/Store
        const storeSchema = {
            "@context": "https://schema.org",
            "@type": "Store",
            "name": store.name,
            "url": storeUrl,
            "description": store.description || `Official store for ${store.name}.`,
            "image": store.logo_url || store.avatar || `${baseUrl}/favicon.svg`,
            "priceRange": "$$",
            "paymentAccepted": "Credit Card, Debit Card, PayPal, Apple Pay, Google Pay"
        };

        // 2. schema.org/CollectionPage with ItemList
        const collectionSchema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": `${store.name} Products Catalog`,
            "url": storeUrl,
            "mainEntity": {
                "@type": "ItemList",
                "itemListElement": products.slice(0, 20).map((p, idx) => ({
                    "@type": "ListItem",
                    "position": idx + 1,
                    "url": `${baseUrl}/product/${p.id}`,
                    "name": p.name
                }))
            }
        };

        // 3. schema.org/BreadcrumbList
        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": baseUrl
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": store.name,
                    "item": storeUrl
                }
            ]
        };

        jsonLdSchemas = [storeSchema, collectionSchema, breadcrumbSchema];
    }

    return (
        <>
            {jsonLdSchemas.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
            <ShopClient initialStore={store} initialProducts={products} username={username} />
        </>
    );
}