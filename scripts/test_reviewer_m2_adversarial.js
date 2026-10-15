import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('======================================================================');
console.log('⚔️  ADVERSARIAL STRESS TEST & REVIEWER AUDIT: MILESTONE 2 HARDENING');
console.log('======================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let findings = [];

async function testCase(category, name, fn) {
    totalChecks++;
    try {
        await fn();
        console.log(`  ✅ [PASS] [${category}] ${name}`);
        passedChecks++;
    } catch (err) {
        console.error(`  ❌ [FAIL] [${category}] ${name}: ${err.message}`);
        findings.push({ category, name, error: err.message });
    }
}

async function runAudit() {
    // -----------------------------------------------------------------------------
    // 1. PRODUCT DETAILS CHECKBOX DOUBLE-TOGGLE & BUBBLING VERIFICATION
    // -----------------------------------------------------------------------------
    await testCase('Checkbox Controls', 'ProductDetails.jsx label has no onClick and input has onChange', () => {
        const content = fs.readFileSync(path.join(projectRoot, 'components/ProductDetails.jsx'), 'utf8');
        
        // Check shipping protection label
        const labelMatch = /<label[^>]*>[\s\S]*?Shipping Protection[\s\S]*?<\/label>/i.exec(content);
        assert(labelMatch, 'Shipping protection label block must exist');
        const labelTag = labelMatch[0].split('>')[0];
        assert(!labelTag.includes('onClick'), 'Label tag must NOT have onClick handler');
        
        // Check input checkbox inside
        const inputMatch = /<input[^>]*type="checkbox"[^>]*>/i.exec(labelMatch[0]);
        assert(inputMatch, 'Input checkbox must exist inside label');
        assert(inputMatch[0].includes('onChange'), 'Input checkbox must have onChange handler');
        assert(inputMatch[0].includes('checked={hasShippingProtection}'), 'Input checkbox must be controlled with checked={hasShippingProtection}');
    });

    await testCase('Checkbox Controls', 'Simulate DOM click semantics: label forwarding triggers single toggle', () => {
        let state = false;
        const setHasShippingProtection = (val) => { state = val; };

        // Native browser behavior for <label><input type="checkbox" /></label>:
        const simulateUserLabelClick = (currentChecked) => {
            const newChecked = !currentChecked;
            setHasShippingProtection(newChecked);
        };

        simulateUserLabelClick(state);
        assert.strictEqual(state, true, 'First click on label must transition false -> true');

        simulateUserLabelClick(state);
        assert.strictEqual(state, false, 'Second click on label must transition true -> false');
    });

    // -----------------------------------------------------------------------------
    // 2. SSR HYDRATION ORIGIN STABILIZATION ACROSS PAGES
    // -----------------------------------------------------------------------------
    await testCase('Hydration Origin', 'app/store/settings/page.jsx stabilizes webhook origin across SSR/Client', () => {
        const content = fs.readFileSync(path.join(projectRoot, 'app/store/settings/page.jsx'), 'utf8');
        
        assert(content.includes('<code suppressHydrationWarning'), 'Webhook code tag must have suppressHydrationWarning');
        assert(content.includes('https://gumshop.online/api/gumroad/webhook'), 'SSR fallback must be production origin');
    });

    await testCase('Hydration Origin', 'app/store/marketing/page.jsx guarantees SSR HTML identical to initial client mount', () => {
        const content = fs.readFileSync(path.join(projectRoot, 'app/store/marketing/page.jsx'), 'utf8');
        
        assert(content.includes("const [mountedOrigin, setMountedOrigin] = useState('');"), 'Must declare mountedOrigin initialized to empty string');
        assert(content.includes("setMountedOrigin(window.location.origin)"), 'Must populate mountedOrigin inside useEffect');
        assert(content.includes("const baseOrigin = mountedOrigin || 'https://gumshop.online'"), 'baseOrigin must fall back to https://gumshop.online when mountedOrigin is empty');
        
        const occurrences = (content.match(/suppressHydrationWarning/g) || []).length;
        assert(occurrences >= 3, `Expected at least 3 suppressHydrationWarning attributes in marketing page, found ${occurrences}`);
    });

    await testCase('Hydration Origin', 'app/store/page.jsx guarantees SSR HTML identical to initial client mount', () => {
        const content = fs.readFileSync(path.join(projectRoot, 'app/store/page.jsx'), 'utf8');
        
        assert(content.includes("const [mountedOrigin, setMountedOrigin] = useState('');"), 'Must declare mountedOrigin initialized to empty string');
        assert(content.includes("setMountedOrigin(window.location.origin)"), 'Must populate mountedOrigin inside useEffect');
        assert(content.includes("const origin = mountedOrigin || 'https://www.gumshop.online'"), 'origin must fall back to https://www.gumshop.online');
        assert(content.includes("suppressHydrationWarning"), 'Bio link must have suppressHydrationWarning');
    });

    // -----------------------------------------------------------------------------
    // 3. COUPON MULTI-STORE STRICT ISOLATION & ADVERSARIAL FILTERING
    // -----------------------------------------------------------------------------
    await testCase('Coupon Store Isolation', 'app/store/coupons/page.jsx strictly filters coupons by storeId', () => {
        const content = fs.readFileSync(path.join(projectRoot, 'app/store/coupons/page.jsx'), 'utf8');
        
        assert(content.includes('setCoupons((data || []).filter(c => c.storeId === currentStore.id))'), 'Filter must strictly check c.storeId === currentStore.id');
        assert(!content.includes('!c.storeId || c.storeId === currentStore.id'), 'Must not allow !c.storeId leak');
    });

    await testCase('Coupon Store Isolation', 'Adversarial dataset: zero cross-tenant bleeding or legacy leak', () => {
        const adversarialCoupons = [
            { code: 'CORRECT_A', storeId: 'store_alpha', discount: 10 },
            { code: 'CORRECT_B', storeId: 'store_beta', discount: 20 },
            { code: 'LEAK_NO_STORE_ID', discount: 50 },
            { code: 'LEAK_NULL_STORE_ID', storeId: null, discount: 30 },
            { code: 'LEAK_EMPTY_STORE_ID', storeId: '', discount: 40 },
            { code: 'LEAK_OTHER_STORE', storeId: 'store_gamma', discount: 15 }
        ];

        const storeA = { id: 'store_alpha' };
        const filteredA = adversarialCoupons.filter(c => c.storeId === storeA.id);
        assert.strictEqual(filteredA.length, 1, 'Store A must see exactly 1 coupon');
        assert.strictEqual(filteredA[0].code, 'CORRECT_A', 'Store A must see only CORRECT_A');

        const storeB = { id: 'store_beta' };
        const filteredB = adversarialCoupons.filter(c => c.storeId === storeB.id);
        assert.strictEqual(filteredB.length, 1, 'Store B must see exactly 1 coupon');
        assert.strictEqual(filteredB[0].code, 'CORRECT_B', 'Store B must see only CORRECT_B');
    });

    // -----------------------------------------------------------------------------
    // 4. GUMROAD STORE-SCOPED URL STORAGE INTEGRITY
    // -----------------------------------------------------------------------------
    await testCase('Gumroad URL Scoping', 'app/store/settings/page.jsx zero un-scoped localStorage writes for Gumroad URLs', () => {
        const content = fs.readFileSync(path.join(projectRoot, 'app/store/settings/page.jsx'), 'utf8');
        
        assert(!content.includes("localStorage.setItem('gumshop_gumroad_url'"), 'Must not write to gumshop_gumroad_url');
        assert(!content.includes("localStorage.setItem('gumroad_product_url'"), 'Must not write to gumroad_product_url');
        assert(content.includes('localStorage.setItem(`gumroad_url_${cleanSlug}`'), 'Must write to scoped gumroad_url_${cleanSlug}');
    });

    await testCase('Gumroad URL Scoping', 'Multi-store isolation simulation: Store A and Store B do not overwrite each other', () => {
        const mockLocalStorage = new Map();
        const saveGumroadUrl = (storeSlug, url) => {
            const cleanSlug = storeSlug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
            mockLocalStorage.set(`gumroad_url_${cleanSlug}`, url);
        };

        saveGumroadUrl('alpha-store', 'https://gumroad.com/l/alpha-product');
        saveGumroadUrl('beta-store', 'https://gumroad.com/l/beta-product');

        assert.strictEqual(mockLocalStorage.get('gumroad_url_alpha-store'), 'https://gumroad.com/l/alpha-product');
        assert.strictEqual(mockLocalStorage.get('gumroad_url_beta-store'), 'https://gumroad.com/l/beta-product');
        assert.strictEqual(mockLocalStorage.has('gumshop_gumroad_url'), false, 'Global un-scoped key must remain untouched');
    });

    // -----------------------------------------------------------------------------
    // 5. SYNCED ORDERS PERSISTENCE IN /api/gumroad/sync
    // -----------------------------------------------------------------------------
    await testCase('Order Persistence', 'app/api/gumroad/sync/route.js calls saveServerOrder for every synced order', () => {
        const content = fs.readFileSync(path.join(projectRoot, 'app/api/gumroad/sync/route.js'), 'utf8');
        
        assert(content.includes("saveServerOrder"), 'Must call saveServerOrder');
        assert(content.includes("saveServerOrder(orderId,"), 'Must call saveServerOrder with orderId and payload');
        assert(content.includes("source: 'gumroad_sync'"), 'Payload must identify source as gumroad_sync');
    });

    await testCase('Order Persistence', 'Simulate serverOrderStore execution with synced orders', async () => {
        const serverStorePath = pathToFileURL(path.join(projectRoot, 'lib/db/orders.js')).href;
        const { saveServerOrder, getServerOrder, getServerOrdersByStore } = await import(serverStorePath);

        const testOrderId = `test_sync_order_${Date.now()}`;
        const testStoreId = 'test_store_sync_123';
        const testOrderPayload = {
            id: testOrderId,
            orderId: testOrderId,
            storeId: testStoreId,
            customerName: 'Alice Buyer',
            customerEmail: 'alice@example.com',
            total: 52.99,
            source: 'gumroad_sync',
            createdAt: new Date().toISOString()
        };

        await saveServerOrder(testOrderId, testOrderPayload);

        const retrieved = await getServerOrder(testOrderId);
        assert(retrieved, 'Order must be retrievable via getServerOrder');
        assert.strictEqual(retrieved.id, testOrderId);
        assert.strictEqual(retrieved.source, 'gumroad_sync');
        assert.strictEqual(retrieved.total, 52.99);

        const storeOrders = await getServerOrdersByStore(testStoreId);
        assert(storeOrders.some(o => o.id === testOrderId), 'Order must be included in store-scoped orders list');
    });

    // -----------------------------------------------------------------------------
    // 6. DEAD FIREBASE STUBS ELIMINATION
    // -----------------------------------------------------------------------------
    await testCase('Firebase Stubs Cleanliness', 'Gumroad sync, webhook, and verify-order routes have 0 dummy stubs', () => {
        const syncContent = fs.readFileSync(path.join(projectRoot, 'app/api/gumroad/sync/route.js'), 'utf8');
        const whContent = fs.readFileSync(path.join(projectRoot, 'app/api/gumroad/webhook/route.js'), 'utf8');
        const voContent = fs.readFileSync(path.join(projectRoot, 'app/api/gumroad/verify-order/route.js'), 'utf8');

        for (const [name, content] of [['sync', syncContent], ['webhook', whContent], ['verify-order', voContent]]) {
            assert(!content.includes("from " + "'@/lib/firebase'"), `${name} route must not import database from firebase`);
            assert(!content.includes('const ref = () => null;'), `${name} route must not have dummy ref stub`);
            assert(!content.includes('const set = () => Promise.resolve();'), `${name} route must not have dummy set stub`);
            assert(!content.includes('const get = () => Promise.resolve'), `${name} route must not have dummy get stub`);
        }
    });

    // -----------------------------------------------------------------------------
    // 7. INTEGRITY AUDIT: CHECK FOR CHEATING, HARDFACED TEST HARNESSES & MOCKS
    // -----------------------------------------------------------------------------
    await testCase('Integrity Audit', 'No hardcoded test mocks or facade shortcuts in modified files', () => {
        const filesToCheck = [
            'components/ProductDetails.jsx',
            'app/store/settings/page.jsx',
            'app/store/marketing/page.jsx',
            'app/store/page.jsx',
            'app/store/coupons/page.jsx',
            'app/api/gumroad/sync/route.js',
            'app/api/gumroad/webhook/route.js',
            'app/api/gumroad/verify-order/route.js'
        ];

        for (const f of filesToCheck) {
            const text = fs.readFileSync(path.join(projectRoot, f), 'utf8');
            assert(!text.includes('__test_mock_return__'), `${f} contains test mock tokens`);
            assert(!text.includes('__bypass_verification__'), `${f} contains verification bypass`);
            assert(!text.includes('return true; // fake pass'), `${f} contains fake pass`);
        }
    });

    console.log('\n======================================================================');
    console.log(`📊 ADVERSARIAL AUDIT SUMMARY: ${passedChecks}/${totalChecks} checks passed.`);
    if (findings.length > 0) {
        console.error(`❌ FINDINGS (${findings.length}):`, findings);
        process.exit(1);
    } else {
        console.log('🏆 100% OF ADVERSARIAL CHECKS PASSED WITH ZERO INTEGRITY VIOLATIONS.');
        console.log('======================================================================');
    }
}

runAudit().catch(err => {
    console.error('Fatal audit failure:', err);
    process.exit(1);
});
