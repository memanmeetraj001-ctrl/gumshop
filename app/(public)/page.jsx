import { resolveHomepageStore, PRIMARY_FALLBACK_STORE } from '@/lib/serverDb';
import { getAllProductsWithStores } from '@/lib/db/products';
import HomeClient from './HomeClient';

export const revalidate = 300;

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
    
    const resolved = await resolveHomepageStore('').catch(() => ({ 
        homepageStore: PRIMARY_FALLBACK_STORE, 
        homepageSlug: 'rubber-couch-toys-official-store' 
    }));
    const resolvedStore = resolved.homepageStore || PRIMARY_FALLBACK_STORE;
    let products = resolvedStore?.products || [];
    if (products.length === 0) {
        products = await getAllProductsWithStores().catch(() => []);
    }

    const initialStore = resolvedStore;

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
            <div id="special-deals" className="scroll-mt-24" />
            <div id="catalog" className="scroll-mt-24" />
            <HomeClient
                initialStore={initialStore}
                initialMode="single"
                initialProducts={products}
            />
        </>
    );
}
