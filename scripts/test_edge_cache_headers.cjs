/**
 * scripts/test_edge_cache_headers.cjs
 * 
 * Verifies that Edge CDN caching headers are correctly applied
 * to public catalog endpoints, reducing serverless invocations and bandwidth.
 */

const assert = require('assert');

async function main() {
    console.log('🧪 Starting Edge CDN Cache Headers Verification...\n');

    const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

    // 1. Test GET /api/products Edge Cache Headers
    console.log('Test 1: Checking GET /api/products response headers...');
    const prodRes = await fetch(`${BASE_URL}/api/products`, { cache: 'no-store' });
    assert.strictEqual(prodRes.status, 200, 'Products endpoint must return 200');
    
    const prodCacheControl = prodRes.headers.get('cache-control') || '';
    const prodCfCacheControl = prodRes.headers.get('cloudflare-cdn-cache-control') || '';
    console.log(`  - Cache-Control: "${prodCacheControl}"`);
    console.log(`  - Cloudflare-CDN-Cache-Control: "${prodCfCacheControl}"`);

    assert(prodCacheControl.includes('s-maxage=120'), 'Cache-Control must contain s-maxage=120');
    assert(prodCacheControl.includes('stale-while-revalidate=300'), 'Cache-Control must contain stale-while-revalidate=300');
    assert(prodCfCacheControl.includes('s-maxage=120'), 'Cloudflare-CDN-Cache-Control must contain s-maxage=120');
    console.log('  ✅ TEST 1 PASSED: /api/products returns Edge CDN caching headers.\n');

    // 2. Test GET /api/products?fresh=true Bypass
    console.log('Test 2: Checking GET /api/products?fresh=true cache bypass...');
    const freshRes = await fetch(`${BASE_URL}/api/products?fresh=true`, { cache: 'no-store' });
    const freshCacheControl = freshRes.headers.get('cache-control') || '';
    console.log(`  - Fresh Cache-Control: "${freshCacheControl}"`);
    assert(freshCacheControl.includes('no-store'), 'Fresh query must bypass cache with no-store');
    console.log('  ✅ TEST 2 PASSED: ?fresh=true successfully bypasses Edge CDN cache for admin.\n');

    // 3. Test GET /api/stores Edge Cache Headers
    console.log('Test 3: Checking GET /api/stores response headers...');
    const storeRes = await fetch(`${BASE_URL}/api/stores`, { cache: 'no-store' });
    assert.strictEqual(storeRes.status, 200, 'Stores endpoint must return 200');
    const storeCacheControl = storeRes.headers.get('cache-control') || '';
    console.log(`  - Cache-Control: "${storeCacheControl}"`);
    assert(storeCacheControl.includes('s-maxage=120'), 'Stores endpoint must contain s-maxage=120');
    console.log('  ✅ TEST 3 PASSED: /api/stores returns Edge CDN caching headers.\n');

    console.log('🎉 ALL EDGE CACHE HEADER TESTS PASSED!');
}

main().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
