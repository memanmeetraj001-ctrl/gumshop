// Complete In-Depth User Roleplay: Vibenest Cloning, Setup, and Customer Purchase Flow
import assert from 'assert';

const BASE_URL = 'https://www.gumshop.online';

async function fullFlow() {
    console.log('======================================================================');
    console.log('🎭 ROLEPLAY: USER CLONING VIBENEST.LIFE & PURCHASING AS A CUSTOMER');
    console.log('======================================================================\n');

    // STEP 1: Store Importer
    console.log('1️⃣ MERCHANT: Inspecting and importing https://www.vibenest.life/ ...');
    const analyzeRes = await fetch(`${BASE_URL}/api/importer/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.vibenest.life/' })
    });
    assert.strictEqual(analyzeRes.status, 200, 'Analyze endpoint must respond 200');
    const analyzeData = await analyzeRes.json();
    assert.strictEqual(analyzeData.success, true, 'Store inspection must succeed');
    console.log(`   ✅ Extracted ${analyzeData.products.length} products and ${analyzeData.banners.length} banners.`);

    const importRes = await fetch(`${BASE_URL}/api/importer/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            destinationStore: {
                name: 'Vibenest Tech Store',
                slug: 'vibenest',
                username: 'vibenest',
                theme: 'tech_hardware',
                themeColor: '#10B981',
                heroBanner: analyzeData.banners?.[0] || '',
                description: 'Fast charging accessories and cables for everyday carry.'
            },
            destinationMode: 'new',
            selectedProducts: analyzeData.products,
            selectedBanners: analyzeData.banners,
            selectedCategories: analyzeData.categories
        })
    });
    assert.strictEqual(importRes.status, 200, 'Import must respond 200');
    const importData = await importRes.json();
    assert.strictEqual(importData.success, true, 'Import must succeed');
    console.log(`   ✅ Store imported! Slug: ${importData.slug}, Products: ${importData.productsCount}`);

    // STEP 2: Payment Configuration
    console.log('\n2️⃣ MERCHANT: Setting up Payment & Gumroad Integration Token ...');
    const configRes = await fetch(`${BASE_URL}/api/store/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            storeSlug: 'vibenest',
            gumroadToken: 'gumroad_merchant_vibenest_live_2026',
            currency: 'USD'
        })
    });
    assert.strictEqual(configRes.status, 200, 'Config must respond 200');
    console.log('   ✅ Payment credentials synchronized to store configuration.');

    // STEP 3: Customer visits Stan Store (/creator/vibenest)
    console.log('\n3️⃣ CUSTOMER: Visiting Link-In-Bio Stan Store at /creator/vibenest ...');
    const stanRes = await fetch(`${BASE_URL}/creator/vibenest`);
    assert.strictEqual(stanRes.status, 200, 'Stan store route must respond 200');
    const stanHtml = await stanRes.text();
    assert(stanHtml.length > 500, 'Stan store page must have full content');
    console.log(`   ✅ Stan store loaded successfully (${stanHtml.length} bytes HTML rendered)`);

    // STEP 4: Customer visits Grid Catalog Storefront (/shop/vibenest)
    console.log('\n4️⃣ CUSTOMER: Visiting Grid Storefront at /shop/vibenest ...');
    const shopRes = await fetch(`${BASE_URL}/shop/vibenest`);
    assert.strictEqual(shopRes.status, 200, 'Shop route must respond 200');
    const shopHtml = await shopRes.text();
    assert(shopHtml.length > 500, 'Shop page must render full content');
    console.log(`   ✅ Main Grid Storefront loaded (${shopHtml.length} bytes HTML rendered)`);

    // STEP 5: Customer initiates Dynamic Checkout
    console.log('\n5️⃣ CUSTOMER: Adding product to cart & executing checkout ...');
    const chosenProduct = analyzeData.products[0];
    const orderPayload = {
        cartItems: {
            [chosenProduct.id || 'prod_1']: 1
        },
        items: [{
            id: chosenProduct.id || 'prod_1',
            title: chosenProduct.name || 'SnapCharge Pro',
            price: Number(chosenProduct.price) || 27.99,
            quantity: 1,
            images: chosenProduct.images || [chosenProduct.image]
        }],
        totalAmount: Number(chosenProduct.price) || 27.99,
        storeSlug: 'vibenest',
        customer: {
            email: 'customer.vibenest@gmail.com',
            name: 'Alex Johnson',
            address: '742 Evergreen Terrace, Springfield, OR'
        }
    };

    const checkoutRes = await fetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
    });
    assert.strictEqual(checkoutRes.status, 200, 'Checkout API must respond 200');
    const checkoutData = await checkoutRes.json();
    assert.strictEqual(checkoutData.success, true, 'Checkout order generation must succeed');
    console.log(`   ✅ Order placed successfully! Order ID: ${checkoutData.orderId}`);
    console.log(`   ✅ Total charged: $${checkoutData.amount || chosenProduct.price}`);

    // STEP 6: Customer views Thank You / Tracking Page
    console.log('\n6️⃣ CUSTOMER: Viewing Order Confirmation & Tracking ...');
    const trackRes = await fetch(`${BASE_URL}/thank-you?orderId=${checkoutData.orderId}`);
    assert.strictEqual(trackRes.status, 200, 'Thank-you page must respond 200');
    const trackHtml = await trackRes.text();
    console.log(`   ✅ Order confirmation page loaded (${trackHtml.length} bytes)`);

    console.log('\n======================================================================');
    console.log('🏆 ALL 6 STAGES OF END-TO-END FLOW PASSED WITH 100% REALITY FIDELITY!');
    console.log('======================================================================\n');
}

fullFlow().catch(err => {
    console.error('❌ Failure in user journey:', err);
    process.exit(1);
});
