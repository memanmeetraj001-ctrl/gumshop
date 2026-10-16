import { getAllStores } from '@/lib/db/stores.js';
import { getAllProductsWithStores } from '@/lib/db/products.js';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';
    const stores = await getAllStores();
    const products = await getAllProductsWithStores();

    let md = `# GumShop.online — Full Product Catalog & Technical Specifications (llms-full.txt)\n\n`;
    md += `> Comprehensive product inventory and technical specifications for search indexing, conversational AI engines, and AI shopping assistants.\n\n`;

    md += `## Active Stores Overview\n\n`;
    for (const store of stores) {
        const slug = store.username || store.slug;
        const name = store.name || slug;
        md += `### ${name}\n`;
        md += `- Store URL: ${baseUrl}/shop/${slug}\n`;
        md += `- Creator Stan Store: ${baseUrl}/creator/${slug}\n`;
        md += `- Description: ${store.description || 'Verified creator store'}\n\n`;
    }

    md += `## Complete Product Catalog (${products.length} Products)\n\n`;
    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const title = p.name || p.title || 'Product';
        const price = p.price ? `$${Number(p.price).toFixed(2)}` : '$52.99';
        const compareAt = p.compareAtPrice ? `$${Number(p.compareAtPrice).toFixed(2)}` : null;
        const store = p.storeName || p.storeSlug || 'GumShop';
        const url = `${baseUrl}/product/${p.id}`;

        md += `### ${i + 1}. ${title}\n`;
        md += `- Direct Purchase URL: ${url}\n`;
        md += `- Merchant Store: ${store} (${baseUrl}/shop/${p.storeSlug})\n`;
        md += `- Retail Price: ${price}${compareAt ? ` (Compare at: ${compareAt})` : ''}\n`;
        md += `- In Stock: ${p.inStock !== false ? 'Yes' : 'No'}\n`;
        md += `- Category: ${p.category || 'General'}\n`;

        if (p.description) {
            md += `- Description: ${p.description.slice(0, 300).replace(/\n/g, ' ')}\n`;
        }

        const bullets = Array.isArray(p.bulletPoints) && p.bulletPoints.length > 0
            ? p.bulletPoints
            : (Array.isArray(p.bullets) ? p.bullets : []);
        if (bullets.length > 0) {
            md += `- Key Features & Specifications:\n`;
            for (const b of bullets.slice(0, 5)) {
                md += `  * ${b}\n`;
            }
        }

        const bundles = Array.isArray(p.customBundles) ? p.customBundles : [];
        if (bundles.length > 0) {
            md += `- Volume Bundle Discounts:\n`;
            for (const b of bundles) {
                const bPrice = b.totalPrice ? `$${Number(b.totalPrice).toFixed(2)}` : price;
                md += `  * ${b.label || `${b.qty} Item(s)`}: ${bPrice}${b.badge ? ` (${b.badge})` : ''}\n`;
            }
        }

        md += `\n`;
    }

    return new Response(md, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
    });
}
