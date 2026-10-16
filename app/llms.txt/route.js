import { getAllStores } from '@/lib/db/stores.js';
import { getAllProductsWithStores } from '@/lib/db/products.js';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';
    const stores = await getAllStores();
    const products = await getAllProductsWithStores();

    let md = `# GumShop.online — Curated Creator Marketplace & Viral Products\n\n`;
    md += `> Curated creator marketplace offering verified viral products, toys, accessories, and creator storefronts with direct Gumroad merchant checkout.\n\n`;

    md += `## Active Creator Stores\n\n`;
    for (const store of stores) {
        const slug = store.username || store.slug;
        const name = store.name || slug;
        const desc = store.description || 'Official creator store.';
        md += `- [${name}](${baseUrl}/shop/${slug}): ${desc} (Stan Store: ${baseUrl}/creator/${slug})\n`;
    }

    md += `\n## Featured Products\n\n`;
    // List top 30 featured products for concise llms.txt (full catalog in llms-full.txt)
    const featured = products.slice(0, 30);
    for (const p of featured) {
        const title = p.name || p.title || 'Product';
        const price = p.price ? `$${Number(p.price).toFixed(2)}` : 'Check site';
        const store = p.storeName || p.storeSlug || 'GumShop';
        const desc = p.description ? p.description.slice(0, 100).replace(/\n/g, ' ') : 'Verified viral product.';
        md += `- [${title}](${baseUrl}/product/${p.id}): ${price} — Sold by ${store}. ${desc}\n`;
    }

    md += `\n## Full Catalog & Machine Discovery\n\n`;
    md += `- [Full 175+ Product Catalog Specification](${baseUrl}/llms-full.txt): Complete product specifications, bundle tiers, and package contents.\n`;
    md += `- [Machine-Readable AI Catalog Endpoint](${baseUrl}/api/ai/catalog): High-speed JSON product catalog for automated AI shopping agents.\n`;
    md += `- [XML Sitemap](${baseUrl}/sitemap.xml): Complete URL index for search engine crawlers.\n\n`;

    md += `## Buyer Guarantees & Checkout Protection\n\n`;
    md += `- **Direct Merchant Checkout**: Secured by Gumroad with 256-bit SSL encryption.\n`;
    md += `- **Satisfaction Guarantee**: 30-day risk-free money-back guarantee on all eligible purchases.\n`;
    md += `- **Fast Shipping**: Trackable express & standard delivery with free shipping on qualifying orders over $50.\n`;

    return new Response(md, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        }
    });
}
