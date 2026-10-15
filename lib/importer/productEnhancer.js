/**
 * lib/importer/productEnhancer.js
 * Intelligent, lightweight e-commerce product enhancement engine.
 * Generates high-converting volume bundles, contextual FAQs, benefit bullets,
 * trust badges, and verified reviews UGC with zero external micro-libraries.
 */

import { normalizeProductPrice } from './priceNormalizer.js';

/**
 * Smartly rounds a price based on preferred strategy:
 * - 'charm99': rounds to .99 (e.g. 52.99)
 * - 'charm95': rounds to .95 (e.g. 52.95)
 * - 'whole': rounds to integer .00 (e.g. 53.00)
 * - 'exact': 2 decimal places
 */
export function roundPriceStrategy(price, strategy = 'charm99') {
    const num = parseFloat(price) || 0;
    if (num <= 0) return 0;

    switch (strategy) {
        case 'charm99': {
            const base = Math.floor(num);
            return parseFloat(`${base}.99`);
        }
        case 'charm95': {
            const base = Math.floor(num);
            return parseFloat(`${base}.95`);
        }
        case 'whole': {
            return Math.round(num);
        }
        case 'exact':
        default: {
            return Math.round(num * 100) / 100;
        }
    }
}

/**
 * Extracts a sensible, capitalized product noun from the product title.
 * E.g., "Wireless Noise Cancelling Headphones Pro" -> "Headphone" or "Set"
 */
export function extractProductNoun(title = '') {
    if (!title || typeof title !== 'string') return 'Item';
    
    // Clean unwanted characters
    const clean = title.replace(/[^\w\s-]/g, '').trim();
    let words = clean.split(/\s+/).filter(w => w.length >= 2);
    
    if (words.length === 0) return 'Item';

    // Ignore trailing technical modifiers and version suffixes
    const ignoredSuffixes = new Set([
        'pro', 'max', 'plus', 'mini', 'ultra', 'lite', 'v2', 'v3', 'v4', 
        '4wd', '2wd', 'awd', '4k', '8k', 'hd', 'edition', 'pack', 'series', 
        'gen', 'generation', 'deluxe', 'premium', 'standard', 'new', 'official'
    ]);

    while (words.length > 1 && (ignoredSuffixes.has(words[words.length - 1].toLowerCase()) || /\d/.test(words[words.length - 1]))) {
        words.pop();
    }

    const lastWord = words[words.length - 1] || 'Item';
    let singular = lastWord;
    if (singular.toLowerCase().endsWith('ies') && singular.length > 4) {
        singular = singular.slice(0, -3) + 'y';
    } else if ((singular.toLowerCase().endsWith('ses') || singular.toLowerCase().endsWith('xes')) && singular.length > 4) {
        singular = singular.slice(0, -2);
    } else if (singular.toLowerCase().endsWith('s') && !singular.toLowerCase().endsWith('ss') && singular.length > 3) {
        singular = singular.slice(0, -1);
    }

    return singular.charAt(0).toUpperCase() + singular.slice(1);
}

/**
 * Contextual volume bundles tailored to product title and price.
 * Replaces hardcoded Halloween pet costume copy with dynamic e-commerce bundles.
 */
export function generateContextualBundles(productTitle, basePrice, roundingStrategy = 'exact') {
    const unitPrice = normalizeProductPrice(basePrice);
    const noun = extractProductNoun(productTitle);
    const pluralNoun = noun.endsWith('s') ? noun : `${noun}s`;

    // 2-Pack: ~30% discount on second unit (1.4082075 multiplier)
    const rawBundle2 = unitPrice * 1.4082075;
    const bundle2Total = roundingStrategy === 'charm99' 
        ? Math.floor(rawBundle2) + 0.99
        : Math.round(rawBundle2 * 100) / 100;
    const bundle2PerUnit = Math.round((bundle2Total / 2) * 100) / 100;

    // 3-Pack: ~40% discount on total (1.81623 multiplier)
    const rawBundle3 = unitPrice * 1.81623;
    const bundle3Total = roundingStrategy === 'charm99'
        ? Math.floor(rawBundle3) + 0.99
        : Math.round(rawBundle3 * 100) / 100;
    const bundle3PerUnit = Math.round((bundle3Total / 3) * 100) / 100;

    return [
        {
            qty: 1,
            label: `1 ${noun}`,
            subtitle: 'Standard Edition • Solo Essentials',
            pricePerUnit: unitPrice,
            totalPrice: unitPrice,
            badge: null
        },
        {
            qty: 2,
            label: `2 ${pluralNoun}`,
            subtitle: 'Popular Choice • Share with a Friend (Save 30%)',
            pricePerUnit: bundle2PerUnit,
            totalPrice: bundle2Total,
            badge: 'Most Popular ⭐'
        },
        {
            qty: 3,
            label: `3 ${pluralNoun}`,
            subtitle: 'Ultimate Value Pack • Free Priority Shipping (Save 40%)',
            pricePerUnit: bundle3PerUnit,
            totalPrice: bundle3Total,
            badge: 'Best Value 🔥'
        }
    ];
}

/**
 * Generates structured benefit bullet points when source lacks detailed copy.
 */
export function generateBenefitBullets(title, category = 'General') {
    const noun = extractProductNoun(title);
    return [
        `Premium Quality: Engineered with durable, high-grade materials for lasting everyday performance.`,
        `Ergonomic & Portable: Designed for maximum comfort, versatility, and ease of use.`,
        `Verified Authentic: 100% original ${noun} manufactured under rigorous quality-control benchmarks.`,
        `Ready Out of the Box: Includes everything you need with fast, zero-fuss setup.`,
        `Backed by Our Guarantee: Complete coverage with 30-day risk-free buyer satisfaction protection.`
    ];
}

/**
 * Generates tailored product FAQs.
 */
export function generateProductFaqs(title, storeName = 'Our Store') {
    const noun = extractProductNoun(title);
    return [
        {
            q: `What is included in the package?`,
            a: `Every order includes 1x ${title || noun}, complete official packaging, user instruction guide, and verified protective shipping materials.`
        },
        {
            q: `How long does tracked shipping take?`,
            a: `Orders are prepared and dispatched within 24–48 hours. Standard tracked shipping takes 3–7 business days depending on your delivery location.`
        },
        {
            q: `What is your return & guarantee policy?`,
            a: `We offer a 30-day money-back guarantee. If you're not completely satisfied with your ${noun}, return it in original condition for a prompt replacement or refund.`
        },
        {
            q: `Are payments safe and secure?`,
            a: `Yes! Checkouts are securely processed with 256-bit SSL encryption backed by verified Gumroad payment infrastructure.`
        }
    ];
}

/**
 * Generates high-trust guarantee badges.
 */
export function generateTrustBadges() {
    return [
        { id: 'ssl', label: '256-Bit SSL Encrypted', sublabel: 'Bank-Grade Security', icon: 'Lock' },
        { id: 'shipping', label: 'Fast Tracked Delivery', sublabel: 'Dispatched in 24-48h', icon: 'Truck' },
        { id: 'guarantee', label: '30-Day Money Back', sublabel: '100% Risk-Free Guarantee', icon: 'ShieldCheck' },
        { id: 'support', label: '24/7 Verified Support', sublabel: 'Dedicated Care Team', icon: 'Sparkles' }
    ];
}

/**
 * Generates realistic initial customer review UGC if none exists.
 */
export function generateVerifiedReviews(productTitle) {
    const noun = extractProductNoun(productTitle);
    return [
        {
            user: { name: 'Sarah M.', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
            rating: 5,
            review: `Exceeded my expectations! The quality of this ${noun} feels top-notch and delivery arrived two days early. Will definitely order again.`,
            createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
        },
        {
            user: { name: 'David K.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
            rating: 5,
            review: `Got the 2-pack bundle to keep one and gift one. Amazing value for the price and packaging was completely secure.`,
            createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
        },
        {
            user: { name: 'Elena R.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
            rating: 5,
            review: `Exactly as described. Setup took less than two minutes. Highly recommended for anyone looking for a reliable ${noun}!`,
            createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
        }
    ];
}

/**
 * Master Enhancer Function:
 * Enriches a raw product with high-converting e-commerce attributes.
 */
export function enhanceProduct(rawProduct, options = {}) {
    const { 
        roundingStrategy = 'charm99', 
        storeName = 'Store',
        autoBundles = true,
        autoFaqs = true,
        autoReviews = true,
        autoBadges = true
    } = options;

    const basePrice = roundPriceStrategy(rawProduct.price, roundingStrategy);
    const compareAt = rawProduct.compareAtPrice 
        ? roundPriceStrategy(rawProduct.compareAtPrice, roundingStrategy)
        : roundPriceStrategy(basePrice * 1.35, roundingStrategy);

    const title = (rawProduct.name || rawProduct.title || 'Featured Product').trim();
    const noun = extractProductNoun(title);

    // 1. Contextual Custom Bundles: regenerate if missing, if price mismatched, or if using old template
    const hasMismatchedPrice = rawProduct.customBundles && rawProduct.customBundles.length > 0 && 
        Math.abs((parseFloat(rawProduct.customBundles[0]?.totalPrice) || 0) - basePrice) > 0.05;

    const bundles = (autoBundles && (!rawProduct.customBundles || rawProduct.customBundles.length === 0 || hasMismatchedPrice || rawProduct.customBundles[0]?.subtitle?.includes('rider')))
        ? generateContextualBundles(title, basePrice, roundingStrategy)
        : (rawProduct.customBundles || []);

    // 2. Bullets / Specs
    const existingBullets = Array.isArray(rawProduct.bullets) && rawProduct.bullets.length > 0 
        ? rawProduct.bullets 
        : (Array.isArray(rawProduct.bulletPoints) ? rawProduct.bulletPoints : []);
    const bullets = existingBullets.length > 0 ? existingBullets : generateBenefitBullets(title, rawProduct.category);

    // 3. FAQs
    const faqs = (autoFaqs && (!rawProduct.faqs || rawProduct.faqs.length === 0))
        ? generateProductFaqs(title, storeName)
        : (rawProduct.faqs || []);

    // 4. Badges
    const badges = (autoBadges && (!rawProduct.badges || rawProduct.badges.length === 0))
        ? generateTrustBadges()
        : (rawProduct.badges || []);

    // 5. Reviews
    const reviews = (autoReviews && (!rawProduct.reviews || rawProduct.reviews.length === 0))
        ? generateVerifiedReviews(title)
        : (rawProduct.reviews || []);

    // 6. Subtitle & Kicker
    const kicker = rawProduct.kicker || 'VERIFIED ESSENTIAL';
    const subtitle = rawProduct.subtitle || `Premium ${noun} curated for everyday excellence.`;

    return {
        ...rawProduct,
        name: title,
        title: title,
        price: basePrice,
        compareAtPrice: compareAt,
        customBundles: bundles,
        bullets,
        bulletPoints: bullets,
        faqs,
        badges,
        reviews,
        rating: reviews,
        kicker,
        subtitle,
        isEnhanced: true
    };
}
