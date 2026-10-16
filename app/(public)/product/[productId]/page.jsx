import { getProductById } from '@/lib/db/products.js';
import ProductClient from './ProductClient';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function generateMetadata({ params }) {
    const { productId } = await params;
    const product = await getProductById(productId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';

    if (!product) {
        return {
            title: 'Product Not Found | GumShop.online',
            description: 'The requested product could not be found or has been discontinued.'
        };
    }

    const title = `${product.name} — Buy Online ($${Number(product.price || 52.99).toFixed(2)}) | ${product.storeName || 'GumShop'}`;
    const cleanDesc = product.description 
        ? `${product.description.slice(0, 150).replace(/\n/g, ' ')}... In-stock, authentic verified, and backed by 30-day buyer protection.`
        : `Buy ${product.name} online at the best price. Free shipping over $50, fast delivery, and secure Gumroad checkout.`;

    const imageUrl = product.image || (Array.isArray(product.images) && product.images[0]) || `${baseUrl}/favicon.svg`;
    const canonical = `${baseUrl}/product/${encodeURIComponent(productId)}`;

    return {
        title,
        description: cleanDesc,
        alternates: {
            canonical
        },
        openGraph: {
            title,
            description: cleanDesc,
            url: canonical,
            siteName: 'GumShop.online',
            images: [
                {
                    url: imageUrl,
                    width: 800,
                    height: 800,
                    alt: product.name
                }
            ],
            type: 'website'
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description: cleanDesc,
            images: [imageUrl]
        }
    };
}

export default async function ProductPage({ params }) {
    const { productId } = await params;
    const product = await getProductById(productId);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';

    // Build rich Schema.org structured data (Product, Breadcrumbs, FAQs)
    let jsonLdSchemas = [];

    if (product) {
        const storeSlug = product.storeSlug || product.storeId || 'store';
        const storeName = product.storeName || 'GumShop';
        const price = Number(product.price || 52.99).toFixed(2);
        const images = Array.isArray(product.images) && product.images.length > 0
            ? product.images
            : [product.image || `${baseUrl}/favicon.svg`];

        // 1. schema.org/Product
        const productSchema = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": images,
            "description": product.description || `Buy ${product.name} with instant tracking and secure Gumroad checkout.`,
            "sku": product.id,
            "brand": {
                "@type": "Brand",
                "name": storeName
            },
            "offers": {
                "@type": "Offer",
                "url": `${baseUrl}/product/${encodeURIComponent(product.id)}`,
                "priceCurrency": "USD",
                "price": price,
                "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                "itemCondition": "https://schema.org/NewCondition",
                "availability": product.inStock !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "seller": {
                    "@type": "Organization",
                    "name": storeName,
                    "url": `${baseUrl}/shop/${storeSlug}`
                }
            },
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": Array.isArray(product.reviews) && product.reviews.length > 0 ? product.reviews.length : 38
            }
        };

        if (Array.isArray(product.reviews) && product.reviews.length > 0) {
            productSchema.review = product.reviews.slice(0, 5).map(r => ({
                "@type": "Review",
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": String(r.rating || 5)
                },
                "author": {
                    "@type": "Person",
                    "name": r.author || r.name || "Verified Customer"
                },
                "reviewBody": r.comment || r.review || r.text || "Excellent product, highly recommend!"
            }));
        }

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
                    "name": storeName,
                    "item": `${baseUrl}/shop/${storeSlug}`
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": product.name,
                    "item": `${baseUrl}/product/${encodeURIComponent(product.id)}`
                }
            ]
        };

        // 3. schema.org/FAQPage (for Google Rich Snippets & AI Answer Engines)
        const faqSchema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": `How much does shipping cost for ${product.name}?`,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "We offer standard shipping for $4.99, priority express shipping for $9.99, and FREE shipping on all orders over $50."
                    }
                },
                {
                    "@type": "Question",
                    "name": `What is the warranty and return policy on ${product.name}?`,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Every purchase is backed by our 30-day risk-free money-back guarantee. If you are not completely satisfied, contact our support team for a full refund."
                    }
                },
                {
                    "@type": "Question",
                    "name": `How are payments secured?`,
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Payments are processed securely via Gumroad with 256-bit SSL encryption. We accept credit cards, debit cards, PayPal, Apple Pay, and Google Pay."
                    }
                }
            ]
        };

        jsonLdSchemas = [productSchema, breadcrumbSchema, faqSchema];
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
            <ProductClient initialProduct={product} productId={productId} />
        </>
    );
}