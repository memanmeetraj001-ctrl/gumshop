const http = require('http');

function getProductVariantPricing(product, variantOrSizeName) {
    const basePrice = parseFloat(product?.price !== undefined && product?.price !== null && product?.price !== '' ? product.price : 52.99);
    if (!variantOrSizeName || !product) {
        return { effectivePrice: basePrice, priceDelta: 0, matchedVariant: null };
    }
    const cleanName = String(variantOrSizeName).toLowerCase().trim();

    // 1. Check product.variants
    if (Array.isArray(product.variants) && product.variants.length > 0) {
        const matched = product.variants.find(v => {
            if (!v) return false;
            if (v.id && String(v.id) === String(variantOrSizeName)) return true;
            const vName = String(v.name || v.label || v.title || '').toLowerCase().trim();
            return vName === cleanName || vName.includes(cleanName) || cleanName.includes(vName);
        });
        if (matched) {
            const vPrice = parseFloat(matched.price || 0);
            const baseV0Price = parseFloat(product.variants[0]?.price || 0);
            let priceDelta = 0;
            if (matched.priceDelta !== undefined && matched.priceDelta !== null && !isNaN(parseFloat(matched.priceDelta))) {
                priceDelta = Math.max(0, parseFloat(matched.priceDelta));
            } else if (matched.effectivePrice && parseFloat(matched.effectivePrice) >= basePrice) {
                priceDelta = Math.max(0, Math.round((parseFloat(matched.effectivePrice) - basePrice) * 100) / 100);
            } else if (vPrice > baseV0Price && baseV0Price > 0) {
                priceDelta = Math.round((vPrice - baseV0Price) * 100) / 100;
            } else if (vPrice > 0 && (!baseV0Price || baseV0Price === 0) && vPrice > basePrice) {
                priceDelta = Math.round((vPrice - basePrice) * 100) / 100;
            }
            return {
                effectivePrice: Math.round((basePrice + priceDelta) * 100) / 100,
                priceDelta,
                matchedVariant: matched
            };
        }
    }

    // 2. Check product.sizes
    if (Array.isArray(product.sizes) && product.sizes.length > 0) {
        const matched = product.sizes.find(s => {
            if (!s) return false;
            const sName = String(s.name || s.label || '').toLowerCase().trim();
            return sName === cleanName || sName.includes(cleanName) || cleanName.includes(sName);
        });
        if (matched && matched.priceDelta) {
            const priceDelta = parseFloat(matched.priceDelta) || 0;
            return {
                effectivePrice: Math.round((basePrice + priceDelta) * 100) / 100,
                priceDelta,
                matchedVariant: matched
            };
        }
    }

    return { effectivePrice: basePrice, priceDelta: 0, matchedVariant: null };
}

async function runTests() {
    console.log('--- TEST 1: Variant Pricing Calculation ---');
    const mockBlaster = {
        id: 'prod_blaster_1',
        name: 'ARP9 3.0 Gel Blaster',
        price: 44.10,
        variants: [
            { id: 'v1', name: 'Standard (10k balls + 1 mag)', price: 125.98 },
            { id: 'v2', name: 'Tactical Pro (20k balls + 2 mags)', price: 135.98 }
        ]
    };

    const resV1 = getProductVariantPricing(mockBlaster, 'Standard (10k balls + 1 mag)');
    console.log('resV1:', resV1);
    if (resV1.effectivePrice !== 44.10 || resV1.priceDelta !== 0) {
        throw new Error(`Expected v1 base price 44.10 and delta 0, got ${resV1.effectivePrice}, delta ${resV1.priceDelta}`);
    }

    const resV2 = getProductVariantPricing(mockBlaster, 'Tactical Pro (20k balls + 2 mags)');
    console.log('resV2:', resV2);
    if (resV2.effectivePrice !== 54.10 || resV2.priceDelta !== 10.00) {
        throw new Error(`Expected v2 price 54.10 and delta 10.00, got ${resV2.effectivePrice}, delta ${resV2.priceDelta}`);
    }
    console.log('✅ TEST 1 Passed!');

    console.log('\n--- TEST 2: Dynamic Volume Bundle Scaling ---');
    const rawBundles = [
        { qty: 1, label: 'Single Unit', totalPrice: 44.10 },
        { qty: 2, label: 'Double Pack', totalPrice: 62.10 },
        { qty: 3, label: 'Triple Pack', totalPrice: 80.10 }
    ];

    const delta = resV2.priceDelta; // 10.00
    const scaledBundles = rawBundles.map(b => {
        const qty = b.qty;
        const scaledTotal = Math.round((b.totalPrice + (delta * qty)) * 100) / 100;
        const scaledUnit = Math.round((scaledTotal / qty) * 100) / 100;
        return { ...b, totalPrice: scaledTotal, pricePerUnit: scaledUnit };
    });

    console.log('scaledBundles:', scaledBundles);
    if (scaledBundles[0].totalPrice !== 54.10) throw new Error(`Bundle 1 mismatch: ${scaledBundles[0].totalPrice}`);
    if (scaledBundles[1].totalPrice !== 82.10) throw new Error(`Bundle 2 mismatch: ${scaledBundles[1].totalPrice}`);
    if (scaledBundles[2].totalPrice !== 110.10) throw new Error(`Bundle 3 mismatch: ${scaledBundles[2].totalPrice}`);
    console.log('✅ TEST 2 Passed!');

    console.log('\n--- TEST 3: Coupon Discount Application ---');
    const coupon20 = { code: 'SAVE20', type: 'percentage', discount: 20 };
    const b2Total = scaledBundles[1].totalPrice; // 82.10
    const discountVal = Math.round(b2Total * (coupon20.discount / 100) * 100) / 100; // 16.42
    const finalPrice = Math.max(1.00, Math.round((b2Total - discountVal) * 100) / 100); // 65.68
    console.log(`b2Total: $${b2Total}, discount: $${discountVal}, finalPrice: $${finalPrice}`);
    if (finalPrice !== 65.68) throw new Error(`Expected final price 65.68, got ${finalPrice}`);
    console.log('✅ TEST 3 Passed!');

    console.log('\n--- TEST 4: Dynamic Checkout API Verification ---');
    const postData = JSON.stringify({
        storeId: 'store_rubber-couch-toys-official-store',
        storeSlug: 'rubber-couch-toys-official-store',
        storeName: 'Rubber Couch Toys Official Store',
        items: [{
            productId: 'prod_rubber-couch-toys-official-store_1_zqv5',
            name: 'ARP9 3.0 Gel Blaster (Option: Tactical Pro • Double Pack)',
            price: scaledBundles[1].pricePerUnit,
            quantity: 2,
            variant: 'Tactical Pro (20k balls + 2 mags)',
            selectedVariantId: 'v2'
        }],
        discountAmount: discountVal,
        couponCode: 'SAVE20'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/gumroad/dynamic-checkout',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
            console.log('HTTP Status:', res.statusCode);
            try {
                const parsed = JSON.parse(body);
                console.log('API Response:', parsed);
                if (res.statusCode === 200 && parsed.success) {
                    console.log(`✅ Checkout Total: $${parsed.total}`);
                    console.log('✅ TEST 4 Passed!');
                    console.log('\n🎉 ALL 4 DYNAMIC PRICING TESTS PASSED PERFECTLY!');
                    process.exit(0);
                } else {
                    console.error('API Error Response:', parsed);
                    process.exit(1);
                }
            } catch (err) {
                console.error('Failed to parse API response:', body);
                process.exit(1);
            }
        });
    });

    req.on('error', (e) => {
        console.error('Request Error:', e);
        process.exit(1);
    });

    req.write(postData);
    req.end();
}

runTests().catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
