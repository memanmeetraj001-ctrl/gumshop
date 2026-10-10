/**
 * Central Store Presets and Starter Catalogs
 * Shared between standard storefronts (/shop/[username]) and creator link-in-bio (/creator/[username])
 */

export const STARTER_PRODUCTS = [
    {
        id: "starter_prod_1",
        name: "Minimalist Ultra-Thin Chrono Watch",
        description: "Sapphire crystal glass, Japanese quartz movement, genuine Italian leather strap.",
        price: 49.99,
        compareAtPrice: 89.99,
        category: "Accessories",
        images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"],
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
        rating: [{ rating: 5, review: "Exceptional quality. Fast shipping!" }],
        reviewCount: 48,
        isInstantBuyGumroad: true
    },
    {
        id: "starter_prod_2",
        name: "Wireless ANC Matte Studio Headphones",
        description: "Active noise cancellation, 40-hour battery life, high-fidelity spatial audio.",
        price: 79.99,
        compareAtPrice: 129.99,
        category: "Audio",
        images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"],
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
        rating: [{ rating: 5, review: "Sound quality rivals high-end brands." }],
        reviewCount: 36,
        isInstantBuyGumroad: true
    },
    {
        id: "starter_prod_3",
        name: "Nordic Minimalist Smart Ambient Lamp",
        description: "Touch-sensitive stepless dimming, 16M colors, warm ambient glow.",
        price: 34.99,
        compareAtPrice: 59.99,
        category: "Home & Decor",
        images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500"],
        image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500",
        rating: [{ rating: 5, review: "Transforms the whole desk setup aesthetic." }],
        reviewCount: 29,
        isInstantBuyGumroad: true
    },
    {
        id: "starter_prod_4",
        name: "Ergonomic Felt & Vegan Leather Desk Mat",
        description: "Water-resistant, non-slip base, extra-large surface for seamless productivity.",
        price: 24.99,
        compareAtPrice: 39.99,
        category: "Workspace",
        images: ["https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500"],
        image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500",
        rating: [{ rating: 5, review: "Clean aesthetic, very durable." }],
        reviewCount: 52,
        isInstantBuyGumroad: true
    }
];

export const RC_DRIFT_STARTER_PRODUCTS = [
    {
        id: "prod_hgt_drift_1",
        name: "HGT RS Pro Drift RC Car (1:16)• Fiber Black edition •",
        description: "1:16 high-speed precision drift chassis, 4WD brushless motor with dual drift gyro control.",
        price: 2499.00,
        compareAtPrice: 4999.00,
        category: "RC DRIFT CAR",
        images: ["https://cdn.shopify.com/s/files/1/0988/2022/7355/files/ChatGPT_Image_Feb_26_2026_11_36_47_PM.png?v=1772129521"],
        image: "https://cdn.shopify.com/s/files/1/0988/2022/7355/files/ChatGPT_Image_Feb_26_2026_11_36_47_PM.png?v=1772129521",
        rating: [{ rating: 5, review: "Insane drift angle and build quality!" }],
        reviewCount: 78,
        isInstantBuyGumroad: true
    },
    {
        id: "prod_hgt_drift_2",
        name: "HGT RS Racing Edition RC Car (1:24)• Turbo White •",
        description: "1:24 scale racing chassis with smoke exhaust effect and replaceable drift slicks.",
        price: 1199.00,
        compareAtPrice: 1999.00,
        category: "RC DRIFT CAR",
        images: ["https://cdn.shopify.com/s/files/1/0988/2022/7355/files/imageye___-_imgi_148_28880dc9-d4e5-44be-bfda-be07e270fc47.jpg?v=1790313372"],
        image: "https://cdn.shopify.com/s/files/1/0988/2022/7355/files/imageye___-_imgi_148_28880dc9-d4e5-44be-bfda-be07e270fc47.jpg?v=1790313372",
        rating: [{ rating: 5, review: "Best mini drift car on the market." }],
        reviewCount: 42,
        isInstantBuyGumroad: true
    },
    {
        id: "prod_hgt_drift_3",
        name: "HB Toys Racing Rally Climbing Beast 4WD (1:10 RTR)",
        description: "1:10 scale 4WD off-road climbing rally beast with hobby-grade suspension and high-torque motor.",
        price: 1399.00,
        compareAtPrice: 2299.00,
        category: "Offroaders",
        images: ["https://cdn.shopify.com/s/files/1/0988/2022/7355/files/BlackRCOff-RoadTruckandPackaging.png?v=1790869941"],
        image: "https://cdn.shopify.com/s/files/1/0988/2022/7355/files/BlackRCOff-RoadTruckandPackaging.png?v=1790869941",
        rating: [{ rating: 5, review: "Climbs steep rocks with zero effort." }],
        reviewCount: 65,
        isInstantBuyGumroad: true
    },
    {
        id: "prod_hgt_drift_4",
        name: "HGT 1:43 Mini 4WD Off-Road RC Crawler",
        description: "Pocket-sized 4WD crawler with proportional steering, LED headlights, and 45-minute battery life.",
        price: 349.00,
        compareAtPrice: 599.00,
        category: "Crawlers",
        images: ["https://cdn.shopify.com/s/files/1/0988/2022/7355/files/ChatGPTImageSep30_2026_01_30_05PM.png?v=1790755290"],
        image: "https://cdn.shopify.com/s/files/1/0988/2022/7355/files/ChatGPTImageSep30_2026_01_30_05PM.png?v=1790755290",
        rating: [{ rating: 5, review: "Perfect desk crawler, incredible suspension travel." }],
        reviewCount: 39,
        isInstantBuyGumroad: true
    }
];

export const HIGHGEARTOYS_PRODUCTS = RC_DRIFT_STARTER_PRODUCTS;
export const DEFAULT_STORE_STARTER_PRODUCTS = STARTER_PRODUCTS;

export const DEMO_PRESETS = {
    'aura-trends': {
        id: 'store_demo_1',
        name: 'Aura Trends',
        username: 'aura-trends',
        description: 'Viral gadgets and minimalist lifestyle tech. Free tracked worldwide shipping on orders over $50.',
        logo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
        themeColor: '#10B981',
        theme: 'viral_lander'
    },
    'neon-vault': {
        id: 'store_demo_2',
        name: 'Neon Vault',
        username: 'neon-vault',
        description: 'Curated cyberpunk gaming audio and RGB desk aesthetics.',
        logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
        themeColor: '#06B6D4',
        theme: 'tech_hardware'
    },
    'clean-glow': {
        id: 'store_demo_3',
        name: 'Clean Glow',
        username: 'clean-glow',
        description: 'Eco-friendly home essentials and smart ambient lighting.',
        logo: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200',
        themeColor: '#3B82F6',
        theme: 'clean_beauty'
    },
    'highgeartoys': {
        id: 'store_highgeartoys',
        name: 'HighGearToys',
        username: 'highgeartoys',
        description: 'Exclusive curated RC off-road crawlers and drift racing cars with express shipping.',
        logo: 'https://cdn.shopify.com/s/files/1/0988/2022/7355/files/ChatGPT_Image_Aug_27_2026_05_13_58_PM.png?v=1787831064',
        themeColor: '#10B981',
        theme: 'tech_hardware'
    },
    'buy-rc-drift-cars-online': {
        id: 'store_highgeartoys',
        name: 'Buy RC Drift Cars Online',
        username: 'buy-rc-drift-cars-online',
        description: 'Exclusive curated RC off-road crawlers and drift racing cars with express shipping.',
        logo: 'https://cdn.shopify.com/s/files/1/0988/2022/7355/files/ChatGPT_Image_Aug_27_2026_05_13_58_PM.png?v=1787831064',
        themeColor: '#10B981',
        theme: 'tech_hardware'
    },
    'higt-rc-drift-cars-onlinee': {
        id: 'store_higt_rc_drift',
        name: 'Buy RC Drift Cars Online',
        username: 'higt-rc-drift-cars-onlinee',
        description: 'Exclusive curated RC off-road crawlers and drift racing cars with express shipping.',
        logo: 'https://cdn.shopify.com/s/files/1/0988/2022/7355/files/ChatGPT_Image_Aug_27_2026_05_13_58_PM.png?v=1787831064',
        themeColor: '#10B981',
        theme: 'tech_hardware'
    },
    'high-rc-toys': {
        id: 'store_high_rc_toys',
        name: 'High Rc Toys',
        username: 'high-rc-toys',
        description: 'Curated remote control cars, drift trucks, and off-road crawlers.',
        logo: 'https://cdn.shopify.com/s/files/1/0988/2022/7355/files/ChatGPT_Image_Aug_27_2026_05_13_58_PM.png?v=1787831064',
        themeColor: '#10B981',
        theme: 'tech_hardware'
    }
};

export const DEFAULT_DEMO_CREATOR = {
    name: "Alex Rivera - UI & 3D Artist",
    verified: true,
    bio: "Creating game-ready 3D assets & Figma design systems. 40k+ creators served.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    socials: {
        twitter: "https://twitter.com",
        youtube: "https://youtube.com",
        github: "https://github.com",
        instagram: "https://instagram.com",
        tiktok: "https://tiktok.com"
    },
    products: [
        {
            id: "prod_demo_3d_icons",
            name: "Ultimate 3D Icon Pack",
            price: 29.00,
            image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
            description: "Over 200+ ultra high-res 3D icons rendered in 4K with transparent PNGs and source Blender files.",
            isInstantBuyGumroad: true
        },
        {
            id: "prod_demo_figma_system",
            name: "Figma SaaS Design System",
            price: 49.00,
            image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&auto=format&fit=crop&q=80",
            description: "Complete design system with 800+ variants, auto-layout 5.0, dark mode tokens, and mobile components.",
            isInstantBuyGumroad: false
        },
        {
            id: "prod_demo_notion_tracker",
            name: "Free Notion Freelance Tracker",
            price: 0,
            image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&auto=format&fit=crop&q=80",
            description: "All-in-one Notion workspace for freelance client CRM, invoice tracking, and project delivery.",
            isFreeDownload: true,
            downloadUrl: "https://gumroad.com"
        }
    ]
};

function checkStoreDeleted(storeIdOrSlug) {
    if (!storeIdOrSlug || typeof window === 'undefined') return false;
    try {
        const raw = localStorage.getItem('gumshop_deleted_stores');
        if (!raw) return false;
        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return false;
        const clean = String(storeIdOrSlug).toLowerCase().trim().replace(/^store_/, '');
        return list.some(item => {
            const cleanItem = String(item).toLowerCase().trim().replace(/^store_/, '');
            return cleanItem === clean;
        });
    } catch {
        return false;
    }
}

function checkProductDeleted(productId) {
    if (!productId || typeof window === 'undefined') return false;
    try {
        const raw = localStorage.getItem('gumshop_deleted_products');
        if (!raw) return false;
        const list = JSON.parse(raw);
        return Array.isArray(list) && list.includes(productId);
    } catch {
        return false;
    }
}

export function resolvePresetStore(slug) {
    const clean = (slug || '').toLowerCase().trim();
    if (!clean) return null;
    if (checkStoreDeleted(clean)) return null;
    if (DEMO_PRESETS[clean]) return DEMO_PRESETS[clean];
    return null;
}

export function resolvePresetProducts(slug, storeId) {
    const clean = (slug || '').toLowerCase().trim();
    if (checkStoreDeleted(clean) || (storeId && checkStoreDeleted(storeId))) return [];
    const isRc = clean.includes('rc') || clean.includes('drift') || clean.includes('toy') || clean.includes('car') || clean.includes('crawler') || clean.includes('highgear') || clean.includes('higt') || clean.includes('racing');
    const prods = isRc ? RC_DRIFT_STARTER_PRODUCTS : STARTER_PRODUCTS;
    const filtered = prods.filter(p => !checkProductDeleted(p.id));
    return storeId ? filtered.map(p => ({ ...p, storeId })) : filtered;
}

/**
 * Synchronous store & catalog resolver for instant frame-1 render without hydration flash
 */
export function getStoreAndCatalogSync(rawSlug) {
    const cleanUser = (rawSlug || '').toLowerCase().trim();
    if (!cleanUser) return { store: null, products: [] };
    if (checkStoreDeleted(cleanUser)) return { store: null, products: [] };

    if (cleanUser === 'demo') {
        if (typeof window !== 'undefined') {
            const activeSlug = localStorage.getItem('gumshop_active_store') || localStorage.getItem('designated_homepage_store');
            const keysToTry = [
                ...(activeSlug ? [`store_${activeSlug}`, `cloned_store_${activeSlug}`, `gumshop_db_stores/store_${activeSlug}`] : []),
                'store_demo', 'cloned_store_demo', 'gumshop_db_stores/store_demo'
            ];
            for (const k of keysToTry) {
                try {
                    const raw = sessionStorage.getItem(k) || localStorage.getItem(k);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed && (parsed.name || parsed.avatar || parsed.bioProfile || parsed.logo)) {
                            return {
                                store: parsed,
                                products: parsed.products || DEFAULT_DEMO_CREATOR.products
                            };
                        }
                    }
                } catch {}
            }

            // Fallback to first non-deleted store in localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith('store_') || k.startsWith('cloned_store_') || k.startsWith('gumshop_db_stores/')) && !k.includes('demo')) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(k) || 'null');
                        if (parsed && (parsed.name || parsed.username) && !checkStoreDeleted(parsed.id || parsed.username)) {
                            return {
                                store: parsed,
                                products: Array.isArray(parsed.products) ? parsed.products : []
                            };
                        }
                    } catch {}
                }
            }
        }
        return {
            store: {
                id: 'store_demo',
                name: DEFAULT_DEMO_CREATOR.name,
                username: 'demo',
                bio: DEFAULT_DEMO_CREATOR.bio,
                avatar: DEFAULT_DEMO_CREATOR.avatar,
                socials: DEFAULT_DEMO_CREATOR.socials,
                themeColor: '#10B981'
            },
            products: DEFAULT_DEMO_CREATOR.products
        };
    }

    const isExplicitDemoPreset = Boolean(DEMO_PRESETS[cleanUser]);
    const preset = resolvePresetStore(cleanUser);
    let store = preset ? { ...preset } : null;
    let products = (preset && isExplicitDemoPreset) ? resolvePresetProducts(cleanUser, preset.id) : [];

    if (typeof window !== 'undefined') {
        const keysToTry = [
            `cloned_store_${cleanUser}`,
            `store_${cleanUser}`,
            `gumshop_db_stores/store_${cleanUser}`,
            `gumshop_db_stores/${cleanUser}`,
            `cloned_store_${rawSlug}`,
            `store_${rawSlug}`
        ];
        for (const k of keysToTry) {
            try {
                const raw = sessionStorage.getItem(k) || localStorage.getItem(k);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && (parsed.name || parsed.username || parsed.id)) {
                        if (checkStoreDeleted(parsed.id) || checkStoreDeleted(parsed.username)) {
                            continue;
                        }
                        store = parsed;
                        if (Array.isArray(parsed.products) && parsed.products.length > 0) {
                            products = parsed.products.filter(p => p && !checkProductDeleted(p.id));
                        }
                        break;
                    }
                }
            } catch {}
        }

        if (store && products.length === 0) {
            const cleanTargetId = (store.id || `store_${cleanUser}`).toLowerCase().replace(/^store_/, '').trim();
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('gumshop_db_products/')) {
                    try {
                        const p = JSON.parse(localStorage.getItem(k) || 'null');
                        if (p && !checkProductDeleted(p.id) && parseFloat(p.price || 0) >= 0) {
                            const pStoreId = (p.storeId || '').toLowerCase().replace(/^store_/, '').trim();
                            if (pStoreId === cleanTargetId) {
                                products.push(p);
                            }
                        }
                    } catch {}
                }
            }
        }
    }

    if (!store || checkStoreDeleted(store.id) || checkStoreDeleted(store.username)) {
        return { store: null, products: [] };
    }

    // Only inject preset products into explicit presets if not cleared/reset
    const hasClearedSync = typeof window !== 'undefined' && (
        localStorage.getItem('gumshop_stores_cleared') === 'true' ||
        localStorage.getItem('gumshop_empty_dashboard_ack') === 'true'
    );
    if (products.length === 0 && isExplicitDemoPreset && !hasClearedSync && !checkStoreDeleted(cleanUser)) {
        products = resolvePresetProducts(cleanUser, store.id);
    }

    return { store, products: (products || []).filter(p => p && !checkProductDeleted(p.id)) };
}

/**
 * Unified Store & Products Resolver
 * Used across /shop/[username], /creator/[username], and /[username]
 * Guarantees 100% synchronization of catalog, prices, and branding
 */
export async function getStoreAndCatalog(rawSlug) {
    const cleanUser = (rawSlug || '').toLowerCase().trim();
    if (!cleanUser) return { store: null, products: [] };
    if (checkStoreDeleted(cleanUser)) return { store: null, products: [] };

    const { getStoreByUsername, getProductsByStore, getAllStores, isProductDeleted, isStoreDeleted, isJunkProductName } = await import('./firebaseDb.js');

    if (isStoreDeleted(cleanUser)) return { store: null, products: [] };

    let store = null;
    let products = [];

    // 1. Check local & session storage first (for live edits, cloned stores, imported catalogs)
    if (typeof window !== 'undefined') {
        const keysToTry = [
            `cloned_store_${cleanUser}`,
            `store_${cleanUser}`,
            `gumshop_db_stores/store_${cleanUser}`,
            `gumshop_db_stores/${cleanUser}`,
            `cloned_store_${rawSlug}`,
            `store_${rawSlug}`
        ];
        for (const k of keysToTry) {
            try {
                const raw = sessionStorage.getItem(k) || localStorage.getItem(k);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && (parsed.name || parsed.username || parsed.id)) {
                        if (isStoreDeleted(parsed.id) || isStoreDeleted(parsed.username)) {
                            continue;
                        }
                        store = parsed;
                        if (Array.isArray(parsed.products) && parsed.products.length > 0) {
                            products = parsed.products.filter(p => p && !isProductDeleted(p.id));
                        }
                        break;
                    }
                }
            } catch {}
        }

        if (!store) {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('cloned_store_') || key.startsWith('store_') || key.startsWith('gumshop_db_stores/'))) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(key) || 'null');
                        if (parsed) {
                            const pSlug = (parsed.username || parsed.name || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                            const pId = (parsed.id || '').toLowerCase().replace(/^store_/, '');
                            if (pSlug === cleanUser || pId === cleanUser || parsed.id === cleanUser) {
                                if (isStoreDeleted(parsed.id) || isStoreDeleted(parsed.username) || isStoreDeleted(pSlug)) {
                                    continue;
                                }
                                store = parsed;
                                if (Array.isArray(parsed.products) && parsed.products.length > 0) {
                                    products = parsed.products.filter(p => p && !isProductDeleted(p.id));
                                }
                                break;
                            }
                        }
                    } catch {}
                }
            }
        }
    }

    // 2. Check server / cloud database (/api/store/data) or remote database
    if (!store) {
        try {
            if (typeof window !== 'undefined') {
                const apiRes = await fetch(`/api/store/data?slug=${encodeURIComponent(cleanUser)}`);
                if (apiRes.ok) {
                    const apiData = await apiRes.json();
                    if (apiData.success && apiData.store) {
                        store = apiData.store;
                        if (Array.isArray(apiData.products) && apiData.products.length > 0) {
                            products = apiData.products.filter(p => p && !isProductDeleted(p.id));
                        }
                        if (typeof window !== 'undefined') {
                            try {
                                const cachePayload = { ...store, products };
                                localStorage.setItem(`store_${cleanUser}`, JSON.stringify(cachePayload));
                                localStorage.setItem(`cloned_store_${cleanUser}`, JSON.stringify(cachePayload));
                                sessionStorage.setItem(`store_${cleanUser}`, JSON.stringify(cachePayload));
                            } catch {}
                        }
                    }
                }
            } else {
                const { serverGetStore, serverGetProducts } = await import('./serverDb.js');
                const sStore = await serverGetStore(cleanUser);
                if (sStore) {
                    store = sStore;
                    const sProds = await serverGetProducts(sStore.id);
                    if (Array.isArray(sProds) && sProds.length > 0) {
                        products = sProds.filter(p => p && !isProductDeleted(p.id));
                    }
                }
            }
        } catch {}
    }
    if (!store) {
        try {
            store = await getStoreByUsername(cleanUser);
        } catch {}
    }
    if (!store) {
        try {
            const allStores = await getAllStores();
            store = allStores.find(s => 
                s.username?.toLowerCase() === cleanUser ||
                s.id?.toLowerCase() === cleanUser ||
                s.id?.toLowerCase() === `store_${cleanUser}` ||
                s.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '-') === cleanUser
            );
        } catch {}
    }

    const hasClearedStores = typeof window !== 'undefined' && (
        localStorage.getItem('gumshop_stores_cleared') === 'true' ||
        localStorage.getItem('gumshop_empty_dashboard_ack') === 'true'
    );

    // 3. Check preset store fallback (e.g. highgeartoys, buy-rc-drift-cars-online, aura-trends)
    const preset = resolvePresetStore(cleanUser);
    if (!store && preset && !isStoreDeleted(cleanUser) && !hasClearedStores) {
        store = { ...preset };
    }

    if (!store && cleanUser === 'demo' && !isStoreDeleted('demo') && !hasClearedStores) {
        try {
            const allStores = await getAllStores();
            const realStore = allStores.find(s => s && s.username !== 'demo' && !isStoreDeleted(s.id) && !isStoreDeleted(s.username));
            if (realStore) {
                store = { ...realStore };
                const rProds = await getProductsByStore(realStore.id);
                if (Array.isArray(rProds) && rProds.length > 0) {
                    products = rProds.filter(p => !isProductDeleted(p.id));
                }
            }
        } catch {}

        if (!store) {
            store = {
                id: 'store_demo',
                name: DEFAULT_DEMO_CREATOR.name,
                username: 'demo',
                bio: DEFAULT_DEMO_CREATOR.bio,
                avatar: DEFAULT_DEMO_CREATOR.avatar,
                socials: DEFAULT_DEMO_CREATOR.socials,
                themeColor: '#10B981'
            };
            products = DEFAULT_DEMO_CREATOR.products;
        }
    }

    if (!store || isStoreDeleted(store.id) || isStoreDeleted(store.username) || isStoreDeleted(cleanUser)) {
        return { store: null, products: [] };
    }

    const effectiveStoreId = store.id || `store_${cleanUser}`;
    store.id = effectiveStoreId;
    store.username = store.username || cleanUser;

    // 4. Resolve products for this store
    let dbProducts = [];
    try {
        dbProducts = await getProductsByStore(effectiveStoreId);
    } catch {}

    if (dbProducts && dbProducts.length > 0) {
        products = dbProducts;
    } else if (products.length === 0 && Array.isArray(store.products) && store.products.length > 0) {
        products = store.products;
    }

    // If still empty, check server / Supabase for this store's products
    if (products.length === 0) {
        try {
            if (typeof window !== 'undefined') {
                const apiRes = await fetch(`/api/store/data?slug=${encodeURIComponent(cleanUser)}`);
                if (apiRes.ok) {
                    const apiData = await apiRes.json();
                    if (apiData.success && Array.isArray(apiData.products) && apiData.products.length > 0) {
                        products = apiData.products.filter(p => p && !isProductDeleted(p.id));
                    }
                }
            } else {
                const { serverGetProducts } = await import('./serverDb.js');
                const sProds = await serverGetProducts(effectiveStoreId);
                if (Array.isArray(sProds) && sProds.length > 0) {
                    products = sProds.filter(p => p && !isProductDeleted(p.id));
                }
            }
        } catch {}
    }

    // Filter tombstoned and junk products
    const isClean = (p) => p && !isProductDeleted(p.id) && !isJunkProductName(p.name || p.title) && (parseFloat(p.price || 0) >= 0);
    products = products.filter(isClean);

    // If product list is empty, and this store is an EXPLICIT preset from DEMO_PRESETS, load preset products ONLY if not explicitly cleared
    const isExplicitDemo = Boolean(DEMO_PRESETS[cleanUser]);
    const hasClearedAcknowledged = typeof window !== 'undefined' && (
        localStorage.getItem('gumshop_empty_dashboard_ack') === 'true' ||
        localStorage.getItem('gumshop_stores_cleared') === 'true'
    );
    if (products.length === 0 && isExplicitDemo && !hasClearedAcknowledged && !isStoreDeleted(cleanUser)) {
        products = resolvePresetProducts(cleanUser, effectiveStoreId);
    }

    // Normalize products so standard shop and creator link-in-bio have identical fields
    products = products.map((p, idx) => ({
        ...p,
        id: p.id || `prod_${cleanUser}_${idx}`,
        storeId: effectiveStoreId,
        name: p.name || p.title || 'Curated Product',
        price: parseFloat(p.price || 0),
        compareAtPrice: parseFloat(p.compareAtPrice || Math.round(parseFloat(p.price || 0) * 1.35 * 100) / 100),
        image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
        category: typeof p.category === 'string' ? p.category : (p.category?.name || 'Featured'),
        isInstantBuyGumroad: true
    }));

    return { store, products };
}
