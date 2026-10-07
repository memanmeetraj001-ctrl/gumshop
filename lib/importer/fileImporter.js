/**
 * CSV and JSON Catalog File Parser
 * Parses Shopify export CSVs and GumShop backup JSONs into standard import preview format.
 */

import { normalizeProductPrice, upgradeShopifyImageUrl, isCleanCatalogProduct } from './priceNormalizer.js';

export function parseCatalogFile(fileContent, fileName = 'Imported Catalog') {
    const trimmed = fileContent.trim();

    // 1. Check for JSON format
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            const rawList = Array.isArray(parsed) 
                ? parsed 
                : (parsed.products || parsed.items || (parsed.stores && parsed.stores[0]?.products) || []);

            const categoriesSet = new Set();
            const products = rawList.map((p, idx) => {
                const name = (p.name || p.title || `Product ${idx + 1}`).trim();
                const price = normalizeProductPrice(p.price || 0);
                const compareAt = normalizeProductPrice(p.compareAtPrice || p.compare_at_price || 0) || Math.round(price * 1.35 * 100) / 100;
                const img = upgradeShopifyImageUrl(p.image || p.images?.[0] || '');
                const cat = (p.category || p.product_type || 'Featured').trim();
                categoriesSet.add(cat);

                return {
                    id: p.id || `file_prod_${idx}_${Date.now()}`,
                    name,
                    price,
                    compareAtPrice: compareAt,
                    category: cat,
                    description: p.description || `${name} premium catalog item.`,
                    image: img,
                    images: Array.isArray(p.images) ? p.images : [img].filter(Boolean),
                    inStock: p.inStock !== false,
                    sourcePlatform: 'json_upload'
                };
            }).filter(p => isCleanCatalogProduct(p.name, p.price, p.image));

            const storeName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Imported Store';

            return {
                success: true,
                store: {
                    name: storeName,
                    description: `Curated catalog imported from ${fileName}.`,
                    theme: 'viral_lander',
                    themeColor: '#10B981'
                },
                categories: Array.from(categoriesSet),
                banners: [],
                products
            };
        } catch (e) {
            return { success: false, error: 'Invalid JSON file structure.' };
        }
    }

    // 2. Parse CSV format (Shopify Products Export CSV or generic CSV)
    try {
        const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
            return { success: false, error: 'CSV file must have a header row and at least 1 product row.' };
        }

        // Parse header row
        const headerRow = parseCsvLine(lines[0]);
        const headerMap = {};
        headerRow.forEach((h, idx) => {
            headerMap[h.toLowerCase().trim().replace(/[^a-z0-9]/g, '')] = idx;
        });

        // Determine key column indexes
        const titleIdx = headerMap['title'] ?? headerMap['name'] ?? headerMap['productname'] ?? 0;
        const priceIdx = headerMap['variantprice'] ?? headerMap['price'] ?? headerMap['unitprice'] ?? -1;
        const compareAtIdx = headerMap['variantcompareatprice'] ?? headerMap['compareatprice'] ?? headerMap['regularprice'] ?? -1;
        const imageIdx = headerMap['imagesrc'] ?? headerMap['image'] ?? headerMap['imageurl'] ?? headerMap['img'] ?? -1;
        const descIdx = headerMap['bodyhtml'] ?? headerMap['description'] ?? headerMap['body'] ?? -1;
        const catIdx = headerMap['type'] ?? headerMap['category'] ?? headerMap['productcategory'] ?? -1;

        const products = [];
        const categoriesSet = new Set();
        const seenNames = new Set();

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i]);
            if (cols.length <= titleIdx) continue;

            const name = (cols[titleIdx] || '').trim();
            if (!name || seenNames.has(name)) continue;

            const rawPrice = priceIdx !== -1 ? cols[priceIdx] : '0';
            const price = normalizeProductPrice(rawPrice);

            const rawCompareAt = compareAtIdx !== -1 ? cols[compareAtIdx] : '0';
            const compareAt = normalizeProductPrice(rawCompareAt) || (price > 0 ? Math.round(price * 1.35 * 100) / 100 : 0);

            let img = imageIdx !== -1 ? (cols[imageIdx] || '') : '';
            img = upgradeShopifyImageUrl(img);

            const cat = catIdx !== -1 && cols[catIdx] ? cols[catIdx].trim() : 'Featured';
            categoriesSet.add(cat);

            const rawDesc = descIdx !== -1 ? (cols[descIdx] || '').replace(/<[^>]*>?/gm, '').trim().slice(0, 500) : '';

            if (isCleanCatalogProduct(name, price, img)) {
                seenNames.add(name);
                products.push({
                    id: `csv_prod_${i}_${Date.now()}`,
                    name,
                    price,
                    compareAtPrice: compareAt,
                    category: cat,
                    description: rawDesc || `${name} high quality product.`,
                    image: img,
                    images: [img],
                    inStock: true,
                    sourcePlatform: 'csv_upload'
                });
            }
        }

        if (products.length === 0) {
            return { success: false, error: 'No valid products found in CSV. Ensure Title, Price, and Image columns are present.' };
        }

        const storeName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Imported Store';

        return {
            success: true,
            store: {
                name: storeName,
                description: `Curated catalog imported from ${fileName}.`,
                theme: 'viral_lander',
                themeColor: '#10B981'
            },
            categories: Array.from(categoriesSet),
            banners: [],
            products
        };

    } catch (err) {
        return { success: false, error: `Failed to parse CSV file: ${err.message}` };
    }
}

/**
 * Splits a single CSV row respecting quoted fields with commas.
 */
function parseCsvLine(text) {
    const p = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
            p.push(cur.trim());
            cur = '';
        } else {
            cur += c;
        }
    }
    p.push(cur.trim());
    return p;
}
