import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyPriceSlash, normalizeProductPrice } from '../lib/importer/priceNormalizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🧪 RUNNING PRICE SLASHING VERIFICATION SUITE');
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

// ----------------------------------------------------
// SECTION 1: Mathematical Accuracy & Edge Cases
// ----------------------------------------------------
console.log('--- SECTION 1: Mathematical Accuracy & Edge Cases ---');

// Case 1: Standard 20% discount
const s1 = applyPriceSlash(100, 20);
check('Standard 20% slash on $100', s1.price === 80 && s1.compareAtPrice === 100, `(got price: $${s1.price}, compareAtPrice: $${s1.compareAtPrice})`);

// Case 2: 50% discount on non-integer
const s2 = applyPriceSlash(49.99, 50);
check('50% slash on $49.99', s2.price === 25.00 && s2.compareAtPrice === 49.99, `(got price: $${s2.price}, compareAtPrice: $${s2.compareAtPrice})`);

// Case 3: 15% discount on $29.95
const s3 = applyPriceSlash(29.95, 15);
// 29.95 * 0.85 = 25.4575 -> 25.46
check('15% slash on $29.95', s3.price === 25.46 && s3.compareAtPrice === 29.95, `(got price: $${s3.price})`);

// Case 4: 0% discount preserves original price without fake compare price
const s4 = applyPriceSlash(100, 0);
check('0% slash preserves original price', s4.price === 100 && s4.compareAtPrice === 0, `(got price: $${s4.price}, compareAtPrice: $${s4.compareAtPrice})`);

// Case 5: 90% discount on $2.00 (triggers $1.00 price floor!)
const s5 = applyPriceSlash(2.00, 90);
check('Minimum $1.00 floor enforced', s5.price === 1.00 && s5.compareAtPrice === 2.00, `(got price: $${s5.price})`);

// Case 6: Preserving already higher compareAtPrice
const s6 = applyPriceSlash(80, 25, 120);
check('Preserves existing higher compareAtPrice', s6.price === 60 && s6.compareAtPrice === 120, `(got price: $${s6.price}, compareAtPrice: $${s6.compareAtPrice})`);

// Case 7: High discount (70% off $500 item)
const s7 = applyPriceSlash(500, 70);
check('70% slash on $500 item', s7.price === 150 && s7.compareAtPrice === 500, `(got price: $${s7.price}, compareAtPrice: $${s7.compareAtPrice})`);

// Case 8: Fractional percentage (e.g. 33.33%)
const s8 = applyPriceSlash(100, 33.33);
check('Fractional percentage (33.33%) rounds cleanly', s8.price === 66.67, `(got price: $${s8.price})`);

// ----------------------------------------------------
// SECTION 2: Codebase Static Integrity Verification
// ----------------------------------------------------
console.log('\n--- SECTION 2: Codebase Static Integrity Verification ---');

// Verify app/api/importer/import/route.js
const importerRouteCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app/api/importer/import/route.js'), 'utf8');
check('Importer route imports applyPriceSlash', importerRouteCode.includes('applyPriceSlash'));
check('Importer route extracts slashPercent', importerRouteCode.includes('slashPercent'));
check('Importer route calculates slashed price', importerRouteCode.includes('applyPriceSlash(rawPrice, numSlash, rawCompareAt)'));

// Verify app/api/store/duplicate/route.js
const duplicateRouteCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app/api/store/duplicate/route.js'), 'utf8');
check('Duplicate route imports applyPriceSlash', duplicateRouteCode.includes('applyPriceSlash'));
check('Duplicate route extracts slashPercent', duplicateRouteCode.includes('slashPercent'));
check('Duplicate route calculates slashed price', duplicateRouteCode.includes('applyPriceSlash(finalPrice, numSlash, finalCompareAt)'));

// Verify app/api/cloner/import/route.js
const clonerRouteCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app/api/cloner/import/route.js'), 'utf8');
check('Cloner route imports applyPriceSlash', clonerRouteCode.includes('applyPriceSlash'));
check('Cloner route extracts slashPercent', clonerRouteCode.includes('slashPercent'));
check('Cloner route calculates slashed price', clonerRouteCode.includes('applyPriceSlash(p.price, slashPercent'));

// Verify app/store/import/page.jsx
const importPageCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app/store/import/page.jsx'), 'utf8');
check('Import page UI imports Scissors and applyPriceSlash', importPageCode.includes('Scissors') && importPageCode.includes('applyPriceSlash'));
check('Import page defines handleSlashPrices', importPageCode.includes('handleSlashPrices'));
check('Import page has Slash toolbar controls', importPageCode.includes('Slash:') && importPageCode.includes('Cut %'));
check('Import page sends slashPercent in payload', importPageCode.includes('slashPercent: activeSlashPercent'));
check('Import page renders strike-through compare price in grid and table', importPageCode.includes('displayCompare > displayPrice'));

// Verify app/dashboard/page.jsx
const dashboardPageCode = fs.readFileSync(path.join(PROJECT_ROOT, 'app/dashboard/page.jsx'), 'utf8');
check('Dashboard page imports Scissors', dashboardPageCode.includes('Scissors'));
check('Dashboard page defines dupSlashPercent state', dashboardPageCode.includes('dupSlashPercent'));
check('Dashboard modal renders price slash selector', dashboardPageCode.includes('Slash Product Prices'));
check('Dashboard duplicate call passes slashPercent', dashboardPageCode.includes('slashPercent: parseFloat(dupSlashPercent)'));

// ----------------------------------------------------
// Summary
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================\n');

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
