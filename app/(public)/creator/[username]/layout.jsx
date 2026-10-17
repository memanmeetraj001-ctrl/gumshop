import { cache } from 'react';
import { getStoreBySlug } from '@/lib/db/stores.js';

export const revalidate = 60;

const getCachedStore = cache(async (slug) => {
    return await getStoreBySlug(slug);
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

export default async function CreatorLayout({ children, params }) {
    const { username } = await params;
    const store = await getCachedStore(username);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';

    let jsonLdSchemas = [];

    if (store) {
        const creatorUrl = `${baseUrl}/creator/${encodeURIComponent(username)}`;

        // 1. schema.org/ProfilePage
        const profileSchema = {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "dateCreated": store.createdAt || new Date().toISOString(),
            "mainEntity": {
                "@type": "Organization",
                "name": store.name,
                "url": creatorUrl,
                "description": store.description || `Official creator page for ${store.name}`,
                "image": store.logo_url || store.avatar || `${baseUrl}/favicon.svg`
            }
        };

        // 2. schema.org/BreadcrumbList
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
                    "name": `${store.name} (Creator Bio)`,
                    "item": creatorUrl
                }
            ]
        };

        jsonLdSchemas = [profileSchema, breadcrumbSchema];
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
            {children}
        </>
    );
}
