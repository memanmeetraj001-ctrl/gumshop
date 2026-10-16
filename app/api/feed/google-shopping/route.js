import { getAllProductsWithStores } from '@/lib/db/products';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export async function GET() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gumshop.online';
        const products = await getAllProductsWithStores().catch(() => []);

        const xmlItems = products.map(product => {
            const id = escapeXml(product.id);
            const title = escapeXml(product.name || product.title || 'Product');
            const description = escapeXml(
                (product.description || `${product.name} available at GumShop with fast delivery, authentic guarantee, and secure checkout.`)
                    .replace(/<[^>]*>?/gm, '')
                    .slice(0, 5000)
            );
            const link = `${baseUrl}/product/${encodeURIComponent(product.id)}`;
            const imageLink = product.image || (Array.isArray(product.images) && product.images[0]) || `${baseUrl}/favicon.svg`;
            const price = `${Number(product.price || 52.99).toFixed(2)} USD`;
            const brand = escapeXml(product.storeName || 'GumShop');

            return `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${brand}</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard Worldwide</g:service>
        <g:price>4.99 USD</g:price>
      </g:shipping>
    </item>`;
        }).join('\n');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>GumShop.online Product Catalog Feed</title>
    <link>${baseUrl}</link>
    <description>Curated Creator Marketplace and Verified Viral Products with Direct Checkout</description>
${xmlItems}
  </channel>
</rss>`;

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
            }
        });
    } catch (err) {
        return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>${escapeXml(err.message)}</description></channel></rss>`, {
            status: 500,
            headers: { 'Content-Type': 'application/xml; charset=utf-8' }
        });
    }
}
