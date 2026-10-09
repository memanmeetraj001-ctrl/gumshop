import { normalizeProductPrice, applyPriceSlash } from '../lib/importer/priceNormalizer.js';
import { serverSaveStore, serverSaveProducts, serverGetStore } from '../lib/serverDb.js';
import { createStore, createProduct, recordImportHistory } from '../lib/firebaseDb.js';

async function runTestSuite() {
    console.log('--- STARTING COMPREHENSIVE IMPORT VERIFICATION SUITE ---');
    let passed = 0;
    let failed = 0;

    const assert = (condition, testName) => {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            passed++;
        } else {
            console.error(`[FAIL] ${testName}`);
            failed++;
        }
    };

    // Test 1: Price normalization
    assert(normalizeProductPrice(29.99) === 29.99, 'Normal price 29.99 normalized');
    assert(normalizeProductPrice("$34.50") === 34.5, 'Currency string $34.50 normalized');
    assert(normalizeProductPrice(2999, { autoDetectCents: true }) === 29.99, 'Cents 2999 auto-converted to 29.99');

    // Test 2: Price slashing
    const slashed = applyPriceSlash(100, 25, 120);
    assert(slashed.price === 75, 'Price slashed by 25% from 100 to 75');
    assert(slashed.compareAtPrice === 120, 'CompareAtPrice preserved at 120');

    // Test 3: Simulating route.js logic for PhantomPaws payload
    const payload = {
        destinationStore: {
            name: "PhantomPaws Headless Horseman Pet Costume",
            slug: "phantompaws-headless-horseman-pet-costume",
            theme: "viral_lander",
            themeColor: "#10B981",
            description: "Halloween Jack-o&#39;-lantern costume for dogs and cats",
            logo: "https://cdn.shopify.com/s/files/1/0001/products/paws.jpg",
            heroBanner: "https://cdn.shopify.com/s/files/1/0001/products/banner.jpg"
        },
        destinationMode: "new",
        setAsHomepage: false,
        slashPercent: 15,
        selectedProducts: [
            {
                id: "prod_1",
                name: "Headless Horseman Dog Rider Costume",
                price: "39.99",
                compareAtPrice: "49.99",
                image: "https://cdn.shopify.com/s/files/1/0001/products/rider.jpg",
                images: ["https://cdn.shopify.com/s/files/1/0001/products/rider.jpg"],
                category: "Pet Costumes",
                sku: "PP-HH-01"
            },
            {
                id: "prod_2",
                name: "Pumpkin King Pet Cape",
                price: 24.99,
                compareAtPrice: 0,
                image: "https://cdn.shopify.com/s/files/1/0001/products/pumpkin.jpg",
                images: [],
                category: "Pet Costumes"
            }
        ],
        selectedBanners: ["https://cdn.shopify.com/s/files/1/0001/products/banner.jpg"],
        selectedCategories: ["Pet Costumes"]
    };

    const rawSlug = payload.destinationStore.slug || payload.destinationStore.name || 'store';
    const cleanSlug = rawSlug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-') || `store-${Date.now()}`;
    const storeId = payload.destinationStore.id || `store_${cleanSlug}`;

    const storeRecord = {
        id: storeId,
        userId: storeId,
        name: (payload.destinationStore.name || cleanSlug).trim(),
        username: cleanSlug,
        description: payload.destinationStore.description || `Official store for ${payload.destinationStore.name}.`,
        logo: payload.destinationStore.logo || '',
        avatar: payload.destinationStore.logo || '',
        favicon: '',
        banner: payload.destinationStore.heroBanner || '',
        banners: payload.selectedBanners,
        categories: payload.selectedCategories,
        theme: payload.destinationStore.theme || 'viral_lander',
        themeColor: payload.destinationStore.themeColor || '#10B981',
        status: 'active',
        productsCount: payload.selectedProducts.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const savedProducts = payload.selectedProducts.map((p, idx) => {
        const prodId = `prod_${cleanSlug}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
        const rawPrice = normalizeProductPrice(p.price, { isCents: false });
        const rawCompareAt = p.compareAtPrice 
            ? normalizeProductPrice(p.compareAtPrice, { isCents: false }) 
            : (rawPrice > 0 ? Math.round(rawPrice * 1.35 * 100) / 100 : 0);

        const numSlash = parseFloat(payload.slashPercent) || 0;
        const { price, compareAtPrice: finalCompareAt } = numSlash > 0
            ? applyPriceSlash(rawPrice, numSlash, rawCompareAt)
            : { price: rawPrice, compareAtPrice: rawCompareAt };

        return {
            id: prodId,
            storeId,
            name: p.name || 'Featured Product',
            slug: (p.slug || p.name || 'product').toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
            description: p.description || storeRecord.description,
            price,
            compareAtPrice: finalCompareAt,
            currency: 'USD',
            category: p.category || 'Featured',
            image: p.image || '',
            images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image].filter(Boolean),
            tags: [],
            sku: p.sku || '',
            inStock: true,
            status: 'active',
            createdAt: new Date().toISOString()
        };
    });

    storeRecord.products = savedProducts;

    await serverSaveStore(storeRecord);
    await serverSaveProducts(storeId, savedProducts);
    await createStore(storeRecord);
    for (const prod of savedProducts) {
        await createProduct(prod);
    }
    await recordImportHistory({
        sourceUrl: 'https://phantompaws.com',
        destinationStoreName: storeRecord.name,
        destinationStoreSlug: cleanSlug,
        productsDetected: payload.selectedProducts.length,
        productsImported: savedProducts.length,
        bannersImported: payload.selectedBanners.length,
        status: 'COMPLETED'
    });

    assert(savedProducts.length === 2, '2 products mapped and saved');
    assert(savedProducts[0].compareAtPrice === 49.99, 'Product 1 compareAtPrice correctly populated at 49.99');
    assert(savedProducts[1].price < 24.99, 'Product 2 slashed by 15%');
    assert(savedProducts[1].compareAtPrice > savedProducts[1].price, 'Product 2 compareAtPrice is greater than slashed price');

    // Retrieve from serverDb
    const retrievedStore = await serverGetStore(cleanSlug);
    assert(Boolean(retrievedStore), 'Store retrieved from serverDb');
    assert(retrievedStore.username === cleanSlug, 'Store slug matches cleanSlug');

    console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

runTestSuite().catch(err => {
    console.error('Test Suite crashed:', err);
    process.exit(1);
});
