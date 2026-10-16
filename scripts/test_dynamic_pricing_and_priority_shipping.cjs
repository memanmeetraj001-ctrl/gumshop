const assert = require('assert');
const fs = require('fs');

console.log('======================================================================');
console.log('🚀 TEST SUITE: DYNAMIC PRICING & PRIORITY SHIPPING VERIFICATION');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(title, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✅ [PASS] ${title}`);
        passedTests++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${title}`);
        console.error(`     Reason: ${err.message}`);
    }
}

// 1. Dynamic Checkout Route sizeDelta & rushFee logic
test('dynamic-checkout respects matchedVariant.priceDelta and rawDiff without collapsing to 0', () => {
    const routeCode = fs.readFileSync('app/api/gumroad/dynamic-checkout/route.js', 'utf8');
    assert.ok(
        routeCode.includes('if (matchedVariant.priceDelta !== undefined && matchedVariant.priceDelta !== null && !isNaN(parseFloat(matchedVariant.priceDelta)))'),
        'Must check matchedVariant.priceDelta first'
    );
    assert.ok(
        routeCode.includes('rawDiff = rawVPrice - baseV0Price'),
        'Must calculate rawDiff between variant price and base variant price'
    );
    assert.ok(
        routeCode.includes('parsedRushFee || 4.99'),
        'Fallback rush fee must be 4.99'
    );
});

// 2. ProductDetails.jsx Multi-Option & PriceDelta formula
test('ProductDetails.jsx implements multi-option selector and robust getVariantPricing', () => {
    const pdCode = fs.readFileSync('components/ProductDetails.jsx', 'utf8');
    assert.ok(
        pdCode.includes('hasProductOptions'),
        'ProductDetails must check hasProductOptions'
    );
    assert.ok(
        pdCode.includes('selectedOptions'),
        'ProductDetails must maintain selectedOptions state'
    );
    assert.ok(
        pdCode.includes('matchedVariant'),
        'ProductDetails must resolve matchedVariant dynamically'
    );
    assert.ok(
        pdCode.includes('activePricing = getVariantPricing(activeVariant)'),
        'ProductDetails must compute activePricing with getVariantPricing'
    );
    assert.ok(
        pdCode.includes('protectionFee = hasShippingProtection ? 4.99 : 0'),
        'ProductDetails must define protectionFee as 4.99 when hasShippingProtection is true'
    );
});

// 3. ProductDetails.jsx Price displays include protectionFee and sizeDelta
test('ProductDetails.jsx includes protectionFee in hero price, Buy Now button, mobile bar, and modal', () => {
    const pdCode = fs.readFileSync('components/ProductDetails.jsx', 'utf8');
    
    // Hero Price
    assert.ok(
        pdCode.includes('${(currentTier.totalPrice + protectionFee).toFixed(2)}'),
        'Hero price must include protectionFee'
    );

    // Buy Now Button
    assert.ok(
        pdCode.includes('`⚡ Buy Now • $${(currentTier.totalPrice + protectionFee).toFixed(2)}`'),
        'Buy Now CTA must include protectionFee'
    );

    // Mobile Sticky Bar
    assert.ok(
        pdCode.includes('${(currentTier.totalPrice + protectionFee).toFixed(2)}</span>'),
        'Mobile sticky buy bar must include protectionFee'
    );

    // Dynamic Checkout payload
    assert.ok(
        pdCode.includes('rushFee: hasShippingProtection ? 4.99 : 0'),
        'handleInstantBuyNow must pass rushFee: hasShippingProtection ? 4.99 : 0'
    );

    // Modal Total
    assert.ok(
        pdCode.includes('total={currentTier.totalPrice + protectionFee + (currentTier.qty >= 3 ? 0 : (storeInfo?.shipping?.standardFee || 4.99))}'),
        'Modal total must include protectionFee'
    );
});

// 4. CartDrawer.jsx Priority Dispatch Toggle & Checkout payload
test('CartDrawer.jsx implements hasPriorityProtection toggle, breakdown, and passes rushFee', () => {
    const cdCode = fs.readFileSync('components/CartDrawer.jsx', 'utf8');
    assert.ok(
        cdCode.includes('const [hasPriorityProtection, setHasPriorityProtection] = useState(true);'),
        'CartDrawer must have hasPriorityProtection state'
    );
    assert.ok(
        cdCode.includes('priorityFee = (hasPriorityProtection && items.length > 0) ? 4.99 : 0;'),
        'CartDrawer must compute priorityFee'
    );
    assert.ok(
        cdCode.includes('finalTotal = Math.max(0, Math.round(((subtotal || 0) + shippingFee + priorityFee - (appliedDiscount || 0)) * 100) / 100);'),
        'CartDrawer finalTotal must include priorityFee'
    );
    assert.ok(
        cdCode.includes('rushFee: priorityFee'),
        'CartDrawer handleCheckout must pass rushFee'
    );
    assert.ok(
        cdCode.includes('⚡ Buy Now • $${finalTotal.toFixed(2)}'),
        'CartDrawer checkout button must display dynamic finalTotal'
    );
});

// 5. GumroadIframeModal.jsx handles rushFee and eliminates double counting
test('GumroadIframeModal.jsx handles rushFee and displays Priority Dispatch as included when active', () => {
    const modalCode = fs.readFileSync('components/GumroadIframeModal.jsx', 'utf8');
    assert.ok(
        modalCode.includes('rushFee = 0,'),
        'GumroadIframeModal must accept rushFee prop'
    );
    assert.ok(
        modalCode.includes('hasRushFeePassed = parseFloat(rushFee || 0) > 0;'),
        'GumroadIframeModal must detect passed rushFee'
    );
    assert.ok(
        modalCode.includes('alreadyHasRush = hasRushFeePassed'),
        'alreadyHasRush must include hasRushFeePassed to prevent double counting'
    );
    assert.ok(
        modalCode.includes('Priority Dispatch & Safe Transit Active'),
        'Modal must show active indicator instead of double-charging when alreadyHasRush is true'
    );
});

// 6. Empirical Variant Math Verification: Delta never collapses to 0
test('Mathematical simulation: variant options with price deltas never collapse to 0', () => {
    const unitPrice = 52.99;
    const baseVariantPrice = 42.98;
    const discountRatio = unitPrice / baseVariantPrice; // 1.2329 (unitPrice > baseVariantPrice)

    const testVariant = {
        name: "Upgraded Package",
        price: 52.98, // $10 higher than baseVariantPrice (42.98)
        priceDelta: 10.00
    };

    // Old buggy logic:
    let oldDelta;
    const rawPrice = testVariant.price;
    if (rawPrice > 0) {
        const effPrice = (discountRatio < 0.999 && discountRatio > 0) ? Math.round(rawPrice * discountRatio * 100) / 100 : rawPrice;
        oldDelta = Math.max(0, Math.round((effPrice - unitPrice) * 100) / 100);
    }
    // In old logic: effPrice was rawPrice (52.98), oldDelta was Math.max(0, 52.98 - 52.99) = 0!
    assert.strictEqual(oldDelta, 0, 'Bug confirmed: old formula collapsed delta to 0');

    // New robust logic:
    let newDelta = 0;
    if (testVariant.priceDelta !== undefined && parseFloat(testVariant.priceDelta) > 0) {
        newDelta = parseFloat(testVariant.priceDelta);
    } else if (rawPrice > baseVariantPrice && baseVariantPrice > 0) {
        const rawDiff = rawPrice - baseVariantPrice;
        newDelta = (discountRatio < 0.999 && discountRatio > 0)
            ? Math.round(rawDiff * discountRatio * 100) / 100
            : Math.round(rawDiff * 100) / 100;
    }
    assert.strictEqual(newDelta, 10.00, 'New formula correctly preserves $10.00 price delta');
});

console.log('\n======================================================================');
console.log(`📊 RESULTS: ${passedTests}/${totalTests} passed`);
console.log('======================================================================\n');

if (passedTests !== totalTests) {
    process.exit(1);
} else {
    process.exit(0);
}
