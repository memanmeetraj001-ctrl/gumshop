/**
 * lib/productOptions.js
 * 
 * Standardized option extraction and price delta calculation across all product schemas
 * (variants, sizes, Shopify options, customBundles).
 */

export function normalizeProductOptions(product) {
    if (!product) return { hasOptions: false, optionsList: [], hasBundles: false, rawVariants: [] };

    // 1. Check custom variants (excluding single dummy "Default Title")
    const rawVariants = Array.isArray(product.variants) ? product.variants.filter(v => {
        if (!v) return false;
        const vTitle = String(v.name || v.title || v.label || '').trim().toLowerCase();
        return vTitle && vTitle !== 'default title';
    }) : [];

    // 2. Check wearable / custom sizes
    const rawSizes = Array.isArray(product.sizes) ? product.sizes : [];

    // 3. Check Shopify options: [{ name: 'Color', values: ['Pink', 'White'] }]
    let rawOptionsList = [];
    if (Array.isArray(product.options) && product.options.length > 0) {
        product.options.forEach(opt => {
            if (Array.isArray(opt?.values)) {
                rawOptionsList.push(...opt.values);
            } else if (typeof opt === 'string' && opt.toLowerCase() !== 'title' && opt.toLowerCase() !== 'default title') {
                rawOptionsList.push(opt);
            }
        });
    }

    // Candidate list of labels
    const candidateList = rawVariants.length > 0
        ? rawVariants.map(v => typeof v === 'string' ? v : (v.name || v.label || v.title || String(v)))
        : (rawSizes.length > 0
            ? rawSizes.map(s => typeof s === 'string' ? s : (s.name || s.label || s.title || String(s)))
            : rawOptionsList);

    const uniqueOptions = Array.from(new Set(candidateList.filter(Boolean)));
    const hasBundleOptions = Array.isArray(product.customBundles) && product.customBundles.length > 1;
    const hasOptions = uniqueOptions.length > 1 || (uniqueOptions.length >= 1 && hasBundleOptions) || hasBundleOptions;

    return {
        hasOptions,
        optionsList: uniqueOptions,
        hasBundles: hasBundleOptions,
        rawVariants
    };
}

export function getProductVariantPricing(product, variantOrSizeName) {
    const basePrice = parseFloat(product?.price !== undefined && product?.price !== null && product?.price !== '' ? product.price : 52.99);
    if (!variantOrSizeName || !product) {
        return { effectivePrice: basePrice, priceDelta: 0, matchedVariant: null };
    }
    const cleanName = String(variantOrSizeName).toLowerCase().trim();

    const rawVariants = Array.isArray(product.variants) ? product.variants : [];
    const allVariantsShareSamePrice = rawVariants.length > 0 && rawVariants.every(v => Math.abs(parseFloat(v.price || 0) - parseFloat(rawVariants[0]?.price || 0)) < 0.01);

    // 1. Check product.variants
    if (rawVariants.length > 0) {
        const matched = rawVariants.find(v => {
            if (!v) return false;
            if (v.id && String(v.id) === String(variantOrSizeName)) return true;
            const vName = String(v.name || v.label || v.title || '').toLowerCase().trim();
            return vName === cleanName || vName.includes(cleanName) || cleanName.includes(vName);
        });
        if (matched) {
            const vPrice = parseFloat(matched.price || 0);
            const baseV0Price = parseFloat(rawVariants[0]?.price || 0);
            let priceDelta = 0;

            if (allVariantsShareSamePrice) {
                priceDelta = 0;
            } else if (baseV0Price > 0 && vPrice > baseV0Price) {
                const discountRatio = (baseV0Price > 0 && basePrice < baseV0Price) ? (basePrice / baseV0Price) : 1;
                priceDelta = Math.round((vPrice - baseV0Price) * discountRatio * 100) / 100;
            } else if (matched.priceDelta !== undefined && matched.priceDelta !== null && !isNaN(parseFloat(matched.priceDelta))) {
                const rawDelta = Math.max(0, parseFloat(matched.priceDelta));
                if (Math.abs((basePrice + rawDelta) - vPrice) < 0.01 && vPrice > basePrice && (baseV0Price === vPrice || allVariantsShareSamePrice)) {
                    priceDelta = 0;
                } else {
                    priceDelta = rawDelta;
                }
            } else if (matched.effectivePrice && parseFloat(matched.effectivePrice) > basePrice && !allVariantsShareSamePrice) {
                priceDelta = Math.max(0, Math.round((parseFloat(matched.effectivePrice) - basePrice) * 100) / 100);
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
        const rawSizes = product.sizes;
        const allSizesShareSamePrice = rawSizes.every(s => Math.abs(parseFloat(s.priceDelta || 0) - parseFloat(rawSizes[0]?.priceDelta || 0)) < 0.01);
        const matched = rawSizes.find(s => {
            if (!s) return false;
            const sName = String(s.name || s.label || '').toLowerCase().trim();
            return sName === cleanName || sName.includes(cleanName) || cleanName.includes(sName);
        });
        if (matched) {
            let priceDelta = parseFloat(matched.priceDelta) || 0;
            if (allSizesShareSamePrice || allVariantsShareSamePrice) {
                priceDelta = 0;
            }
            return {
                effectivePrice: Math.round((basePrice + priceDelta) * 100) / 100,
                priceDelta,
                matchedVariant: matched
            };
        }
    }

    return { effectivePrice: basePrice, priceDelta: 0, matchedVariant: null };
}
