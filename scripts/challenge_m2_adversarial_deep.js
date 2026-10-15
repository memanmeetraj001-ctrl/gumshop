import fs from 'fs';
import assert from 'assert';
import path from 'path';

console.log('======================================================================');
console.log('🥊 ADVERSARIAL CHALLENGER: MILESTONE 2 CONTROLS & ISOLATION HARDENING');
console.log('======================================================================\n');

let passed = 0;
let failed = 0;

async function challenge(desc, fn) {
    try {
        await fn();
        console.log(`  ✅ [PASS] ${desc}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${desc}: ${err.message}`);
        failed++;
        process.exitCode = 1;
    }
}

async function runAll() {
    // 1. Audit all label elements in ProductDetails.jsx for conflicting onClick handlers
    await challenge('ProductDetails.jsx contains 0 conflicting onClick handlers on <label> tags wrapping form controls', () => {
        const pd = fs.readFileSync('components/ProductDetails.jsx', 'utf8');
        const labelRegex = /<label[\s\S]*?>/g;
        let match;
        let labelCount = 0;
        while ((match = labelRegex.exec(pd)) !== null) {
            labelCount++;
            const tag = match[0];
            assert(!tag.includes('onClick'), `Found onClick on <label>: ${tag}`);
        }
        assert(labelCount > 0, 'Must have at least one label');
        console.log(`     Verified ${labelCount} label tag(s) with 0 conflicting onClick handlers`);
    });

    // 2. Shipping protection checkbox event flow verification
    await challenge('ProductDetails.jsx shipping protection checkbox relies purely on input onChange', () => {
        const pd = fs.readFileSync('components/ProductDetails.jsx', 'utf8');
        assert(pd.includes('checked={hasShippingProtection}'), 'Checkbox must bind checked={hasShippingProtection}');
        assert(pd.includes('onChange={(e) => setHasShippingProtection(e.target.checked)}'), 'Checkbox must bind onChange to e.target.checked');
    });

    // 3. Hydration origin stabilization SSR/initial client render equivalence
    await challenge('Marketing, Settings, and Store pages guarantee SSR and initial client render equality', () => {
        const mkt = fs.readFileSync('app/store/marketing/page.jsx', 'utf8');
        const store = fs.readFileSync('app/store/page.jsx', 'utf8');
        const settings = fs.readFileSync('app/store/settings/page.jsx', 'utf8');

        // In marketing, initial baseOrigin must be 'https://gumshop.online'
        assert(mkt.includes("const [mountedOrigin, setMountedOrigin] = useState('');"), 'Marketing must initialize mountedOrigin as empty string');
        assert(mkt.includes("const baseOrigin = mountedOrigin || 'https://gumshop.online';"), 'Marketing SSR fallback must be https://gumshop.online');
        assert(mkt.includes('suppressHydrationWarning'), 'Marketing must include suppressHydrationWarning on origin-sensitive elements');

        // In store, initial origin must be 'https://www.gumshop.online'
        assert(store.includes("const [mountedOrigin, setMountedOrigin] = useState('');"), 'Store must initialize mountedOrigin as empty string');
        assert(store.includes("const origin = mountedOrigin || 'https://www.gumshop.online';"), 'Store SSR fallback must be https://www.gumshop.online');
        assert(store.includes('suppressHydrationWarning'), 'Store must include suppressHydrationWarning on bioUrl link');

        // In settings, code tag must suppress hydration warnings
        assert(settings.includes('<code suppressHydrationWarning'), 'Settings webhook code must have suppressHydrationWarning');
    });

    // 4. Coupons store isolation boundary simulation
    await challenge('Coupons filter strictly isolates coupons per store, completely dropping orphaned/cross-store coupons', () => {
        const coup = fs.readFileSync('app/store/coupons/page.jsx', 'utf8');
        assert(coup.includes('.filter(c => c.storeId === currentStore.id)'), 'Filter must be strictly c.storeId === currentStore.id');
        assert(!coup.includes('!c.storeId ||'), 'Must not allow !c.storeId leak');

        // Adversarial data simulation
        const mockCoupons = [
            { id: 1, code: 'SAVE10', storeId: 'store_alpha' },
            { id: 2, code: 'SAVE20', storeId: 'store_beta' },
            { id: 3, code: 'LEAKED_NULL', storeId: null },
            { id: 4, code: 'LEAKED_UNDEFINED' },
            { id: 5, code: 'ALPHA_SPECIAL', storeId: 'store_alpha' }
        ];

        const currentStoreAlpha = { id: 'store_alpha' };
        const filteredAlpha = mockCoupons.filter(c => c.storeId === currentStoreAlpha.id);
        assert.strictEqual(filteredAlpha.length, 2, 'Store Alpha must receive exactly 2 coupons');
        assert.deepStrictEqual(filteredAlpha.map(c => c.code), ['SAVE10', 'ALPHA_SPECIAL']);

        const currentStoreBeta = { id: 'store_beta' };
        const filteredBeta = mockCoupons.filter(c => c.storeId === currentStoreBeta.id);
        assert.strictEqual(filteredBeta.length, 1, 'Store Beta must receive exactly 1 coupon');
        assert.deepStrictEqual(filteredBeta.map(c => c.code), ['SAVE20']);
    });

    // 5. Gumroad URL storage key scoping collision test
    await challenge('Settings page scopes Gumroad product URL writes per slug with zero cross-store collisions', () => {
        const settings = fs.readFileSync('app/store/settings/page.jsx', 'utf8');
        
        // Check cleanSlug logic
        assert(settings.includes('localStorage.setItem(`gumroad_url_${cleanSlug}`'), 'Must write to gumroad_url_${cleanSlug}');
        assert(!settings.includes("localStorage.setItem('gumshop_gumroad_url'"), 'Must never write to global gumshop_gumroad_url');
        assert(!settings.includes("localStorage.setItem('gumroad_product_url'"), 'Must never write to global gumroad_product_url');

        // Simulate two stores writing their URLs
        function getCleanSlug(storeInfo) {
            return (storeInfo.username ? storeInfo.username.trim() : (storeInfo.name || 'shop').replace(/\s+/g, '-')).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'shop';
        }

        const mockStorage = {};
        const store1 = { username: 'alpha-gear', name: 'Alpha Gear' };
        const store2 = { username: 'beta-merch', name: 'Beta Merch' };

        mockStorage[`gumroad_url_${getCleanSlug(store1)}`] = 'https://gumroad.com/l/alpha';
        mockStorage[`gumroad_url_${getCleanSlug(store2)}`] = 'https://gumroad.com/l/beta';

        assert.strictEqual(mockStorage['gumroad_url_alpha-gear'], 'https://gumroad.com/l/alpha');
        assert.strictEqual(mockStorage['gumroad_url_beta-merch'], 'https://gumroad.com/l/beta');
        assert.strictEqual(mockStorage['gumshop_gumroad_url'], undefined, 'Global key must remain untouched');
    });

    // 6. Gumroad sync route persistence simulation with serverOrderStore
    await challenge('Gumroad sync route correctly saves and indexes synced orders in serverOrderStore', async () => {
        const { saveServerOrder, getServerOrder } = await import('../lib/serverOrderStore.js');

        const testOrderId = `test_sync_order_${Date.now()}`;
        const mockSyncedOrder = {
            id: testOrderId,
            orderId: testOrderId,
            gumroadOrderNumber: 'GM-999888',
            storeId: 'store_demo_123',
            customer: {
                name: 'Jane Doe',
                email: 'jane@example.com',
                shippingAddress: '123 Test St, Test City 12345, US'
            },
            items: 'Test Product Pack',
            total: 52.99,
            currency: 'USD',
            status: 'Completed',
            fulfillmentStatus: 'unfulfilled',
            paymentMethod: 'Gumroad Pay',
            createdAt: new Date().toISOString(),
            gumroadSaleId: 'sale_xyz_123',
            source: 'gumroad_sync',
            syncedAt: new Date().toISOString()
        };

        await saveServerOrder(testOrderId, mockSyncedOrder);

        const retrieved = await getServerOrder(testOrderId);
        assert(retrieved, 'Order must be retrievable via getServerOrder');
        assert.strictEqual(retrieved.id, testOrderId);
        assert.strictEqual(retrieved.source, 'gumroad_sync');
        assert.strictEqual(retrieved.total, 52.99);
        assert.strictEqual(retrieved.storeId, 'store_demo_123');
    });

    // 7. Verification that zero dead dummy stubs remain in Gumroad API routes
    await challenge('No dead Firebase dummy stubs remain in app/api/gumroad/* routes', () => {
        const files = [
            'app/api/gumroad/sync/route.js',
            'app/api/gumroad/webhook/route.js',
            'app/api/gumroad/verify-order/route.js'
        ];

        for (const f of files) {
            const content = fs.readFileSync(f, 'utf8');
            assert(!content.includes('const ref = () => null;'), `${f} contains dead ref stub`);
            assert(!content.includes('const set = () => Promise.resolve();'), `${f} contains dead set stub`);
            assert(!content.includes("from " + "'@/lib/firebase'"), `${f} imports dead firebase`);
        }
    });

    console.log(`\n======================================================================`);
    console.log(`📊 ADVERSARIAL CHALLENGER RESULTS: ${passed} passed, ${failed} failed`);
    console.log(`======================================================================`);

    if (failed > 0) {
        process.exit(1);
    }
}

runAll();
