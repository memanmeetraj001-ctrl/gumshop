const baseUrl = 'https://www.gumshop.online';

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
    try {
        await fn();
        console.log(`✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`❌ FAIL: ${name}:`, err.message);
        failed++;
    }
}

async function main() {
    console.log(`--- Smoke Testing Live Production Site (${baseUrl}) ---`);

    // 1. Root Homepage
    await runTest('Homepage (/) returns 200', async () => {
        const res = await fetch(`${baseUrl}/`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // 2. Dashboard
    await runTest('Dashboard (/dashboard) returns 200', async () => {
        const res = await fetch(`${baseUrl}/dashboard`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // 3. Login
    await runTest('Login (/login) returns 200', async () => {
        const res = await fetch(`${baseUrl}/login`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // 4. Store Customers
    await runTest('Customers CRM (/store/customers) returns 200', async () => {
        const res = await fetch(`${baseUrl}/store/customers`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // 5. Store Orders
    await runTest('Orders (/store/orders) returns 200', async () => {
        const res = await fetch(`${baseUrl}/store/orders`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // 6. Store Coupons
    await runTest('Coupons (/store/coupons) returns 200', async () => {
        const res = await fetch(`${baseUrl}/store/coupons`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // 7. Store Import
    await runTest('Store Importer (/store/import) returns 200', async () => {
        const res = await fetch(`${baseUrl}/store/import`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // 8. Auth API GET
    await runTest('Auth API GET returns 200 and unauthenticated', async () => {
        const res = await fetch(`${baseUrl}/api/admin/auth`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (data.authenticated !== false) throw new Error('Expected authenticated: false');
    });

    // 9. Auth API POST (Valid)
    let sessionToken = null;
    await runTest('Auth API POST with correct master password', async () => {
        const res = await fetch(`${baseUrl}/api/admin/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'Meetminal@0406' })
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.success || !data.token) throw new Error('Failed to authenticate');
        sessionToken = data.token;
    });

    // 10. Auth API GET with Token
    await runTest('Auth API GET with Bearer token', async () => {
        const res = await fetch(`${baseUrl}/api/admin/auth`, {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (!data.authenticated) throw new Error('Expected authenticated: true with token');
    });

    // 11. Stores API
    await runTest('Stores API (/api/stores) returns 200', async () => {
        const res = await fetch(`${baseUrl}/api/stores`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // 12. Store Data API
    await runTest('Store Data API (/api/store/data) returns 200', async () => {
        const res = await fetch(`${baseUrl}/api/store/data`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // 13. Products API
    await runTest('Products API (/api/products) returns 200', async () => {
        const res = await fetch(`${baseUrl}/api/products`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // 14. Importer History API
    await runTest('Importer History API (/api/importer/history) returns 200', async () => {
        const res = await fetch(`${baseUrl}/api/importer/history`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    console.log(`\n========================================`);
    console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
    console.log(`========================================`);
}

main();
