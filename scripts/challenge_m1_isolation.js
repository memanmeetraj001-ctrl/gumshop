/**
 * 🧪 Challenger 1: Empirical Stress Harness for Milestone M1
 * Multi-Store Data Isolation & Credential Separation Stress Testing
 */

import assert from 'assert';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

async function challenge(title, fn) {
    totalTests++;
    const start = performance.now();
    try {
        await fn();
        const duration = Math.round(performance.now() - start);
        console.log(`  ✅ [PASS] ${title} (${duration}ms)`);
        passedTests++;
    } catch (err) {
        const duration = Math.round(performance.now() - start);
        console.error(`  ❌ [FAIL] ${title} (${duration}ms): ${err.message}`);
        failedTests++;
        failures.push({ title, error: err.message, stack: err.stack });
    }
}

async function runEmpiricalStressSuite() {
    console.log(`\n======================================================================`);
    console.log(`🥊 EMPIRICAL CHALLENGER 1: M1 MULTI-STORE DATA & CREDENTIAL ISOLATION`);
    console.log(`📅 Execution: ${new Date().toISOString()}`);
    console.log(`======================================================================\n`);

    const {
        getServerGumroadToken,
        setServerGumroadToken,
        clearServerGumroadToken
    } = await import('../lib/serverVault.js');

    const {
        saveServerOrder,
        getServerOrdersByStore,
        getServerOrder
    } = await import('../lib/serverOrderStore.js');

    // =========================================================================
    // SUITE 1: Concurrency and Race Condition Stress Test for Credentials
    // =========================================================================
    console.log(`🔐 [SUITE 1] Vault Credential Separation Under Concurrency Stress`);

    await challenge('Concurrent alternating writes and reads maintain absolute isolation', async () => {
        const TOKEN_ALPHA = 'gum_secret_alpha_live_999888';
        const TOKEN_BETA = 'gum_secret_beta_live_111222';

        // 1. Initial write
        await setServerGumroadToken(TOKEN_ALPHA, 'stress-alpha');
        await setServerGumroadToken(TOKEN_BETA, 'stress-beta');

        // 2. 200 concurrent randomized operations
        const ops = [];
        for (let i = 0; i < 200; i++) {
            const opType = i % 4;
            if (opType === 0) {
                // Read Alpha
                ops.push(async () => {
                    const token = await getServerGumroadToken('stress-alpha');
                    if (token !== TOKEN_ALPHA) {
                        throw new Error(`Store Alpha read contaminated or wrong: expected ${TOKEN_ALPHA}, got ${token}`);
                    }
                });
            } else if (opType === 1) {
                // Read Beta
                ops.push(async () => {
                    const token = await getServerGumroadToken('stress-beta');
                    if (token !== TOKEN_BETA) {
                        throw new Error(`Store Beta read contaminated or wrong: expected ${TOKEN_BETA}, got ${token}`);
                    }
                });
            } else if (opType === 2) {
                // Read Unconfigured Store (must be empty string, zero leak)
                ops.push(async () => {
                    const token = await getServerGumroadToken(`stress-unconfigured-${i}`);
                    if (token !== '') {
                        throw new Error(`Unconfigured store read leaked credentials: got ${token}`);
                    }
                });
            } else {
                // Re-write Alpha with delay
                ops.push(async () => {
                    await setServerGumroadToken(TOKEN_ALPHA, 'stress-alpha');
                    const token = await getServerGumroadToken('stress-alpha');
                    if (token !== TOKEN_ALPHA) {
                        throw new Error(`Store Alpha write failed during concurrency: got ${token}`);
                    }
                });
            }
        }

        // Run all 200 operations concurrently
        await Promise.all(ops.map(fn => fn()));
    });

    await challenge('Clearing Store Alpha credentials leaves Store Beta completely untouched', async () => {
        const TOKEN_BETA = 'gum_secret_beta_live_111222';
        await clearServerGumroadToken('stress-alpha');

        const alphaTokenAfterClear = await getServerGumroadToken('stress-alpha');
        assert.strictEqual(alphaTokenAfterClear, '', 'Cleared store must return empty string');

        const betaTokenAfterAlphaClear = await getServerGumroadToken('stress-beta');
        assert.strictEqual(betaTokenAfterAlphaClear, TOKEN_BETA, 'Store Beta credentials must survive Store Alpha clear intact');

        // Clean up Beta
        await clearServerGumroadToken('stress-beta');
        const betaTokenAfterBetaClear = await getServerGumroadToken('stress-beta');
        assert.strictEqual(betaTokenAfterBetaClear, '', 'Cleared store must return empty string');
    });

    // =========================================================================
    // SUITE 2: Multi-Store Order Partitioning Under Load
    // =========================================================================
    console.log(`\n📦 [SUITE 2] Multi-Store Order Isolation Under High Load (100 Concurrent Orders)`);

    await challenge('100 orders across 3 distinct stores are partitioned with zero cross-contamination', async () => {
        const storeAlphaOrders = [];
        const storeBetaOrders = [];
        const storeGammaOrders = [];

        // Generate 45 Alpha orders, 45 Beta orders, 10 Gamma orders
        const savePromises = [];

        for (let i = 0; i < 45; i++) {
            const orderId = `ord_stress_alpha_${i}_${Date.now()}`;
            const orderData = {
                id: orderId,
                orderId,
                storeId: i % 2 === 0 ? 'store_alpha_stress' : 'alpha_stress',
                storeSlug: 'alpha_stress',
                total: 20 + i,
                customer: { email: `buyer_alpha_${i}@test.com` },
                createdAt: new Date(Date.now() - i * 1000).toISOString()
            };
            storeAlphaOrders.push(orderId);
            savePromises.push(saveServerOrder(orderId, orderData));
        }

        for (let i = 0; i < 45; i++) {
            const orderId = `ord_stress_beta_${i}_${Date.now()}`;
            const orderData = {
                id: orderId,
                orderId,
                storeId: i % 2 === 0 ? 'store_beta_stress' : 'beta_stress',
                storeSlug: 'beta_stress',
                total: 50 + i,
                customer: { email: `buyer_beta_${i}@test.com` },
                createdAt: new Date(Date.now() - i * 1000).toISOString()
            };
            storeBetaOrders.push(orderId);
            savePromises.push(saveServerOrder(orderId, orderData));
        }

        for (let i = 0; i < 10; i++) {
            const orderId = `ord_stress_gamma_${i}_${Date.now()}`;
            const orderData = {
                id: orderId,
                orderId,
                storeId: 'gamma_stress',
                storeSlug: 'gamma_stress',
                total: 100 + i,
                customer: { email: `buyer_gamma_${i}@test.com` },
                createdAt: new Date(Date.now() - i * 1000).toISOString()
            };
            storeGammaOrders.push(orderId);
            savePromises.push(saveServerOrder(orderId, orderData));
        }

        // Save all concurrently
        await Promise.all(savePromises);

        // Fetch Alpha orders using slug
        const fetchedAlpha = await getServerOrdersByStore('alpha_stress');
        // Fetch Beta orders using slug
        const fetchedBeta = await getServerOrdersByStore('beta_stress');
        // Fetch Gamma orders using slug
        const fetchedGamma = await getServerOrdersByStore('gamma_stress');
        // Fetch an unconfigured/empty store
        const fetchedNonExistent = await getServerOrdersByStore('store_nonexistent_empty');

        // Assert Alpha isolation
        assert.strictEqual(fetchedAlpha.length, 45, `Expected exactly 45 Alpha orders, got ${fetchedAlpha.length}`);
        const alphaIds = new Set(fetchedAlpha.map(o => o.id));
        storeAlphaOrders.forEach(id => {
            assert.strictEqual(alphaIds.has(id), true, `Store Alpha missing its order ${id}`);
        });
        fetchedAlpha.forEach(order => {
            assert.strictEqual(storeBetaOrders.includes(order.id), false, `CRITICAL: Alpha contains Beta order ${order.id}`);
            assert.strictEqual(storeGammaOrders.includes(order.id), false, `CRITICAL: Alpha contains Gamma order ${order.id}`);
        });

        // Assert Beta isolation
        assert.strictEqual(fetchedBeta.length, 45, `Expected exactly 45 Beta orders, got ${fetchedBeta.length}`);
        const betaIds = new Set(fetchedBeta.map(o => o.id));
        storeBetaOrders.forEach(id => {
            assert.strictEqual(betaIds.has(id), true, `Store Beta missing its order ${id}`);
        });
        fetchedBeta.forEach(order => {
            assert.strictEqual(storeAlphaOrders.includes(order.id), false, `CRITICAL: Beta contains Alpha order ${order.id}`);
            assert.strictEqual(storeGammaOrders.includes(order.id), false, `CRITICAL: Beta contains Gamma order ${order.id}`);
        });

        // Assert Gamma isolation
        assert.strictEqual(fetchedGamma.length, 10, `Expected 10 Gamma orders, got ${fetchedGamma.length}`);

        // Assert Nonexistent store returns 0
        assert.strictEqual(fetchedNonExistent.length, 0, `Expected 0 orders for nonexistent store, got ${fetchedNonExistent.length}`);
    });

    await challenge('Orders with saleId and orderNumber deduplicate cleanly in getServerOrdersByStore', async () => {
        const orderId = `ord_dedupe_test_${Date.now()}`;
        const saleId = `sale_dedupe_${Date.now()}`;
        const orderNumber = 887766;

        await saveServerOrder(orderId, {
            id: orderId,
            orderId,
            saleId,
            orderNumber,
            storeId: 'store_dedupe_shop',
            storeSlug: 'dedupe_shop',
            total: 42.00,
            createdAt: new Date().toISOString()
        });

        const orders = await getServerOrdersByStore('dedupe_shop');
        const matches = orders.filter(o => o.id === orderId);
        assert.strictEqual(matches.length, 1, `Expected exactly 1 order instance, got ${matches.length} (deduplication failure)`);
    });

    // =========================================================================
    // SUITE 3: Edge Cases, Normalization, and Attack Payloads
    // =========================================================================
    console.log(`\n🛡️ [SUITE 3] Edge Cases: Case Sensitivity, Special Characters & Attack Strings`);

    await challenge('Case sensitivity: Credentials and orders match across UPPER, lower, and MiXeD case', async () => {
        const TOKEN_CASE = 'gum_secret_case_insensitive_123';
        await setServerGumroadToken(TOKEN_CASE, 'My-CaSe-StOrE');

        const upperToken = await getServerGumroadToken('MY-CASE-STORE');
        const lowerToken = await getServerGumroadToken('my-case-store');
        const mixedToken = await getServerGumroadToken('mY-cAsE-sToRe');

        assert.strictEqual(upperToken, TOKEN_CASE, 'UPPERCASE lookup must match');
        assert.strictEqual(lowerToken, TOKEN_CASE, 'lowercase lookup must match');
        assert.strictEqual(mixedToken, TOKEN_CASE, 'MiXeD case lookup must match');

        // Order case sensitivity
        const caseOrderId = `ord_case_test_${Date.now()}`;
        await saveServerOrder(caseOrderId, {
            id: caseOrderId,
            orderId: caseOrderId,
            storeId: 'STORE_CASE_UPPER',
            storeSlug: 'case_upper',
            total: 15.00,
            createdAt: new Date().toISOString()
        });

        const fetchedUpper = await getServerOrdersByStore('store_case_upper');
        const fetchedLower = await getServerOrdersByStore('case_upper');
        const fetchedMixed = await getServerOrdersByStore('StOrE_cAsE_uPpEr');

        assert.strictEqual(fetchedUpper.some(o => o.id === caseOrderId), true, 'Store orders must resolve lowercase store_ query');
        assert.strictEqual(fetchedLower.some(o => o.id === caseOrderId), true, 'Store orders must resolve stripped slug query');
        assert.strictEqual(fetchedMixed.some(o => o.id === caseOrderId), true, 'Store orders must resolve mixed-case query');
    });

    await challenge('Slug prefix flexibility: store_ prefix normalization resolves seamlessly', async () => {
        const TOKEN_PREFIX = 'gum_secret_prefix_test_456';
        await setServerGumroadToken(TOKEN_PREFIX, 'store_super_shop');

        const withPrefix = await getServerGumroadToken('store_super_shop');
        const withoutPrefix = await getServerGumroadToken('super_shop');

        assert.strictEqual(withPrefix, TOKEN_PREFIX, 'With store_ prefix must resolve token');
        assert.strictEqual(withoutPrefix, TOKEN_PREFIX, 'Without store_ prefix must resolve token');
    });

    await challenge('Whitespace trimming: padded slugs do not create phantom stores or leak', async () => {
        const TOKEN_TRIM = 'gum_secret_trim_789';
        await setServerGumroadToken(TOKEN_TRIM, '   spaced_store   ');

        const cleanLookup = await getServerGumroadToken('spaced_store');
        const rawLookup = await getServerGumroadToken('   spaced_store   ');

        assert.strictEqual(cleanLookup, TOKEN_TRIM, 'Clean lookup must find trimmed token');
        assert.strictEqual(rawLookup, TOKEN_TRIM, 'Padded lookup must find trimmed token');
    });

    await challenge('Special characters in store slug do not throw unhandled exceptions or corrupt vault', async () => {
        const specialSlugs = [
            'store-with-hyphens',
            'store_with_underscores',
            'store.with.dots',
            'store@domain',
            'store#hash',
            'store$dollar',
            'store(parens)'
        ];

        for (const slug of specialSlugs) {
            const token = `token_special_${slug}`;
            await setServerGumroadToken(token, slug);
            const retrieved = await getServerGumroadToken(slug);
            assert.strictEqual(retrieved, token, `Special slug [${slug}] failed round-trip`);
            await clearServerGumroadToken(slug);
        }
    });

    await challenge('Adversarial attack strings: SQLi, XSS, and Traversal payloads are safely isolated', async () => {
        const attackSlugs = [
            `' OR '1'='1`,
            `admin'--`,
            `<script>alert("xss")</script>`,
            `../../etc/passwd`,
            `..\\..\\windows\\system32`
        ];

        for (const slug of attackSlugs) {
            const token = `token_attack_${Buffer.from(slug).toString('hex')}`;
            await setServerGumroadToken(token, slug);
            const retrieved = await getServerGumroadToken(slug);
            assert.strictEqual(retrieved, token, `Attack payload slug [${slug}] failed isolation`);

            // Check that a standard store is NOT contaminated
            const normalStoreToken = await getServerGumroadToken('legit_store_unaffected');
            assert.strictEqual(normalStoreToken, '', `Attack string contaminated normal store!`);

            await clearServerGumroadToken(slug);
        }
    });

    await challenge('Prototype pollution resistance: __proto__ and constructor do not corrupt Object prototype', async () => {
        const tokenProto = 'malicious_proto_token';
        await setServerGumroadToken(tokenProto, '__proto__');
        await setServerGumroadToken(tokenProto, 'constructor');

        // Check Object prototype is clean
        const plainObj = {};
        assert.strictEqual(plainObj.gumroadToken, undefined, 'Object.prototype.gumroadToken polluted!');
        assert.strictEqual(plainObj[tokenProto], undefined, 'Object.prototype polluted by key!');
        assert.strictEqual(typeof plainObj.toString, 'function', 'Object.prototype.toString corrupted!');

        await clearServerGumroadToken('__proto__');
        await clearServerGumroadToken('constructor');
    });

    await challenge('Empty, null, undefined slugs: graceful handling and no global leakage', async () => {
        const unconfiguredStore = await getServerGumroadToken('nonexistent_random_store_777');
        assert.strictEqual(unconfiguredStore, '', 'Unconfigured store must return empty token');

        // Null / undefined query
        const nullStore = await getServerGumroadToken(null);
        const undefStore = await getServerGumroadToken(undefined);
        // Note: When no storeKey is provided, it falls back to global env or memory token,
        // but it must NEVER return a scoped store token from another store!
        const alphaToken = await getServerGumroadToken('stress-alpha');
        assert.strictEqual(nullStore !== 'gum_secret_alpha_live_999888', true, 'Global fallback must not leak Store Alpha token');
        assert.strictEqual(undefStore !== 'gum_secret_alpha_live_999888', true, 'Global fallback must not leak Store Alpha token');

        // Server orders query with empty slug
        // In GumShop architecture, getServerOrdersByStore('') or 'all' is the macro master fleet query for /dashboard
        const allOrders = await getServerOrdersByStore('');
        assert.strictEqual(Array.isArray(allOrders), true, 'Empty slug returns all orders array for macro dashboard');
    });

    // =========================================================================
    // SUMMARY
    // =========================================================================
    console.log(`\n======================================================================`);
    console.log(`📊 EMPIRICAL STRESS TEST SUITE RESULTS`);
    console.log(`======================================================================`);
    console.log(`Total Challenges: ${totalTests}`);
    console.log(`Passed:           ${passedTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log(`Failed:           ${failedTests}`);

    if (failedTests > 0) {
        console.log(`\n❌ Failures Detected:`);
        failures.forEach(f => {
            console.log(`  - ${f.title}: ${f.error}`);
        });
        process.exit(1);
    } else {
        console.log(`\n🎉 ALL EMPIRICAL CHALLENGES PASSED! Multi-store isolation verified.`);
        process.exit(0);
    }
}

runEmpiricalStressSuite().catch(err => {
    console.error('Fatal Runner Error:', err);
    process.exit(1);
});
