// scripts/test_cloner_enhancement.js
// Tests the Deep Product Extraction, Product Enhancer, Price Rounding, and Store Customization utilities

import assert from 'assert';
import { 
    roundPriceStrategy, 
    extractProductNoun, 
    generateContextualBundles, 
    enhanceProduct, 
    generateProductFaqs,
    generateTrustBadges,
    generateBenefitBullets
} from '../lib/importer/productEnhancer.js';
import { parseShopifyProducts } from '../lib/importer/shopifyImporter.js';
import { extractJsonLdProducts } from '../lib/importer/genericImporter.js';

console.log('--- 🧪 STARTING CLONER & ENHANCEMENT TEST SUITE ---');

// Test 1: Price Rounding Strategies
console.log('Test 1: Price Rounding Strategies...');
assert.strictEqual(roundPriceStrategy(52.34, 'charm99'), 52.99);
assert.strictEqual(roundPriceStrategy(52.34, 'charm95'), 52.95);
assert.strictEqual(roundPriceStrategy(52.34, 'whole'), 52);
assert.strictEqual(roundPriceStrategy(52.341, 'exact'), 52.34);
console.log('✅ Price rounding passed.');

// Test 2: Product Noun Extraction
console.log('Test 2: Product Noun Extraction...');
assert.strictEqual(extractProductNoun('Wireless Noise Cancelling Headphones'), 'Headphone');
assert.strictEqual(extractProductNoun('Premium Leather Boots'), 'Boot');
assert.strictEqual(extractProductNoun('Ultra Drift RC Car 4WD'), 'Car');
assert.strictEqual(extractProductNoun(''), 'Item');
console.log('✅ Product noun extraction passed.');

// Test 3: Contextual Bundles (No Halloween pet costume copy!)
console.log('Test 3: Contextual Volume Bundles...');
const bundles = generateContextualBundles('Wireless Noise Cancelling Headphones', 50.00, 'exact');
assert.strictEqual(bundles.length, 3);
assert.strictEqual(bundles[0].qty, 1);
assert.strictEqual(bundles[0].label, '1 Headphone');
assert.strictEqual(bundles[0].totalPrice, 50.00);

assert.strictEqual(bundles[1].qty, 2);
assert.strictEqual(bundles[1].label, '2 Headphones');
assert.ok(!bundles[1].subtitle.includes('Two-Pet Household'), 'Must not contain pet costume copy');
assert.strictEqual(bundles[1].badge, 'Most Popular ⭐');

assert.strictEqual(bundles[2].qty, 3);
assert.strictEqual(bundles[2].label, '3 Headphones');
assert.ok(!bundles[2].subtitle.includes('Costume Party Pack'), 'Must not contain pet costume copy');
assert.strictEqual(bundles[2].badge, 'Best Value 🔥');
console.log('✅ Contextual bundles passed.');

// Test 4: Master Enhancer
console.log('Test 4: Master Product Enhancer...');
const rawProduct = {
    id: 'test_prod_1',
    name: 'Minimalist Titanium Watch',
    price: 99.45,
    category: 'Accessories'
};

const enhanced = enhanceProduct(rawProduct, { roundingStrategy: 'charm99', storeName: 'Aero Watches' });
assert.strictEqual(enhanced.price, 99.99);
assert.strictEqual(enhanced.isEnhanced, true);
assert.ok(enhanced.customBundles.length === 3);
assert.strictEqual(enhanced.customBundles[0].label, '1 Watch');
assert.ok(Array.isArray(enhanced.faqs) && enhanced.faqs.length >= 3);
assert.ok(Array.isArray(enhanced.badges) && enhanced.badges.length >= 3);
assert.ok(Array.isArray(enhanced.reviews) && enhanced.reviews.length >= 3);
assert.ok(Array.isArray(enhanced.bullets) && enhanced.bullets.length >= 4);
console.log('✅ Master enhancer passed.');

// Test 5: Shopify Parsing Pipeline with Enhancements
console.log('Test 5: Shopify Importer Pipeline...');
const mockShopify = [
    {
        id: 999111,
        title: 'HyperDrive RC Stunt Car',
        handle: 'hyperdrive-rc-stunt-car',
        body_html: '<p>Super fast stunt car.</p><ul><li>360 degree spins</li><li>4WD all-terrain tires</li></ul>',
        product_type: 'Toys',
        variants: [
            { id: 101, title: 'Red', price: '45.00', compare_at_price: '65.00', available: true },
            { id: 102, title: 'Blue', price: '45.00', compare_at_price: '65.00', available: true }
        ],
        images: [
            { src: 'https://cdn.shopify.com/car_red.jpg' },
            { src: 'https://cdn.shopify.com/car_blue.jpg' }
        ]
    }
];

const shopifyResult = parseShopifyProducts(mockShopify, 'https://example-shop.com');
assert.strictEqual(shopifyResult.products.length, 1);
const sp = shopifyResult.products[0];
assert.strictEqual(sp.name, 'HyperDrive RC Stunt Car');
assert.strictEqual(sp.price, 45.00);
assert.strictEqual(sp.compareAtPrice, 65.00);
assert.strictEqual(sp.variants.length, 2);
assert.strictEqual(sp.customBundles[0].label, '1 Car');
assert.ok(!sp.customBundles[1].subtitle.includes('Two-Pet'));
assert.ok(sp.faqs.length > 0);
assert.ok(sp.bullets.length >= 2);
console.log('✅ Shopify importer pipeline passed.');

// Test 6: JSON-LD Pipeline with Enhancements
console.log('Test 6: JSON-LD Importer Pipeline...');
const mockJsonLdHtml = `
<!DOCTYPE html>
<html>
<head>
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Acoustic Studio Microphone",
  "image": ["https://example.com/mic1.jpg", "https://example.com/mic2.jpg"],
  "description": "Studio recording microphone with cardioid pickup pattern.",
  "category": "Audio",
  "offers": {
    "@type": "Offer",
    "price": "89.00",
    "priceCurrency": "USD"
  }
}
</script>
</head>
<body></body>
</html>
`;

const jsonLdResult = extractJsonLdProducts(mockJsonLdHtml, 'https://micshop.com', 'Microphone Store');
assert.strictEqual(jsonLdResult.products.length, 1);
const jp = jsonLdResult.products[0];
assert.strictEqual(jp.name, 'Acoustic Studio Microphone');
assert.strictEqual(jp.price, 89.00);
assert.strictEqual(jp.customBundles[0].label, '1 Microphone');
assert.ok(jp.images.length === 2);
assert.ok(jp.faqs.length > 0);
assert.ok(jp.badges.length > 0);
console.log('✅ JSON-LD importer pipeline passed.');

console.log('--- 🏆 ALL CLONER & ENHANCEMENT TESTS PASSED 100% ---');
