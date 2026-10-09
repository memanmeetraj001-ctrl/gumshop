import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🧪 TESTING RESET TO ZERO & MOCK PRODUCT ISOLATION');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function check(title, condition, extraInfo = '') {
    if (condition) {
        console.log(`  ✅ [PASS] ${title} ${extraInfo}`);
        passed++;
    } else {
        console.error(`  ❌ [FAIL] ${title} ${extraInfo}`);
        failed++;
    }
}

// 1. Verify app/(public)/page.jsx does not fallback to buy-rc-drift-cars-online
const publicPageCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app/(public)/page.jsx'), 'utf8');
check('Root page does NOT fallback to buy-rc-drift-cars-online', !publicPageCode.includes('buy-rc-drift-cars-online'));
check('Root page does NOT fall back to preset loader when store catalog is empty', !publicPageCode.includes('preset?.products?.length > 0'));
check('Root page sets products to [] when no store exists', publicPageCode.includes('setActiveStore(null);\n                    setProducts([]);') || publicPageCode.includes('setActiveStore(null);') && publicPageCode.includes('setProducts([]);'));
check('Root page does NOT unconditionnally inject reduxProducts over 0 products', !publicPageCode.includes('if (!activeStore && reduxProducts && reduxProducts.length > 0 && products.length === 0)'));

// 2. Verify lib/firebaseDb.js does not inject presets when cleared
const firebaseDbCode = fs.readFileSync(path.join(PROJECT_ROOT, 'lib/firebaseDb.js'), 'utf8');
check('firebaseDb checks hasCleared before injecting central presets', firebaseDbCode.includes('const hasCleared = typeof window !== \'undefined\'') && firebaseDbCode.includes('if (!hasCleared)'));

// 3. Verify lib/storePresets.js checks cleared status
const storePresetsCode = fs.readFileSync(path.join(PROJECT_ROOT, 'lib/storePresets.js'), 'utf8');
check('storePresets getStoreAndCatalogSync checks hasClearedSync', storePresetsCode.includes('hasClearedSync'));
check('storePresets getStoreAndCatalog checks hasClearedAcknowledged', storePresetsCode.includes('hasClearedAcknowledged'));

// 4. Verify app/dashboard/page.jsx clears homepage cookie and triggers events on wipe
const dashboardCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app/dashboard/page.jsx'), 'utf8');
check('Dashboard wipe expires gumshop_homepage_store cookie', dashboardCode.includes('gumshop_homepage_store=;'));
check('Dashboard wipe dispatches homepage_store_changed event', dashboardCode.includes('homepage_store_changed'));

// 5. Verify app/api/reset/route.js deletes cookies
const resetRouteCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app/api/reset/route.js'), 'utf8');
check('Reset API route explicitly deletes gumshop_homepage_store cookie', resetRouteCode.includes('res.cookies.delete(\'gumshop_homepage_store\')'));
check('Reset API route explicitly deletes active_store_slug cookie', resetRouteCode.includes('res.cookies.delete(\'active_store_slug\')'));

console.log('\n====================================================');
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================\n');

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
