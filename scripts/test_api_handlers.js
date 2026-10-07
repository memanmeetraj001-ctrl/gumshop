import { GET as getAuth, POST as postAuth } from '../app/api/admin/auth/route.js';
import { GET as getStores } from '../app/api/stores/route.js';
import { GET as getProducts } from '../app/api/products/route.js';
import { GET as getStoreData } from '../app/api/store/data/route.js';
import { GET as getHomepage, POST as postHomepage } from '../app/api/store/homepage/route.js';
import { GET as getHistory } from '../app/api/importer/history/route.js';

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
    try {
        await fn();
        console.log(`✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`❌ FAIL: ${name}`, err);
        failed++;
    }
}

async function main() {
    console.log('--- Testing API Handlers In-Process ---');

    // 1. Auth GET
    await runTest('Auth GET (unauthenticated)', async () => {
        const req = new Request('http://localhost:3000/api/admin/auth');
        const res = await getAuth(req);
        const data = await res.json();
        if (data.authenticated !== false) throw new Error('Expected authenticated: false');
    });

    // 2. Auth POST (valid password)
    await runTest('Auth POST (valid password)', async () => {
        const req = new Request('http://localhost:3000/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'Meetminal@0406' })
        });
        const res = await postAuth(req);
        const data = await res.json();
        if (!data.success || !data.token) throw new Error('Expected success: true and token');
    });

    // 3. Auth POST (wrong password)
    await runTest('Auth POST (wrong password)', async () => {
        const req = new Request('http://localhost:3000/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'WrongPassword123' })
        });
        const res = await postAuth(req);
        if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
    });

    // 4. Stores GET
    await runTest('Stores GET', async () => {
        const req = new Request('http://localhost:3000/api/stores');
        const res = await getStores(req);
        const data = await res.json();
        if (!Array.isArray(data.stores) && !Array.isArray(data)) throw new Error('Expected stores array');
    });

    // 5. Products GET
    await runTest('Products GET', async () => {
        const req = new Request('http://localhost:3000/api/products');
        const res = await getProducts(req);
        const data = await res.json();
        if (!data) throw new Error('Expected data');
    });

    // 6. Store Data GET
    await runTest('Store Data GET', async () => {
        const req = new Request('http://localhost:3000/api/store/data');
        const res = await getStoreData(req);
        const data = await res.json();
        if (!data) throw new Error('Expected store data');
    });

    // 7. Homepage GET & POST
    await runTest('Homepage GET', async () => {
        const req = new Request('http://localhost:3000/api/store/homepage');
        const res = await getHomepage(req);
        const data = await res.json();
        if (!data) throw new Error('Expected homepage data');
    });

    // 8. Import History GET
    await runTest('Import History GET', async () => {
        const req = new Request('http://localhost:3000/api/importer/history');
        const res = await getHistory(req);
        const data = await res.json();
        if (!data.success || !Array.isArray(data.history)) throw new Error('Expected history array');
    });

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
}

main();
