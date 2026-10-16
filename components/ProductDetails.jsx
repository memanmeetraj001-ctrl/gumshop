'use client'

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { addToCart } from "@/lib/features/cart/cartSlice";
import { 
    Zap, 
    Star, 
    ShieldCheck, 
    Truck, 
    Lock, 
    RotateCcw, 
    ChevronDown, 
    ChevronUp, 
    Check, 
    ShoppingBag
} from "lucide-react";
import toast from "react-hot-toast";
import GumroadIframeModal from "./GumroadIframeModal";
import LiveSalesToaster from "./LiveSalesToaster";
import { getSafeImageUrl, handleImageError } from "@/lib/imageUtils";
import { trackEvent } from "./AnalyticsTracker";

const ProductDetails = ({ product, storeInfo }) => {
    const productId = product.id;
    const dispatch = useDispatch();
    const router = useRouter();

    // Dynamic Color & Size Variant Switcher (ONLY if authentic variants exist)
    // Dynamic Color, Size & Multi-Option Switcher (ONLY if authentic variants/options exist)
    const hasExplicitColors = Array.isArray(product.colors) && product.colors.length > 0;
    const hasExplicitSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
    const hasVariantsArray = Array.isArray(product.variants) && product.variants.length > 0;
    const hasProductOptions = Array.isArray(product.options) && product.options.length > 0;

    // Detect color/style option from product.options if not explicitly passed
    const colorOption = !hasExplicitColors && hasProductOptions
        ? product.options.find(o => /color|style|finish/i.test(o.name || ''))
        : null;

    const getColorHex = (val) => {
        const lower = String(val || '').toLowerCase();
        if (lower.includes('red')) return '#ef4444';
        if (lower.includes('white')) return '#f8fafc';
        if (lower.includes('black')) return '#1e293b';
        if (lower.includes('blue')) return '#3b82f6';
        if (lower.includes('tan') || lower.includes('sand') || lower.includes('desert')) return '#d97706';
        if (lower.includes('green') || lower.includes('camo')) return '#15803d';
        if (lower.includes('gold') || lower.includes('yellow')) return '#eab308';
        return '#10b981';
    };

    const availableColors = useMemo(() => {
        if (hasExplicitColors) return product.colors;
        if (colorOption && Array.isArray(colorOption.values) && colorOption.values.length > 1) {
            return colorOption.values.map(val => ({
                name: val,
                hex: getColorHex(val)
            }));
        }
        return [];
    }, [hasExplicitColors, product.colors, colorOption]);

    const baseVariantPrice = hasVariantsArray ? parseFloat(product.variants[0]?.price || 0) : 0;
    const unitPrice = parseFloat(product.price !== undefined && product.price !== null && product.price !== '' ? product.price : (baseVariantPrice || 52.99));
    const discountRatio = (baseVariantPrice > 0 && unitPrice > 0) ? (unitPrice / baseVariantPrice) : 1;

    const getVariantPricing = (v) => {
        if (!v) return { effectivePrice: unitPrice, priceDelta: 0 };
        const rawPrice = parseFloat(v.price || 0);
        let effectivePrice = unitPrice;
        let priceDelta = 0;

        // 1. Explicit priceDelta takes precedence (including 0 for base variant)
        if (v.priceDelta !== undefined && v.priceDelta !== null && !isNaN(parseFloat(v.priceDelta))) {
            priceDelta = Math.max(0, parseFloat(v.priceDelta));
        } 
        // 2. Explicit effectivePrice if stored on variant
        else if (v.effectivePrice !== undefined && v.effectivePrice !== null && !isNaN(parseFloat(v.effectivePrice))) {
            const eff = parseFloat(v.effectivePrice);
            priceDelta = Math.max(0, Math.round((eff - unitPrice) * 100) / 100);
        } 
        // 3. Proportional difference if variant price is higher than the base variant
        else if (rawPrice > baseVariantPrice && baseVariantPrice > 0) {
            const rawDiff = rawPrice - baseVariantPrice;
            priceDelta = (discountRatio < 0.999 && discountRatio > 0)
                ? Math.round(rawDiff * discountRatio * 100) / 100
                : Math.round(rawDiff * 100) / 100;
        } 
        // 4. Fallback only if baseVariantPrice is missing/zero and rawPrice exceeds unitPrice
        else if (rawPrice > 0 && rawPrice > unitPrice && (!baseVariantPrice || baseVariantPrice === 0)) {
            priceDelta = Math.round((rawPrice - unitPrice) * 100) / 100;
        }

        effectivePrice = Math.round((unitPrice + priceDelta) * 100) / 100;
        return { effectivePrice, priceDelta };
    };

    // Multi-option state for products with options array (e.g. Style, Gel Balls, Battery, Bullets, Magazines)
    const [selectedOptions, setSelectedOptions] = useState(() => {
        const initial = {};
        if (hasProductOptions) {
            product.options.forEach(opt => {
                if (opt && opt.name && Array.isArray(opt.values) && opt.values.length > 0) {
                    initial[opt.name] = opt.values[0];
                }
            });
        }
        return initial;
    });

    useEffect(() => {
        if (Array.isArray(product.options) && product.options.length > 0) {
            const initial = {};
            product.options.forEach(opt => {
                if (opt && opt.name && Array.isArray(opt.values) && opt.values.length > 0) {
                    initial[opt.name] = opt.values[0];
                }
            });
            setSelectedOptions(initial);
        }
    }, [product.id, product.options]);

    const allVariantSizes = useMemo(() => {
        if (hasExplicitSizes) {
            return product.sizes.map(s => {
                const pricing = getVariantPricing(s);
                return {
                    ...s,
                    effectivePrice: pricing.effectivePrice,
                    priceDelta: pricing.priceDelta
                };
            });
        }
        if (hasVariantsArray) {
            return product.variants.map(v => {
                const pricing = getVariantPricing(v);
                return {
                    id: v.id,
                    name: v.name,
                    sku: v.sku,
                    available: v.available !== false,
                    effectivePrice: pricing.effectivePrice,
                    priceDelta: pricing.priceDelta,
                    compareAtPrice: v.compareAtPrice
                };
            });
        }
        const isApparel = /apparel|clothing|costume|outfit|shirt|jacket|shoes|pants|hoodie|harness|collar|vest|sweater|suit|dress|wear\b/i.test(`${product.name || ''} ${product.category || ''}`);
        const isToyOrHardware = /toy|gun|blaster|rifle|pistol|launcher|bullet|nerf|ammo|magazine|battery|charger|rc\b|drone|car\b|truck|motor|gadget|knife|blade|tool|electronics|gel\s*ball|rubber/i.test(`${product.name || ''} ${product.category || ''}`);
        if (isApparel && !isToyOrHardware) {
            return [
                { name: "Small (S)", priceDelta: 0, effectivePrice: unitPrice },
                { name: "Medium (M)", priceDelta: 0, effectivePrice: unitPrice },
                { name: "Large (L)", priceDelta: 0, effectivePrice: unitPrice },
                { name: "X-Large (XL)", priceDelta: 0, effectivePrice: unitPrice }
            ];
        }
        return [];
    }, [hasExplicitSizes, product.sizes, hasVariantsArray, product.variants, unitPrice, discountRatio, product.name, product.category]);

    const [selectedColor, setSelectedColor] = useState(availableColors[0] || null);

    // If a color is selected and variants contain the color name, filter to those variants for focused UX
    const availableSizes = useMemo(() => {
        if (selectedColor && allVariantSizes.length > 4) {
            const filtered = allVariantSizes.filter(s => 
                s.name.toLowerCase().includes(selectedColor.name.toLowerCase())
            );
            if (filtered.length > 0) return filtered;
        }
        return allVariantSizes;
    }, [allVariantSizes, selectedColor]);

    const [selectedSize, setSelectedSize] = useState(() => {
        if (hasVariantsArray && allVariantSizes.length > 0) {
            return allVariantSizes[0];
        }
        return allVariantSizes[1] || allVariantSizes[0] || null;
    });

    // When color changes, keep selectedSize in sync with the filtered options
    useEffect(() => {
        if (selectedColor && availableSizes.length > 0) {
            const stillAvailable = availableSizes.find(s => s.name === selectedSize?.name);
            if (!stillAvailable) {
                setSelectedSize(availableSizes[0]);
            }
        }
    }, [selectedColor, availableSizes]);

    // Matched Variant Resolution across multi-options or selected size
    const normOptStr = (str) => String(str || '').toLowerCase().replace(/[\s\-_/×x]+/g, ' ').trim();
    const matchedVariant = useMemo(() => {
        if (!hasVariantsArray) return null;
        const optEntries = Object.entries(selectedOptions);
        if (optEntries.length > 0) {
            const selectedVals = optEntries.map(([_, v]) => normOptStr(v));
            const matched = product.variants.find(v => {
                const vNorm = normOptStr(v.name);
                return selectedVals.every(val => vNorm.includes(val));
            });
            if (matched) return matched;
        }
        if (selectedSize) {
            const found = product.variants.find(v => (selectedSize.id && v.id === selectedSize.id) || v.name === selectedSize.name);
            if (found) return found;
        }
        return product.variants[0] || null;
    }, [hasVariantsArray, product.variants, selectedOptions, selectedSize]);

    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [openFaq, setOpenFaq] = useState(0);
    const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, gumroadUrl: '', orderSessionId: '' });
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [hasShippingProtection, setHasShippingProtection] = useState(true);
    const [showStickyBar, setShowStickyBar] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowStickyBar(window.scrollY > 320);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const images = (product.images && product.images.length > 0) 
        ? product.images 
        : [product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'];
    
    const [mainImage, setMainImage] = useState(images[0]);

    // Track product view for analytics
    useEffect(() => {
        if (product && product.id) {
            trackEvent('product_view', {
                productId: product.id,
                productName: product.name,
                storeId: product.storeId || storeInfo?.id,
                storeSlug: storeInfo?.username || (product.storeId ? String(product.storeId).replace(/^store_/, '') : '')
            });
        }
    }, [product?.id]);

    const activeVariant = matchedVariant || selectedSize || null;
    const activePricing = getVariantPricing(activeVariant);
    const sizeDelta = activePricing.priceDelta;
    const effectiveUnitPrice = unitPrice + sizeDelta;
    const protectionFee = hasShippingProtection ? 4.99 : 0;
    const rawCompareAt = parseFloat(activeVariant?.compareAtPrice || selectedSize?.compareAtPrice || product.compareAtPrice || product.mrp || 0);
    const compareAtPrice = rawCompareAt > 0
        ? ((discountRatio < 0.999 && discountRatio > 0 && (activeVariant?.compareAtPrice || selectedSize?.compareAtPrice))
            ? Math.round(rawCompareAt * discountRatio * 100) / 100
            : rawCompareAt + sizeDelta)
        : (unitPrice === 52.99 ? 69.99 : Math.round(effectiveUnitPrice * 1.35 * 100) / 100);

    const colorCode = selectedColor?.name?.substring(0, 3).toUpperCase() || 'DEF';
    const sizeCode = (activeVariant?.name || selectedSize?.name || 'STD').substring(0, 3).toUpperCase();
    const baseSku = product.sku || `SKU-${product.id?.substring(0, 6)?.toUpperCase() || 'PROD'}`;
    const activeSku = activeVariant?.sku || selectedSize?.sku || `${baseSku}-${colorCode}-${sizeCode}`;

    const rawStock = Number(product.stockQuantity !== undefined ? product.stockQuantity : 42);
    const isOutOfStock = product.inStock === false || rawStock <= 0;
    const isLowStock = !isOutOfStock && rawStock <= 12;

    const activeVariantLabel = activeVariant?.name 
        || (hasProductOptions && Object.values(selectedOptions).length > 0 ? Object.values(selectedOptions).join(' / ') : null)
        || `${selectedColor && !selectedSize?.name?.toLowerCase().includes(selectedColor.name.toLowerCase()) ? selectedColor.name + ' • ' : ''}${selectedSize?.name || 'Standard Edition'}`;

    // Quantity Tier Breaks: Prefer authentic product-specific customBundles if available, scaling if size variant has priceDelta
    const baseItemName = product.name ? product.name.split(' ')[0] : 'Item';
    const rawTiers = (Array.isArray(product.customBundles) && product.customBundles.length > 0)
        ? product.customBundles
        : [
            {
                qty: 1,
                label: `1 ${baseItemName}`,
                subtitle: "One legendary rider",
                pricePerUnit: unitPrice,
                totalPrice: unitPrice,
                badge: null
            },
            {
                qty: 2,
                label: `2 ${baseItemName}s`,
                subtitle: "Two-Pet Household / matching Halloween photos",
                pricePerUnit: Math.round((Math.round(unitPrice * 1.4082075 * 100) / 100 / 2) * 100) / 100,
                totalPrice: Math.round(unitPrice * 1.4082075 * 100) / 100,
                badge: "Two-Pet Household ⭐"
            },
            {
                qty: 3,
                label: `3 ${baseItemName}s`,
                subtitle: "Costume Party Pack",
                pricePerUnit: Math.round((Math.round(unitPrice * 1.81623 * 100) / 100 / 3) * 100) / 100,
                totalPrice: Math.round(unitPrice * 1.81623 * 100) / 100,
                badge: "Costume Party Pack 🔥"
            }
        ];

    const quantityTiers = useMemo(() => {
        if (sizeDelta === 0) return rawTiers;
        return rawTiers.map(t => {
            const addedTotal = Math.round(sizeDelta * t.qty * 100) / 100;
            const newTotal = Math.round((t.totalPrice + addedTotal) * 100) / 100;
            const newUnit = Math.round((newTotal / t.qty) * 100) / 100;
            return {
                ...t,
                totalPrice: newTotal,
                pricePerUnit: newUnit
            };
        });
    }, [rawTiers, sizeDelta]);

    const currentTier = quantityTiers.find(t => t.qty === selectedQuantity) || quantityTiers[0];

    const handleAddToCart = () => {
        const itemKey = activeVariantLabel ? `${productId}__${activeVariantLabel}` : productId;
        dispatch(addToCart({ 
            productId, 
            itemKey,
            quantity: selectedQuantity,
            product: {
                ...product,
                name: `${product.name} (${activeVariantLabel})`,
                image: images[0],
                price: currentTier.pricePerUnit,
                variant: activeVariantLabel,
                selectedColor: selectedColor?.name,
                selectedSize: activeVariant?.name || selectedSize?.name,
                selectedOptions,
                hasShippingProtection,
                storeId: product.storeId || storeInfo?.id,
                storeName: storeInfo?.name
            }
        }));
        trackEvent('add_to_cart', {
            productId: product.id,
            productName: product.name,
            storeId: product.storeId || storeInfo?.id,
            storeSlug: storeInfo?.username || (product.storeId ? String(product.storeId).replace(/^store_/, '') : ''),
            quantity: selectedQuantity,
            price: currentTier.pricePerUnit
        });
        toast.success(`Added ${selectedQuantity}x "${activeVariantLabel}" to your cart!`);
    };

    // White-Labeled "⚡ Buy Now" Handler (Gumroad In-Page Iframe)
    const handleInstantBuyNow = async () => {
        setIsCheckingOut(true);
        let activeCoupon = '';
        let discountAmount = 0;
        if (typeof window !== 'undefined') {
            const storedCoupon = sessionStorage.getItem('active_coupon');
            if (storedCoupon) {
                activeCoupon = storedCoupon.trim().toUpperCase();
                const pct = activeCoupon === 'SAVE20' ? 20 : (activeCoupon === 'FLASH25' ? 25 : (activeCoupon === 'SAVE10' ? 10 : 20));
                discountAmount = Math.round((currentTier.totalPrice * (pct / 100)) * 100) / 100;
            }
        }

        trackEvent('initiate_checkout', {
            productId: product.id,
            productName: product.name,
            storeId: product.storeId || storeInfo?.id,
            storeSlug: storeInfo?.username || (product.storeId ? String(product.storeId).replace(/^store_/, '') : ''),
            quantity: currentTier.qty,
            price: Math.max(1, currentTier.totalPrice + protectionFee - discountAmount)
        });
        try {
            const res = await fetch('/api/gumroad/dynamic-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: product.storeId || storeInfo?.id,
                    storeName: storeInfo?.name || 'Store',
                    items: [
                        {
                            productId: product.id,
                            name: `${product.name} (${activeVariantLabel})`,
                            price: currentTier.pricePerUnit,
                            quantity: currentTier.qty,
                            variant: activeVariantLabel,
                            selectedSize: activeVariant?.name || selectedSize?.name,
                            selectedVariantId: activeVariant?.id || selectedSize?.id,
                            sku: activeSku,
                            gumroadUrl: product.gumroadUrl || ''
                        }
                    ],
                    couponCode: activeCoupon,
                    discountAmount: discountAmount,
                    shippingFee: currentTier.qty >= 3 ? 0 : (storeInfo?.shipping?.standardFee || 4.99),
                    rushFee: hasShippingProtection ? 4.99 : 0,
                    gumroadProductUrl: product?.gumroadUrl || storeInfo?.gumroadProductUrl || (typeof window !== 'undefined' ? ((storeInfo?.username ? localStorage.getItem(`gumroad_url_${storeInfo.username}`) : '') || localStorage.getItem('gumshop_gumroad_url') || localStorage.getItem('gumroad_product_url') || '') : '')
                })
            });

            const storeSlug = storeInfo?.username || (product?.storeId ? String(product.storeId).replace(/^store_/, '') : '');
            const storeScopedUrl = (typeof window !== 'undefined' && storeSlug) ? (localStorage.getItem(`gumroad_url_${storeSlug}`) || localStorage.getItem(`gumroad_product_url_${storeSlug}`)) : '';
            const fallbackGumroadUrl = product?.gumroadUrl || storeInfo?.gumroadProductUrl || storeScopedUrl || (typeof window !== 'undefined' ? (localStorage.getItem('gumshop_gumroad_url') || '') : '');
            const data = await res.json().catch(() => ({}));
            setCheckoutModal({
                isOpen: true,
                gumroadUrl: data.checkoutUrl || fallbackGumroadUrl || '',
                orderSessionId: data.orderSessionId || `ord_${Date.now()}`,
                discountAmount
            });
        } catch (err) {
            console.error('Checkout error:', err);
            const storeSlug = storeInfo?.username || (product?.storeId ? String(product.storeId).replace(/^store_/, '') : '');
            const storeScopedUrl = (typeof window !== 'undefined' && storeSlug) ? (localStorage.getItem(`gumroad_url_${storeSlug}`) || localStorage.getItem(`gumroad_product_url_${storeSlug}`)) : '';
            const fallbackGumroadUrl = product?.gumroadUrl || storeInfo?.gumroadProductUrl || storeScopedUrl || (typeof window !== 'undefined' ? (localStorage.getItem('gumshop_gumroad_url') || '') : '');
            setCheckoutModal({
                isOpen: true,
                gumroadUrl: fallbackGumroadUrl || '',
                orderSessionId: `ord_${Date.now()}`
            });
        } finally {
            setIsCheckingOut(false);
        }
    };

    const faqs = (Array.isArray(product.faqs) && product.faqs.length > 0)
        ? product.faqs
        : [
            {
                q: "How fast is delivery?",
                a: "Orders are processed promptly upon payment confirmation. Standard tracked shipping takes 3–7 business days depending on destination."
            },
            {
                q: "What is your refund policy?",
                a: "If you have any issues with your order, contact our support team. We honor return and refund requests according to our store refund policy."
            },
            {
                q: "Are transactions safe and encrypted?",
                a: "Yes! All checkouts are processed via bank-grade 256-bit SSL encryption through verified Gumroad payment infrastructure."
            }
        ];

    return (
        <div className="max-w-7xl mx-auto pb-16 sm:pb-0 overflow-x-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
                
                {/* Left Column: Product Gallery */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm relative group">
                        <img 
                            src={getSafeImageUrl(mainImage)} 
                            alt={product.name} 
                            decoding="async"
                            onError={(e) => handleImageError(e, 'product')}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        {compareAtPrice > unitPrice && (
                            <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-xs shadow-md">
                                SAVE {Math.round(((compareAtPrice - unitPrice) / compareAtPrice) * 100)}%
                            </span>
                        )}
                    </div>

                    {/* Thumbnail Strip */}
                    {images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setMainImage(img)}
                                    className={`size-20 rounded-2xl overflow-hidden border-2 shrink-0 transition ${
                                        mainImage === img ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <img 
                                        src={getSafeImageUrl(img)} 
                                        alt="" 
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => handleImageError(e, 'product')}
                                        className="w-full h-full object-cover" 
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Customer Photo Reviews UGC Gallery (Rendered only when real reviews exist) */}
                    {(() => {
                        const rawRevs = product.reviews || product.data?.reviews || product.rating || product.data?.rating;
                        const reviewsList = Array.isArray(rawRevs)
                            ? rawRevs
                            : (rawRevs && typeof rawRevs === 'object' ? [rawRevs] : []);

                        const validReviews = reviewsList.map(rev => {
                            if (typeof rev === 'string') {
                                return { comment: rev, author: 'Verified Buyer', date: 'Recent', rating: 5, avatar: '' };
                            }
                            const comment = rev?.comment || rev?.review || rev?.text || rev?.content || rev?.body || '';
                            const author = rev?.author || rev?.user?.name || rev?.name || rev?.userName || 'Verified Buyer';
                            const date = rev?.date || (rev?.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent');
                            const rating = typeof rev?.rating === 'number' ? rev.rating : (typeof rev?.stars === 'number' ? rev.stars : 5);
                            const avatar = rev?.user?.image || rev?.avatar || rev?.image || '';
                            return { comment, author, date, rating, avatar };
                        }).filter(r => Boolean(r.comment));

                        if (validReviews.length === 0) return null;

                        return (
                            <div className="pt-8 border-t border-slate-200">
                                <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <span>Customer Reviews</span>
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                            {validReviews.length} Verified
                                        </span>
                                    </span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {validReviews.map((rev, idx) => (
                                        <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-emerald-500">
                                                        {Array(Math.min(5, Math.max(1, rev.rating))).fill('').map((_, i) => (
                                                            <Star key={i} size={13} className="fill-emerald-500" />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-medium">{rev.date}</span>
                                                </div>
                                                <p className="text-xs text-slate-700 font-medium mt-2.5 leading-relaxed">
                                                    "{rev.comment}"
                                                </p>
                                            </div>
                                            <div className="text-[11px] font-bold text-slate-900 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {rev.avatar ? (
                                                        <img src={rev.avatar} alt="" className="size-5 rounded-full object-cover" />
                                                    ) : (
                                                        <span className="size-5 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] flex items-center justify-center">
                                                            {rev.author.charAt(0)}
                                                        </span>
                                                    )}
                                                    <span>{rev.author}</span>
                                                </div>
                                                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                                    <span>✓</span> Verified Buyer
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Right Column: Buy Box & Conversion Tiers */}
                <div className="lg:col-span-5 space-y-6">
                    
                    {/* Live Viewers & Star Rating */}
                    {/* Status & Category */}
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                                {product.category || 'Featured'}
                            </span>
                            {product.reviewCount > 0 && (
                                <span className="flex items-center gap-1 text-slate-700 font-semibold text-[11px]">
                                    <Star size={13} className="fill-amber-400 text-amber-400" />
                                    <span>{typeof product.rating === 'number' ? product.rating.toFixed(1) : '5.0'}</span>
                                    <span className="text-slate-400">({product.reviewCount})</span>
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                            <span className="size-2 rounded-full bg-emerald-500"></span>
                            <span className="text-emerald-700 font-semibold">{product.inStock !== false ? 'In Stock' : 'Pre-Order'}</span>
                        </div>
                    </div>

                    {/* High-Converting Kicker & Punchline Headline */}
                    <div>
                        {product.kicker && (
                            <div className="mb-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/30">
                                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                    {product.kicker}
                                </span>
                            </div>
                        )}
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            {product.name}
                        </h1>
                        {product.subtitle && (
                            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mt-2">
                                {product.subtitle}
                            </p>
                        )}
                    </div>

                    {/* Benefit Checkmarks */}
                    {(() => {
                        const bulletList = (Array.isArray(product.bullets) && product.bullets.length > 0)
                            ? product.bullets
                            : (Array.isArray(product.bulletPoints) && product.bulletPoints.length > 0 ? product.bulletPoints : []);
                        if (bulletList.length === 0) return null;
                        return (
                            <div className="space-y-2 py-1">
                                {bulletList.map((bullet, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 font-medium">
                                        <div className="size-4 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check size={11} className="stroke-[3]" />
                                        </div>
                                        <span>{bullet}</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    {/* Price Header & Real-Time Stock Status */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <span className="text-3xl sm:text-4xl font-black text-slate-950">
                                ${(currentTier.totalPrice + protectionFee).toFixed(2)}
                            </span>
                            {hasShippingProtection && (
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded-full">
                                    + $4.99 Priority Protection
                                </span>
                            )}
                            {compareAtPrice > unitPrice && (
                                <span className="text-lg text-slate-400 line-through font-semibold">
                                    ${(compareAtPrice * selectedQuantity).toFixed(2)}
                                </span>
                            )}
                            {isOutOfStock ? (
                                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                                    Out of Stock
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                    ✓ In Stock • Ships within 48 hours
                                </span>
                            )}
                        </div>

                        {/* Real-time Urgency Stock Level Bar */}
                        {isLowStock && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                                    <span className="flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                        🔥 High Demand: Only {rawStock} left in stock!
                                    </span>
                                    <span className="text-[11px] font-mono text-amber-700">Almost Sold Out</span>
                                </div>
                                <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${Math.min(100, Math.max(15, (rawStock / 15) * 100))}%` }} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Interactive Multi-Option & Variant Switcher */}
                    <div className="space-y-4 pt-1 pb-1">
                        {hasProductOptions ? (
                            product.options.map((opt, optIdx) => {
                                const isColorLike = /color|style|finish/i.test(opt.name || '');
                                const selectedVal = selectedOptions[opt.name] || opt.values?.[0] || '';
                                return (
                                    <div key={optIdx} className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                            <span className="uppercase tracking-wider text-[11px] text-slate-500">{opt.name}</span>
                                            <span className="text-emerald-600 font-extrabold">{selectedVal}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2.5 items-center">
                                            {opt.values.map((val, vIdx) => {
                                                const isSelected = selectedVal === val;
                                                const candidateOpts = { ...selectedOptions, [opt.name]: val };
                                                const candidateVals = Object.values(candidateOpts).map(v => normOptStr(v));
                                                const candVariant = hasVariantsArray ? product.variants.find(v => {
                                                    const vNorm = normOptStr(v.name);
                                                    return candidateVals.every(cv => vNorm.includes(cv));
                                                }) : null;
                                                const candDelta = candVariant ? getVariantPricing(candVariant).priceDelta : 0;

                                                return (
                                                    <button
                                                        key={vIdx}
                                                        type="button"
                                                        aria-pressed={isSelected}
                                                        onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: val }))}
                                                        className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 transition text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                                                            isSelected
                                                                ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 shadow-xs ring-1 ring-emerald-500/20'
                                                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                                        }`}
                                                    >
                                                        {isColorLike && (
                                                            <span 
                                                                className="size-3.5 rounded-full border border-slate-300/80 shadow-xs shrink-0 flex items-center justify-center"
                                                                style={{ backgroundColor: getColorHex(val) }}
                                                            >
                                                                {isSelected && (
                                                                    <Check size={9} className={val.toLowerCase().includes('white') ? 'text-slate-900 stroke-[3]' : 'text-white stroke-[3]'} />
                                                                )}
                                                            </span>
                                                        )}
                                                        <span>{val}</span>
                                                        {candDelta > 0 && !isSelected && (
                                                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded">
                                                                +${candDelta.toFixed(2)}
                                                            </span>
                                                        )}
                                                        {isSelected && !isColorLike && (
                                                            <span className="size-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                                                <Check size={10} className="stroke-[3]" />
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <>
                                {/* 1. Color Swatches */}
                                {availableColors.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                            <span className="uppercase tracking-wider text-[11px] text-slate-500">Color / Finish</span>
                                            <span className="text-emerald-600 font-extrabold">{selectedColor?.name}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2.5 items-center">
                                            {availableColors.map((col, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    aria-pressed={selectedColor?.name === col.name}
                                                    onClick={() => setSelectedColor(col)}
                                                    className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                                                        selectedColor?.name === col.name
                                                            ? 'border-emerald-600 bg-emerald-50/60 text-slate-900 shadow-xs'
                                                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                                                    }`}
                                                >
                                                    <span 
                                                        className="size-4 rounded-full border border-slate-300/80 shadow-xs shrink-0 flex items-center justify-center"
                                                        style={{ backgroundColor: col.hex || '#10b981' }}
                                                    >
                                                        {selectedColor?.name === col.name && (
                                                            <Check size={10} className={col.hex === '#ffffff' || col.hex === '#fff' ? 'text-slate-900 stroke-[3]' : 'text-white stroke-[3]'} />
                                                        )}
                                                    </span>
                                                    <span>{col.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 2. Size / Bundle Options */}
                                {availableSizes.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                            <span className="uppercase tracking-wider text-[11px] text-slate-500">Edition / Package</span>
                                            <span className="text-emerald-600 font-extrabold">{selectedSize?.name}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {availableSizes.map((sz, idx) => {
                                                const isSelected = selectedSize?.name === sz.name;
                                                const delta = parseFloat(sz.priceDelta || 0);
                                                const cardEffectivePrice = sz.effectivePrice || (unitPrice + delta);
                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        aria-pressed={isSelected}
                                                        onClick={() => setSelectedSize(sz)}
                                                        className={`p-3 rounded-2xl border-2 text-left transition flex flex-col justify-between outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                                                            isSelected
                                                                ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/20'
                                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-1.5">
                                                            <span className="text-xs font-bold text-slate-900 leading-snug">{sz.name}</span>
                                                            {isSelected && (
                                                                <span className="size-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                                                                    <Check size={10} className="stroke-[3]" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] font-semibold mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                                                            <span className="text-emerald-700 font-black font-mono">
                                                                ${cardEffectivePrice.toFixed(2)}
                                                            </span>
                                                            <span>
                                                                {delta > 0 ? (
                                                                    <span className="text-amber-800 bg-amber-100/80 border border-amber-300/80 px-2 py-0.5 rounded-md text-[10px] font-black tracking-tight">
                                                                        +${delta.toFixed(2)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400 text-[10px] font-semibold">Standard Price</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Volume Quantity Breaks ("Buy More, Save More") */}
                    <div className="space-y-3 pt-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                            Select Quantity (Bundle & Save)
                        </label>
                        <div className="space-y-2">
                            {quantityTiers.map((tier) => (
                                <div
                                    key={tier.qty}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={selectedQuantity === tier.qty}
                                    onClick={() => setSelectedQuantity(tier.qty)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setSelectedQuantity(tier.qty);
                                        }
                                    }}
                                    className={`p-3.5 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 select-none ${
                                        selectedQuantity === tier.qty
                                            ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                                            selectedQuantity === tier.qty ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                                        }`}>
                                            {selectedQuantity === tier.qty && <Check size={12} className="stroke-[3]" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{tier.label}</p>
                                            <p className="text-[11px] text-slate-500">${tier.pricePerUnit.toFixed(2)} / each</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        {tier.badge && (
                                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white mb-1 inline-block">
                                                {tier.badge}
                                            </span>
                                        )}
                                        <p className="text-sm font-black text-slate-900">
                                            ${(tier.totalPrice + (selectedQuantity === tier.qty ? protectionFee : 0)).toFixed(2)}
                                        </p>
                                        {selectedQuantity === tier.qty && hasShippingProtection && (
                                            <span className="text-[10px] font-bold text-amber-700 block">
                                                +$4.99 Protection
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Protection & Skip The Line Add-on Checkbox */}
                    <div className="space-y-2 pt-2">
                        <label 
                            className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition select-none ${
                                hasShippingProtection ? 'border-amber-400 bg-amber-50/60 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={hasShippingProtection}
                                    onChange={(e) => setHasShippingProtection(e.target.checked)}
                                    className="size-4 accent-amber-500 rounded cursor-pointer"
                                />
                                <div>
                                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                        <ShieldCheck size={14} className="text-amber-600" />
                                        <span>Shipping Protection</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500">Lost, stolen or damaged in transit? We reship or refund.</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-slate-900 shrink-0">+$4.99</span>
                        </label>
                    </div>

                    {/* Live Order Total Summary Breakdown */}
                    <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-2 text-xs select-none">
                        <div className="flex justify-between items-center text-slate-600 font-medium">
                            <span>Package ({currentTier.label}):</span>
                            <span className="font-bold text-slate-900">${currentTier.totalPrice.toFixed(2)}</span>
                        </div>
                        {hasShippingProtection && (
                            <div className="flex justify-between items-center text-amber-800 font-bold">
                                <span className="flex items-center gap-1.5">
                                    <ShieldCheck size={14} className="text-amber-600 shrink-0" />
                                    Shipping Protection & Rush Handling:
                                </span>
                                <span className="font-mono text-amber-900">+$4.99</span>
                            </div>
                        )}
                        <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline font-black">
                            <span className="text-slate-800 text-sm font-extrabold">Total Due:</span>
                            <div className="text-right">
                                <span className="text-2xl font-black text-slate-950 font-mono tracking-tight">
                                    ${(currentTier.totalPrice + protectionFee).toFixed(2)}
                                </span>
                                {hasShippingProtection && (
                                    <span className="block text-[11px] text-amber-700 font-bold">
                                        (includes $4.99 protection)
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* The Primary "⚡ Buy Now" & "Add to Cart" Actions */}
                    <div className="space-y-3 pt-2">
                        {/* Primary "⚡ Buy Now" Button */}
                        <button
                            onClick={handleInstantBuyNow}
                            disabled={isCheckingOut || isOutOfStock}
                            className={`w-full py-4 px-6 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                                isOutOfStock
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-xl shadow-emerald-600/30 hover:scale-[1.01] cursor-pointer'
                            }`}
                        >
                            <span>
                                {isOutOfStock 
                                    ? "Sold Out" 
                                    : isCheckingOut 
                                        ? "Preparing Checkout..." 
                                        : `⚡ Buy Now • $${(currentTier.totalPrice + protectionFee).toFixed(2)}`}
                            </span>
                        </button>

                        {/* Secondary Add to Cart */}
                        <button
                            onClick={handleAddToCart}
                            disabled={isOutOfStock}
                            className={`w-full py-3 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${
                                isOutOfStock
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 cursor-pointer'
                            }`}
                        >
                            <ShoppingBag size={16} />
                            <span>{isOutOfStock ? "Out of Stock" : "Add to Bag"}</span>
                        </button>
                    </div>

                    {/* Trust & Security Guarantee Seals Strip */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-2 text-center text-slate-700">
                        <div className="flex flex-col items-center">
                            <Lock size={18} className="text-emerald-600 mb-1" />
                            <span className="text-[10px] font-bold leading-tight">256-Bit SSL Encrypted</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <Truck size={18} className="text-emerald-600 mb-1" />
                            <span className="text-[10px] font-bold leading-tight">Tracked Delivery</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <RotateCcw size={18} className="text-emerald-600 mb-1" />
                            <span className="text-[10px] font-bold leading-tight">Buyer Protection</span>
                        </div>
                    </div>

                    {/* Product Description */}
                    <div className="pt-2 text-sm text-slate-600 leading-relaxed space-y-3">
                        <p>{product.description || "Curated with the highest standards of materials and craftsmanship. Guaranteed satisfaction."}</p>
                        
                        {Array.isArray(product.bullets || product.bulletPoints) && (product.bullets || product.bulletPoints).length > 0 && (
                            <ul className="space-y-1.5 pt-2 border-t border-slate-100 text-xs font-medium text-slate-700">
                                {(product.bullets || product.bulletPoints).map((b, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Interactive Product FAQs Accordion */}
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                            Frequently Asked Questions
                        </h4>
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                                <button
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full p-3.5 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                                >
                                    <span>{faq.q}</span>
                                    {openFaq === idx ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                </button>
                                {openFaq === idx && (
                                    <div className="p-3.5 pt-0 text-xs text-slate-600 leading-relaxed bg-slate-50/50">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                </div>

            </div>

            {/* High-Converting Mobile Sticky Bottom Buy Bar on Mobile Viewports */}
            <div 
                className={`fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] sm:hidden transition-transform duration-300 ease-in-out ${
                    showStickyBar ? 'translate-y-0' : 'translate-y-full pointer-events-none'
                }`}
                style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))' }}
            >
                <div className="px-3 py-1.5 flex items-center justify-between gap-2 max-w-lg mx-auto w-full">
                    {/* Product Thumbnail & Price */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <img 
                            src={images[0] || product.image || '/favicon.svg'} 
                            alt={product.name}
                            className="size-8 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">{product.name}</p>
                            <div className="flex items-center gap-1.5 leading-none mt-0.5">
                                <span className="text-xs sm:text-sm font-black text-emerald-600 font-mono tracking-tight">${(currentTier.totalPrice + protectionFee).toFixed(2)}</span>
                                {(compareAtPrice * currentTier.qty) > (currentTier.totalPrice + protectionFee) && (
                                    <span className="text-[10px] text-slate-400 line-through">
                                        ${(compareAtPrice * currentTier.qty).toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={handleAddToCart}
                            aria-label="Add to cart"
                            className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center justify-center active:scale-95 cursor-pointer shrink-0"
                        >
                            <ShoppingBag size={15} />
                        </button>
                        <button
                            onClick={handleInstantBuyNow}
                            disabled={isCheckingOut || isOutOfStock}
                            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
                        >
                            <Zap size={12} className="fill-white shrink-0" />
                            <span>Instant Buy</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* In-Frame Checkout Modal */}
            <GumroadIframeModal
                isOpen={checkoutModal.isOpen}
                onClose={() => setCheckoutModal({ isOpen: false, gumroadUrl: '', orderSessionId: '' })}
                product={product}
                items={[{
                    id: product.id,
                    name: `${product.name} (${activeVariantLabel})`,
                    price: currentTier.pricePerUnit,
                    quantity: currentTier.qty,
                    image: (product.images && product.images[0]) || product.image
                }]}
                total={currentTier.totalPrice + protectionFee + (currentTier.qty >= 3 ? 0 : (storeInfo?.shipping?.standardFee || 4.99))}
                shippingFee={currentTier.qty >= 3 ? 0 : (storeInfo?.shipping?.standardFee || 4.99)}
                rushFee={protectionFee}
                gumroadUrl={checkoutModal.gumroadUrl}
                orderSessionId={checkoutModal.orderSessionId}
            />

            {/* 🔥 Live Verified Sales Pop-Up (Social Proof) */}
            <LiveSalesToaster product={product} storeName={storeInfo?.name} />
        </div>
    );
};

export default ProductDetails;