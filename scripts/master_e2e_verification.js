import assert from 'assert';
import { normalizeProductPrice, applyPriceSlash } from '../lib/importer/priceNormalizer.js';
import { serverSaveStore, serverSaveProducts, serverGetStore, serverGetAllStores, serverDeleteStore } from '../lib/serverDb.js';
import { createStore, getStore, getAllStores, createProduct, getProduct, getProductsByStore, createCoupon, getCoupon, recordImportHistory, getAllImportHistory } from '../lib/firebaseDb.js';
import { saveServerOrder, getServerOrder, getServerOrdersByStore } from '../lib/serverOrderStore.js';
import { setServerGumroadToken, getServerGumroadToken } from '../lib/serverVault.js';

console.log('======================================================================');
console.log('🏆 MASTER END-TO-END VERIFICATION & REAL-WORLD WORKFLOW SUITE');
console.log('======================================================================\n');

let totalPassed = 0;
let totalFailed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`  ✅ [PASS] ${name}`);
        totalPassed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}:`, err.message);
        totalFailed++;
    }
}

async function runMasterSuite() {
    console.log('🏢 [STAGE 1] Multi-Store Creation & Data Isolation');
    const storeAId = 'store_test_alpha_' + Date.now();
    const storeASlug = 'test-alpha-' + Date.now();
    const storeBId = 'store_test_beta_' + Date.now();
    const storeBSlug = 'test-beta-' + Date.now();

    await test('Create independent Store Alpha and Store Beta', async () => {
        const storeA = {
            id: storeAId,
            name: 'Alpha Electronics',
            username: storeASlug,
            description: 'Alpha official tech store',
            theme: 'tech_hardware',
            themeColor: '#3B82F6',
            status: 'active'
        };
        const storeB = {
            id: storeBId,
            name: 'Beta Fashion',
            username: storeBSlug,
            description: 'Beta official boutique',
            theme: 'fashion_lookbook',
            themeColor: '#EC4899',
            status: 'active'
        };

        await serverSaveStore(storeA);
        await serverSaveStore(storeB);
        await createStore(storeA);
        await createStore(storeB);

        const fetchedA = await serverGetStore(storeASlug);
        const fetchedB = await serverGetStore(storeBSlug);

        assert.ok(fetchedA, 'Store Alpha not found');
        assert.ok(fetchedB, 'Store Beta not found');
        assert.strictEqual(fetchedA.name, 'Alpha Electronics');
        assert.strictEqual(fetchedB.name, 'Beta Fashion');
    });

    await test('Store catalogs remain strictly isolated with zero leakage', async () => {
        const prodA = {
            id: 'prod_a_1_' + Date.now(),
            storeId: storeAId,
            name: 'Alpha Drone Pro',
            price: 199.99,
            compareAtPrice: 249.99,
            category: 'Drones',
            inStock: true
        };
        const prodB = {
            id: 'prod_b_1_' + Date.now(),
            storeId: storeBId,
            name: 'Beta Silk Scarf',
            price: 49.99,
            compareAtPrice: 69.99,
            category: 'Accessories',
            inStock: true
        };

        await serverSaveProducts(storeAId, [prodA]);
        await serverSaveProducts(storeBId, [prodB]);
        await createProduct(prodA);
        await createProduct(prodB);

        const prodsA = await getProductsByStore(storeAId);
        const prodsB = await getProductsByStore(storeBId);

        assert.ok(prodsA.some(p => p.id === prodA.id), 'prodA missing in store A');
        assert.ok(!prodsA.some(p => p.id === prodB.id), 'Leak: prodB found in store A');
        assert.ok(prodsB.some(p => p.id === prodB.id), 'prodB missing in store B');
        assert.ok(!prodsB.some(p => p.id === prodA.id), 'Leak: prodA found in store B');
    });

    console.log('\n🔐 [STAGE 2] Per-Store Gumroad Credentials Isolation');
    await test('Vault maintains strict token partitioning', async () => {
        await setServerGumroadToken('token_alpha_secret_123', storeASlug);
        await setServerGumroadToken('token_beta_secret_456', storeBSlug);

        const tokenA = await getServerGumroadToken(storeASlug);
        const tokenB = await getServerGumroadToken(storeBSlug);

        assert.strictEqual(tokenA, 'token_alpha_secret_123');
        assert.strictEqual(tokenB, 'token_beta_secret_456');

        await setServerGumroadToken('', storeASlug);
        const tokenAAfter = await getServerGumroadToken(storeASlug);
        const tokenBAfter = await getServerGumroadToken(storeBSlug);

        assert.strictEqual(tokenAAfter, '', 'Token A was not cleared');
        assert.strictEqual(tokenBAfter, 'token_beta_secret_456', 'Token B was corrupted by clearing Token A');
    });

    console.log('\n✂️ [STAGE 3] Price Normalization & Price Slashing');
    await test('Price Normalizer handles international decimals, currency symbols, and cents', async () => {
        assert.strictEqual(normalizeProductPrice('$129.99'), 129.99);
        assert.strictEqual(normalizeProductPrice('€ 49,99'), 49.99);
        assert.strictEqual(normalizeProductPrice('1.299,00'), 1299.00);
        assert.strictEqual(normalizeProductPrice('2999', { autoDetectCents: true }), 29.99);
        assert.strictEqual(normalizeProductPrice(null), 0);
        assert.strictEqual(normalizeProductPrice(-50), 0);
    });

    await test('applyPriceSlash computes exact strike-through discounts with $1.00 minimum floor', async () => {
        const slash25 = applyPriceSlash(100.00, 25);
        assert.strictEqual(slash25.price, 75.00);
        assert.strictEqual(slash25.compareAtPrice, 100.00);

        const slash50 = applyPriceSlash(29.99, 50, 39.99);
        assert.strictEqual(slash50.price, 15.00);
        assert.strictEqual(slash50.compareAtPrice, 39.99);

        // Floor enforcement
        const heavySlash = applyPriceSlash(2.00, 90);
        assert.strictEqual(heavySlash.price, 1.00);
    });

    console.log('\n🛒 [STAGE 4] Dynamic Checkout & Multi-Store Order Persistence');
    await test('Orders persist and partition strictly by store ID', async () => {
        const orderA = {
            id: 'ord_alpha_' + Date.now(),
            orderId: 'ord_alpha_' + Date.now(),
            storeId: storeAId,
            storeSlug: storeASlug,
            total: 199.99,
            currency: 'USD',
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            items: [{ name: 'Alpha Drone Pro', price: 199.99, quantity: 1 }]
        };
        const orderB = {
            id: 'ord_beta_' + Date.now(),
            orderId: 'ord_beta_' + Date.now(),
            storeId: storeBId,
            storeSlug: storeBSlug,
            total: 49.99,
            currency: 'USD',
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            items: [{ name: 'Beta Silk Scarf', price: 49.99, quantity: 1 }]
        };

        await saveServerOrder(orderA);
        await saveServerOrder(orderB);

        const fetchedOrderA = await getServerOrder(orderA.id);
        const fetchedOrderB = await getServerOrder(orderB.id);

        assert.ok(fetchedOrderA, 'Order A not found');
        assert.ok(fetchedOrderB, 'Order B not found');

        const ordersA = await getServerOrdersByStore(storeAId);
        const ordersB = await getServerOrdersByStore(storeBId);

        assert.ok(ordersA.some(o => o.id === orderA.id), 'Order A not in Store A list');
        assert.ok(!ordersA.some(o => o.id === orderB.id), 'Leak: Order B in Store A list');
        assert.ok(ordersB.some(o => o.id === orderB.id), 'Order B not in Store B list');
        assert.ok(!ordersB.some(o => o.id === orderA.id), 'Leak: Order A in Store B list');
    });

    console.log('\n🎟️ [STAGE 5] Coupon Architecture & Edge-Case Validation');
    await test('Create and validate store-scoped coupons', async () => {
        const couponCode = 'SAVE30_' + Date.now();
        await createCoupon({
            code: couponCode,
            description: '30% Off Store Alpha',
            discount: 30,
            type: 'percentage',
            minSpend: 50.00,
            storeId: storeAId
        });

        const retrievedCoupon = await getCoupon(couponCode);
        assert.ok(retrievedCoupon, 'Coupon not found');
        assert.strictEqual(retrievedCoupon.discount, 30);
        assert.strictEqual(retrievedCoupon.minSpend, 50.00);
        assert.strictEqual(retrievedCoupon.storeId, storeAId);
    });

    console.log('\n📜 [STAGE 6] Store Importer Ledger & History Audit');
    await test('Record and retrieve store import history', async () => {
        const impId = 'imp_test_' + Date.now();
        await recordImportHistory({
            id: impId,
            sourceUrl: 'https://competitor-store.com',
            destinationStoreName: 'Imported Brand',
            destinationStoreSlug: 'imported-brand-' + Date.now(),
            productsDetected: 24,
            productsImported: 24,
            bannersImported: 3,
            status: 'COMPLETED'
        });

        const history = await getAllImportHistory();
        assert.ok(history.some(h => h.id === impId), 'Import history entry not found');
    });

    // Clean up temporary test stores
    await serverDeleteStore(storeAId, storeASlug);
    await serverDeleteStore(storeBId, storeBSlug);

    console.log('\n======================================================================');
    console.log(`TOTAL CHECKS: ${totalPassed + totalFailed} | PASSED: ${totalPassed} | FAILED: ${totalFailed}`);
    console.log('======================================================================\n');

    if (totalFailed > 0) {
        process.exit(1);
    }
}

runMasterSuite().catch(err => {
    console.error('Master Suite Crash:', err);
    process.exit(1);
});
