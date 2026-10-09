// End-to-End User Simulation: Clone vibenest.life, Configure Payment, Test Stan Store & Main Storefront & Checkout
const BASE_URL = 'https://www.gumshop.online';

async function runSimulation() {
    console.log('============================================================');
    console.log('🧑‍💻 USER SIMULATION: CLONING VIBENEST.LIFE & TESTING E2E FLOW');
    console.log('Target:', BASE_URL);
    console.log('============================================================\n');

    // 1. Step 1: User analyzes vibenest.life
    console.log('🔍 [STEP 1] User analyzes store: https://www.vibenest.life/');
    const analyzeRes = await fetch(`${BASE_URL}/api/importer/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.vibenest.life/' })
    });
    const analyzeData = await analyzeRes.json();
    console.log('   Analyze Response Status:', analyzeRes.status);
    console.log('   Success:', analyzeData.success);
    if (!analyzeData.success) {
        console.error('   ❌ Error:', analyzeData.error);
        return;
    }

    console.log(`   Found Store: "${analyzeData.store?.name}" (${analyzeData.products?.length || 0} products, ${analyzeData.banners?.length || 0} banners)`);
    if (analyzeData.products && analyzeData.products.length > 0) {
        console.log(`   Sample Product: "${analyzeData.products[0].name}" - $${analyzeData.products[0].price}`);
    }

    // 2. Step 2: User imports / clones the store as "vibenest"
    console.log('\n📥 [STEP 2] User imports store into GumShop as "vibenest"');
    const importPayload = {
        destinationStore: {
            name: analyzeData.store?.name || 'Vibenest Store',
            slug: 'vibenest',
            username: 'vibenest',
            theme: 'tech_hardware',
            themeColor: '#10B981',
            heroBanner: analyzeData.banners?.[0] || '',
            description: 'Vibenest official high-performance cables and lifestyle accessories'
        },
        destinationMode: 'new',
        setAsHomepage: false,
        selectedProducts: analyzeData.products || [],
        selectedBanners: analyzeData.banners || [],
        selectedCategories: analyzeData.categories || []
    };

    const importRes = await fetch(`${BASE_URL}/api/importer/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importPayload)
    });
    const importData = await importRes.json();
    console.log('   Import Response Status:', importRes.status);
    console.log('   Success:', importData.success);
    if (!importData.success) {
        console.error('   ❌ Import Error:', importData.error);
        return;
    }
    console.log(`   ✅ Cloned store created with ${importData.productsCount ?? (importData.importedCount || 0)} products! Store ID: ${importData.store?.id || importData.storeId}`);

    // 3. Step 3: User configures payment (Merchant token setup)
    console.log('\n💳 [STEP 3] User configures payment integration for vibenest');
    const paymentConfigRes = await fetch(`${BASE_URL}/api/store/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            storeSlug: 'vibenest',
            gumroadToken: 'gumroad_merchant_live_vibenest_token_2026',
            currency: 'USD'
        })
    });
    console.log('   Payment Config Status:', paymentConfigRes.status);

    // 4. Step 4: Customer visits Stan Store link-in-bio (/creator/vibenest)
    console.log('\n📱 [STEP 4] Customer visits Stan Store Link-In-Bio: /creator/vibenest');
    const stanRes = await fetch(`${BASE_URL}/creator/vibenest`);
    console.log('   Stan Store HTTP Status:', stanRes.status);
    const stanHtml = await stanRes.text();
    const hasVibenestInStan = stanHtml.includes('vibenest') || stanHtml.includes('Vibenest');
    console.log('   Stan Store contains store brand:', hasVibenestInStan ? '✅ YES' : '❌ NO');

    // 5. Step 5: Customer visits Main Grid Storefront (/shop/vibenest)
    console.log('\n🛍️ [STEP 5] Customer visits Main Grid Storefront: /shop/vibenest');
    const shopRes = await fetch(`${BASE_URL}/shop/vibenest`);
    console.log('   Shop Storefront HTTP Status:', shopRes.status);
    const shopHtml = await shopRes.text();
    const hasVibenestInShop = shopHtml.includes('vibenest') || shopHtml.includes('Vibenest');
    console.log('   Shop contains store brand:', hasVibenestInShop ? '✅ YES' : '❌ NO');

    // 6. Step 6: Customer adds a product to cart and initiates dynamic checkout
    console.log('\n🛒 [STEP 6] Customer tests Dynamic Checkout for product');
    const sampleProduct = (importData.store?.products || analyzeData.products || [])[0];
    const checkoutPayload = {
        cartItems: {
            [sampleProduct?.id || 'sample_prod_1']: 1
        },
        items: [{
            id: sampleProduct?.id || 'sample_prod_1',
            title: sampleProduct?.name || 'Smart Charger Plus',
            price: Number(sampleProduct?.price || 19.99),
            quantity: 1,
            images: sampleProduct?.images || []
        }],
        totalAmount: Number(sampleProduct?.price || 19.99),
        storeSlug: 'vibenest',
        customer: {
            email: 'customer.test@example.com',
            name: 'Jane Doe',
            address: '123 Market St, San Francisco, CA'
        }
    };

    const checkoutRes = await fetch(`${BASE_URL}/api/gumroad/dynamic-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload)
    });
    const checkoutData = await checkoutRes.json();
    console.log('   Checkout Response Status:', checkoutRes.status);
    console.log('   Checkout Order Generated:', checkoutData.success ? '✅ YES' : '❌ NO');
    if (checkoutData.orderId) {
        console.log(`   Created Order ID: ${checkoutData.orderId}`);
        console.log(`   Checkout / Redirect URL: ${checkoutData.checkoutUrl || checkoutData.redirectUrl || 'Self-hosted direct'}`);
    }

    console.log('\n============================================================');
    console.log('🎉 END-TO-END FLOW SUMMARY:');
    console.log('   1. Store Analysis:    ', analyzeData.success ? 'PASSED ✅' : 'FAILED ❌');
    console.log('   2. Store Import:      ', importData.success ? 'PASSED ✅' : 'FAILED ❌');
    console.log('   3. Stan Storefront:   ', stanRes.status === 200 ? 'PASSED ✅' : 'FAILED ❌');
    console.log('   4. Main Storefront:   ', shopRes.status === 200 ? 'PASSED ✅' : 'FAILED ❌');
    console.log('   5. Dynamic Checkout:  ', checkoutData.success ? 'PASSED ✅' : 'FAILED ❌');
    console.log('============================================================');
}

runSimulation().catch(console.error);
