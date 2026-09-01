import json, os

def get_data():
    categories = [
        {"id": "cat_guns_wands", "slug": "guns-wands", "name": "Guns & Wands", "description": "Precision ergonomic pressure washer guns, live swivels, and extension lances.", "image": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=800&q=80", "icon": "Shield", "sortOrder": 1, "status": "active"},
        {"id": "cat_foam_cannons", "slug": "foam-cannons", "name": "Foam Cannons", "description": "Wide-mouth snow foam lances engineered for thick cling and maximum dwell time.", "image": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80", "icon": "Droplets", "sortOrder": 2, "status": "active"},
        {"id": "cat_quick_connects", "slug": "quick-connects", "name": "Hoses & Fittings", "description": "304 Stainless steel quick disconnects, M22 adapters, and kink-free swivel fittings.", "image": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80", "icon": "Zap", "sortOrder": 3, "status": "active"},
        {"id": "cat_accessories", "slug": "accessories", "name": "Accessories & Microfiber", "description": "1200 GSM twist loop drying towels, wash mitts, nozzle tips, and detailing brushes.", "image": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80", "icon": "Sparkles", "sortOrder": 4, "status": "active"},
        {"id": "cat_chemicals", "slug": "car-care-chemicals", "name": "Car Care & Sealants", "description": "Hydrophobic ceramic booster sprays, high-lubricity snow soaps, and rim cleaners.", "image": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80", "icon": "Layers", "sortOrder": 5, "status": "active"}
    ]
    collections = [
        {"id": "col_best_sellers", "slug": "best-sellers", "title": "Best Sellers", "description": "Our highest-rated detailing gear trusted by thousands of pros.", "image": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80", "seoTitle": "Best Selling Pressure Washer Car Care Gear | WashForge", "seoDescription": "Discover best-selling swivel guns and foam cannons.", "productIds": ["swivel-gun-pro", "foam-cannon-pro", "ss-quick-connect-kit", "mega-plush-drying-towel"], "sortOrder": 1, "status": "published"},
        {"id": "col_pro_series", "slug": "pro-detailing-series", "title": "Pro Detailing Series", "description": "Heavy duty, stainless steel internal components.", "image": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=80", "seoTitle": "Pro Detailing Hardware | WashForge", "seoDescription": "Engineered for daily commercial use.", "productIds": ["swivel-gun-pro", "extension-wand-20", "ss-quick-connect-kit"], "sortOrder": 2, "status": "published"},
        {"id": "col_starter_kits", "slug": "starter-wash-kits", "title": "Starter Kits & Bundles", "description": "Complete upgrade packages.", "image": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80", "seoTitle": "Starter Bundles | WashForge", "seoDescription": "Save with upgrade packages.", "productIds": ["swivel-gun-pro", "foam-cannon-pro", "mega-plush-drying-towel"], "sortOrder": 3, "status": "published"}
    ]
    return categories, collections

def get_products():
    return [
        {
            "id": "swivel-gun-pro",
            "slug": "swivel-gun-pro",
            "title": "WashForge Swivel Gun Pro? (Stainless 3/8\" QC)",
            "shortDescription": "Ergonomic short trigger pressure washer gun with integrated 360? stainless steel live ball swivel.",
            "description": "### Better Control. Zero Hose Tangles.\n\nThe **WashForge Swivel Gun Pro?** replaces clumsy stock pressure washer wands with a compact, ultra-responsive trigger gun crafted specifically for vehicle detailing.\n\n#### Key Advantages:\n- **Integrated 360? Live Stainless Ball Swivel**: Rotates effortlessly under high pressure (up to 5,000 PSI).\n- **Ultra-Light Easy-Pull Trigger**: Low-fatigue internal spring mechanism.\n- **Solid 304 Stainless Steel Internals**: Corrosion-resistant and rated for up to 300?F.\n- **Standard 1/4\" QC Outlet & 3/8\" QC Inlet**: Plug and play with all detailing hoses and foam cannons.",
            "price": 79.98,
            "compareAtPrice": 99.98,
            "currency": "USD",
            "sku": "WF-GUN-SWIVEL-01",
            "categoryId": "cat_guns_wands",
            "collectionIds": ["col_best_sellers", "col_pro_series", "col_starter_kits"],
            "tags": ["swivel gun", "pressure washer", "best seller", "guns & wands", "pro series"],
            "status": "published",
            "featured": True,
            "bestseller": True,
            "newProduct": False,
            "sale": True,
            "images": [
                "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1000&q=80"
            ],
            "thumbnail": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80",
            "specifications": [
                {"key": "Max Pressure", "value": "5,000 PSI (345 Bar)"},
                {"key": "Max Flow Rate", "value": "12 GPM (45 L/min)"},
                {"key": "Max Water Temp", "value": "300?F (150?C)"},
                {"key": "Inlet Fitting", "value": "3/8\" Stainless Steel QC Plug"},
                {"key": "Outlet Fitting", "value": "1/4\" Brass QC Coupler"},
                {"key": "Trigger Safety", "value": "Mechanical Locking Latch"},
                {"key": "Warranty", "value": "Lifetime Limited Warranty"}
            ],
            "faq": [
                {"question": "Will this fit my Ryobi, Sun Joe, or Greenworks washer?", "answer": "Yes! Combine with our Stainless Quick Connect Adapter Kit (M22-14mm or M22-15mm) to plug straight in."},
                {"question": "Does the swivel turn while under full pressure?", "answer": "Absolutely. It uses a high-tolerance dual ceramic ball-bearing assembly designed to spin freely under 4,000+ PSI."}
            ],
            "gumroadUrl": "https://washforge.gumroad.com/l/swivel-gun-pro",
            "buyMeACoffeeUrl": "https://buymeacoffee.com/washforge",
            "primaryCheckout": "gumroad",
            "directCheckout": True,
            "buttonText": "Buy on Gumroad",
            "seoTitle": "WashForge Swivel Gun Pro | 5000 PSI Snub Nose Pressure Washer Gun",
            "seoDescription": "Premium short trigger car detailing gun with 360 degree stainless live swivel.",
            "seoImage": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80",
            "sortOrder": 1,
            "createdAt": "2026-09-01T00:00:00.000Z",
            "updatedAt": "2026-09-01T00:00:00.000Z"
        },
        {
            "id": "foam-cannon-pro",
            "slug": "wide-mouth-foam-cannon-pro",
            "title": "Wide Mouth Snub Foam Cannon Pro (1.1mm Orifice)",
            "shortDescription": "Heavy-foam snow cannon with tip-resistant wide base, dual metering valve, and 1.1mm pre-installed orifice.",
            "description": "### Shaving Cream-Thick Foam On Any Pressure Washer.\n\nEngineered with an ultra-wide stability base that never tips over when filled with soap. The **WashForge Wide Mouth Foam Cannon Pro** produces ultra-dense, clinging foam blankets.",
            "price": 64.95,
            "compareAtPrice": 79.95,
            "currency": "USD",
            "sku": "WF-FOAM-PRO-02",
            "categoryId": "cat_foam_cannons",
            "collectionIds": ["col_best_sellers", "col_starter_kits"],
            "tags": ["foam cannon", "snow foam", "best seller", "foam cannons"],
            "status": "published",
            "featured": True,
            "bestseller": True,
            "newProduct": False,
            "sale": True,
            "images": [
                "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1000&q=80",
                "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1000&q=80"
            ],
            "thumbnail": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80",
            "specifications": [
                {"key": "Bottle Capacity", "value": "1.0 Liter (34 fl oz)"},
                {"key": "Min Pressure", "value": "1,000 PSI"},
                {"key": "Max Pressure", "value": "4,000 PSI"},
                {"key": "Orifices Included", "value": "1.1mm (Pre-installed) & 1.25mm"}
            ],
            "faq": [
                {"question": "Does this work with low GPM electric washers?", "answer": "Yes! The 1.1mm orifice is pre-installed specifically to produce massive foam on 1.2-1.5 GPM electric washers."}
            ],
            "gumroadUrl": "https://washforge.gumroad.com/l/wide-mouth-foam-cannon",
            "buyMeACoffeeUrl": "https://buymeacoffee.com/washforge",
            "primaryCheckout": "gumroad",
            "directCheckout": True,
            "buttonText": "Buy on Gumroad",
            "seoTitle": "Wide Mouth Snub Foam Cannon Pro | Dense Snow Foam Lance",
            "seoDescription": "Wide-mouth tip-proof foam cannon with 1.1mm orifice.",
            "sortOrder": 2,
            "createdAt": "2026-09-01T00:00:00.000Z",
            "updatedAt": "2026-09-01T00:00:00.000Z"
        },
        {
            "id": "extension-wand-20",
            "slug": "rinsing-extension-wand-20",
            "title": "20\" Stainless Steel Rinsing Extension Wand (15? Bend)",
            "shortDescription": "Ergonomic 20-inch stainless steel lance with 15-degree bend for easy roof and wheel arch rinsing.",
            "description": "### Reach Higher Roofs & Lower Wheel Arches With Ease.\n\nClicks directly into your Swivel Gun Pro with standard 1/4\" quick disconnects.",
            "price": 39.95,
            "compareAtPrice": 49.95,
            "currency": "USD",
            "sku": "WF-WAND-20-03",
            "categoryId": "cat_guns_wands",
            "collectionIds": ["col_pro_series"],
            "tags": ["wand", "extension lance", "stainless steel"],
            "status": "published",
            "featured": False,
            "bestseller": False,
            "newProduct": True,
            "sale": False,
            "images": [
                "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1000&q=80"
            ],
            "thumbnail": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80",
            "specifications": [
                {"key": "Length", "value": "20 Inches (50 cm)"},
                {"key": "Tip Angle", "value": "15? Curved Nozzle Outlet"},
                {"key": "Material", "value": "304 Stainless Steel"}
            ],
            "faq": [],
            "gumroadUrl": "https://washforge.gumroad.com/l/extension-wand-20",
            "buyMeACoffeeUrl": "https://buymeacoffee.com/washforge",
            "primaryCheckout": "gumroad",
            "directCheckout": True,
            "buttonText": "Buy on Gumroad",
            "seoTitle": "20\" Stainless Steel Rinsing Extension Wand | WashForge",
            "seoDescription": "High pressure stainless steel car wash extension lance.",
            "sortOrder": 3,
            "createdAt": "2026-09-01T00:00:00.000Z",
            "updatedAt": "2026-09-01T00:00:00.000Z"
        },
        {
            "id": "ss-quick-connect-kit",
            "slug": "stainless-quick-connect-kit",
            "title": "Complete 304 Stainless Steel Quick Connect Adapter Kit",
            "shortDescription": "Full 8-piece leak-free stainless quick release set for pump, hose, and spray gun connections.",
            "description": "### Stop Screwing Fittings. Snap & Detail.\n\nUpgrade your entire pressure washer workflow to 1-second quick connects. Precision machined from 304 Stainless Steel with high-grade Viton O-rings.",
            "price": 49.99,
            "compareAtPrice": 59.99,
            "currency": "USD",
            "sku": "WF-QC-KIT-04",
            "categoryId": "cat_quick_connects",
            "collectionIds": ["col_best_sellers", "col_pro_series"],
            "tags": ["quick connect", "fittings", "stainless", "best seller"],
            "status": "published",
            "featured": True,
            "bestseller": True,
            "newProduct": False,
            "sale": False,
            "images": [
                "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1000&q=80"
            ],
            "thumbnail": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80",
            "specifications": [
                {"key": "Material", "value": "100% Solid 304 Stainless Steel"},
                {"key": "O-Rings", "value": "Viton Chemical Resistant"},
                {"key": "Pressure Rating", "value": "5,000 PSI"}
            ],
            "faq": [],
            "gumroadUrl": "https://washforge.gumroad.com/l/quick-connect-kit",
            "buyMeACoffeeUrl": "https://buymeacoffee.com/washforge",
            "primaryCheckout": "gumroad",
            "directCheckout": True,
            "buttonText": "Buy on Gumroad",
            "seoTitle": "Stainless Steel Pressure Washer Quick Connect Kit | WashForge",
            "seoDescription": "8-piece 304 stainless steel quick disconnect adapter set.",
            "sortOrder": 4,
            "createdAt": "2026-09-01T00:00:00.000Z",
            "updatedAt": "2026-09-01T00:00:00.000Z"
        },
        {
            "id": "mega-plush-drying-towel",
            "slug": "mega-plush-1200gsm-drying-towel",
            "title": "The Mega Plush 1200 GSM Edgeless Twist Loop Drying Towel",
            "shortDescription": "Giant 24\" x 36\" super absorbent 1200 GSM twisted loop microfiber towel that dries a whole truck in one pass.",
            "description": "### One Pass. Zero Streaks. Zero Scratches.\n\nMade with ultra-absorbent twisted loop 70/30 microfiber fibers. Absorbs over 6 pounds of water without wringing out.",
            "price": 29.95,
            "compareAtPrice": 39.95,
            "currency": "USD",
            "sku": "WF-TOWEL-1200-06",
            "categoryId": "cat_accessories",
            "collectionIds": ["col_best_sellers", "col_starter_kits"],
            "tags": ["microfiber", "drying towel", "twist loop", "accessories"],
            "status": "published",
            "featured": True,
            "bestseller": True,
            "newProduct": False,
            "sale": True,
            "images": [
                "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1000&q=80"
            ],
            "thumbnail": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80",
            "specifications": [
                {"key": "Weight/Density", "value": "1,200 GSM"},
                {"key": "Dimensions", "value": "24\" x 36\" (60cm x 90cm)"}
            ],
            "faq": [],
            "gumroadUrl": "https://washforge.gumroad.com/l/mega-plush-towel",
            "buyMeACoffeeUrl": "https://buymeacoffee.com/washforge",
            "primaryCheckout": "gumroad",
            "directCheckout": True,
            "buttonText": "Buy on Gumroad",
            "seoTitle": "1200 GSM Twisted Loop Microfiber Car Drying Towel | WashForge",
            "seoDescription": "Extra large 24x36 inch 1200 GSM edgeless twist loop car drying towel.",
            "sortOrder": 5,
            "createdAt": "2026-09-01T00:00:00.000Z",
            "updatedAt": "2026-09-01T00:00:00.000Z"
        },
        {
            "id": "hydro-bead-ceramic-detailer",
            "slug": "hydro-bead-ceramic-spray-detailer",
            "title": "Hydro-Bead SiO2 Ceramic Spray Sealant (16 fl oz)",
            "shortDescription": "Hyper-slick hydrophobic spray coating delivering 6+ months of water beading and deep mirror gloss.",
            "description": "### Extreme Hydrophobics in Minutes.\n\nSpray on a wet or dry surface and buff off with a clean microfiber. Creates an instant cross-linked ceramic barrier.",
            "price": 24.95,
            "compareAtPrice": 29.95,
            "currency": "USD",
            "sku": "WF-CHEM-CERAMIC-07",
            "categoryId": "cat_chemicals",
            "collectionIds": ["col_starter_kits"],
            "tags": ["ceramic sealant", "hydrophobic", "spray wax", "chemicals"],
            "status": "published",
            "featured": False,
            "bestseller": False,
            "newProduct": True,
            "sale": False,
            "images": [
                "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80"
            ],
            "thumbnail": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
            "specifications": [
                {"key": "Size", "value": "16 fl oz (473 ml)"},
                {"key": "Durability", "value": "Up to 6 Months"}
            ],
            "faq": [],
            "gumroadUrl": "https://washforge.gumroad.com/l/hydro-bead-ceramic",
            "buyMeACoffeeUrl": "https://buymeacoffee.com/washforge",
            "primaryCheckout": "gumroad",
            "directCheckout": True,
            "buttonText": "Buy on Gumroad",
            "seoTitle": "Hydro-Bead SiO2 Ceramic Spray Sealant | WashForge Car Care",
            "seoDescription": "High gloss hydrophobic ceramic coating booster spray.",
            "sortOrder": 6,
            "createdAt": "2026-09-01T00:00:00.000Z",
            "updatedAt": "2026-09-01T00:00:00.000Z"
        }
    ]

def get_bundles():
    return [
        {
            "id": "bundle_ultimate_pro",
            "slug": "ultimate-pro-wash-bundle",
            "name": "The Ultimate Pro Wash Kit (Swivel Gun + Foam Cannon + QC Kit + Towel)",
            "description": "The definitive complete setup for enthusiast car washers. Includes the Swivel Gun Pro, Wide Mouth Foam Cannon, Full Stainless Quick Connect Set, and 1200 GSM Mega Drying Towel.",
            "image": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80",
            "productIds": ["swivel-gun-pro", "foam-cannon-pro", "ss-quick-connect-kit", "mega-plush-drying-towel"],
            "price": 189.99,
            "compareAtPrice": 249.90,
            "badge": "Save $60 (24% Off)",
            "ctaText": "Get The Pro Bundle on Gumroad",
            "gumroadUrl": "https://washforge.gumroad.com/l/ultimate-pro-wash-bundle",
            "status": "published",
            "sortOrder": 1
        },
        {
            "id": "bundle_foam_starter",
            "slug": "touchless-foam-cannon-starter-kit",
            "name": "Touchless Snow Foam Cannon & Quick Connect Starter Kit",
            "description": "Upgrade any factory pressure washer to instant snow foam bliss. Features our Wide Mouth Foam Cannon Pro and 304 Stainless adapter set.",
            "image": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=80",
            "productIds": ["foam-cannon-pro", "ss-quick-connect-kit"],
            "price": 99.95,
            "compareAtPrice": 129.94,
            "badge": "Starter Favorite",
            "ctaText": "Get Starter Kit on Gumroad",
            "gumroadUrl": "https://washforge.gumroad.com/l/foam-starter-bundle",
            "status": "published",
            "sortOrder": 2
        }
    ]

def get_sections():
    return [
        {
            "id": "sec_hero",
            "type": "hero",
            "title": "ENGINEERED FOR THE PERFECT DETAIL.",
            "subtitle": "BETTER TOOLS. BETTER WASHES.",
            "content": "Eliminate hose tangles, blast thick shaving-cream foam, and wash your vehicle with professional-grade stainless steel pressure washer hardware.",
            "image": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1600&q=85",
            "buttonText": "Shop Best Sellers",
            "buttonUrl": "/collections/best-sellers",
            "secondaryButtonText": "Explore Upgrade Bundles",
            "secondaryButtonUrl": "/bundles",
            "enabled": True,
            "sortOrder": 1,
            "settingsJson": {"overlayOpacity": 0.6, "alignment": "left", "badgeText": "? PRO DETAILER HARDWARE"}
        },
        {
            "id": "sec_social_proof",
            "type": "social_proof",
            "title": "TRUSTED BY OVER 15,000+ ENTHUSIASTS & DETAIL SHOPS",
            "subtitle": "",
            "content": "",
            "enabled": True,
            "sortOrder": 2,
            "settingsJson": {
                "badges": [
                    {"icon": "Award", "title": "5,000 PSI Tested", "desc": "Commercial Grade 304 Stainless"},
                    {"icon": "ShieldCheck", "title": "Lifetime Craftsmanship", "desc": "Built To Last A Lifetime"},
                    {"icon": "Truck", "title": "Fast Global Shipping", "desc": "Dispatched in 24 Hours"},
                    {"icon": "Star", "title": "4.9/5 Star Rating", "desc": "Over 2,400+ Verified Reviews"}
                ]
            }
        },
        {
            "id": "sec_best_sellers",
            "type": "product_grid",
            "title": "Top Rated Detailing Hardware",
            "subtitle": "FEATURED BEST SELLERS",
            "content": "Our flagship swivel guns, snow foam cannons, and quick connect fittings built for uncompromised performance.",
            "buttonText": "View All Products",
            "buttonUrl": "/collections/all",
            "enabled": True,
            "sortOrder": 3,
            "settingsJson": {"collectionSlug": "best-sellers", "limit": 4, "columns": 4}
        },
        {
            "id": "sec_benefits",
            "type": "benefits",
            "title": "Why WashForge Outperforms Stock Gear",
            "subtitle": "THE WASHFORGE DIFFERENCE",
            "content": "Most consumer pressure washer wands are cheap plastic, leak at the seams, and turn your wash routine into a tangled mess. We build precision stainless tools that feel incredible in hand.",
            "image": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=80",
            "enabled": True,
            "sortOrder": 4,
            "settingsJson": {
                "points": [
                    {"title": "Zero-Kink 360? Live Swivel", "desc": "Ceramic ball bearings rotate freely under full pressure so hoses stay flat."},
                    {"title": "Low-Fatigue Featherweight Trigger", "desc": "Up to 60% less hand strain over extended detailing sessions."},
                    {"title": "Pure 304 Stainless Steel Couplers", "desc": "No cheap brass plating that strips, corrodes, or binds."},
                    {"title": "1-Second Tool Swaps", "desc": "Instantly swap between foam cannon, rinse wand, and turbo nozzles."}
                ]
            }
        },
        {
            "id": "sec_bundles",
            "type": "bundle_grid",
            "title": "Save With Complete Upgrade Kits",
            "subtitle": "BUNDLE & SAVE UP TO 25%",
            "content": "Everything you need in one box to transform your pressure washer into a detailing machine.",
            "enabled": True,
            "sortOrder": 5,
            "settingsJson": {"limit": 2}
        },
        {
            "id": "sec_categories",
            "type": "category_grid",
            "title": "Shop By Category",
            "subtitle": "FIND YOUR EXACT FITMENT",
            "content": "",
            "enabled": True,
            "sortOrder": 6,
            "settingsJson": {"columns": 4}
        },
        {
            "id": "sec_testimonials",
            "type": "testimonials",
            "title": "What Real Detailers Are Saying",
            "subtitle": "VERIFIED CUSTOMER REVIEWS",
            "content": "",
            "enabled": True,
            "sortOrder": 7,
            "settingsJson": {"autoScroll": True}
        },
        {
            "id": "sec_community",
            "type": "community",
            "title": "Join The #WashForge Detailing Crew",
            "subtitle": "COMMUNITY & BUILDS",
            "content": "Tag @WashForgeCarCare on Instagram and TikTok to be featured on our front page and win monthly hardware drops.",
            "enabled": True,
            "sortOrder": 8,
            "settingsJson": {
                "images": [
                    {"url": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80", "tag": "@porsche_gt3_detail"},
                    {"url": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80", "tag": "@m3_foam_party"},
                    {"url": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80", "tag": "@washforge_garage"},
                    {"url": "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80", "tag": "@ceramic_shield_pro"}
                ]
            }
        },
        {
            "id": "sec_faq",
            "type": "faq",
            "title": "Frequently Asked Questions",
            "subtitle": "NEED HELP WITH COMPATIBILITY?",
            "content": "Have questions about pressure washer adapters, thread sizes, or orifice ratings? We have you covered.",
            "enabled": True,
            "sortOrder": 9,
            "settingsJson": {
                "items": [
                    {"q": "How do I know which quick connects fit my pressure washer hose?", "a": "Check your hose connection: Most commercial/gas washers use M22-14mm (14mm inner stem). Many electric washers (like Sun Joe or Ryobi) use M22-15mm. Our complete Quick Connect kit includes adapters for both styles!"},
                    {"q": "How does external checkout on Gumroad work?", "a": "When you click 'Buy Now', you are securely transferred directly to our official WashForge Gumroad storefront to complete your payment with credit card, Apple Pay, or PayPal with instant confirmation and tracking."},
                    {"q": "Can I support the WashForge independent project directly?", "a": "Yes! We offer a direct Buy Me a Coffee link for enthusiasts who love our detailing open guides and want to support ongoing tool R&D."}
                ]
            }
        },
        {
            "id": "sec_newsletter",
            "type": "newsletter",
            "title": "Unlock 10% Off Your First Order",
            "subtitle": "JOIN THE DETAIL SQUAD",
            "content": "Subscribe to get exclusive hardware release drops, car care detailing masterclasses, and private bundle discounts.",
            "buttonText": "Subscribe Now",
            "enabled": True,
            "sortOrder": 10,
            "settingsJson": {"successMessage": "Welcome to the WashForge Crew! Check your inbox for your 10% promo code."}
        }
    ]

def get_other_data():
    navigation = [
        {"id": "nav_home", "label": "Home", "url": "/", "sortOrder": 1, "visible": True, "openNewTab": False},
        {"id": "nav_shop", "label": "Shop All", "url": "/collections/all", "sortOrder": 2, "visible": True, "openNewTab": False},
        {"id": "nav_guns", "label": "Guns & Wands", "url": "/collections/guns-wands", "sortOrder": 3, "visible": True, "openNewTab": False, "parentId": "nav_shop"},
        {"id": "nav_foam", "label": "Foam Cannons", "url": "/collections/foam-cannons", "sortOrder": 4, "visible": True, "openNewTab": False, "parentId": "nav_shop"},
        {"id": "nav_fittings", "label": "Hoses & Fittings", "url": "/collections/quick-connects", "sortOrder": 5, "visible": True, "openNewTab": False, "parentId": "nav_shop"},
        {"id": "nav_bundles", "label": "Bundles & Kits", "url": "/bundles", "sortOrder": 6, "visible": True, "openNewTab": False, "badge": "Save 25%"},
        {"id": "nav_blog", "label": "Guides & Blog", "url": "/blog", "sortOrder": 7, "visible": True, "openNewTab": False},
        {"id": "nav_about", "label": "About Us", "url": "/about", "sortOrder": 8, "visible": True, "openNewTab": False},
        {"id": "nav_support", "label": "Support / Coffee", "url": "/support", "sortOrder": 9, "visible": True, "openNewTab": False, "badge": "? Support"}
    ]
    footer = [
        {
            "id": "col_shop", "title": "Shop Gear", "sortOrder": 1,
            "links": [
                {"id": "fl_all", "label": "All Products", "url": "/collections/all"},
                {"id": "fl_swivel", "label": "Swivel Gun Pro?", "url": "/products/swivel-gun-pro"},
                {"id": "fl_foam", "label": "Wide Mouth Foam Cannon", "url": "/products/wide-mouth-foam-cannon-pro"},
                {"id": "fl_qc", "label": "Stainless QC Kit", "url": "/products/stainless-quick-connect-kit"},
                {"id": "fl_bundles", "label": "Pro Upgrade Bundles", "url": "/bundles"}
            ]
        },
        {
            "id": "col_help", "title": "Fitment & Help", "sortOrder": 2,
            "links": [
                {"id": "fl_guide", "label": "Pressure Washer Fitment Guide", "url": "/blog/how-to-choose-the-right-pressure-washer-quick-connects"},
                {"id": "fl_faq", "label": "Common FAQs", "url": "/#faq"},
                {"id": "fl_contact", "label": "Contact Support", "url": "/contact"},
                {"id": "fl_shipping", "label": "Shipping & Delivery", "url": "/about"},
                {"id": "fl_bmac", "label": "? Buy Us A Coffee", "url": "/support"}
            ]
        },
        {
            "id": "col_company", "title": "WashForge Story", "sortOrder": 3,
            "links": [
                {"id": "fl_about", "label": "Our Philosophy", "url": "/about"},
                {"id": "fl_blog", "label": "Detailing Blog & Articles", "url": "/blog"},
                {"id": "fl_community", "label": "Instagram Gallery", "url": "/#community"},
                {"id": "fl_admin", "label": "Admin Login", "url": "/admin/login"}
            ]
        }
    ]
    theme = {
        "brandName": "WashForge",
        "tagline": "Better tools. Better washes.",
        "logoUrl": "",
        "faviconUrl": "",
        "primaryColor": "#0F1115",
        "secondaryColor": "#1A1D24",
        "accentColor": "#EF4444",
        "backgroundColor": "#0A0C0F",
        "surfaceColor": "#14171F",
        "textColor": "#F9FAFB",
        "mutedTextColor": "#9CA3AF",
        "buttonColor": "#EF4444",
        "buttonTextColor": "#FFFFFF",
        "headingFont": "Plus Jakarta Sans, Inter, system-ui, sans-serif",
        "bodyFont": "Inter, system-ui, sans-serif",
        "headingWeight": "700",
        "bodyWeight": "400",
        "maxWidth": "1440px",
        "borderRadius": "8px",
        "cardRadius": "12px",
        "buttonRadius": "8px",
        "sectionSpacing": "80px",
        "gridGap": "24px",
        "stickyHeader": True,
        "transparentHeader": False,
        "logoPosition": "left",
        "navigationPosition": "center",
        "announcementEnabled": True,
        "announcementText": "?? FREE US SHIPPING ON ALL UPGRADE BUNDLES | USE CODE 'DETAILPRO' FOR 10% OFF",
        "announcementLink": "/bundles",
        "announcementBg": "#EF4444",
        "announcementColor": "#FFFFFF",
        "footerColumnsCount": 3,
        "footerBg": "#090B0E",
        "footerTextColor": "#9CA3AF",
        "copyrightText": "? 2026 WashForge Car Care. All Rights Reserved. Clean-Room Architecture for McKillans Enthusiasts.",
        "socialLinks": {
            "instagram": "https://instagram.com/washforgecarcare",
            "youtube": "https://youtube.com/@washforge",
            "facebook": "https://facebook.com/washforge",
            "tiktok": "https://tiktok.com/@washforge",
            "x": "https://x.com/washforge"
        }
    }
    payments = [
        {
            "id": "pay_gumroad",
            "provider": "gumroad",
            "label": "Gumroad External Checkout",
            "enabled": True,
            "storeUrl": "https://washforge.gumroad.com",
            "defaultProductUrl": "https://washforge.gumroad.com/l/demo-product",
            "buttonText": "Buy on Gumroad",
            "checkoutMode": "new_tab",
            "openNewTab": True,
            "floatingWidget": False,
            "widgetPosition": "bottom-right"
        },
        {
            "id": "pay_bmac",
            "provider": "buymeacoffee",
            "label": "Buy Me a Coffee Support",
            "enabled": True,
            "creatorUrl": "https://buymeacoffee.com/washforge",
            "buttonText": "? Support on Buy Me a Coffee",
            "checkoutMode": "new_tab",
            "openNewTab": True,
            "floatingWidget": True,
            "widgetPosition": "bottom-right"
        }
    ]
    promotions = [
        {"id": "promo_1", "type": "announcement", "title": "Free Shipping Over $50", "description": "Spend $50 or more and get free express 2-day continental US shipping.", "ctaText": "Shop Now", "ctaUrl": "/collections/all", "enabled": True, "discountCode": "FREESHIP50"},
        {"id": "promo_2", "type": "popup", "title": "Get 10% Off Your First Order", "description": "Sign up for our detailing newsletter and receive an instant 10% discount on your first Gumroad checkout.", "ctaText": "Claim 10% Off", "ctaUrl": "#newsletter", "enabled": True, "discountCode": "WASHFORGE10"}
    ]
    testimonials = [
        {"id": "test_1", "name": "Marcus Vance", "title": "Vance Auto Spa & Mobile Detailing", "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80", "rating": 5, "review": "The Swivel Gun Pro completely changed my daily workflow. Zero hose fighting when moving around wide SUVs.", "productName": "WashForge Swivel Gun Pro?", "productId": "swivel-gun-pro", "verified": True, "published": True, "sortOrder": 1},
        {"id": "test_2", "name": "Sarah Lindqvist", "title": "Track Day Enthusiast", "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80", "rating": 5, "review": "The wide mouth foam cannon is impossible to knock over and produces ridiculously thick shaving foam with my Sun Joe electric pressure washer.", "productName": "Wide Mouth Snub Foam Cannon Pro", "productId": "foam-cannon-pro", "verified": True, "published": True, "sortOrder": 2},
        {"id": "test_3", "name": "Dave K.", "title": "Garage Detailer & Collector", "avatar": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80", "rating": 5, "review": "100% solid stainless steel quick connects. No cheap plastic or fake chrome plating. Connected straight to my active pressure washer in 10 seconds flat.", "productName": "Stainless Quick Connect Kit", "productId": "ss-quick-connect-kit", "verified": True, "published": True, "sortOrder": 3}
    ]
    blog = [
        {
            "id": "post_qc_guide",
            "slug": "how-to-choose-the-right-pressure-washer-quick-connects",
            "title": "How to Choose the Right Quick Connects for Your Pressure Washer (M22-14 vs M22-15)",
            "excerpt": "Never suffer from leaky fittings or stripped threads again. Here is everything you need to know about pressure washer thread standards and 3/8\" stainless quick releases.",
            "content": "## The Ultimate Quick Connect Guide\n\nUpgrading your factory pressure washer to 1-second quick connects is the single highest-impact upgrade you can make to your car washing experience.\n\n### M22-14mm vs. M22-15mm: The Crucial Difference\nThe majority of pressure washers on the market use an M22 threaded connection between the pump and the hose.\n\n1. **M22-14mm (14mm Internal Pin)**: Standard on gas pressure washers and commercial detailing rigs.\n2. **M22-15mm (15mm Internal Pin)**: Common on consumer electric units (Sun Joe, Ryobi, AR Blue Clean).\n\n### Why We Use 304 Stainless Steel Instead of Brass\nWhile cheap brass fittings oxidize, turn green, and deform when dropped onto concrete, 304 stainless steel maintains its surgical precision tolerances for years.",
            "featuredImage": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
            "author": "Alex Mercer",
            "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            "categories": ["Hardware Guides", "Fitment"],
            "tags": ["quick connects", "pressure washer", "fittings", "detailing guide"],
            "readTime": "4 min read",
            "status": "published",
            "publishedAt": "2026-08-28T00:00:00.000Z",
            "seoTitle": "Pressure Washer Quick Connect Guide: M22-14 vs M22-15 Explained",
            "seoDescription": "Learn how to properly convert your pressure washer to stainless steel 3/8\" quick connects."
        },
        {
            "id": "post_foam_cannon_breakdown",
            "slug": "snow-foam-cannon-orifice-guide-electric-vs-gas",
            "title": "Why Orifice Size Dictates Your Foam Cannon Performance",
            "excerpt": "Getting runny, watery foam from your foam cannon? You probably have the wrong orifice installed. Here is how a $5 1.1mm orifice doubles your foam thickness.",
            "content": "## The Physics of Snow Foam\n\nA foam cannon works through the venturi effect: high-pressure water shoots through a tiny calibrated nozzle orifice, creating a vacuum that draws soap and ambient air into a stainless steel wire mesh agitator.\n\n### 1.1mm vs. 1.25mm Orifice\n- **1.1mm Orifice**: Designed for lower GPM machines (1.2 to 1.8 GPM). Increases water velocity to create ultra-dense foam.\n- **1.25mm Orifice**: Standard on gas machines producing 2.5 GPM or higher.\n\nThe WashForge Wide Mouth Foam Cannon Pro includes BOTH orifices right out of the box so you never have to guess!",
            "featuredImage": "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=1200&q=80",
            "author": "Chris Bennett",
            "authorAvatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
            "categories": ["Foam & Wash Tech"],
            "tags": ["foam cannon", "snow foam", "orifice", "car detailing"],
            "readTime": "5 min read",
            "status": "published",
            "publishedAt": "2026-08-25T00:00:00.000Z",
            "seoTitle": "Foam Cannon Orifice Size Guide: 1.1mm vs 1.25mm for Electric Washers",
            "seoDescription": "Discover how choosing between 1.1mm and 1.25mm foam cannon orifices transforms your snow foam consistency."
        }
    ]
    settings = {
        "currency": "USD",
        "currencySymbol": "$",
        "maintenanceMode": False,
        "maintenanceTitle": "WashForge is Under Scheduled Maintenance",
        "maintenanceMessage": "We are updating our catalog with new pro-grade detailing hardware. We will be back online shortly!",
        "newsletterProvider": "custom",
        "newsletterHeadline": "Get 10% Off Your First Detailing Order",
        "newsletterDescription": "Join thousands of professional detailers and weekend enthusiasts. Never miss a hardware drop.",
        "newsletterSuccessMsg": "Thank you for joining WashForge! Check your email for your exclusive welcome gift.",
        "contactEmail": "support@mckillanscarcare.online",
        "supportPhone": "+1 (800) 555-WASH",
        "address": "WashForge Automotive Gear, Silicon Valley, CA",
        "seoTitle": "WashForge | Premium Car Care & Pressure Washer Detailing Hardware",
        "seoDescription": "Clean-room precision automotive car care storefront. High pressure swivel guns, wide-mouth foam cannons, and 304 stainless fittings.",
        "ogImage": "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=1200&q=80",
        "twitterCard": "summary_large_image",
        "canonicalUrl": "https://mckillanscarcare.online",
        "googleAnalyticsId": "",
        "metaPixelId": ""
    }
    return navigation, footer, theme, payments, promotions, testimonials, blog, settings

def generate():
    cats, cols = get_data()
    prods = get_products()
    bundles = get_bundles()
    secs = get_sections()
    nav, footer, theme, payments, promos, tests, blog, settings = get_other_data()

    ts_content = f'''import {{
  Product,
  Category,
  Collection,
  Bundle,
  HomepageSection,
  NavigationItem,
  FooterColumn,
  ThemeSettings,
  PaymentIntegration,
  Promotion,
  Testimonial,
  BlogPost,
  SiteSettings,
  User,
}} from '../types';
import bcrypt from 'bcryptjs';

export const getInitialSeedData = () => {{
  const hashedPassword = bcrypt.hashSync('admin123', 10);

  const users: User[] = [
    {{
      id: 'usr_admin_1',
      email: 'admin@washforge.com',
      password: hashedPassword,
      name: 'WashForge Super Admin',
      role: 'superadmin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString(),
    }},
    {{
      id: 'usr_editor_1',
      email: 'editor@washforge.com',
      password: hashedPassword,
      name: 'Detailing Editor',
      role: 'editor',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString(),
    }},
  ];

  const categories: Category[] = {json.dumps(cats, indent=2)};
  const collections: Collection[] = {json.dumps(cols, indent=2)};
  const products: Product[] = {json.dumps(prods, indent=2)};
  const bundles: Bundle[] = {json.dumps(bundles, indent=2)};
  const homepageSections: HomepageSection[] = {json.dumps(secs, indent=2)};
  const navigationItems: NavigationItem[] = {json.dumps(nav, indent=2)};
  const footerColumns: FooterColumn[] = {json.dumps(footer, indent=2)};
  const themeSettings: ThemeSettings = {json.dumps(theme, indent=2)};
  const paymentIntegrations: PaymentIntegration[] = {json.dumps(payments, indent=2)};
  const promotions: Promotion[] = {json.dumps(promos, indent=2)};
  const testimonials: Testimonial[] = {json.dumps(tests, indent=2)};
  const blogPosts: BlogPost[] = {json.dumps(blog, indent=2)};
  const siteSettings: SiteSettings = {json.dumps(settings, indent=2)};

  return {{
    users,
    categories,
    collections,
    products,
    bundles,
    homepageSections,
    navigationItems,
    footerColumns,
    themeSettings,
    paymentIntegrations,
    promotions,
    testimonials,
    blogPosts,
    siteSettings,
  }};
}};
'''
    with open("backend/src/db/seedData.ts", "w", encoding="utf-8") as f:
        f.write(ts_content)
    print("Seed data generated in backend/src/db/seedData.ts successfully!")

if __name__ == "__main__":
    generate()
