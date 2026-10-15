/**
 * Platform Source Detector
 * Analyzes response headers, HTML signatures, and public endpoints to identify store CMS.
 */

export function detectStorePlatform(html, headers = {}) {
    const lowerHtml = (html || '').toLowerCase();
    
    // Shopify indicators
    if (
        lowerHtml.includes('cdn.shopify.com') ||
        lowerHtml.includes('shopify.theme') ||
        lowerHtml.includes('shopify-buy') ||
        lowerHtml.includes('powered by shopify') ||
        lowerHtml.includes('/shopify/')
    ) {
        return 'shopify';
    }

    // WooCommerce indicators
    if (
        lowerHtml.includes('woocommerce') ||
        lowerHtml.includes('wc-block') ||
        lowerHtml.includes('wp-content/plugins/woocommerce')
    ) {
        return 'woocommerce';
    }

    // BigCommerce indicators
    if (
        lowerHtml.includes('bigcommerce') ||
        lowerHtml.includes('cdn11.bigcommerce.com')
    ) {
        return 'bigcommerce';
    }

    // Default to modern generic HTML / microdata
    return 'generic_html';
}

/**
 * Store Currency Detector
 * Extracts authoritative 3-letter currency code from HTML metadata or signatures.
 */
export function detectStoreCurrency(html) {
    if (!html || typeof html !== 'string') return 'USD';

    // 1. Shopify.currency JSON signature
    const shopifyCurrMatch = html.match(/Shopify\.currency\s*=\s*\{[^}]*["']active["']\s*:\s*["']([A-Za-z]{3})["']/i);
    if (shopifyCurrMatch && shopifyCurrMatch[1]) {
        return shopifyCurrMatch[1].toUpperCase();
    }

    // 2. OpenGraph price currency meta tag
    const ogMatch = html.match(/<meta[^>]+property=["']og:price:currency["'][^>]+content=["']([A-Za-z]{3})["']/i) ||
                    html.match(/<meta[^>]+content=["']([A-Za-z]{3})["'][^>]+property=["']og:price:currency["']/i);
    if (ogMatch && ogMatch[1]) {
        return ogMatch[1].toUpperCase();
    }

    // 3. JSON-LD currency declaration
    const jsonLdCurrMatch = html.match(/["']priceCurrency["']\s*:\s*["']([A-Za-z]{3})["']/i);
    if (jsonLdCurrMatch && jsonLdCurrMatch[1]) {
        return jsonLdCurrMatch[1].toUpperCase();
    }

    // 4. Currency symbols in HTML
    if (html.includes('₹') || html.includes('Rs.') || html.includes('INR')) return 'INR';
    if (html.includes('€') || html.includes('EUR')) return 'EUR';
    if (html.includes('£') || html.includes('GBP')) return 'GBP';
    if (html.includes('¥') || html.includes('JPY')) return 'JPY';
    if (html.includes('CAD') || html.includes('C$')) return 'CAD';
    if (html.includes('AUD') || html.includes('A$')) return 'AUD';

    return 'USD';
}
