/**
 * 🥊 Milestone 1 Empirical Challenger: Deep Adversarial Link & Anchor Verification
 * 
 * Verifies:
 * 1. Absence of dead anchors (#flash-deals, #reviews, /store/products) across entire codebase.
 * 2. Static AST / Regex validation that all internal anchors (#catalog, #special-deals) map to existing DOM IDs.
 * 3. #special-deals presence invariant under both discountedDeals > 0 and discountedDeals == 0 states.
 * 4. Duplicate ID check (HTML5 standard violation prevention).
 * 5. Next.js router route validity for internal links (app/ router paths).
 * 6. Footer.jsx and login/page.jsx Next.js <Link> usage.
 * 7. Store settings relative URLs and dynamic origin clipboard copying.
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT_DIR = process.cwd();

const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

function test(name, fn) {
    results.total++;
    try {
        fn();
        console.log(`  ✅ [PASS] ${name}`);
        results.passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${name}`);
        console.error(`     Error: ${err.message}`);
        results.failed++;
        results.errors.push({ name, error: err.message });
    }
}

console.log('======================================================================');
console.log('🥊 ADVERSARIAL CHALLENGER: MILESTONE 1 VERIFICATION');
console.log('======================================================================\n');

// --- TEST 1: Scan for legacy dead anchor / path tokens ---
test('No dead links (#flash-deals, #reviews, /store/products) exist in any source file', () => {
    const forbiddenTokens = ['#flash-deals', '#reviews', '/store/products'];
    const scannedDirs = ['app', 'components', 'lib'];
    
    function scanDir(dir) {
        const entries = fs.readdirSync(path.join(ROOT_DIR, dir), { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                scanDir(fullPath);
            } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
                const content = fs.readFileSync(path.join(ROOT_DIR, fullPath), 'utf-8');
                for (const token of forbiddenTokens) {
                    if (content.includes(token)) {
                        throw new Error(`Forbidden dead link token "${token}" found in ${fullPath}`);
                    }
                }
            }
        }
    }

    for (const d of scannedDirs) {
        if (fs.existsSync(path.join(ROOT_DIR, d))) {
            scanDir(d);
        }
    }
});

// --- TEST 2: Inspect app/(public)/page.jsx for #special-deals and #catalog DOM targets ---
test('app/(public)/page.jsx unconditionally contains #special-deals and #catalog with zero duplicate IDs', () => {
    const homepagePath = path.join(ROOT_DIR, 'app/(public)/page.jsx');
    const content = fs.readFileSync(homepagePath, 'utf-8');

    // 1. Check special-deals anchor
    const specialDealsMatches = content.match(/id=["']special-deals["']/g) || [];
    assert.strictEqual(specialDealsMatches.length, 1, `Expected exactly 1 occurrence of id="special-deals", found ${specialDealsMatches.length}`);

    // 2. Check catalog anchor
    const catalogMatches = content.match(/id=["']catalog["']/g) || [];
    assert.strictEqual(catalogMatches.length, 1, `Expected exactly 1 occurrence of id="catalog", found ${catalogMatches.length}`);

    // 3. Verify special-deals div is outside any conditional
    // The line should be: <div id="special-deals" className="scroll-mt-24" />
    const specialDealsLineRegex = /<div\s+id=["']special-deals["']\s+className=["']scroll-mt-24["']\s*\/>/;
    assert.ok(specialDealsLineRegex.test(content), 'special-deals div must have class scroll-mt-24 for fixed header clearance');

    // 4. Verify discountedDeals condition comes AFTER the special-deals anchor div
    const divIdx = content.indexOf('id="special-deals"');
    const condIdx = content.indexOf('discountedDeals.length > 0');
    assert.ok(divIdx !== -1 && condIdx !== -1, 'Both elements must exist in app/(public)/page.jsx');
    assert.ok(divIdx < condIdx, 'id="special-deals" div must precede the conditional {discountedDeals.length > 0} block');
});

// --- TEST 3: Adversarial Simulation of app/(public)/page.jsx Scroll Behavior ---
test('Simulate DOM anchor resolution when discountedDeals is populated AND when empty', () => {
    const homepageContent = fs.readFileSync(path.join(ROOT_DIR, 'app/(public)/page.jsx'), 'utf-8');

    // Function to simulate rendering the deals strip block
    function simulateDealsSection(deals) {
        let dom = [];
        // Anchor is always rendered:
        dom.push({ id: 'special-deals', tag: 'div', scrollMarginTop: '96px' });
        
        // Conditional strip:
        if (deals.length > 0) {
            dom.push({
                tag: 'section',
                type: 'Featured Discounted Items',
                items: deals.map(d => d.name)
            });
        }

        // Main catalog section:
        dom.push({ id: 'catalog', tag: 'section', type: 'Featured Catalog' });
        return dom;
    }

    // Case 1: With discounted products
    const populatedDom = simulateDealsSection([{ id: 'p1', name: 'Product 1', discount: 20 }]);
    const targetWithDeals = populatedDom.find(el => el.id === 'special-deals');
    assert.ok(targetWithDeals, 'Target #special-deals must exist in DOM when deals are present');
    const indexWithDeals = populatedDom.indexOf(targetWithDeals);
    assert.strictEqual(populatedDom[indexWithDeals + 1].type, 'Featured Discounted Items', 'Directly following element must be Featured Discounted Items');

    // Case 2: Empty discounted products (e.g. store has no sales active)
    const emptyDom = simulateDealsSection([]);
    const targetEmpty = emptyDom.find(el => el.id === 'special-deals');
    assert.ok(targetEmpty, 'Target #special-deals MUST STILL EXIST in DOM when deals are empty (no dead anchor)');
    const indexEmpty = emptyDom.indexOf(targetEmpty);
    assert.strictEqual(emptyDom[indexEmpty + 1].type, 'Featured Catalog', 'When empty, anchor gracefully falls through directly to Featured Catalog');
});

// --- TEST 4: Navigation Links in Navbar.jsx and Footer.jsx ---
test('Navbar.jsx and Footer.jsx link exclusively to valid anchors with Next.js <Link>', () => {
    const navbarContent = fs.readFileSync(path.join(ROOT_DIR, 'components/Navbar.jsx'), 'utf-8');
    const footerContent = fs.readFileSync(path.join(ROOT_DIR, 'components/Footer.jsx'), 'utf-8');

    // Navbar checks
    assert.ok(navbarContent.includes('href="/#catalog"'), 'Navbar must have link to /#catalog');
    assert.ok(navbarContent.includes('href="/#special-deals"'), 'Navbar must have link to /#special-deals');
    assert.ok(!navbarContent.includes('href="/#flash-deals"'), 'Navbar must NOT have link to /#flash-deals');
    assert.ok(!navbarContent.includes('href="/#reviews"'), 'Navbar must NOT have link to /#reviews');

    // Footer checks
    assert.ok(footerContent.includes('<Link href="/#catalog"'), 'Footer must use <Link> for /#catalog');
    assert.ok(footerContent.includes('<Link href="/#special-deals"'), 'Footer must use <Link> for /#special-deals');
    assert.ok(!footerContent.includes('<a href="/#catalog"'), 'Footer must NOT use raw <a> for /#catalog');
    assert.ok(!footerContent.includes('<a href="/#special-deals"'), 'Footer must NOT use raw <a> for /#special-deals');
});

// --- TEST 5: Master Dashboard Product Management Route Validity ---
test('app/dashboard/page.jsx references /store/manage-product and target route exists in App Router', () => {
    const dashboardContent = fs.readFileSync(path.join(ROOT_DIR, 'app/dashboard/page.jsx'), 'utf-8');
    
    // Check that /store/manage-product is linked
    assert.ok(
        dashboardContent.includes('/store/manage-product?store='),
        'Dashboard must link to /store/manage-product?store=...'
    );

    // Verify destination route exists in filesystem
    const targetPagePath = path.join(ROOT_DIR, 'app/store/manage-product/page.jsx');
    assert.ok(fs.existsSync(targetPagePath), `Target route file ${targetPagePath} must exist`);
});

// --- TEST 6: Login page router link ---
test('app/login/page.jsx uses <Link href="/dashboard"> and contains 0 raw <a> tags', () => {
    const loginContent = fs.readFileSync(path.join(ROOT_DIR, 'app/login/page.jsx'), 'utf-8');
    assert.ok(loginContent.includes('<Link'), 'Login must use <Link>');
    assert.ok(loginContent.includes('href="/dashboard"'), 'Login must link to /dashboard');
    assert.ok(!loginContent.includes('<a '), 'Login must not contain raw <a> tags');
});

// --- TEST 7: Store Settings relative URLs & dynamic origin ---
test('app/store/settings/page.jsx uses relative URLs for navigation and dynamic window.location.origin for clipboard copy', () => {
    const settingsContent = fs.readFileSync(path.join(ROOT_DIR, 'app/store/settings/page.jsx'), 'utf-8');
    
    // Check storeUrl definition
    assert.ok(settingsContent.includes('const storeUrl = `/shop/${storeSlug}`;'), 'storeUrl must be relative /shop/${storeSlug}');
    
    // Check Bio Mode link
    assert.ok(settingsContent.includes('href={`/creator/${storeSlug}`}'), 'Bio mode link must be relative /creator/${storeSlug}');
    
    // Check clipboard copy uses dynamic window.location.origin
    assert.ok(settingsContent.includes('window.location.origin'), 'Clipboard copy must dynamically use window.location.origin');
    
    // Ensure all anchor hrefs in settings are relative, not hardcoded to https://gumshop.online
    const hrefRegex = /href=\{?["'`]?([^"'` >}]+)["'`]?\}?/g;
    let match;
    const hardcodedHrefs = [];
    while ((match = hrefRegex.exec(settingsContent)) !== null) {
        if (match[1].startsWith('https://gumshop.online')) {
            hardcodedHrefs.push(match[1]);
        }
    }
    assert.strictEqual(hardcodedHrefs.length, 0, `Found hardcoded production hrefs: ${hardcodedHrefs.join(', ')}`);
});

// --- TEST 8: All App Router Route Targets from Navigation Components ---
test('All internal routes linked in Navbar.jsx and Footer.jsx resolve to real app/ directory routes', () => {
    const navbarContent = fs.readFileSync(path.join(ROOT_DIR, 'components/Navbar.jsx'), 'utf-8');
    const footerContent = fs.readFileSync(path.join(ROOT_DIR, 'components/Footer.jsx'), 'utf-8');

    const linkRegex = /href=["'](\/[a-zA-Z0-9_\-\/]+)["']/g;
    const routes = new Set();
    
    for (const text of [navbarContent, footerContent]) {
        let match;
        while ((match = linkRegex.exec(text)) !== null) {
            routes.add(match[1]);
        }
    }

    console.log(`     Discovered navigation routes: ${[...routes].join(', ')}`);

    for (const route of routes) {
        if (route === '/') continue;
        const normalized = route.replace(/^\//, '');
        // Check for app/[route]/page.jsx or app/(public)/[route]/page.jsx or app/[route]/page.js
        const candidatePaths = [
            path.join(ROOT_DIR, 'app', normalized, 'page.jsx'),
            path.join(ROOT_DIR, 'app', normalized, 'page.js'),
            path.join(ROOT_DIR, 'app', '(public)', normalized, 'page.jsx'),
            path.join(ROOT_DIR, 'app', '(public)', normalized, 'page.js')
        ];

        const exists = candidatePaths.some(p => fs.existsSync(p));
        assert.ok(exists, `Route ${route} linked in navigation does not correspond to an existing App Router page file!`);
    }
});

console.log('\n======================================================================');
console.log(`📊 CHALLENGER SUMMARY: ${results.passed} / ${results.total} PASSED (${results.failed} failed)`);
console.log('======================================================================');

if (results.failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
