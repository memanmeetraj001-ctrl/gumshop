const DOMAIN = 'https://www.gumshop.online';

const routes = [
    { name: 'Root Homepage', path: '/' },
    { name: 'Global Shop Catalog', path: '/shop' },
    { name: 'Storefront: Rubber Couch Toys', path: '/shop/rubber-couch-toys-official-store' },
    { name: 'Storefront: PhantomPaws', path: '/shop/phantompaws-headless-horseman-pet-costume' },
    { name: 'Stan Store: Rubber Couch Toys', path: '/creator/rubber-couch-toys-official-store' },
    { name: 'Stan Store: PhantomPaws', path: '/creator/phantompaws-headless-horseman-pet-costume' },
    { name: 'Admin Login Gate', path: '/login' },
    { name: 'Policy: Shipping', path: '/policies/shipping' },
    { name: 'Policy: Refund', path: '/policies/refund' },
    { name: 'Policy: Privacy', path: '/policies/privacy' },
    { name: 'Policy: Terms', path: '/policies/terms' },
    { name: 'Order Tracking', path: '/track' },
    { name: 'Cart View', path: '/cart' },
    { name: 'API: Stores List', path: '/api/stores' },
    { name: 'API: Products Catalog', path: '/api/products' },
    { name: 'API: Store Data (Rubber Couch)', path: '/api/store/data?slug=rubber-couch-toys-official-store' }
];

console.log('====================================================');
console.log('🌐 RUNNING LIVE CLOUDFLARE PRODUCTION AUDIT');
console.log('Domain:', DOMAIN);
console.log('====================================================\n');

let passed = 0;
let failed = 0;

for (const r of routes) {
    try {
        const start = Date.now();
        const res = await fetch(`${DOMAIN}${r.path}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const elapsed = Date.now() - start;
        const server = res.headers.get('server') || 'unknown';
        const cfRay = res.headers.get('cf-ray') || 'none';

        if (res.status === 200) {
            console.log(`✅ [200 OK] ${r.name.padEnd(35)} (${elapsed}ms) [Server: ${server}, Ray: ${cfRay.slice(0, 10)}]`);
            passed++;
        } else {
            console.error(`❌ [${res.status}] ${r.name.padEnd(35)} (${elapsed}ms) [Server: ${server}]`);
            failed++;
        }
    } catch (err) {
        console.error(`💥 [ERROR] ${r.name.padEnd(35)} - ${err.message}`);
        failed++;
    }
}

// Check Admin Authentication with Meetminal@0406
try {
    const authStart = Date.now();
    const authRes = await fetch(`${DOMAIN}/api/admin/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'Meetminal@0406' })
    });
    const authData = await authRes.json();
    const authElapsed = Date.now() - authStart;

    if (authRes.status === 200 && authData.authenticated === true) {
        console.log(`✅ [200 OK] Admin Auth (Meetminal@0406)      (${authElapsed}ms) Authenticated: true 🎉`);
        passed++;
    } else {
        console.error(`❌ [AUTH FAIL] Admin Auth returned:`, authData);
        failed++;
    }
} catch (err) {
    console.error(`💥 [ERROR] Admin Auth check failed:`, err.message);
    failed++;
}

console.log('\n====================================================');
console.log(`AUDIT RESULTS: ${passed} Passed, ${failed} Failed`);
console.log('====================================================');

if (failed > 0) {
    process.exit(1);
}
