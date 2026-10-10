import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🔬 STARTING DEEP COMPREHENSIVE BUG HUNT');
console.log('Target:', PROJECT_ROOT);
console.log('====================================================\n');

let issuesFound = [];
let checksPassed = 0;

function reportIssue(severity, file, line, message) {
    issuesFound.push({ severity, file, line, message });
    console.log(`[${severity}] ${file}${line ? ':' + line : ''} - ${message}`);
}

function check(desc, condition, file = '', line = '') {
    if (condition) {
        checksPassed++;
    } else {
        reportIssue('ERROR', file, line, desc);
    }
}

// 1. Collect all JS and JSX files
function getFiles(dir, exts = ['.js', '.jsx']) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        if (file === 'node_modules' || file === '.next' || file === '.git' || file === '.agents') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(filePath, exts));
        } else if (exts.some(ext => file.endsWith(ext))) {
            results.push(filePath);
        }
    }
    return results;
}

const allFiles = getFiles(PROJECT_ROOT);
console.log(`Auditing ${allFiles.length} JavaScript/JSX files across codebase...\n`);

// 2. Check imports validity
console.log('--- AUDIT 1: Import Resolutions & File Existence ---');
for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
        const importMatch = lineText.match(/(?:import|from)\s+['"]([^'"]+)['"]/);
        if (importMatch) {
            const importPath = importMatch[1];
            if (importPath.startsWith('.')) {
                // Relative import
                const dir = path.dirname(file);
                const resolved = path.resolve(dir, importPath);
                const exists = fs.existsSync(resolved) || 
                               fs.existsSync(resolved + '.js') || 
                               fs.existsSync(resolved + '.jsx') || 
                               fs.existsSync(path.join(resolved, 'index.js')) ||
                               fs.existsSync(path.join(resolved, 'index.jsx'));
                if (!exists) {
                    reportIssue('ERROR', path.relative(PROJECT_ROOT, file), idx + 1, `Broken relative import: "${importPath}"`);
                } else {
                    checksPassed++;
                }
            } else if (importPath.startsWith('@/')) {
                // Alias import
                const subPath = importPath.substring(2);
                const resolved = path.resolve(PROJECT_ROOT, subPath);
                const exists = fs.existsSync(resolved) || 
                               fs.existsSync(resolved + '.js') || 
                               fs.existsSync(resolved + '.jsx') || 
                               fs.existsSync(path.join(resolved, 'index.js')) ||
                               fs.existsSync(path.join(resolved, 'index.jsx'));
                if (!exists) {
                    reportIssue('ERROR', path.relative(PROJECT_ROOT, file), idx + 1, `Broken alias import: "${importPath}"`);
                } else {
                    checksPassed++;
                }
            }
        }
    });
}

// 3. Check JSON.parse without try/catch
console.log('\n--- AUDIT 2: Unguarded JSON.parse Calls ---');
for (const file of allFiles) {
    if (file.includes('scripts')) continue; // Skip test scripts
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
        if (lineText.includes('JSON.parse(') && !lineText.includes('// safe')) {
            // Check if inside a try block within 15 lines above
            const startIdx = Math.max(0, idx - 15);
            const surroundingCode = lines.slice(startIdx, idx + 1).join('\n');
            const hasTry = surroundingCode.includes('try {') || surroundingCode.includes('try{');
            if (!hasTry) {
                reportIssue('WARNING', path.relative(PROJECT_ROOT, file), idx + 1, `Potential uncaught JSON.parse call: ${lineText.trim()}`);
            } else {
                checksPassed++;
            }
        }
    });
}

// 4. Check API Routes resilience (req.json, error handling, status codes)
console.log('\n--- AUDIT 3: API Routes Defensive Hardening ---');
const apiDir = path.join(PROJECT_ROOT, 'app', 'api');
const apiRoutes = getFiles(apiDir).filter(f => f.endsWith('route.js'));

for (const routeFile of apiRoutes) {
    const relPath = path.relative(PROJECT_ROOT, routeFile);
    const content = fs.readFileSync(routeFile, 'utf8');

    // Check if POST/PUT/PATCH routes catch req.json()
    if (content.includes('req.json()')) {
        const hasJsonCatch = content.includes('req.json().catch(') || content.includes('try {') || content.includes('try{');
        if (!hasJsonCatch) {
            reportIssue('ERROR', relPath, 0, 'req.json() is called without try/catch or .catch() fallback');
        } else {
            checksPassed++;
        }
    }

    // Check if route has an outer try/catch
    const hasOuterCatch = content.includes('} catch (') || content.includes('} catch(');
    if (!hasOuterCatch) {
        reportIssue('ERROR', relPath, 0, 'API route missing outer try/catch block');
    } else {
        checksPassed++;
    }

    // Check if route returns NextResponse.json
    if (!content.includes('NextResponse.json')) {
        reportIssue('WARNING', relPath, 0, 'API route does not use NextResponse.json');
    } else {
        checksPassed++;
    }
}

// 5. Check Next.js 16 cookies() usage (cookies() is async in Next 15/16)
console.log('\n--- AUDIT 4: Next.js Cookies & Async Headers Audit ---');
for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
        // If importing cookies from next/headers
        if (lineText.includes('cookies()') && file.endsWith('.js') && file.includes('app/')) {
            // Check if it's awaited or synchronous
            if (!lineText.includes('await cookies()') && !lineText.includes('(await cookies())')) {
                // If in Next 15+, cookies() returns a Promise
                const relPath = path.relative(PROJECT_ROOT, file);
                reportIssue('WARNING', relPath, idx + 1, `Synchronous cookies() call detected (In Next.js 15+, cookies() should be awaited): ${lineText.trim()}`);
            } else {
                checksPassed++;
            }
        }
    });
}

// 6. Check for undefined variable references (common copy-paste bugs like compareAt)
console.log('\n--- AUDIT 5: Common Typo & Undefined Reference Scan ---');
const dangerousKeywords = [
    { pattern: /\bcompareAt\b(?!\s*[:=]|Price)/g, desc: 'Unqualified compareAt identifier (likely should be compareAtPrice)' },
    { pattern: /\bproductsCount\b(?!\s*[:=]|\.)/g, desc: 'Unqualified productsCount identifier' },
    { pattern: /\bproductIds\b(?!\s*[:=]|\.)/g, desc: 'Unqualified productIds identifier' }
];

for (const file of allFiles) {
    if (file.includes('scripts')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
        if (lineText.trim().startsWith('//') || lineText.trim().startsWith('*')) return;
        dangerousKeywords.forEach(({ pattern, desc }) => {
            if (pattern.test(lineText)) {
                // check if declared in surrounding lines
                const startIdx = Math.max(0, idx - 5);
                const scope = lines.slice(startIdx, idx + 1).join('\n');
                if (!scope.includes('const compareAt') && !scope.includes('let compareAt') && !scope.includes('function compareAt') && !scope.includes('compareAt:')) {
                    reportIssue('WARNING', path.relative(PROJECT_ROOT, file), idx + 1, `${desc}: ${lineText.trim()}`);
                }
            }
        });
    });
}

// 7. Check for broken internal links
console.log('\n--- AUDIT 6: Internal Link Routing Validity ---');
const knownRoutes = new Set([
    '/', '/admin', '/admin/login', '/cart', '/contact', '/create-store',
    '/dashboard', '/login', '/orders', '/policies/privacy', '/policies/refund',
    '/policies/shipping', '/policies/terms', '/product', '/settings/integrations/gumroad',
    '/shop', '/store', '/store/add-product', '/store/bio-editor', '/store/cloner',
    '/store/coupons', '/store/create', '/store/customers', '/store/import',
    '/store/manage-product', '/store/marketing', '/store/orders', '/store/settings',
    '/thank-you', '/track'
]);

for (const file of allFiles) {
    if (file.includes('scripts') || file.includes('app/api')) continue;
    const content = fs.readFileSync(file, 'utf8');
    const linkMatches = content.matchAll(/href=["'](\/[^"'?#]*)["']/g);
    for (const match of linkMatches) {
        const linkPath = match[1];
        if (linkPath.startsWith('/_') || linkPath.startsWith('/api') || linkPath.includes('${') || linkPath.includes('[') || linkPath.includes('http')) continue;
        
        // Check dynamic prefixes
        const isDynamicMatch = linkPath.startsWith('/shop/') || 
                               linkPath.startsWith('/creator/') || 
                               linkPath.startsWith('/product/') || 
                               linkPath.startsWith('/store/edit-product/');
        
        if (!knownRoutes.has(linkPath) && !isDynamicMatch) {
            reportIssue('WARNING', path.relative(PROJECT_ROOT, file), 0, `Potential invalid internal link route: "${linkPath}"`);
        } else {
            checksPassed++;
        }
    }
}

console.log('\n====================================================');
console.log(`TOTAL AUDIT CHECKS PASSED: ${checksPassed}`);
console.log(`TOTAL ISSUES FLAGGED:     ${issuesFound.length}`);
console.log('====================================================\n');

const errors = issuesFound.filter(i => i.severity === 'ERROR');
const warnings = issuesFound.filter(i => i.severity === 'WARNING');

console.log(`Errors:   ${errors.length}`);
console.log(`Warnings: ${warnings.length}\n`);

if (issuesFound.length > 0) {
    console.log('ISSUES SUMMARY:');
    issuesFound.forEach(i => console.log(`  [${i.severity}] ${i.file}${i.line ? ':' + i.line : ''} - ${i.message}`));
}

process.exit(errors.length > 0 ? 1 : 0);
