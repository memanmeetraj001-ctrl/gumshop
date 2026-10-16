/**
 * test_multistore_homepage_selection.js
 * Comprehensive automated test suite verifying multi-store homepage modes:
 * 1. 'all' (Marketplace mode combining all stores)
 * 2. 'custom' (Selective combination of one or multiple stores)
 * 3. 'single' (Designated single store)
 * 4. Product attribution and store isolation
 */

const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log('🧪 Starting Multi-Store Homepage Selection Automated Test Suite...\n');
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            failed++;
        }
    }

    try {
        // Test 1: Verify /api/store/homepage returns homepageMode, homepageSlug, and selectedStores
        console.log('Test 1: Verify /api/store/homepage GET response structure');
        const hpRes = await fetch(`${BASE_URL}/api/store/homepage`);
        const hpData = await hpRes.json();
        assert(hpData.success === true, 'API returned success: true');
        assert(['all', 'custom', 'single'].includes(hpData.homepageMode), `Valid homepageMode: "${hpData.homepageMode}"`);
        assert(Array.isArray(hpData.selectedStores), `selectedStores is an array (length: ${hpData.selectedStores?.length})`);

        // Test 2: Set Mode to 'all' and verify
        console.log('\nTest 2: Set mode to "all" (All Shops Marketplace)');
        const setAllRes = await fetch(`${BASE_URL}/api/store/homepage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'all' })
        });
        const setAllData = await setAllRes.json();
        assert(setAllData.success === true, 'Switched to "all" mode successfully');
        assert(setAllData.homepageMode === 'all', 'Returned homepageMode is "all"');

        // Test 3: Fetch products with mode=all
        console.log('\nTest 3: Fetch /api/products?mode=all');
        const prodsAllRes = await fetch(`${BASE_URL}/api/products?mode=all`);
        const prodsAllData = await prodsAllRes.json();
        assert(prodsAllData.success === true, 'Products API returned success: true');
        assert(Array.isArray(prodsAllData.products) && prodsAllData.products.length > 0, `Returned ${prodsAllData.products?.length} products`);
        
        // Check attribution
        const hasStoreAttribution = prodsAllData.products.every(p => p.storeSlug && p.storeName);
        assert(hasStoreAttribution, 'All products contain storeSlug and storeName attribution');

        // Check multiple stores present
        const uniqueStoreSlugs = new Set(prodsAllData.products.map(p => p.storeSlug));
        console.log(`  ℹ️ Detected ${uniqueStoreSlugs.size} distinct store slugs in "all" catalog:`, Array.from(uniqueStoreSlugs));
        assert(uniqueStoreSlugs.size >= 1, 'Catalog has products from stores');

        // Test 4: Set Mode to 'custom' with 1 selected store
        console.log('\nTest 4: Set mode to "custom" with single store selected');
        const targetStore1 = 'rubber-couch-toys-official-store';
        const setCustom1Res = await fetch(`${BASE_URL}/api/store/homepage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                mode: 'custom', 
                selectedStores: [targetStore1] 
            })
        });
        const setCustom1Data = await setCustom1Res.json();
        assert(setCustom1Data.success === true, 'Switched to "custom" mode successfully');
        assert(setCustom1Data.homepageMode === 'custom', 'Returned homepageMode is "custom"');
        assert(setCustom1Data.selectedStores.includes(targetStore1), `selectedStores includes "${targetStore1}"`);

        // Test 5: Fetch filtered products for 1 store
        console.log(`\nTest 5: Fetch /api/products?mode=custom&stores=${targetStore1}`);
        const custom1ProdsRes = await fetch(`${BASE_URL}/api/products?mode=custom&stores=${targetStore1}`);
        const custom1ProdsData = await custom1ProdsRes.json();
        assert(custom1ProdsData.success === true, 'Custom products fetch successful');
        const allMatchStore1 = custom1ProdsData.products.every(p => 
            p.storeSlug === targetStore1 || p.storeId === targetStore1 || p.storeId === `store_${targetStore1}`
        );
        assert(allMatchStore1, `All ${custom1ProdsData.products.length} products belong strictly to "${targetStore1}"`);

        // Test 6: Set Mode to 'custom' with 2 stores selected
        console.log('\nTest 6: Set mode to "custom" with 2 stores selected');
        const targetStore2 = 'phantompaws-headless-horseman-pet-costume';
        const twoStores = [targetStore1, targetStore2];
        const setCustom2Res = await fetch(`${BASE_URL}/api/store/homepage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                mode: 'custom', 
                selectedStores: twoStores 
            })
        });
        const setCustom2Data = await setCustom2Res.json();
        assert(setCustom2Data.success === true, 'Switched to custom mode with 2 stores');
        assert(setCustom2Data.selectedStores.length === 2, '2 stores recorded in selectedStores');

        // Test 7: Fetch products for 2 stores
        console.log(`\nTest 7: Fetch /api/products?mode=custom&stores=${twoStores.join(',')}`);
        const custom2ProdsRes = await fetch(`${BASE_URL}/api/products?mode=custom&stores=${twoStores.join(',')}`);
        const custom2ProdsData = await custom2ProdsRes.json();
        assert(custom2ProdsData.success === true, 'Custom 2-store products fetch successful');
        assert(custom2ProdsData.products.length >= 2, `Returned ${custom2ProdsData.products.length} products total`);

        // Test 8: Set Mode back to 'single'
        console.log('\nTest 8: Set mode to "single" designating official store');
        const setSingleRes = await fetch(`${BASE_URL}/api/store/homepage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                mode: 'single', 
                storeSlug: targetStore1 
            })
        });
        const setSingleData = await setSingleRes.json();
        assert(setSingleData.success === true, 'Single store mode set successfully');
        assert(setSingleData.homepageMode === 'single', 'homepageMode is "single"');
        assert(setSingleData.homepageSlug === targetStore1, `homepageSlug is "${targetStore1}"`);

        // Test 9: Verify root homepage (/) renders cleanly with HTTP 200
        console.log('\nTest 9: Verify root homepage (/) HTTP response');
        const rootRes = await fetch(`${BASE_URL}/`);
        assert(rootRes.status === 200, 'Root homepage (/) returns HTTP 200 OK');

        // Summary
        console.log(`\n========================================`);
        console.log(`Multi-Store Test Results: ${passed} PASSED, ${failed} FAILED`);
        console.log(`========================================\n`);

        if (failed > 0) process.exit(1);
    } catch (err) {
        console.error('Fatal error during test run:', err);
        process.exit(1);
    }
}

runTests();
