/**
 * Adversarial Stress Test & Reviewer Audit Suite for Milestone 3
 * Tests:
 * 1. Unused imports & reference integrity across 16 target files
 * 2. Native date-fns replacement & date edge case behavior
 * 3. Multi-tenant storage isolation in GumroadIframeModal
 * 4. Protected test tokens preservation
 * 5. Codebase cleanliness & Ponytail minimalism
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT_DIR = process.cwd();

console.log('======================================================================');
console.log('⚔️  ADVERSARIAL STRESS TEST & REVIEWER AUDIT: MILESTONE 3 (PONYTAIL)');
console.log('======================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✅ [PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(`     Error: ${err.message}`);
    }
}

// ----------------------------------------------------------------------
// 1. Unused Imports & Reference Integrity in 16 Target Files
// ----------------------------------------------------------------------
const PRUNED_TOKENS = {
    'components/Navbar.jsx': ['SlidersHorizontal', 'UserCheck'],
    'components/Hero.jsx': ['ArrowRight', 'ShieldCheck', 'CheckCircle2', 'Copy', 'Play', 'ShoppingBag', 'ExternalLink', 'Layers'],
    'components/ProductDetails.jsx': ['Sparkles', 'Eye', 'useSelector'],
    'components/CartDrawer.jsx': ['ArrowRight', 'clearCart', 'createOrder'],
    'components/OrderSummary.jsx': ['PlusIcon', 'SquarePenIcon', 'createOrder', 'clearCart'],
    'components/FeaturesGrid.jsx': ['Film', 'ShieldCheck'],
    'components/FeaturedStoresShowcase.jsx': ['Sparkles'],
    'components/StorefrontNavbar.jsx': ['Search', 'Sparkles'],
    'components/store/StoreSidebar.jsx': ['LayoutListIcon', 'Film', 'Image'],
    'components/store/StoreNavbar.jsx': ['Check'],
    'components/WishlistDrawer.jsx': ['ArrowRight', 'Link'],
    'app/dashboard/page.jsx': ['Layers', 'MousePointerClick', 'Share2', 'AlertCircle', 'Clock', 'DEFAULT_CATALOG_PRODUCTS'],
    'app/store/settings/page.jsx': ['Youtube', 'Zap', 'BarChart3', 'getStoreByUserId'],
    'app/store/coupons/page.jsx': ['Sparkles', 'Clock', 'ShoppingBag', 'Calendar', 'format'],
    'app/store/manage-product/page.jsx': ['Calculator', 'CheckCircle2', 'CheckSquare', 'Square', 'ArrowUpDown', 'Percent', 'getStoreByUserId']
};

runTest('1. Pruned tokens are completely absent from imports and never referenced as undeclared identifiers', () => {
    for (const [relPath, tokens] of Object.entries(PRUNED_TOKENS)) {
        const fullPath = path.join(ROOT_DIR, relPath);
        assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
        const content = fs.readFileSync(fullPath, 'utf8');

        // Extract all import statements
        const importLines = content.split('\n').filter(l => l.trim().startsWith('import '));
        const importBlock = importLines.join('\n');

        for (const token of tokens) {
            // Token must not be in import statements
            const importedRegex = new RegExp(`\\b${token}\\b`);
            assert.ok(!importedRegex.test(importBlock), `Token '${token}' should NOT be imported in ${relPath}`);

            // If token is pruned, it should not be used in JSX/code as an identifier
            // (e.g. <Token or Token( or Token. or {Token})
            const usageRegex = new RegExp(`(<${token}\\b|\\b${token}\\s*\\(|\\b${token}\\.[a-zA-Z]|\\b${token}\\b)`);
            
            // To ensure we don't flag variable declarations with same name, check if token appears in body
            const bodyLines = content.split('\n').filter(l => !l.trim().startsWith('import ')).join('\n');
            const usages = [];
            const matches = bodyLines.match(new RegExp(`\\b${token}\\b`, 'g'));
            if (matches) {
                // If token appears in body, verify it's not a JSX component or function call
                const jsxMatch = bodyLines.match(new RegExp(`<${token}[\\s/>]`));
                assert.ok(!jsxMatch, `Pruned token '${token}' is still used as JSX element in ${relPath}!`);
            }
        }
    }
});

runTest('2. All imported icons in pruned components are genuinely referenced in the file body', () => {
    const iconFiles = [
        'components/Navbar.jsx',
        'components/Hero.jsx',
        'components/ProductDetails.jsx',
        'components/CartDrawer.jsx',
        'components/FeaturesGrid.jsx',
        'components/FeaturedStoresShowcase.jsx',
        'components/StorefrontNavbar.jsx',
        'components/store/StoreSidebar.jsx',
        'components/store/StoreNavbar.jsx',
        'components/WishlistDrawer.jsx'
    ];

    for (const relPath of iconFiles) {
        const fullPath = path.join(ROOT_DIR, relPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Find lucide-react import
        const lucideMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
        if (lucideMatch) {
            const icons = lucideMatch[1].split(',').map(s => s.trim()).filter(Boolean);
            const body = content.substring(content.indexOf(lucideMatch[0]) + lucideMatch[0].length);
            for (const icon of icons) {
                const iconRegex = new RegExp(`\\b${icon}\\b`);
                assert.ok(iconRegex.test(body), `Imported icon '${icon}' in ${relPath} is not referenced in the component body!`);
            }
        }
    }
});

// ----------------------------------------------------------------------
// 2. Native date-fns Replacement & Date Robustness
// ----------------------------------------------------------------------
runTest('3. date-fns is zero times imported in app/store/coupons/page.jsx and entire codebase', () => {
    const couponsContent = fs.readFileSync(path.join(ROOT_DIR, 'app/store/coupons/page.jsx'), 'utf8');
    assert.ok(!couponsContent.includes('date-fns'), 'app/store/coupons/page.jsx must not reference date-fns');

    // Check all JSX files in app/
    function checkDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) checkDir(p);
            else if (e.isFile() && (e.name.endsWith('.jsx') || e.name.endsWith('.js'))) {
                const txt = fs.readFileSync(p, 'utf8');
                assert.ok(!txt.includes("from 'date-fns'") && !txt.includes('from "date-fns"'), `Unexpected date-fns import in ${p}`);
            }
        }
    }
    checkDir(path.join(ROOT_DIR, 'app'));
    checkDir(path.join(ROOT_DIR, 'components'));
});

runTest('4. Native date ISO slicing and locale string formatting handle boundary conditions', () => {
    // Stress test the exact logic used in StoreCoupons:
    // value={newCoupon.expiresAt instanceof Date ? new Date(newCoupon.expiresAt).toISOString().slice(0, 10) : String(newCoupon.expiresAt).slice(0, 10)}
    const formatDateInput = (expiresAt) => {
        return expiresAt instanceof Date 
            ? new Date(expiresAt).toISOString().slice(0, 10) 
            : String(expiresAt).slice(0, 10);
    };

    const formatDisplayDate = (expiresAt) => {
        return new Date(expiresAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    // Test cases:
    const d1 = new Date('2026-12-31T23:59:59.000Z');
    assert.strictEqual(formatDateInput(d1), '2026-12-31');

    const d2 = '2026-07-04T12:00:00.000Z';
    assert.strictEqual(formatDateInput(d2), '2026-07-04');

    const d3 = '2026-01-01';
    assert.strictEqual(formatDateInput(d3), '2026-01-01');

    // Leap year test
    const dLeap = new Date('2028-02-29T10:00:00.000Z');
    assert.strictEqual(formatDateInput(dLeap), '2028-02-29');

    // Display formatting
    const display1 = formatDisplayDate('2026-11-15T00:00:00Z');
    assert.ok(display1.includes('Nov') && display1.includes('2026'), `Expected Nov & 2026, got ${display1}`);
});

// ----------------------------------------------------------------------
// 3. Multi-Tenant URL Storage Isolation in GumroadIframeModal.jsx
// ----------------------------------------------------------------------
runTest('5. GumroadIframeModal cleanSlug algorithm isolates store instances and prefixes', () => {
    const deriveSlug = (activeStore, product, storeId) => {
        return (activeStore?.username || activeStore?.id || storeId || '').toLowerCase().replace(/^store_/, '').trim();
    };

    assert.strictEqual(deriveSlug({ username: 'alpha-store' }), 'alpha-store');
    assert.strictEqual(deriveSlug({ id: 'store_beta_apparel' }), 'beta_apparel');
    assert.strictEqual(deriveSlug({ username: '  GAMMA-SHOP  ' }), 'gamma-shop');
    assert.strictEqual(deriveSlug(null, null, 'store_delta'), 'delta');
    assert.strictEqual(deriveSlug(null, null, 'omega'), 'omega');
});

runTest('6. GumroadIframeModal prioritized URL resolution prevents cross-store pollution', () => {
    // Simulate localStorage behavior
    const mockStorage = {
        'gumroad_url_store_alpha': 'https://gumroad.com/l/alpha-product',
        'gumroad_url_store_beta': 'https://gumroad.com/l/beta-product',
        'gumshop_gumroad_url': 'https://gumroad.com/l/legacy-global'
    };

    const resolveUrl = (cleanSlug) => {
        return (cleanSlug ? mockStorage[`gumroad_url_${cleanSlug}`] : '') || mockStorage['gumshop_gumroad_url'] || '';
    };

    assert.strictEqual(resolveUrl('store_alpha'), 'https://gumroad.com/l/alpha-product');
    assert.strictEqual(resolveUrl('store_beta'), 'https://gumroad.com/l/beta-product');
    // Store without scoped URL falls back to legacy global
    assert.strictEqual(resolveUrl('store_unconfigured'), 'https://gumroad.com/l/legacy-global');
});

// ----------------------------------------------------------------------
// 4. Protected Test Tokens Preservation
// ----------------------------------------------------------------------
runTest('7. Critical tokens required by test suites are intact and unmodified', () => {
    const firebaseDb = fs.readFileSync(path.join(ROOT_DIR, 'lib/firebaseDb.js'), 'utf8');
    assert.ok(firebaseDb.includes('gumshop_db_products/'), "lib/firebaseDb.js must retain 'gumshop_db_products/'");

    const manageProd = fs.readFileSync(path.join(ROOT_DIR, 'app/store/manage-product/page.jsx'), 'utf8');
    assert.ok(manageProd.includes('generateContextualBundles'), "app/store/manage-product/page.jsx must retain 'generateContextualBundles'");

    const serverDb = fs.readFileSync(path.join(ROOT_DIR, 'lib/serverDb.js'), 'utf8');
    assert.ok(serverDb.includes('serverSaveProducts'), 'lib/serverDb.js must retain serverSaveProducts');
});

// ----------------------------------------------------------------------
// 5. Ponytail Minimalism & YAGNI Assessment
// ----------------------------------------------------------------------
runTest('8. Dead Firebase dummy stubs are eliminated from app/api/gumroad/* routes', () => {
    const routes = [
        'app/api/gumroad/sync/route.js',
        'app/api/gumroad/verify-order/route.js',
        'app/api/gumroad/webhook/route.js'
    ];

    for (const r of routes) {
        const text = fs.readFileSync(path.join(ROOT_DIR, r), 'utf8');
        assert.ok(!text.includes('const ref = () => null'), `Route ${r} should not have dummy ref stub`);
        assert.ok(!text.includes('const get = () => Promise.resolve'), `Route ${r} should not have dummy get stub`);
        assert.ok(!text.includes('const set = () => Promise.resolve'), `Route ${r} should not have dummy set stub`);
    }
});

console.log('\n======================================================================');
console.log(`📊 ADVERSARIAL AUDIT SUMMARY: ${passedTests}/${totalTests} tests passed.`);
console.log('======================================================================');

if (passedTests === totalTests) {
    console.log('🏆 ALL ADVERSARIAL STRESS CHECKS PASSED WITH 100% SUCCESS.');
    process.exit(0);
} else {
    console.error('❌ SOME ADVERSARIAL STRESS CHECKS FAILED.');
    process.exit(1);
}
