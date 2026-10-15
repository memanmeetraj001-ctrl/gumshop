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
    if (cleanPath === '') return true;

    for (const r of knownRoutes) {
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
    const lines = content.split('\n');

    const linkRegex = /<(?:Link|a)\b([^>]*?)>/g;
    const results = [];

    lines.forEach((line, lineIndex) => {
        let match;
        while ((match = linkRegex.exec(line)) !== null) {
            const tagAttrs = match[1];
            // Extract href
            const hrefMatch = /href=(?:\{`([^`]+)`\}|\{([^}]+)\}|"([^"]+)"|'([^']+)')/.exec(tagAttrs);
            if (!hrefMatch) {
                // Could be a Link or a with dynamic href across lines, check tag
                continue;
            }
            const rawHref = hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || hrefMatch[4];
            const lineNumber = lineIndex + 1;

            // Analyze href
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
                rawHref,
                status,
                reason,
                codeSnippet: line.trim()
            });
        }
    });

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

console.log('\n======================================================================');
console.log(`📊 SUMMARY: ${passCount}/${totalLinks} links passed. Failures: ${failCount}`);
console.log('======================================================================');

if (failCount > 0) {
    console.error('❌ LINK AUDIT FAILED! Details:', failureList);
    process.exit(1);
} else {
    console.log('✅ ALL AUDITED LINKS VERIFIED CLEANLY WITH 100% RESOLUTION!');
    process.exit(0);
}
