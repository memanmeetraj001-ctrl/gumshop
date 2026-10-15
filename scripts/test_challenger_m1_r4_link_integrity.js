import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

// 1. Gather all App Router routes from app/
function getAppRouterRoutes() {
    const appDir = path.join(projectRoot, 'app');
    const routes = [];

    function walk(dir, currentRoute = '') {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                // Route groups like (public) don't affect the URL path
                const segment = entry.name.startsWith('(') && entry.name.endsWith(')') ? '' : entry.name;
                const nextRoute = segment ? `${currentRoute}/${segment}` : currentRoute;
                walk(fullPath, nextRoute);
            } else if (entry.isFile() && (entry.name === 'page.jsx' || entry.name === 'page.js' || entry.name === 'route.js')) {
                const finalRoute = currentRoute === '' ? '/' : currentRoute;
                routes.push({
                    route: finalRoute,
                    file: path.relative(projectRoot, fullPath).replace(/\\/g, '/'),
                    type: entry.name.startsWith('page') ? 'page' : 'api'
                });
            }
        }
    }

    walk(appDir);
    return routes;
}

// 2. Discover DOM IDs in public homepage
function getHomepageDomIds() {
    const homePath = path.join(projectRoot, 'app/(public)/page.jsx');
    const content = fs.readFileSync(homePath, 'utf8');
    const idRegex = /\bid=["']([^"']+)["']/g;
    const ids = new Set();
    let match;
    while ((match = idRegex.exec(content)) !== null) {
        ids.add(match[1]);
    }
    return ids;
}

// 3. Match a path against App Router route list
function routeMatches(targetPath, knownRoutes) {
    const cleanPath = targetPath.split('?')[0].split('#')[0];
    if (cleanPath === '' || cleanPath === '/') {
        const root = knownRoutes.find(r => r.route === '/');
        return { matched: true, matchedRoute: '/', file: root ? root.file : 'app/(public)/page.jsx' };
    }

    // 1. Try exact static match first
    const staticMatch = knownRoutes.find(r => r.route === cleanPath);
    if (staticMatch) {
        return { matched: true, matchedRoute: staticMatch.route, file: staticMatch.file };
    }

    // 2. Try dynamic route match
    // Sort dynamic routes so more specific routes come before generic /[username]
    const dynamicRoutes = knownRoutes
        .filter(r => r.route.includes('['))
        .sort((a, b) => b.route.split('/').length - a.route.split('/').length);

    for (const r of dynamicRoutes) {
        const routePattern = r.route;
        // Convert route pattern like /shop/[username] to regex ^/shop/[^/]+$
        const regexStr = '^' + routePattern.replace(/\[([^\]]+)\]/g, '[^/]+') + '$';
        const regex = new RegExp(regexStr);
        if (regex.test(cleanPath)) {
            return { matched: true, matchedRoute: r.route, file: r.file };
        }
    }
    return { matched: false };
}

// 4. Parse all links in a given file
function inspectLinksInFile(relFilePath, knownRoutes, homepageIds) {
    const fullPath = path.join(projectRoot, relFilePath);
    if (!fs.existsSync(fullPath)) {
        return [{ file: relFilePath, error: 'File does not exist' }];
    }
    const content = fs.readFileSync(fullPath, 'utf8');

    // Multiline regex for <Link ...> and <a ...>
    const tagRegex = /<(Link|a)\b([\s\S]*?)>/g;
    const results = [];
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
        const tagName = match[1];
        const tagBody = match[2];
        const matchIndex = match.index;
        // Calculate line number
        const lineNumber = content.substring(0, matchIndex).split('\n').length;

        // Extract href
        const hrefMatch = /href=(?:\{`([\s\S]*?)`\}|\{([\s\S]*?)\}|"([^"]*)"|'([^']*)')/.exec(tagBody);
        if (!hrefMatch) {
            continue;
        }

        const rawHref = (hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || hrefMatch[4] || '').trim();
        let status = 'UNKNOWN';
        let reason = '';

        // Handle external links
        if (rawHref.startsWith('http://') || rawHref.startsWith('https://') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
            status = 'PASS';
            reason = 'External link';
        }
        // Handle anchors on current or home page
        else if (rawHref.startsWith('/#') || rawHref.startsWith('#')) {
            const anchorId = rawHref.replace(/^\/?#/, '').split('?')[0];
            if (homepageIds.has(anchorId)) {
                status = 'PASS';
                reason = `Valid DOM anchor id="#${anchorId}" in app/(public)/page.jsx`;
            } else {
                status = 'FAIL';
                reason = `Dead anchor: id="#${anchorId}" NOT found in app/(public)/page.jsx`;
            }
        }
        // Handle dynamic expressions
        else if (rawHref.includes('${') || rawHref.startsWith('storeUrl') || rawHref.startsWith('`')) {
            // Replace template variables like ${...} with mock 'demo-store'
            const simulated = rawHref
                .replace(/\$\{[^}]+\}/g, 'demo-slug')
                .replace(/storeUrl/, '/shop/demo-slug')
                .replace(/`|'/g, '');

            const matchResult = routeMatches(simulated, knownRoutes);
            if (matchResult.matched) {
                status = 'PASS';
                reason = `Dynamic route resolves to ${matchResult.matchedRoute} (${matchResult.file})`;
            } else {
                status = 'FAIL';
                reason = `Unresolved dynamic route target: ${simulated}`;
            }
        }
        // Handle static internal routes
        else {
            const cleanHref = rawHref.split('?')[0].split('#')[0];
            const matchResult = routeMatches(cleanHref, knownRoutes);
            if (matchResult.matched) {
                status = 'PASS';
                reason = `Static route resolves to ${matchResult.matchedRoute} (${matchResult.file})`;
            } else {
                status = 'FAIL';
                reason = `Dead internal route: ${cleanHref} does not match any App Router page`;
            }
        }

        results.push({
            file: relFilePath,
            line: lineNumber,
            tagName,
            rawHref,
            status,
            reason
        });
    }

    return results;
}

// Run audit
const knownRoutes = getAppRouterRoutes();
const homepageIds = getHomepageDomIds();

console.log('======================================================================');
console.log('🔍 EMPIRICAL LINK INTEGRITY & ROUTE AUDIT (CHALLENGER M1_2)');
console.log('======================================================================');
console.log(`Discovered ${knownRoutes.length} App Router routes in app/`);
console.log(`Discovered ${homepageIds.size} DOM IDs in app/(public)/page.jsx: ${Array.from(homepageIds).join(', ')}`);
console.log('----------------------------------------------------------------------');

const targetFiles = [
    'components/Navbar.jsx',
    'components/Footer.jsx',
    'app/dashboard/page.jsx',
    'app/login/page.jsx',
    'app/store/settings/page.jsx'
];

let totalLinks = 0;
let passCount = 0;
let failCount = 0;
const failureList = [];

for (const targetFile of targetFiles) {
    const fileLinks = inspectLinksInFile(targetFile, knownRoutes, homepageIds);
    console.log(`\n📄 ${targetFile} (${fileLinks.length} links found):`);
    for (const l of fileLinks) {
        totalLinks++;
        if (l.status === 'PASS') {
            passCount++;
            console.log(`  ✅ [L${l.line}] ${l.rawHref} -> ${l.reason}`);
        } else {
            failCount++;
            failureList.push(l);
            console.log(`  ❌ [L${l.line}] ${l.rawHref} -> ${l.reason}`);
        }
    }
}

// 5. Check for defunct/dead patterns across app, components, and lib
console.log('\n----------------------------------------------------------------------');
console.log('🔎 CODEBASE SCAN FOR DEFUNCT TOKENS in app/, components/, lib/:');
const deadPatterns = [
    { pattern: '/store/products', label: 'Defunct 404 Route /store/products' },
    { pattern: 'flash-deals', label: 'Defunct Anchor #flash-deals' },
    { pattern: '#reviews', label: 'Defunct Anchor #reviews' }
];

let defunctFound = false;

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            scanDir(full);
        } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js'))) {
            const text = fs.readFileSync(full, 'utf8');
            for (const dp of deadPatterns) {
                if (text.includes(dp.pattern)) {
                    console.error(`  ❌ FOUND ${dp.label} in ${path.relative(projectRoot, full)}!`);
                    defunctFound = true;
                }
            }
        }
    }
}

['app', 'components', 'lib'].forEach(d => scanDir(path.join(projectRoot, d)));

if (!defunctFound) {
    console.log('  ✅ Zero occurrences of /store/products, flash-deals, or #reviews found across app/, components/, and lib/!');
}

console.log('\n======================================================================');
console.log(`📊 SUMMARY: ${passCount}/${totalLinks} links passed. Failures: ${failCount}`);
console.log('======================================================================');

if (failCount > 0 || defunctFound) {
    console.error('❌ LINK AUDIT FAILED! Details:', failureList);
    process.exit(1);
} else {
    console.log('✅ ALL AUDITED LINKS VERIFIED CLEANLY WITH 100% RESOLUTION!');
    process.exit(0);
}
