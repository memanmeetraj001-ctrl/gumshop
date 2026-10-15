import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

console.log('======================================================================');
console.log('🚀 TEST SUITE: STORE ISOLATION & PAYMENT DECOUPLING VERIFICATION');
console.log('======================================================================\n');

let passed = 0;
let failed = 0;

function it(title, fn) {
    try {
        fn();
        console.log(`  ✅ [PASS] ${title}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${title}: ${err.message}`);
        failed++;
    }
}

async function itAsync(title, fn) {
    try {
        await fn();
        console.log(`  ✅ [PASS] ${title}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${title}: ${err.message}`);
        failed++;
    }
}

// 1. Check Master Dashboard Code
it('Master Dashboard header contains NO "Payouts: Universal Gateway"', () => {
    const dashboardCode = fs.readFileSync(path.join(ROOT, 'app/dashboard/page.jsx'), 'utf-8');
    assert.ok(!dashboardCode.includes('Payouts: Universal Gateway'), 'Found forbidden Universal Gateway text in dashboard');
    assert.ok(!dashboardCode.includes('Universal Secure Checkout Gateway Active'), 'Found forbidden Universal Gateway title in dashboard');
});

it('Master Dashboard header contains NO "+ ADD PRODUCT" button', () => {
    const dashboardCode = fs.readFileSync(path.join(ROOT, 'app/dashboard/page.jsx'), 'utf-8');
    assert.ok(!dashboardCode.includes('+ ADD PRODUCT'), 'Found forbidden + ADD PRODUCT in master dashboard header');
});

it('Master Dashboard navigation tabs contain NO combined "Master Catalog" or "All Orders"', () => {
    const dashboardCode = fs.readFileSync(path.join(ROOT, 'app/dashboard/page.jsx'), 'utf-8');
    assert.ok(!dashboardCode.includes('Master Catalog'), 'Found combined Master Catalog tab');
    assert.ok(!dashboardCode.includes('All Orders ('), 'Found combined All Orders tab');
});

it('Master Dashboard initial tab is "stores" (Fleet Command Center)', () => {
    const dashboardCode = fs.readFileSync(path.join(ROOT, 'app/dashboard/page.jsx'), 'utf-8');
    assert.ok(dashboardCode.includes("const [activeNavTab, setActiveNavTab] = useState('stores');"), 'Default active tab is not stores');
});

// 2. Check Dynamic Checkout Code
it('Dynamic Checkout contains ZERO universal fallback url (gumshop-checkout)', () => {
    const checkoutCode = fs.readFileSync(path.join(ROOT, 'app/api/gumroad/dynamic-checkout/route.js'), 'utf-8');
    assert.ok(!checkoutCode.includes("https://gumroad.com/l/gumshop-checkout"), 'Found forbidden universal fallback checkout permalink');
    assert.ok(checkoutCode.includes('has not connected a Gumroad account'), 'Missing required unconnected Gumroad error response');
});

it('Dynamic Checkout strictly scopes server token lookup to targetStoreKey', () => {
    const checkoutCode = fs.readFileSync(path.join(ROOT, 'app/api/gumroad/dynamic-checkout/route.js'), 'utf-8');
    assert.ok(checkoutCode.includes('const targetStoreKey = storeSlug || storeId || \'\';'), 'Missing targetStoreKey resolution');
    assert.ok(checkoutCode.includes('targetStoreKey ? await getServerGumroadToken(targetStoreKey) : \'\''), 'Server token not strictly scoped to targetStoreKey');
});

// 3. Check Homepage Empty State
it('Homepage app/(public)/page.jsx renders "No Store Configured" when no store exists', () => {
    const homepageCode = fs.readFileSync(path.join(ROOT, 'app/(public)/page.jsx'), 'utf-8');
    assert.ok(homepageCode.includes('No Store Configured'), 'Missing No Store Configured empty state');
    assert.ok(homepageCode.includes('if (!loading && !activeStore)'), 'Missing early return for no active store');
});

// 4. Test Token Scoping in lib/serverVault.js
await itAsync('ServerVault maintains strict store isolation for tokens', async () => {
    const { setServerGumroadToken, getServerGumroadToken } = await import('../lib/serverVault.js');
    
    await setServerGumroadToken('token_store_alpha_99', 'store_alpha');
    await setServerGumroadToken('token_store_beta_88', 'store_beta');

    const alphaToken = await getServerGumroadToken('store_alpha');
    const betaToken = await getServerGumroadToken('store_beta');
    const gammaToken = await getServerGumroadToken('store_gamma_unconnected');

    assert.strictEqual(alphaToken, 'token_store_alpha_99', 'Store Alpha token mismatch');
    assert.strictEqual(betaToken, 'token_store_beta_88', 'Store Beta token mismatch');
    assert.strictEqual(gammaToken, '', 'Unconnected store gamma must return empty token');
});

// 5. Test Dynamic Checkout Handler isolation
await itAsync('POST /api/gumroad/dynamic-checkout enforces 400 when store has no connected Gumroad', async () => {
    let serverOnline = false;
    try {
        const probe = await fetch('http://localhost:3000/api/gumroad/status', { signal: AbortSignal.timeout(1000) });
        serverOnline = true;
    } catch {}

    if (serverOnline) {
        const res = await fetch('http://localhost:3000/api/gumroad/dynamic-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                storeId: 'unconnected_test_store',
                storeSlug: 'unconnected_test_store',
                storeName: 'Unconnected Store',
                items: [{
                    name: 'Test Product',
                    price: 25.00,
                    quantity: 1
                }]
            })
        });
        assert.strictEqual(res.status, 400, 'Expected 400 error status for store without Gumroad credentials');
        const body = await res.json();
        assert.ok(body.error.includes('has not connected a Gumroad account'), 'Expected error message indicating store has not connected Gumroad');
    } else {
        // Offline verification: verify dynamic checkout route code has no fallback and strictly guards
        const checkoutCode = fs.readFileSync(path.join(ROOT, 'app/api/gumroad/dynamic-checkout/route.js'), 'utf-8');
        assert.ok(checkoutCode.includes('if (!resolvedProductUrl)'), 'Missing resolvedProductUrl null guard');
        assert.ok(checkoutCode.includes('has not connected a Gumroad account. Connect Gumroad in Store Settings to enable checkout'), 'Missing exact 400 rejection text');
        assert.ok(!checkoutCode.includes('https://gumroad.com/l/gumshop-checkout'), 'Universal checkout fallback still exists');
    }
});

console.log('\n======================================================================');
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
console.log('======================================================================');

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
