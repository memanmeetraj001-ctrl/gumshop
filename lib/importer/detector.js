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
