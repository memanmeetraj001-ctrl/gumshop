import { cookies } from 'next/headers';
import { resolveHomepageStore } from '@/lib/serverDb';
import { getAllProductsWithStores } from '@/lib/db/products';
import HomeClient from './HomeClient';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function generateMetadata() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';
    const title = 'GumShop.online — The Best E-Commerce Store for Best Deals & Viral Products';
    const description = 'Discover trending viral products, curated creator storefronts, and exclusive deals. Fast worldwide delivery, 30-day buyer guarantee, and instant Gumroad checkout.';

    return {
        title,
        description,
        alternates: {
            canonical: baseUrl
        },
        openGraph: {
            title,
            description,
            url: baseUrl,
            siteName: 'GumShop.online',
            images: [
                {
                    url: `${baseUrl}/favicon.svg`,
                    width: 800,
                    height: 800,
                    alt: 'GumShop.online'
                }
            ],
            type: 'website'
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [`${baseUrl}/favicon.svg`]
        }
    };
}

export default async function HomePage() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';
    
    let cookieSlug = '';
    let cookieMode = 'single';
    let selectedStores = [];
    
    try {
        const cookieStore = await cookies();
        cookieSlug = cookieStore.get('gumshop_homepage_store')?.value || '';
        cookieMode = cookieStore.get('gumshop_homepage_mode')?.value || 'single';
        const rawStores = cookieStore.get('gumshop_homepage_stores')?.value || '';
        if (rawStores) {
            try {
                selectedStores = JSON.parse(rawStores);
            } catch {
                selectedStores = rawStores.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            }
        }
    } catch {}

    const resolved = await resolveHomepageStore(cookieSlug).catch(() => ({ homepageStore: null, homepageSlug: '' }));
    let products = [];

    if (cookieMode === 'all') {
        products = await getAllProductsWithStores().catch(() => []);
    } else if (cookieMode === 'custom' && selectedStores.length > 0) {
        const all = await getAllProductsWithStores().catch(() => []);
        const allowed = new Set(selectedStores.map(s => String(s).toLowerCase().replace(/^store_/, '')));
        products = all.filter(p => allowed.has((p.storeSlug || p.storeId || '').toLowerCase().replace(/^store_/, '')));
    } else {
        products = resolved.homepageStore?.products || [];
        if (products.length === 0) {
            const all = await getAllProductsWithStores().catch(() => []);
            products = all;
        }
    }

    const initialStore = cookieMode === 'all'
        ? {
            name: 'All Shops Marketplace',
            username: 'marketplace',
            isMarketplace: true,
            description: 'Browse verified top-selling products across our creator fleet.'
        }
        : cookieMode === 'custom'
        ? {
            name: 'Combined Stores Showcase',
            username: 'showcase',
            isMarketplace: true,
            description: 'Explore featured products across our selected creator stores with direct merchant checkout.'
        }
        : resolved.homepageStore;

    // Structured Data: WebSite with SearchAction
    const websiteSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'GumShop.online',
        url: baseUrl,
        potentialAction: {
            '@type': 'SearchAction',
            target: `${baseUrl}/shop?search={search_term_string}`,
            'query-input': 'required name=search_term_string'
        }
    };

    // Structured Data: Organization
    const orgSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'GumShop.online',
        url: baseUrl,
        logo: `${baseUrl}/favicon.svg`,
        description: 'Curated creator marketplace and viral e-commerce store with direct merchant checkout.'
    };

    // Structured Data: ItemList of Top Active Products
    const itemListSchema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: (products || []).slice(0, 12).map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'Product',
                name: item.name || item.title,
                image: item.image || (Array.isArray(item.images) && item.images[0]) || `${baseUrl}/favicon.svg`,
                description: item.description?.slice(0, 150) || `${item.name} online at GumShop.`,
                offers: {
                    '@type': 'Offer',
                    price: Number(item.price || 52.99).toFixed(2),
                    priceCurrency: 'USD',
                    availability: 'https://schema.org/InStock',
                    url: `${baseUrl}/product/${encodeURIComponent(item.id)}`
                }
            }
        }))
    };

    // Structured Data: FAQPage for Answer Engine Optimization (Perplexity / ChatGPT Search / AI Overviews)
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'How does GumShop verify creators and products?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Every creator store and product catalog on GumShop is verified for authentic inventory, transparent pricing, and direct merchant order fulfillment.'
                }
            },
            {
                '@type': 'Question',
                name: 'How does checkout and payment protection work?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Orders are processed through dynamic Gumroad checkout sessions with 256-bit SSL encryption, backed by standard 30-day buyer protection.'
                }
            },
            {
                '@type': 'Question',
                name: 'How long does shipping and delivery take?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Orders are dispatched within 24 to 48 hours. Standard tracked worldwide delivery typically arrives within 5 to 10 business days with full tracking numbers provided.'
                }
            },
            {
                '@type': 'Question',
                name: 'What is the return and refund policy on GumShop?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Refund and cancellation requests are handled directly by the store merchant in accordance with standard customer protection policies and 30-day money-back guarantees.'
                }
            }
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <HomeClient
                initialStore={initialStore}
                initialMode={cookieMode}
                initialProducts={products}
            />
        </>
    );
}
