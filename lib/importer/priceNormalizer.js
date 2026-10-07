/**
 * Universal Price Normalizer & High-Res Image Resolver
 * Prevents pricing issues (such as cents imported as integers or stripped decimals),
 * normalizes international currency formats, and maximizes image fidelity.
 */

// Common non-product keywords to exclude from store catalogs
const JUNK_KEYWORDS = [
    'shipping protection',
    'route package',
    'package protection',
    'transit insurance',
    'navidium',
    'order protection',
    'gift card',
    'e-gift card',
    'voucher',
    'tip',
    'tips',
    'gratuity',
    'donation',
    'custom order',
    'deposit',
    'down payment',
    'partial payment',
    'advance payment',
    'booking fee',
    'draft',
    'test product',
    'do not buy',
    'extended warranty',
    'warranty protection',
    'gift wrap',
    'gift wrapping'
];

/**
 * Normalizes any raw price input (string, number, object, cents, currency string) into standard float dollars/units.
 * Correctly handles:
 * - "99.99" -> 99.99
 * - "$99.99" -> 99.99
 * - "99,99 €" -> 99.99 (European comma decimal)
 * - "1,299.99" -> 1299.99
 * - "1.299,99" -> 1299.99
 * - 9999 (cents) -> 99.99 if autoDetectCents or isCents option is enabled
 */
export function normalizeProductPrice(rawVal, options = {}) {
    if (rawVal === null || rawVal === undefined) return 0;

    // Handle object representations (e.g. { amount: "99.99", currencyCode: "USD" })
    if (typeof rawVal === 'object') {
        rawVal = rawVal.amount ?? rawVal.value ?? rawVal.price ?? 0;
    }

    let str = String(rawVal).trim();
    if (!str) return 0;

    // Strip currency symbols and letters, keeping digits, commas, dots, dashes
    str = str.replace(/[$€£₹¥A-Za-z\s]/g, '');

    // Case 1: Both comma and dot present (e.g. "1,299.99" or "1.299,99")
    if (str.includes(',') && str.includes('.')) {
        if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
            // European standard: 1.299,99 -> 1299.99
            str = str.replace(/\./g, '').replace(',', '.');
        } else {
            // US standard: 1,299.99 -> 1299.99
            str = str.replace(/,/g, '');
        }
    } 
    // Case 2: Only comma present (e.g. "99,99" or "1,200")
    else if (str.includes(',')) {
        const parts = str.split(',');
        // If 2 digits after comma, it's a decimal separator (e.g. "99,99" or "19,50")
        if (parts.length === 2 && parts[1].length === 2) {
            str = str.replace(',', '.');
        } else {
            // Thousand separator: "1,000" -> "1000"
            str = str.replace(/,/g, '');
        }
    }

    let num = parseFloat(str);
    if (isNaN(num) || num < 0) return 0;

    // Case 3: Cents heuristic or explicit cents flag
    // If explicitly told it's in cents, or if num is an integer >= 1000 (e.g. 9999, 4500, 2999)
    // and options.autoDetectCents is active, convert to dollars/units
    if (options.isCents || (options.autoDetectCents && Number.isInteger(num) && num >= 1000)) {
        num = num / 100;
    }

    return Math.round(num * 100) / 100;
}

/**
 * Strips Shopify thumbnail dimensions to request maximum available image resolution.
 * e.g. "https://cdn.shopify.com/.../shoe_small.jpg" -> "https://cdn.shopify.com/.../shoe.jpg"
 * e.g. "https://cdn.shopify.com/.../shoe_300x300.jpg" -> "https://cdn.shopify.com/.../shoe_master.jpg"
 */
export function upgradeShopifyImageUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    let url = rawUrl.trim();

    if (url.startsWith('//')) {
        url = 'https:' + url;
    }

    if (url.includes('cdn.shopify.com') || url.includes('/cdn/shop/')) {
        // Strip query params like ?v=12345 temporarily or preserve
        const [base, query] = url.split('?');
        // Replace size suffixes like _100x100, _300x300, _small, _medium, _compact, _large, _grande
        const cleaned = base
            .replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|100x100|200x200|300x300|400x400|500x500|600x600|800x800|1024x1024|2048x2048)\.([a-zA-Z0-9]+)$/i, '_master.$1');
        return query ? `${cleaned}?${query}` : cleaned;
    }

    return url;
}

/**
 * Determines whether a detected product is valid and clean (non-junk, non-tip, has image).
 */
export function isCleanCatalogProduct(name, price, image) {
    if (!name || typeof name !== 'string') return false;
    const lowerName = name.toLowerCase().trim();
    if (lowerName.length < 2) return false;

    // Check for junk keywords
    for (const kw of JUNK_KEYWORDS) {
        if (lowerName.includes(kw)) return false;
    }

    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return false;

    if (!image || typeof image !== 'string' || (!image.startsWith('http') && !image.startsWith('//'))) {
        return false;
    }

    return true;
}
